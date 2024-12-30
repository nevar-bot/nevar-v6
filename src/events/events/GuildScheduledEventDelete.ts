import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildScheduledEvent } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildScheduledEventDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedEvent: GuildScheduledEvent): Promise<any> {
		if (!deletedEvent || !deletedEvent.guild) return;
		const { guild } = deletedEvent;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildScheduledEventDelete, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('event_delete') + ' [Event gelöscht](' + deletedEvent.url + ')\n\n' +
				'-# ' + this.emote('calendar') + ' **Event**: #' + deletedEvent.name;

			const eventLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(deletedEvent.image);
			if(executor) eventLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(eventLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildScheduledEventDeleteEvent };