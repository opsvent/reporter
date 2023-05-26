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
		this.unscheduleAllJobs();

		for (const jobDefinition of jobDefinitions) {
			const jobId = `job_${jobDefinition.type}_${jobDefinition.id}`;
			this.logger.debug('Scheduling new job', { job: jobId });
			this.scheduledJobs.add(jobId);

			// create new job
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

	public unscheduleAllJobs() {
		this.scheduledJobs.forEach(jobId => {
			this.logger.debug('Unscheduling job', { job: jobId });
			this.scheduler.removeById(jobId);
			this.scheduledJobs.delete(jobId);
		});
	}
}

export default Runner;
