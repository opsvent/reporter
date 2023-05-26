import hmac from '@opsvent/hmac';
import got from 'got';
import Winston from 'winston';

import { ReporterConfig } from '../Config.js';
import Runner from '../runner/Runner.js';
import Job, { JobResult } from '../runner/jobs/Job.js';

import ApiResponse from './ApiResponse.js';
import { isErrorResponse } from './ErrorResponse.js';
import { JobDefinition } from './JobDefinition.js';

class Worker {
	private config: ReporterConfig;
	private logger: Winston.Logger;
	private authKey;

	private generationWatchInterval: NodeJS.Timer | null = null;
	private generation = 0;
	private jobDefinitions: JobDefinition[] = [];

	private runner: Runner;

	constructor(config: ReporterConfig, logger: Winston.Logger) {
		this.config = config;
		this.logger = logger;
		this.authKey = {
			id: this.config.kid,
			key: this.config.key
		};

		this.logger.info('Creating worker node', { kid: this.config.kid });

		this.runner = new Runner(
			this.reportJobStatus.bind(this),
			this.logger.child({ group: 'runner' })
		);
	}

	public async start() {
		await this.fetchJobDefinitions();

		this.generationWatchInterval = setInterval(
			this.checkGeneration.bind(this),
			15_000
		);
	}

	public async stop() {
		clearInterval(this.generationWatchInterval ?? undefined);
		this.generationWatchInterval = null;

		this.runner.unscheduleAllJobs();
	}

	private async fetchJobDefinitions() {
		const resp = await this.sendRequest<{
			generation: number;
			definitions: JobDefinition[];
		}>('GET', 'reporter/definitions');

		if (isErrorResponse(resp)) {
			this.logger.error('Failed to fetch job definitions', { ...resp });
			return;
		}

		this.generation = resp.generation;
		this.jobDefinitions = resp.definitions;

		this.logger.info('Got job definitions', {
			generation: this.generation,
			count: this.jobDefinitions.length
		});
		this.logger.debug('List of job definitions', {
			definitions: this.jobDefinitions
		});

		this.runner.scheduleJobs(this.jobDefinitions);
	}

	private async checkGeneration() {
		const resp = await this.sendRequest<{ generation: number }>(
			'GET',
			'reporter/generation'
		);

		if (isErrorResponse(resp)) {
			this.logger.error('Failed to check for generation change', {
				...resp
			});
			return;
		}

		if (resp.generation > this.generation) {
			this.logger.info('Generation change', {
				from: this.generation,
				to: resp.generation
			});
			this.fetchJobDefinitions();
		} else {
			this.logger.debug('No generation change');
		}
	}

	private reportJobStatus(job: Job, result: JobResult) {
		return this.sendRequest<{ generation: number; status: 'ok' }>(
			'POST',
			'reporter/report',
			{
				generation: this.generation,
				monitor: job.definition.id,
				ok: result.ok,
				message: result.message ?? undefined
			}
		).then(resp => {
			if (isErrorResponse(resp)) {
				if (resp.message == 'Invalid generation') {
					this.logger.warn(
						'Report rejected due to generation change'
					);
					this.fetchJobDefinitions();
					return;
				}

				this.logger.error('Report rejected', { ...resp });
				return;
			}

			this.logger.debug('Submitted report for monitor', {
				monitor: job.definition.id,
				ok: result.ok
			});
		});
	}

	private sendRequest<T>(
		method: 'GET' | 'POST',
		path: string,
		body?: any
	): Promise<ApiResponse<T>> {
		const sendBody = body ? JSON.stringify(body) : undefined;

		return got({
			method: method,
			prefixUrl: this.config.coordinator,
			url: path,
			body: sendBody,
			headers: {
				'Content-type': 'application/json',
				Authorization: hmac.sign(
					{
						method,
						url: '/' + path,
						body: sendBody || ''
					},
					this.authKey
				)
			},
			throwHttpErrors: false
		})
			.json<ApiResponse<T>>()
			.catch(e => {
				this.logger.error('Failed to complete API request', {
					exception: e.message
				});
				return {
					statusCode: -1,
					error: e.code,
					message: 'Failed to complete request'
				};
			});
	}
}

export default Worker;
