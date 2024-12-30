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
		if(!removedGuildMember || !removedGuildMember.id || !removedGuildMember.guild) return;
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
		if(guildData.settings.farewell.enabled){
			function parseFarewellMessage(message: string): string {
				return message
					.replaceAll('?user.displayName', removedGuildMember.displayName)
					.replaceAll('?user.name', removedGuildMember.user.username)
					.replaceAll('?user', removedGuildMember.toString())
					.replaceAll('?server.name', guild.name)
					.replaceAll('?server.memberCount', guild.memberCount.toString())
					.replaceAll('?newline', '\n');
			}

			const farewellMessage: string = parseFarewellMessage(guildData.settings.farewell.message);

			const channel: any = guild.channels.cache.get(guildData.settings.farewell.channelId);
			if(!channel) return;

			if(!guild.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) return;
			if(!guildData.settings.farewell.color) return;

			const farewellEmbed: EmbedBuilder = new EmbedBuilder()
				.setDescription(farewellMessage)
				.setColor(guildData.settings.farewell.color as ColorResolvable)
				.setFooter({ text: config.get('embeds.footer_text') });

			if(guildData.settings.farewell.avatar){
				farewellEmbed.setThumbnail(removedGuildMember.displayAvatarURL());
			}

			await channel.send({ embeds: [farewellEmbed] });
		}
	}
}

export { GuildMemberRemoveEvent };