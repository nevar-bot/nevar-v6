import { BaseCommand } from '@core/BaseCommand.js';
import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class ExampleCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'example',
			description: 'Beschreibung',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
			},
		});
	}

	public async run(): Promise<void> {

	}
}

export { ExampleCommand };