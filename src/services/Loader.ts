import * as path from 'path';
import { extname, join } from 'path';
import { Events } from 'discord.js';
import { readdir } from 'fs/promises';
import { BaseClient } from '@core/BaseClient.js';
import { LoggerUtils as Log } from '@utils/logger-utils.js';
import { ClientUtils } from '@utils/client-utils.js';
import { CommandUtils } from '@utils/command-utils.js';
import { lstatSync, readdirSync, Stats } from 'fs';
import config from 'config';

const Logger: Log = new Log();


export class Loader {
	private readonly client: BaseClient;

	public constructor(client: BaseClient) {
		this.client = client;
	}

	public async loadCommands(silent: boolean = false): Promise<void | Error> {
		try {
			const Utils: ClientUtils = new ClientUtils(this.client);
			const commandUtilsInstance: CommandUtils = new CommandUtils(this.client);
			/* Load chat commands */
			let loadedChatCommands: number = 0;
			let failedChatCommands: number = 0;
			if (!silent) Logger.log('Trying to load chat commands...');

			/* Read all directories in chat commands folder */
			const directories: string[] = await readdir('./dist/commands/chat')
				.catch((error: any): [] => {
					if (error?.code !== 'ENOENT' && !silent) {
						Logger.error('Error while reading chat commands directory', error);
					}
					return [];
				});

			/* Loop through all directories */
			for (const directory of directories) {
				const chatCommands: string[] = await readdir(path.join('./dist/commands/chat', directory))
					.catch((error: any): [] => {
						if (error?.code !== 'ENOENT' && !silent) {
							Logger.error('Error while reading message command category directory', error);
						}
						return [];
					});

				/* Filter JavaScript files and load chat commands */
				for (const chatCommand of chatCommands.filter(command => path.extname(command) === '.js')) {
					try {
						await commandUtilsInstance.loadCommand('../commands/chat/' + directory, chatCommand, 'chat');
						loadedChatCommands++;
						if (!silent) Logger.log('Loaded chat command ' + chatCommand);
					} catch (error: unknown) {
						failedChatCommands++;
						if (!silent) Logger.error('Error while loading chat command ' + chatCommand, error);
					}
				}
			}

			const chatCommandsLogMessage: string = 'Attempted to load ' + (loadedChatCommands + failedChatCommands) + ' chat commands. ✅  ' + loadedChatCommands + ' - ❌  ' + failedChatCommands;
			if (failedChatCommands > 0) {
				if (!silent) Logger.warn(chatCommandsLogMessage);
			} else {
				if (!silent) Logger.success(chatCommandsLogMessage);
			}
			if (!silent && (failedChatCommands + loadedChatCommands === 0)) Logger.warn('There\'s no chat commands to load');

			/* Load user commands */
			let loadedUserCommands: number = 0;
			let failedUserCommands: number = 0;
			if (!silent) Logger.log('Trying to load user commands...');

			const userCommands: string[] = await readdir('./dist/commands/user')
				.catch((error: any): [] => {
					if (error?.code !== 'ENOENT' && !silent) {
						Logger.error('Error while reading user commands directory', error);
					}
					return [];
				});

			/* Filter JavaScript files and load user commands */
			for (const userCommand of userCommands.filter(command => path.extname(command) === '.js')) {
				try {
					await commandUtilsInstance.loadCommand('../commands/user/', userCommand, 'user');
					loadedUserCommands++;
					if (!silent) Logger.log('Loaded user command ' + userCommand);
				} catch (error: unknown) {
					failedUserCommands++;
					if (!silent) Logger.error('Error while loading user command ' + userCommand, error);
				}
			}


			const userCommandsLogMessage: string = 'Attempted to load ' + (loadedUserCommands + failedUserCommands) + ' user commands. ✅  ' + loadedUserCommands + ' - ❌  ' + failedUserCommands;
			if (failedUserCommands > 0) {
				if (!silent) Logger.warn(userCommandsLogMessage);
			} else {
				if (!silent) Logger.success(userCommandsLogMessage);
			}
			if (!silent && (failedUserCommands + loadedUserCommands === 0)) Logger.warn('There\'s no user commands to load');

			/* Load message commands */
			let loadedMessageCommands: number = 0;
			let failedMessageCommands: number = 0;
			if (!silent) Logger.log('Trying to load message commands...');

			const messageCommands: string[] = await readdir('./dist/commands/message')
				.catch((error: any): [] => {
					if (error?.code !== 'ENOENT' && !silent) {
						Logger.error('Error while reading message commands directory', error);
					}
					return [];
				});

			/* Filter JavaScript files and load message commands */
			for (const messageCommand of messageCommands.filter(command => path.extname(command) === '.js')) {
				try {
					await commandUtilsInstance.loadCommand('../commands/message/', messageCommand, 'message');
					loadedMessageCommands++;
					if (!silent) Logger.success('Loaded message command ' + messageCommand);
				} catch (error: unknown) {
					failedMessageCommands++;
					if (!silent) Logger.error('Error while loading message command ' + messageCommand, error);
				}
			}


			const messageCommandsLogMessage: string = 'Attempted to load ' + (loadedMessageCommands + failedMessageCommands) + ' message commands. ✅  ' + loadedMessageCommands + ' - ❌  ' + failedMessageCommands;
			if (failedMessageCommands > 0) {
				if (!silent) Logger.warn(messageCommandsLogMessage);
			} else {
				if (!silent) Logger.success(messageCommandsLogMessage);
			}
			if (!silent && (failedMessageCommands + loadedMessageCommands === 0)) Logger.warn('There\'s no message commands to load');
		} catch (error: unknown) {
			throw error;
		}
	}

