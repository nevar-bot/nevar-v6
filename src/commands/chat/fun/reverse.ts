import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction, CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder, SlashCommandStringOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class ReverseCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'reverse',
			description: '?thets reih saw ,nesel ud tsnnaK',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('text')
						.setDescription('Gib deinen Text ein, den ich umdrehen soll')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const textToReverse: string = this.options.getString('text');

		await this.interaction.followUp({ content: '> ' + this.emote('reload') + ' ' + this.user.toString() + ': ' + textToReverse.split('').reverse().join('') });
	}
}

export { ReverseCommand };