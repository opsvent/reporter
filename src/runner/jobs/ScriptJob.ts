import got, { GotRequestFunction, OptionsInit } from 'got';
import IsolatedVM from 'isolated-vm';
import _ from 'lodash';

import { MS_IN_SEC } from '../../constants.js';
import { limitMaxCalls } from '../../utils.js';
import { ScriptJobDefinition } from '../../worker/JobDefinition.js';

import Job from './Job.js';

class ScriptJob extends Job {
	public readonly definition!: ScriptJobDefinition;

	private async exposeGlobals(ctx: IsolatedVM.Context) {
		const limitedGot = limitMaxCalls(
			got,
			10,
			'request'
		) as GotRequestFunction;
		await ctx.global.set(
			'__ov_request_ref',
			new IsolatedVM.Reference(
				async (
					urlOrOptions: string | OptionsInit,
					options?: OptionsInit
				) => {
					const result = options
						? await limitedGot(urlOrOptions as string, options)
						: await limitedGot(urlOrOptions as OptionsInit);

					if (result instanceof Buffer) {
						const arrayBuffer = result.buffer;
						return new IsolatedVM.ExternalCopy(arrayBuffer, {
							transferList: [arrayBuffer]
						}).copyInto();
					}

					if (typeof result == 'object') {
						return new IsolatedVM.ExternalCopy(
							_.pick(result, [
								'ok',
								'statusCode',
								'headers',
								'body',
								'timings'
							])
						).copyInto();
					}

					return new IsolatedVM.ExternalCopy(result).copyInto();
				}
			)
		);
		await ctx.eval(`
			globalThis.request = (...args) => {
				return globalThis.__ov_request_ref.apply(undefined, [...args], {
					arguments: {
						copy: true
					},
					result: {
						promise: true
					}
				});
			};
		`);

		await ctx.global.set(
			'result',
			new IsolatedVM.ExternalCopy({
				ok: new IsolatedVM.Callback(
					() => new IsolatedVM.Reference({ ok: true })
				),
				fail: new IsolatedVM.Callback(
					(reason?: string) =>
						new IsolatedVM.Reference({ ok: false, message: reason })
				)
			}).copyInto()
		);
	}

	private async getTrustedCtx(isolate: IsolatedVM.Isolate) {
		const ctx = await isolate.createContext();
		await ctx.global.set('ivm', IsolatedVM);
		await ctx.global.set(
			'setTimeout',
			(fn: IsolatedVM.Reference, timeout: number) =>
				void setTimeout(() => isolate.isDisposed || fn.apply(), timeout)
		);
		return ctx;
	}

	private timeoutPromise(
		ctx: IsolatedVM.Context,
		promise: IsolatedVM.Reference,
		timeout: number
	): Promise<any> {
		return ctx.evalClosure(
			`return Promise.race([
				$0,
				new Promise((_, reject) =>
					setTimeout(
						new ivm.Reference(() =>
							reject(new Error("[Script Runner] Script exceeded maximum wait time of ${timeout} seconds"))
						),
						${timeout * MS_IN_SEC}
					)
				)
			])`,
			[promise.derefInto()],
			{
				result: {
					promise: true
				}
			}
		);
	}

	protected async execute() {
		const isolate = new IsolatedVM.Isolate({
			memoryLimit: 30 // MB
		});

		try {
			// create context, compile script and execute it
			const ctx = await isolate.createContext();
			const script = await isolate
				.compileScript(this.definition.script)
				.catch(e => {
					throw new Error(
						'[Script Runner] Syntax Error: ' + e.message
					);
				});
			await script
				.run(ctx, {
					timeout: 500
				})
				.catch(e => {
					throw new Error(
						'[Script Runner] Failed to execute script: ' + e.message
					);
				});

			this.exposeGlobals(ctx);

			// get the check function defined in global
			const checkFn = await ctx.global.get('check', {
				reference: true
			});

			if (checkFn.typeof != 'function') {
				throw new Error(
					'[Script Runner] Your code should expose a check function in the global space (async function check(){ ... })'
				);
			}

			// execute check function and get the returned promise
			const checkReturn = await checkFn
				.apply(undefined, [], {
					timeout: 5000,
					result: {
						reference: true
					}
				})
				.catch(e => {
					throw new Error('[Script Runner] ' + e.message);
				});

			if (checkReturn.typeof != 'object') {
				throw new Error(
					'[Script Runner] Check function should return a promise'
				);
			}

			// add a race with a timeout promise to time out the request
			const trustedCtx = await this.getTrustedCtx(isolate);
			const resultRef = await this.timeoutPromise(
				trustedCtx,
				checkReturn,
				this.definition.timeout
			);

			if (!resultRef || typeof resultRef.deref != 'function') {
				throw new Error(
					'[Script Runner] Invalid return type. Please use the result.ok() and result.fail() functions.'
				);
			}

			const result = resultRef.deref();

			if (
				!result ||
				typeof result.ok != 'boolean' ||
				!['undefined', 'string'].includes(typeof result.message)
			) {
				throw new Error(
					'[Script Runner] Invalid return type. Please use the result.ok() and result.fail() functions.'
				);
			}

			return _.pick(result, ['ok', 'message']);
		} finally {
			isolate.dispose();
		}
	}
}

export default ScriptJob;
