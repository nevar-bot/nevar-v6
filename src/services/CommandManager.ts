import { BaseClient } from '@core/BaseClient.js';
import { LoggerUtils } from '@utils/logger-utils.js';
import { ContextMenuCommandBuilder, PermissionsBitField, Routes, REST } from 'discord.js';
import config from 'config';
import { bgBlueBright, bold, yellow, cyan, black } from 'colorette';
import { table } from 'table';

class CommandManager {
	private readonly client: BaseClient;
	private readonly logger: LoggerUtils;
	private readonly rest: REST;

	constructor(client: BaseClient) {
		this.client = client;
		this.logger = new LoggerUtils();
		this.rest = new REST().setToken(config.get('client.token'));
	}

	public async register(): Promise<void|Error> {
		try{
			this.logger.log('Trying to register chat commands...');
			const commands: Array<any> = [];

			for (const [_, command] of this.client.commands.chat) {
				if(!command) continue;
				const { general, permissions, slashCommand } = command;
				if(!slashCommand?.register) continue;

				const slashData = slashCommand.data;
				if(!slashData) continue;

				await slashData
					.setName(general.name)
					.setDescription(general.description)

				if (permissions?.user.length >= 1) {
					const PermissionsField: PermissionsBitField = new PermissionsBitField();
					permissions.user.forEach((perm: any): any => PermissionsField.add(perm));
					slashData.setDefaultMemberPermissions(PermissionsField.bitfield);
				}

				commands.push(slashData.toJSON());
			}

			const contextMenus: Map<string, any> = new Map([...this.client.commands.user.entries(), ...this.client.commands.message.entries()]);
			for (const [, command] of contextMenus) {
				if (!command) continue;
				const { general, permissions, slashCommand } = command;
				if (!slashCommand?.register) continue;

				const slashData = slashCommand.data;
				if(!slashData) continue;

				await slashData
					.setName(general.name)
					.setType(general.type)

				if (permissions?.user.length >= 1) {
					const PermissionsField: PermissionsBitField = new PermissionsBitField();
					permissions.user.forEach((perm: any): any => PermissionsField.add(perm));
					slashData.setDefaultMemberPermissions(PermissionsField.bitfield);
				}

				commands.push(slashData.toJSON());
			}

			console.log(commands.find((command) => command.name === 'tempchannels'));
			try {
				await this.rest.put(Routes.applicationCommands(config.get('client.id')), { body: commands });
				this.logger.success('Successfully registered ' + commands.length + ' commands');
			} catch (error: unknown) {
				this.logger.error('Error while registering interactions', error);
			}

		}catch(error: unknown){
			throw error;
		}
	}

	public async unregister(): Promise<void|Error> {
		try {
			this.logger.log('Trying to unregister interactions...');
			await this.rest.put(Routes.applicationCommands(config.get('client.id')), { body: [] });
			this.logger.success('Successfully unregistered all commands');
		}catch(error: unknown){
			throw error;
		}
	}

	public async view(): Promise<void|Error> {
		try {
			this.logger.log('Trying to show registered commands...');
			const applicationCommands: any = await this.rest.get(Routes.applicationCommands(config.get('client.id')))

			const data: string[][] = [
				[cyan(bold('Name')), cyan(bold('Description')), cyan(bold('Type'))],
				...applicationCommands.map((command: any) => [yellow(command.name), yellow(command.description || 'N/A'), yellow(command.type)])
			];

			console.log(table(data, { header: { alignment: 'center', content: bgBlueBright(black(bold('REGISTERED COMMANDS')))}}));
		}catch(error: unknown){
			throw error;
		}
	}

	public async delete(command: string): Promise<void|Error> {
		try{
			this.logger.log('Trying to delete command ' + command + '...');
			if(!command){
				this.logger.error('No command specified');
				return;
			}
			const applicationCommands: any = await this.rest.get(Routes.applicationCommands(config.get('client.id')));

			const registeredCommand = applicationCommands.find((cmd: any): boolean => cmd.name === command);

			if(!registeredCommand){
				this.logger.error('Command ' + command + ' is not registered or does not exist');
				return;
			}

			await this.rest.delete(Routes.applicationCommand(config.get('client.id'), registeredCommand.id));
			this.logger.success('Unregistered command ' + command);
		}catch(error: unknown){
			throw error;
		}
	}
}

export { CommandManager };