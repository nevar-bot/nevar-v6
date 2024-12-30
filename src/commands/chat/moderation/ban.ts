import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, GuildBan, InteractionContextType,
	PermissionsBitField, SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;
import ems from "enhanced-ms";
const ms: any = ems("de");

class BanCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'ban',
			description: 'Verbanne unliebsame Nutzer von deinem Server',
			permissions: {
				bot: [Flags.BanMembers],
				user: [Flags.BanMembers]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das Mitglied, welches du bannen möchtest')
						.setRequired(true)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('grund')
						.setDescription('Begründe den Ban')
						.setRequired(false)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('dauer')
						.setDescription('Wähle eine Dauer (z.B. 1h, 1d, 1h 30m, etc.)')
						.setRequired(false)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const user = this.options.getUser('mitglied');
		const member = await this.guild.members.fetch(user.id).catch((): void => {});
		const reason: string = this.options.getString('grund') || 'Kein Grund angegeben';
		const duration: string = this.options.getString('dauer') || '200y';

		// Check if user tries to ban himself
		if(user.id === this.member.user.id){
			const cantBanYourselfEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du kannst **dich nicht selbst bannen**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantBanYourselfEmbed] });
			return;
		}

		// Check if user tries to ban the bot
		if(user.id === this.client.user.id){
			const cantBanMyselfEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich kann **mich nicht selbst bannen**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantBanMyselfEmbed] });
			return;
		}

		// Check if target member has a higher role
		if (member && member?.roles.highest.position >= this.member.roles.highest.position) {
			const higherRoleEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} hat eine **höhere oder gleich hohe Rolle** als du.', this.emote('error'), 'error', member.toString());
			await this.interaction.followUp({ embeds: [higherRoleEmbed] });
			return;
		}

		// Check if target member is bannable
		if(member && !member?.bannable){
			const notBannableEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist **nicht bannbar**.', this.emote('error'), 'error', member.toString());
			await this.interaction.followUp({ embeds: [notBannableEmbed] });
			return;
		}

		// Check if user is already banned
		const fetchedGuildBan: GuildBan|void = await this.guild.bans.fetch(user.id).catch((): void => {});
		if(fetchedGuildBan){
			const alreadyBannedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist **bereits gebannt**.', this.emote('error'), 'error', (member ? member.toString() : user.username));
			await this.interaction.followUp({ embeds: [alreadyBannedEmbed] });
			return;
		}

		// Check if duration is valid
		if(duration && !ms(duration)){
			const invalidDurationEmbed: EmbedBuilder = this.clientUtils.createEmbed('Gib eine **gültige Dauer an, bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidDurationEmbed] });
			return;
		}

		const convertedDuration: number = ms(duration);
		const relativeTime: string = this.formatUtils.discordTimestamp(Date.now() + convertedDuration, 'R');
		const unbanDate: string = this.formatUtils.discordTimestamp(Date.now() + convertedDuration, 'f');

		// Inform target user about the ban
		const privateBanInformationText: string =
			'### ' + this.emote('ban') + ' Du wurdest von ' + this.guild.name + ' gebannt!\n\n' +
			'-# ' + this.emote('text') + ' **Grund**: ' + reason + '\n' +
			'-# ' + this.emote('calendar') + ' **Entbannung am**: ' + unbanDate + '\n' +
			'-# ' + this.emote('reminder') + ' **Entbannung**: ' + relativeTime + '\n' +
			'-# ' + this.emote('user') + ' **Moderator**: ' + this.member.user.toString();

		const privateBanInformationEmbed: EmbedBuilder = this.clientUtils.createEmbed(privateBanInformationText, null, 'error');
		const privateBanInformationMessage: any = await user.send({ embeds: [privateBanInformationEmbed] }).catch((): void => {});

		try {
			// Ban target user
			await this.guild.bans.create(user.id, {
				reason: 'Moderator: ' + this.member.user.username + ' | Grund: ' + reason
			});

			// Save ban data in the database
			const targetMemberData = await this.databaseUtils.findOrCreateMember(user.id, this.guild.id);
			targetMemberData.ban = {
				status: true,
				reason,
				moderator: this.member.user.id,
				bannedAt: Date.now(),
				duration: convertedDuration,
				expiration: Date.now() + convertedDuration
			}
			targetMemberData.markModified('ban');
			await targetMemberData.save();

			// Inform the guild about the ban
			const publicBanInformationText: string =
				'### ' + this.emote('ban') + ' ' + (member ? member.toString() : user.username) + ' wurde gebannt!\n\n' +
				'-# ' + this.emote('text') + ' **Grund**: ' + reason + '\n' +
				'-# ' + this.emote('calendar') + ' **Entbannung am**: ' + unbanDate + '\n' +
				'-# ' + this.emote('reminder') + ' **Entbannung**: ' + relativeTime + '\n';
			const publicBanInformationEmbed: EmbedBuilder = this.clientUtils.createEmbed(publicBanInformationText, null, 'error')
				.setImage('https://c.tenor.com/jJuyU09YX3AAAAAd/tenor.gif');

			await this.interaction.followUp({ embeds: [publicBanInformationEmbed] });
		} catch (error: unknown) {
			await this.handleUnknownError(error);
			privateBanInformationMessage?.delete().catch((): void => {});
		}
	}
}

export { BanCommand };