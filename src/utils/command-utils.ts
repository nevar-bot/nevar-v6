import { BaseClient } from '@core/BaseClient.js';
import { ApplicationCommand } from 'discord.js';
import path from 'path';

class CommandUtils {
	private readonly client: BaseClient;
	constructor(client: BaseClient) {
		this.client = client;
	}

	/**
	 * Load a command
	 * @param commandPath
	 * @param name
	 * @param type
	 */
	public async loadCommand(commandPath: string, name: string, type: 'chat'|'user'|'message'): Promise<void> {
		try{
			// Import command
			const module = await import(commandPath + '/' + name);

			// Remove file extension from command name
			const commandNameWithoutFileExtension: string = path.basename(name, path.extname(name));

			// Create command class name
			const commandClassName: string = commandNameWithoutFileExtension.charAt(0).toUpperCase() + commandNameWithoutFileExtension.slice(1) + 'Command';

			// Instantiate command
			const props = new module[commandClassName](this.client);

			// Set location
			props.general.location = commandPath;

			// Set command in client commands collection
			this.client.commands[type].set(props.general.name, props);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Unload a command
	 * @param commandPath
	 * @param name
	 * @param type
	 */
	public async unloadCommand(commandPath: string, name: string, type: 'chat'|'user'|'message'): Promise<void> {
		try{
			// Remove command from client commands collection
			delete require.cache[require.resolve(commandPath + path.sep + name + '.js')];
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Reload a command
	 * @param commandPath
	 * @param name
	 * @param type
	 */
	public async reloadCommand(commandPath: string, name: string, type: 'chat'|'user'|'message'): Promise<void> {
		try{
			// Unload and load command
			await this.unloadCommand(commandPath, name, type);
			await this.loadCommand(commandPath, name, type);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Create a command mention
	 * @param name
	 * @param subParts
	 */
	public async commandMention(name: string, ...subParts: string[]): Promise<string> {
		try{
			// Check if command is cached else fetch commands
			if(!this.client.application.commands.cache.find((command: ApplicationCommand): boolean => command.name === name)){
				await this.client.application.commands.fetch();
			}

			// Get application command from cache
			const applicationCommand: ApplicationCommand|undefined = this.client.application.commands.cache.find((command: ApplicationCommand): boolean => command.name === name);

			// Return fake command mention if command is not cached
			if(!applicationCommand) return '/' + name + ' ' + subParts.join(' ');

			// Create command mention
			let commandWithSubparts: string = [applicationCommand.name, ...subParts].join(' ');
			return '</' + commandWithSubparts.trim() + ':' + applicationCommand.id + '>';
		}catch(error: unknown){
			throw error;
		}
	}
}

export { CommandUtils };