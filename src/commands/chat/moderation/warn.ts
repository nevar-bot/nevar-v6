import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType, CommandInteraction, CommandInteractionOptionResolver,
	InteractionContextType, SlashCommandBuilder, SlashCommandStringOption,
	SlashCommandUserOption, EmbedBuilder
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class WarnCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'warn',
			description: 'Verwarnt ein Mitglied',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das zu verwarnende Mitglied')
						.setRequired(true)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('grund')
						.setDescription('Gib einen Grund für die Verwarnung an')
					)
			},
		});
	}

	public async run(): Promise<void> {
		const member: any = this.options.getMember('mitglied');
		const reason: string = this.options.getString('grund') || 'Kein Grund angegeben';

		// Check if user tries to warn bot
		if(member.user.id === this.client.user.id){
			const cantWarnBotEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich kann mich **nicht selber verwarnen**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantWarnBotEmbed] });
			return;
		}

		// Check if user tries to warn himself
		if(member.user.id === this.member.user.id){
			const cantWarnYourselfEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du kannst dich **nicht selber verwarnen**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantWarnYourselfEmbed] });
			return;
		}

		// Check if user has higher role
		if(member.roles.highest.position >= this.member.roles.highest.position){
			const higherRoleEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du kannst keine Mitglieder verwarnen, die eine **höhere Rolle als du** haben.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [higherRoleEmbed] });
			return;
		}

		// Warn member
		const memberData = await this.databaseUtils.findOrCreateMember(member.user.id, this.guild.id);

		memberData.warnings.push({
			date: Date.now(),
			moderator: this.member.user.id,
			reason: reason
		});

		memberData.markModified('warnings');
		await memberData.save();

		// Notify warned member
		const privateText: string =
			'### ' + this.emote('warning') + ' Du wurdest auf ' + this.guild.name + ' verwarnt!\n\n' +
			'-# ' + this.emote('user') + ' **Moderator**: ' + this.member.toString() + '\n' +
			'-# ' + this.emote('text') + ' **Grund**: ' + reason;
		const privateEmbed: EmbedBuilder = this.clientUtils.createEmbed(privateText, null, 'warning');
		await member.user.send({ embeds: [privateEmbed] }).catch(() => {});

		// Send confirmation embed
		const publicText: string =
			'### ' + this.emote('warning') + ' ' + member.toString() + ' wurde verwarnt!\n\n' +
			'-# ' + this.emote('user') + ' **Moderator**: ' + this.member.toString() + '\n' +
			'-# ' + this.emote('text') + ' **Grund**: ' + reason;
		const publicEmbed: EmbedBuilder = this.clientUtils.createEmbed(publicText, null, 'normal')
			.setImage('https://y.yarn.co/108bf3d2-58ed-4741-88c6-9d112f599227_text.gif');
		await this.interaction.followUp({ embeds: [publicEmbed] });

		// Log action
		const guildLoggingText: string =
			'### ' + this.emote('warning') + ' ' + member.toString() + ' verwarnt\n\n' +
			'-# ' + this.emote('text') + ' **Grund**: ' + reason;

		const guildLoggingEmbed: EmbedBuilder = this.clientUtils.createEmbed(guildLoggingText, null, 'normal')
			.setAuthor({ name: this.interaction.user.username, iconURL: this.interaction.user.displayAvatarURL() });

		await this.guildUtils.log(guildLoggingEmbed, 'moderation');
	}
}

export { WarnCommand };