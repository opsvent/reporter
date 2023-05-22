import Winston from 'winston';

import { LogConfig } from './Config.js';

class Logger {
	private winston: Winston.Logger;

	constructor(config: LogConfig) {
		this.winston = Winston.createLogger({
			level: config.level,
			format:
				config.format == 'json'
					? Winston.format.combine(
							Winston.format.timestamp(),
							Winston.format.json()
					  )
					: Winston.format.combine(
							Winston.format.timestamp(),
							Winston.format.printf(info => {
								const {
									timestamp,
									level,
									group,
									message,
									...extra
								} = info;

								const extraInfo = Object.keys(extra)
									.map(
										key =>
											`\t> ${key.padEnd(15, ' ')} - ${
												extra[key] instanceof Object ||
												extra[key] instanceof Array
													? JSON.stringify(extra[key])
													: extra[key]
											}`
									)
									.join('\n');

								return `${timestamp} - ${level.padEnd(
									5,
									' '
								)} - ${group.padEnd(15, ' ')} - ${message}${
									extraInfo ? '\n' + extraInfo : ''
								}`;
							})
					  ),
			transports: Array.from(config.transports)
				.map(transport => {
					if (transport == 'console') {
						return new Winston.transports.Console();
					}

					if (transport == 'file') {
						return new Winston.transports.File({
							filename: 'opsvent-reporter.log',
							maxsize: 10485760,
							maxFiles: 10,
							tailable: true
						});
					}

					return null;
				})
				.filter(
					(
						transport
					): transport is
						| Winston.transports.ConsoleTransportInstance
						| Winston.transports.FileTransportInstance =>
						!!transport
				)
		});
	}

	createLogger(group: string): Winston.Logger {
		return this.winston.child({ group });
	}
}

export default Logger;
