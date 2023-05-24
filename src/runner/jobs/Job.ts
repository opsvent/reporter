import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';

import { JobDefinition } from '../../worker/JobDefinition.js';

export interface JobResult {
	ok: boolean;
	message?: string;
}

export type JobResultHandler = (result: JobResult) => Promise<void>;
export type JobErrorHandler = (error: Error) => void;

abstract class Job {
	public readonly definition: JobDefinition;
	public readonly id: string;

	constructor(definition: JobDefinition) {
		this.definition = definition;
		this.id = `job_${definition.type}_${definition.id}`;
	}

	protected abstract execute(): Promise<JobResult>;

	protected result = {
		ok: (): JobResult => ({ ok: true }),
		fail: (reason?: string): JobResult => ({ ok: false, message: reason })
	};

	private buildTask(
		resultHandler: JobResultHandler,
		errorHandler: JobErrorHandler
	) {
		return new AsyncTask(
			this.id,
			() => this.execute().then(resultHandler),
			errorHandler
		);
	}

	public registerJob(
		resultHandler: JobResultHandler,
		errorHandler: JobErrorHandler
	) {
		return new SimpleIntervalJob(
			{ seconds: this.definition.frequency, runImmediately: true },
			this.buildTask(resultHandler, errorHandler),
			{ id: this.id }
		);
	}
}

export default Job;
