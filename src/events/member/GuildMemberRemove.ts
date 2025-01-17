import { BaseClient } from '@core/BaseClient';
import { BaseEvent } from '@core/BaseEvent.js';
import { GuildUtils } from '@utils/guild-utils.js';
import config from 'config';
import { ColorResolvable, EmbedBuilder, GuildMember, PermissionsBitField } from 'discord.js';

class GuildMemberRemoveEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(removedGuildMember: GuildMember): Promise<void> {
		if (!removedGuildMember || !removedGuildMember.id || !removedGuildMember.guild) return;
		const { guild } = removedGuildMember;

		const guildUtilsInstance: GuildUtils = new GuildUtils(this.client, guild);

		const guildData: any = await this.databaseUtils.findOrCreateGuild(guild.id);

		// Log message
		const embedText: string =
			'### ' + this.emote('member_delete') + ' Mitglied hat den Server verlassen\n\n' +
			'-# ' + this.emote('calendar') + ' **Erstellt am**: ' + this.formatUtils.discordTimestamp(removedGuildMember.user.createdTimestamp, 'f') + '\n' +
			'-# ' + this.emote('reminder') + ' **Erstellt vor**: ' + this.formatUtils.discordTimestamp(removedGuildMember.user.createdTimestamp, 'R');

		const memberLogEmbed = this.clientUtils.createEmbed(embedText, null, 'error')
			.setAuthor({ name: removedGuildMember.user.username, iconURL: removedGuildMember.displayAvatarURL() });

		await guildUtilsInstance.log(memberLogEmbed, 'member');

		// Goodbye message
		if (guildData.settings.farewell.enabled) {
			const guildMessage: string = guildData.settings.farewell.message;

			if (!guildMessage) {
				const embedText: string =
					'### ' + this.emote('error') + ' Verabschiedungsnachricht nicht gefunden\n\n' +
					'-# ' + this.emote('arrow_right') + ' **Fehler**: Es wurde keine Verabschiedungsnachricht gesetzt. Bitte setze die Verabschiedungsnachricht mit `/goodbye nachricht`.';

				const serverLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(this.client.user.displayAvatarURL());
				await guildUtilsInstance.log(serverLogEmbed, 'guild');
				return;
			}

			const farewellMessage: string = this.parseFarewellMessage(guildMessage, removedGuildMember, guild);

			const channel: any = guild.channels.cache.get(guildData.settings.farewell.channelId);
			if (!channel) {
				const embedText: string =
					'### ' + this.emote('error') + ' Verabschiedungskanal nicht gefunden\n\n' +
					'-# ' + this.emote('arrow_right') + ' **Fehler**:  Der Verabschiedungskanal wurde nicht gefunden. Bitte setze den Verabschiedungskanal mit `/goodbye kanal`.';

				const serverLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(this.client.user.displayAvatarURL());
				await guildUtilsInstance.log(serverLogEmbed, 'guild');
				return;
			}

			if (!guild.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) return;
			if (!guildData.settings.farewell.color) {
				const embedText: string =
					'### ' + this.emote('error') + ' Verabschiedungsfarbe nicht gefunden\n\n' +
					'-# ' + this.emote('arrow_right') + ' **Fehler**: Die Verabschiedungsfarbe wurde nicht gefunden. Bitte setze die Verabschiedungsfarbe mit `/goodbye farbe`.';

				const serverLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(this.client.user.displayAvatarURL());
				await guildUtilsInstance.log(serverLogEmbed, 'guild');
				return;
			}

			const farewellEmbed: EmbedBuilder = new EmbedBuilder()
				.setDescription(farewellMessage)
				.setColor(guildData.settings.farewell.color as ColorResolvable)
				.setFooter({ text: config.get('embeds.footer_text') });

			if (guildData.settings.farewell.avatar) {
				farewellEmbed.setThumbnail(removedGuildMember.displayAvatarURL());
			}

			await channel.send({ embeds: [farewellEmbed] });
		}
	}

	private parseFarewellMessage(message: string, removedGuildMember: GuildMember, guild: any): string {
		return message
			.replaceAll('?user.displayName', removedGuildMember.displayName)
			.replaceAll('?user.name', removedGuildMember.user.username)
			.replaceAll('?user', removedGuildMember.toString())
			.replaceAll('?server.name', guild.name)
			.replaceAll('?server.memberCount', guild.memberCount.toString())
			.replaceAll('?newline', '\n');
	}
}

export { GuildMemberRemoveEvent };