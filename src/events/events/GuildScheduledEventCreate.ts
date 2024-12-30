import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildScheduledEvent } from "discord.js";
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildScheduledEventCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdEvent: GuildScheduledEvent): Promise<any> {
		if (!createdEvent || !createdEvent.guild) return;
		const { guild } = createdEvent;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildScheduledEventCreate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('event_create') + ' [Event erstellt](' + createdEvent.url + ')\n\n' +
				'-# ' + this.emote('calendar') + ' **Event**: ' + createdEvent.name;

			const eventLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success').setThumbnail(createdEvent.image);
			if(executor) eventLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(eventLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildScheduledEventCreateEvent };