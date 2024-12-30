import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	ButtonBuilder, ButtonStyle, CommandInteraction,
	CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType, SlashCommandBuilder,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class VoteCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'vote',
			description: 'Unterstütze uns mit deiner Stimme!',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
			},
		});
	}

	public async run(): Promise<void> {
		const voteText: string = 'Wir sind dir sehr dankbar, wenn du für {0} votest! Deine Stimme hilft uns, **bekannter zu werden** und **neue Nutzer zu gewinnen**.';
		const voteEmbed: EmbedBuilder = this.clientUtils.createEmbed(voteText, this.emote('chart_up'), 'normal', this.client.user.displayName);
		const topggButton: ButtonBuilder = this.componentsUtils.createButton(null, 'Top.gg', ButtonStyle.Link, this.emote('topgg'), false, 'https://top.gg/bot/' + this.client.user.id + '/vote');
		const voteActionRow = this.componentsUtils.createActionRow(topggButton);

		await this.interaction.followUp({ embeds: [voteEmbed], components: [voteActionRow] });
	}
}

export { VoteCommand };