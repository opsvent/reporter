import { ScriptJobDefinition } from '../../worker/JobDefinition.js';

import Job from './Job.js';

class ScriptJob extends Job {
	public readonly definition!: ScriptJobDefinition;

	protected async execute() {
		return this.result.fail('not implemented');
	}
}

export default ScriptJob;
