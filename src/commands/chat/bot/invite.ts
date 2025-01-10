import { BaseCommand } from '@core/BaseCommand.js';
import {
	ButtonBuilder, ButtonStyle, CommandInteraction,
	CommandInteractionOptionResolver, EmbedBuilder, SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class InviteCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'invite',
			description: 'Lade mich auf deinen Server ein',
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
		const inviteText: string = 'Ich **würde mich freuen**, auch auf deinem Server zu sein! **Klicke einfach auf den Button**, um mich einzuladen.';
		const inviteEmbed: EmbedBuilder = this.clientUtils.createEmbed(inviteText, this.emote('logo_icon'), 'normal');
		const inviteButton: ButtonBuilder = this.componentsUtils.createButton(null, 'Einladen', ButtonStyle.Link, this.emote('logo_icon'), false, this.clientUtils.createInvite());
		const inviteActionRow = this.componentsUtils.createActionRow(inviteButton);

		await this.interaction.followUp({ embeds: [inviteEmbed], components: [inviteActionRow] });
	}
}

export { InviteCommand };