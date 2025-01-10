import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, PermissionsBitField,
	SlashCommandUserOption, EmbedBuilder, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class ResetwarningsCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'reset-warnings',
			description: 'Setze die Verwarnungen eines Mitgliedes zurück',
			dirname: import.meta.url,
			permissions: {
				bot: [Flags.KickMembers],
				user: [Flags.KickMembers]
			},
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle ein Mitglied')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const member: any = this.options.getMember('mitglied');

		if (!member) {
			const memberIsMissingEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst ein Mitglied auswählen, bevor du den Befehl absendest.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [memberIsMissingEmbed] });
			return;
		}

		try {
			const memberData: any = await this.databaseUtils.findOrCreateMember(member.user.id, this.guild.id);
			memberData.warnings = [];
			memberData.markModified('warnings');
			await memberData.save();

			const warningsResettedMessage: string = 'Die Verwarnungen von ' + member.toString() + ' **wurden zurückgesetzt**.';
			const warningsResettedEmbed: EmbedBuilder = this.clientUtils.createEmbed(warningsResettedMessage, this.emote('delete'), 'normal');
			await this.interaction.followUp({ embeds: [warningsResettedEmbed] });

			const logMessage: string =
				'### ' + this.emote('delete') + ' Verwarnungen von ' + member.toString() + ' zurückgesetzt';

			const logEmbed: EmbedBuilder = this.clientUtils.createEmbed(logMessage, null, 'normal')
				.setAuthor({ name: this.member.user.username, iconURL: this.member.displayAvatarURL() });

			await this.guildUtils.log(logEmbed, 'moderation');
		} catch (error: unknown) {
			await this.handleUnknownError(error);
		}
	}
}

export { ResetwarningsCommand };