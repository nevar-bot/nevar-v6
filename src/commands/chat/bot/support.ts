import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	ButtonBuilder, ButtonStyle, CommandInteraction,
	CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType, SlashCommandBuilder,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class SupportCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'support',
			description: 'Betritt gerne unseren Support- & Community-Server',
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
		const supportText: string = 'Du hast **Fragen, Probleme, Anregungen oder möchtest einfach nur mit uns reden**? Wir sind gerne für dich da: über den Button gelangst du direkt zu uns!';
		const supportEmbed: EmbedBuilder = this.clientUtils.createEmbed(supportText, this.emote('question_mark'), 'normal');
		const supportButton: ButtonBuilder = this.componentsUtils.createButton(null, 'Support-Server', ButtonStyle.Link, this.emote('discord'), false, this.client.support);
		const supportActionRow = this.componentsUtils.createActionRow(supportButton);

		await this.interaction.followUp({ embeds: [supportEmbed], components: [supportActionRow] });
	}
}

export { SupportCommand };