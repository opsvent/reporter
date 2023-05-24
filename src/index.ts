import Config from './Config.js';
import Logger from './Logger.js';
import Worker from './worker/Worker.js';

const config = new Config();

const loggerFactory = new Logger(config.log);

const log = loggerFactory.createLogger('main');

const worker = new Worker(
	config.reporter,
	loggerFactory.createLogger('worker')
);

const main = async () => {
	log.info('OpsVent Reporter starting up');

	try {
		await worker.start();

		log.info('Startup sequence completed');
	} catch (e) {
		log.error('Failed to start up', { exception: e });
		// eslint-disable-next-line no-console
		console.log(e);
		exit();
	}
};

const exit = async () => {
	log.info('Shutting down');
	await worker.stop().catch(() => {});
	log.info('Bye!');
	process.exit();
};

process.on('SIGTERM', exit);
process.on('SIGINT', exit);

main();
