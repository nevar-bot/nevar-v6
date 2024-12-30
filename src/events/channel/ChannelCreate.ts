import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildChannel } from "discord.js";
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class ChannelCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdChannel: GuildChannel): Promise<any> {
		if (!createdChannel || !createdChannel.guild) return;
		const { guild } = createdChannel;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const channelType: string = this.formatUtils.localizedChannelType(createdChannel.type);
			const embedText: string =
				'### ' + this.emote('channel_create') + ' [' + channelType + ' erstellt](' + createdChannel.url + ')\n\n' +
				'-# ' + this.emote('channel') + ' **Kanal**: ' + createdChannel.toString();

			const channelLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success');
			if(executor) channelLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(channelLogEmbed, 'channel');
		}catch(error: unknown){

		}
	}
}

export { ChannelCreateEvent };