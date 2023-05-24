import { ToadScheduler } from 'toad-scheduler';
import Winston from 'winston';

import { JobDefinition } from '../worker/JobDefinition.js';

import Job, { JobResult } from './jobs/Job.js';
import JobBuilder from './jobs/JobBuilder.js';

type ReportFn = (job: Job, result: JobResult) => Promise<void>;

class Runner {
	private report: ReportFn;
	private logger: Winston.Logger;

	private scheduler: ToadScheduler;
	private scheduledJobs: Set<string>;

	constructor(report: ReportFn, logger: Winston.Logger) {
		this.report = report;
		this.logger = logger;
		this.scheduler = new ToadScheduler();
		this.scheduledJobs = new Set();

		this.logger.info('Initialized job runner');
	}

	public scheduleJobs(jobDefinitions: JobDefinition[]) {
		const currentJobs = new Set<string>();

		for (const jobDefinition of jobDefinitions) {
			const jobId = `job_${jobDefinition.type}_${jobDefinition.id}`;
			currentJobs.add(jobId);

			try {
				this.scheduler.getById(jobId);
				// job already running, don't disturb it
			} catch {
				// create new job
				this.logger.debug('Scheduling new job', { job: jobId });
				const job = JobBuilder(jobDefinition);
				this.scheduler.addSimpleIntervalJob(
					job.registerJob(
						result => {
							return this.report(job, result);
						},
						error => {
							this.logger.warn('Job failed to execute', {
								job: job.id,
								error: error.message
							});
							this.report(job, {
								ok: false,
								message: 'Error: ' + error.message
							});
						}
					)
				);
			}
		}

		// stop jobs that are unscheduled now
		this.scheduledJobs.forEach(jobId => {
			if (!currentJobs.has(jobId)) {
				// unschedule job
				this.logger.debug('Unscheduling job', { job: jobId });
				this.scheduler.removeById(jobId);
				this.scheduledJobs.delete(jobId);
			}
		});
	}
}

export default Runner;
