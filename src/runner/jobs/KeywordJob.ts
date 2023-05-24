import got from 'got';

import { MS_IN_SEC } from '../../constants.js';
import { KeywordJobDefinition } from '../../worker/JobDefinition.js';

import Job from './Job.js';

class KeywordJob extends Job {
	public readonly definition!: KeywordJobDefinition;

	protected async execute() {
		const resp = await got(this.definition.endpoint, {
			timeout: {
				request: this.definition.timeout * MS_IN_SEC
			}
		});

		for (const keyword of this.definition.keywords) {
			if (!resp.body.includes(keyword)) {
				return this.result.fail(
					`Body does not include keyword "${keyword}"`
				);
			}
		}

		return this.result.ok();
	}
}

export default KeywordJob;