	public async loadEvents(): Promise<void | Error> {
		try {
			let loadedEvents: number = 0;
			let failedEvents: number = 0;
			Logger.log('Trying to load events...');

			const eventFiles: string[] = this.recursiveReadDirSync('dist/events');

			for (const eventPath of eventFiles) {
				const eventFile: string = path.basename(eventPath);
				const eventName: string | typeof Events = path.basename(eventFile, path.extname(eventFile));

				try {
					const cleanPath: string = eventPath.split(path.sep).join(path.posix.sep).replace(/^[A-Za-z]:/, '');
					const module = await import(cleanPath);
					const nameWithoutFileExtension: string = path.basename(eventName, path.extname(eventName));
					const className: string = nameWithoutFileExtension + 'Event';
					const event = module[className];

					this.client.on(Events[eventName], (...args): void => {
						const eventInstance = new event(this.client);
						eventInstance.run(...args);
					});

					loadedEvents++;
					Logger.log('Loaded event ' + eventName);
				} catch (error: unknown) {
					failedEvents++;
					Logger.error('Error while loading event ' + eventName, error);
				}
			}
			const eventsLogMessage: string = 'Attempted to load ' + (loadedEvents + failedEvents) + ' events. ✅  ' + loadedEvents + ' - ❌  ' + failedEvents;
			if (failedEvents > 0) {
				Logger.warn(eventsLogMessage);
			} else {
				Logger.success(eventsLogMessage);
			}
			if (failedEvents + loadedEvents === 0) Logger.warn('There\'s no events to load');


		} catch (error: unknown) {
			throw error;
		}
	}

	public async login(): Promise<void> {
		await this.client.login(config.get('client.token'));
	}

	private recursiveReadDirSync(directory: string, allowedExtensions: string[] = ['.js']): string[] {
		const filePaths: string[] = [];

		const readCommands = (dir: string): void => {
			const files: string[] = readdirSync(join(process.cwd(), dir));
			files.forEach((file: string): void => {
				const filePath: string = join(process.cwd(), dir, file);
				const stat: Stats = lstatSync(filePath);

				if (stat.isDirectory()) {
					readCommands(join(dir, file));
				} else if (allowedExtensions.includes(extname(file))) {
					filePaths.push(filePath);
				}
			});
		};

		readCommands(directory);
		return filePaths;
	}
}