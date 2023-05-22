import dotenv from 'dotenv';
import env from 'env-var';
import _ from 'lodash';

export interface ReporterConfig {
	readonly coordinator: string;
	readonly kid: string;
	readonly key: string;
}

export interface LogConfig {
	readonly level: string;
	readonly format: string;
	readonly transports: Set<string>;
}

class Config {
	_reporter: ReporterConfig;
	_log: LogConfig;

	constructor() {
		dotenv.config();

		this._reporter = {
			coordinator: env.get('OV_COORDINATOR').required().asString(),
			kid: env.get('OV_AUTH_KID').required().asString(),
			key: env.get('OV_AUTH_KEY').required().asString()
		};

		this._log = {
			level: env.get('OV_LOG_LEVEL').default('info').asString(),
			format: env.get('OV_LOG_FORMAT').default('json').asString(),
			transports: new Set(
				env.get('OV_LOG_TRANSPORTS').default('console').asArray()
			)
		};
	}

	public get reporter() {
		return _.cloneDeep(this._reporter);
	}

	public get log() {
		return _.cloneDeep(this._log);
	}
}

export default Config;
