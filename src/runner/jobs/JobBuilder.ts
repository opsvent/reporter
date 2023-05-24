import { JobDefinition, JobType } from '../../worker/JobDefinition.js';

import HTTPJob from './HTTPJob.js';
import Job from './Job.js';
import KeywordJob from './KeywordJob.js';
import PingJob from './PingJob.js';
import ScriptJob from './ScriptJob.js';

const assertUnreachable = (_: never) => {
	throw new Error('This should not be reached');
	return _;
};

const JobBuilder = (definition: JobDefinition): Job => {
	switch (definition.type) {
		case JobType.http:
			return new HTTPJob(definition);
		case JobType.ping:
			return new PingJob(definition);
		case JobType.keyword:
			return new KeywordJob(definition);
		case JobType.script:
			return new ScriptJob(definition);
		default:
			return assertUnreachable(definition.type);
	}
};

export default JobBuilder;
