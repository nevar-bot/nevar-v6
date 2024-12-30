import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType,
	SlashCommandBuilder, SlashCommandStringOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class ReportbugCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'reportbug',
			description: 'Melde einen Fehler direkt an unser Entwickler-Team',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('beschreibung')
						.setDescription('Beschreibe den beobachteten Fehler bitte so genau wie möglich')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const bugReportMessage: string =
			'### ' + this.emote('bughunter') + ' Ein neuer Bug wurde gemeldet!\n\n' +
			'-# ' + this.emote('text') + ' ' + this.options.getString('beschreibung');

		const bugReportEmbed: EmbedBuilder = this.clientUtils.createEmbed(bugReportMessage, null, 'error')
			.setAuthor({ name: this.interaction.user.username, iconURL: this.interaction.user.displayAvatarURL() });
		this.clientUtils.sendEmbedToLog(bugReportEmbed);

		const bugReportConfirmationEmbed: EmbedBuilder = this.clientUtils.createEmbed('Dein **Bug-Report wurde eingereicht**. Vielen Dank für deine Meldung!', this.emote('bughunter'), 'normal');
		await this.interaction.followUp({ embeds: [bugReportConfirmationEmbed] });
	}
}

export { ReportbugCommand };