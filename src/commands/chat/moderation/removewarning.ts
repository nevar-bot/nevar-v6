import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType, CommandInteraction, PermissionsBitField,
	CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType,
	SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandUserOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;
class RemovewarningCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'remove-warning',
			description: 'Entferne eine Verwarnung eines Mitglieds',
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
						.setDescription('Wähle das Mitglied')
						.setRequired(true)
					)
					.addIntegerOption((integerOption: SlashCommandIntegerOption) => integerOption
						.setName('nummer')
						.setDescription('Gib die Nummer der zu entfernenden Verwarnung an')
						.setRequired(true)
						.setMinValue(1)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const member: any = this.options.getMember('mitglied');
		const num: number = this.options.getInteger('nummer');

		const memberData = await this.databaseUtils.findOrCreateMember(member.user.id, this.guild.id);
		if(!memberData.warnings[num - 1]){
			const numberIsMissingEmbed = this.clientUtils.createEmbed('{0} hat **keinen Warn mit der Nummer {1}**.', this.emote('error'), 'error', member.toString(), num);
			await this.interaction.followUp({ embeds: [numberIsMissingEmbed] });
			return;
		}

		if(member.user.id === this.member.user.id){
			const cantRemoveOwnWarnsEmbed = this.clientUtils.createEmbed('Du kannst **keine eigenen Verwarnungen entfernen**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantRemoveOwnWarnsEmbed] });
			return;
		}

		// Remove warning
		memberData.warnings.splice(num - 1, 1);
		memberData.markModified('warnings');
		await memberData.save();

		const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verwarnung mit der **Nummer {0} wurde von {1} entfernt**.', this.emote('success'), 'success', num, member.toString());
		await this.interaction.followUp({ embeds: [successEmbed] });

		// Log action
		const guildLoggingText: string =
			'### ' + this.emote('warning') + ' Verwarnung ' + num + ' von ' + member.toString() + ' entfernt';

		const guildLoggingEmbed: EmbedBuilder = this.clientUtils.createEmbed(guildLoggingText, null, 'normal')
			.setAuthor({ name: this.interaction.user.username, iconURL: this.interaction.user.displayAvatarURL() });

		await this.guildUtils.log(guildLoggingEmbed, 'moderation');
	}
}

export { RemovewarningCommand };