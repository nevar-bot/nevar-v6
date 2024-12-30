import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction,
	CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption,
	EmbedBuilder
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class LetmegooglethatCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'letmegooglethat',
			description: 'Lass mich das für dich googlen',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('suchanfrage')
						.setDescription('Wonach möchtest du suchen?')
						.setRequired(true)
					)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('nutzer')
						.setDescription('Für wen möchtest du suchen?')
						.setRequired(false)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const searchQuery: string = this.options.getString('suchanfrage');
		const targetUser = this.options.getUser('nutzer');

		const searchUrl: string = 'https://letmegooglethat.com/?q=' + encodeURIComponent(searchQuery);

		const googleText: string = targetUser
			? 'Lass mich das für dich googlen, {2}: [{0}]({1})'
			: 'Lass mich das für dich googlen: [{0}]({1})';

		const googleEmbed: EmbedBuilder = this.clientUtils.createEmbed(googleText, this.emote('search'), 'normal', searchQuery, searchUrl, targetUser?.toString());

		await this.interaction.followUp({ embeds: [googleEmbed] });
	}
}

export { LetmegooglethatCommand };