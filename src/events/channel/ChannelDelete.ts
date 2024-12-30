import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildChannel } from "discord.js";
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class ChannelDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedChannel: GuildChannel): Promise<any> {
		if (!deletedChannel || !deletedChannel.guild) return;
		const { guild } = deletedChannel;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const channelType: string = this.formatUtils.localizedChannelType(deletedChannel.type);
			const embedText: string =
				'### ' + this.emote('channel_delete') + ' [' + channelType + ' gelöscht](' + deletedChannel.url + ')\n\n' +
				'-# ' + this.emote('channel') + ' **Kanal**: #' + deletedChannel.name;

			const channelLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error');
			if(executor) channelLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(channelLogEmbed, 'channel');
		}catch(error: unknown){

		}
	}
}

export { ChannelDeleteEvent };