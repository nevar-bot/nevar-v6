import 'module-alias/register.js';
import 'source-map-support/register.js';

import { BaseClient } from '@core/BaseClient.js';
import { ConfigValidator } from '@services/ConfigValidator.js';
import { Loader } from '@services/Loader.js';
import { CommandManager } from '@services/CommandManager.js';
import { Database } from '@database/mongoose.js';



import { LoggerUtils } from '@utils/logger-utils.js';
import { ClientUtils } from '@utils/client-utils.js';

// Initialize class instances
const loggerInstance: LoggerUtils = new LoggerUtils();
const configValidatorInstance: ConfigValidator = new ConfigValidator();
const clientInstance: BaseClient = new BaseClient();
const databaseInstance: Database = new Database();
const commandManagerInstance: CommandManager = new CommandManager(clientInstance);
const loaderInstance: Loader = new Loader(clientInstance);
const clientUtilsInstance: ClientUtils = new ClientUtils(clientInstance);

// Validate configuration file
await configValidatorInstance.start().catch((error: Error) => loggerInstance.error('Error while validating config file', error));

// Map command actions
const commandActions: { [key: string]: () => Promise<void|Error> } = {
	view: async () => await commandManagerInstance.view(),
	unregister: async () => await commandManagerInstance.unregister(),
	delete: async () => await commandManagerInstance.delete(process.argv[4]),
	register: async () => {
		await loaderInstance.loadCommands(true);
		await commandManagerInstance.register();
	}
}

// Handle command action
if(process.argv[2] === 'commands' && commandActions[process.argv[3]]){
	await commandActions[process.argv[3]]();
	process.exit(0);
}else{
	(async (): Promise<BaseClient> => await initiate())();
}


// Initialize client
async function initiate(): Promise<BaseClient> {
	await loaderInstance.loadCommands().catch((error: Error) => loggerInstance.error('Error while loading commands', error));
	await loaderInstance.loadEvents().catch((error: Error) => loggerInstance.error('Error while loading events', error));
	await databaseInstance.initiate().catch((error: Error) => loggerInstance.error('Error while initializing database', error));
	await loaderInstance.login().catch((error: Error) => loggerInstance.error('Error while logging in bot', error));

	return clientInstance;
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error): void => {
	loggerInstance.error('An uncaught exception occurred', error);
	clientUtilsInstance.sendToErrorLog(error, 'error');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any): void => {
	loggerInstance.error('An unhandled rejection occurred', reason);
	clientUtilsInstance.sendToErrorLog(reason, 'error');
});

// Handle warnings
process.on('warning', (warning: Error): void => {
	loggerInstance.warn('A warning occurred', warning);
	clientUtilsInstance.sendToErrorLog(warning, 'warning');
});

export { clientInstance as client };