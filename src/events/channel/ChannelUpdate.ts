import { BaseClient } from '@core/BaseClient.js';
import { AuditLogEvent, EmbedBuilder } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class ChannelUpdateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(oldChannel, newChannel): Promise<void> {
		if (!oldChannel || !newChannel || !newChannel.guild) return;
		const { guild } = newChannel;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const channelType: string = this.formatUtils.localizedChannelType(newChannel.type);

			const embedText: string =
				'### ' + this.emote('channel_update') + ' [' + channelType + ' bearbeitet](' + newChannel.url + ')\n\n'+
				'-# ' + this.emote('channel') + ' **Kanal**: ' + newChannel.toString() + '\n' +
				'### ' + this.emote('edit') + ' Änderungen:\n';

			const changes: string[] = [];

			if(oldChannel.name !== newChannel.name) changes.push('-# ' + this.emote('quotes') + ' **Name**: ' + oldChannel.name + ' **➜** ' + newChannel.name);
			if(oldChannel.topic !== newChannel.topic && (newChannel.topic || oldChannel.topic)) changes.push('-# ' + this.emote('text') + ' **Thema**: ' + (oldChannel.topic || '/') + ' **➜** ' + (newChannel.topic || '/'));
			if(oldChannel.nsfw !== newChannel.nsfw) changes.push('-# ' + this.emote('underage') + ' **NSFW**: ' + (oldChannel.nsfw ? 'aktiv' : 'inaktiv') + ' **➜** ' + (newChannel.nsfw ? 'aktiv' : 'inaktiv'));
			if(oldChannel.parentId !== newChannel.parentId) changes.push('-# ' + this.emote('list') + ' **Kategorie**: ' + (oldChannel.parent?.name || '/') + ' **➜** ' + (newChannel.parent?.name || '/'));
			if(oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser && (newChannel.rateLimitPerUser || oldChannel.rateLimitPerUser)) changes.push('-# ' + this.emote('timeout') + ' **Slow-Modus**: ' + (oldChannel.rateLimitPerUser ? (oldChannel.rateLimitPerUser + 's') : 'inaktiv') + ' **➜** ' + (newChannel.rateLimitPerUser ? (newChannel.rateLimitPerUser + 's') : 'inaktiv'));
			if(oldChannel.bitrate !== newChannel.bitrate) changes.push('-# ' + this.emote('ping_good') + ' **Bitrate**: ' + oldChannel.bitrate / 1000 + 'kbps **➜** ' + newChannel.bitrate / 1000 + 'kbps');
			if(oldChannel.userLimit !== newChannel.userLimit) changes.push('-# ' + this.emote('users') + ' **Userlimit**: ' + (oldChannel.userLimit === 0 ? 'unbegrenzt' : oldChannel.userLimit) + ' **➜** ' + (newChannel.userLimit === 0 ? 'unbegrenzt' : newChannel.userLimit));
			if(oldChannel.videoQualityMode !== newChannel.videoQualityMode) changes.push('-# ' + this.emote('monitor') + ' **Videoqualität**: ' + (oldChannel.videoQualityMode === 1 ? 'automatisch' : '720p') + ' **➜** ' + (newChannel.videoQualityMode === 1 ? 'automatisch' : '720p'));

			if(changes.length === 0) return;

			const channelLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText + changes.join('\n'), null, 'normal');
			if(executor) channelLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(channelLogEmbed, 'channel');
		}catch(error: unknown){

		}
	}
}

export { ChannelUpdateEvent };