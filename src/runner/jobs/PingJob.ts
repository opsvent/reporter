import Ping from 'net-ping';

import { MS_IN_SEC } from '../../constants.js';
import {
	PingJobDefinition,
	PingIPVersion
} from '../../worker/JobDefinition.js';

import Job, { JobResult } from './Job.js';

class PingJob extends Job {
	public readonly definition!: PingJobDefinition;

	private static sessionIdCounter = process.pid % 65535;

	private static getSessionId(): number {
		if (PingJob.sessionIdCounter > 65535) {
			PingJob.sessionIdCounter = 1;
		}

		return PingJob.sessionIdCounter++;
	}

	protected async execute() {
		const session = Ping.createSession({
			networkProtocol:
				this.definition.version == PingIPVersion.ipv6
					? Ping.NetworkProtocol.IPv6
					: Ping.NetworkProtocol.IPv4,
			timeout: this.definition.timeout * MS_IN_SEC,
			sessionId: PingJob.getSessionId()
		});

		return new Promise<JobResult>(resolve => {
			session.pingHost(this.definition.endpoint, err => {
				session.close();
				if (!err) {
					resolve(this.result.ok());
					return;
				}

				resolve(this.result.fail(err.message));
			});
		});
	}
}

export default PingJob;
