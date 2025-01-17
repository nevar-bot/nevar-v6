import { BaseClient } from '@core/BaseClient';
import { BaseEvent } from '@core/BaseEvent.js';
import { GuildUtils } from '@utils/guild-utils.js';
import config from 'config';
import { ColorResolvable, EmbedBuilder, GuildMember, PermissionsBitField, Role, RoleResolvable } from 'discord.js';

class GuildMemberAddEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(addedGuildMember: GuildMember): Promise<void> {
		if (!addedGuildMember || !addedGuildMember.id || !addedGuildMember.guild || !addedGuildMember.guild.available || addedGuildMember.pending) return;
		const { guild } = addedGuildMember;

		const guildUtilsInstance: GuildUtils = new GuildUtils(this.client, guild);
		const guildData: any = await this.databaseUtils.findOrCreateGuild(guild.id);

		// Log message
		const embedText: string =
			'### ' + this.emote('member_create') + ' Mitglied hat den Server betreten\n\n' +
			'-# ' + this.emote('calendar') + ' **Erstellt am**: ' + this.formatUtils.discordTimestamp(addedGuildMember.user.createdTimestamp, 'f') + '\n' +
			'-# ' + this.emote('reminder') + ' **Erstellt vor**: ' + this.formatUtils.discordTimestamp(addedGuildMember.user.createdTimestamp, 'R');

		const memberLogEmbed = this.clientUtils.createEmbed(embedText, null, 'success')
			.setAuthor({ name: addedGuildMember.user.username, iconURL: addedGuildMember.displayAvatarURL() });

		await guildUtilsInstance.log(memberLogEmbed, 'member');

		// Auto roles
		if (guildData.settings.welcome.autoroles.length > 0) {
			const autoRoles: RoleResolvable[] = [];
			for (let roleId of guildData.settings.welcome.autoroles) {
				const role: Role | void = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => {
				});
				if (role) autoRoles.push(role);
			}

			addedGuildMember.roles.add(autoRoles).catch(() => {
			});
		}

		// Welcome message
		if (guildData.settings.welcome.enabled) {
			const guildMessage: string = guildData.settings.welcome.message;
			if (!guildMessage) {
				const embedText: string =
					'### ' + this.emote('error') + ' Willkommensnachricht nicht gefunden\n\n' +
					'-# ' + this.emote('arrow_right') + ' **Fehler**: Es wurde keine Willkommensnachricht gesetzt. Bitte setze die Willkommensnachricht mit `/welcome nachricht`.';

				const serverLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(this.client.user.displayAvatarURL());
				await guildUtilsInstance.log(serverLogEmbed, 'guild');
				return;
			}

			const welcomeMessage: string = this.parseWelcomeMessage(guildMessage, addedGuildMember, guild);

			const channel: any = guild.channels.cache.get(guildData.settings.welcome.channelId);
			if (!channel) {
				const embedText: string =
					'### ' + this.emote('error') + ' Willkommenskanal nicht gefunden\n\n' +
					'-# ' + this.emote('arrow_right') + ' **Fehler**: Der Willkommenskanal wurde nicht gefunden. Bitte setze den Willkommenskanal mit `/welcome kanal`.';

				const serverLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(this.client.user.displayAvatarURL());
				await guildUtilsInstance.log(serverLogEmbed, 'guild');
				return;
			}

			if (!guild.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) return;
			if (!guildData.settings.welcome.color) {
				const embedText: string =
					'### ' + this.emote('error') + ' Willkommensfarbe nicht gefunden\n\n' +
					'-# ' + this.emote('arrow_right') + ' **Fehler**: Die Willkommensfarbe wurde nicht gefunden. Bitte setze die Willkommensfarbe mit `/welcome farbe`.';

				const serverLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(this.client.user.displayAvatarURL());
				await guildUtilsInstance.log(serverLogEmbed, 'guild');
				return;
			}

			const welcomeEmbed: EmbedBuilder = new EmbedBuilder()
				.setDescription(welcomeMessage)
				.setColor(guildData.settings.welcome.color as ColorResolvable)
				.setFooter({ text: config.get('embeds.footer_text') });

			if (guildData.settings.welcome.avatar) {
				welcomeEmbed.setThumbnail(addedGuildMember.displayAvatarURL());
			}

			await channel.send({ embeds: [welcomeEmbed] });
		}
	}

	private parseWelcomeMessage(message: string, addedGuildMember: GuildMember, guild: any): string {
		return message
			.replaceAll('?user.displayName', addedGuildMember.displayName)
			.replaceAll('?user.name', addedGuildMember.user.username)
			.replaceAll('?user', addedGuildMember.toString())
			.replaceAll('?server.name', guild.name)
			.replaceAll('?server.memberCount', guild.memberCount.toString())
			.replaceAll('?newline', '\n');
	}
}

export { GuildMemberAddEvent };
