import got from 'got';
import _ from 'lodash';

import { MS_IN_SEC } from '../../constants.js';
import { HTTPJobDefinition } from '../../worker/JobDefinition.js';

import Job from './Job.js';

class HTTPJob extends Job {
	public readonly definition!: HTTPJobDefinition;

	protected async execute() {
		const resp = await got(this.definition.endpoint, {
			timeout: {
				request: this.definition.timeout * MS_IN_SEC
			},
			throwHttpErrors: false,
			followRedirect: false
		});

		for (const allowedStatus of this.definition.allowedHttpStatuses) {
			if (allowedStatus instanceof Array) {
				if (
					_.inRange(
						resp.statusCode,
						allowedStatus[0],
						allowedStatus[1] + 1
					)
				) {
					return this.result.ok();
				}
			} else {
				if (allowedStatus == resp.statusCode) {
					return this.result.ok();
				}
			}
		}

		return this.result.fail(`Got response code ${resp.statusCode}`);
	}
}

export default HTTPJob;
