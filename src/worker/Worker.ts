import hmac from '@opsvent/hmac';
import got from 'got';
import Winston from 'winston';

import { ReporterConfig } from '../Config.js';

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

	constructor(config: ReporterConfig, logger: Winston.Logger) {
		this.config = config;
		this.logger = logger;
		this.authKey = {
			id: this.config.kid,
			key: this.config.key
		};

		this.logger.info('Creating worker node', { kid: this.config.kid });
	}

	public async start() {
		await this.fetchJobDefinitions();
	}

	public async stop() {}

	private async fetchJobDefinitions() {
		const resp = (await this.sendRequest(
			'GET',
			'/definitions'
		)) as ApiResponse<{ generation: number; definitions: JobDefinition[] }>;

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
	}

	private sendRequest(
		method: 'GET' | 'POST',
		path: string,
		body?: any
	): Promise<any> {
		const sendBody = body ? JSON.stringify(body) : '';

		return got({
			method: method,
			prefixUrl: this.config.coordinator,
			url: path,
			body: sendBody,
			headers: {
				Authorization: hmac.sign(
					{
						method,
						url: path,
						body: sendBody
					},
					this.authKey
				)
			}
		}).json();
	}
}

export default Worker;
