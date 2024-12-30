import { BaseClient } from '@core/BaseClient.js';
import { AuditLogEvent, EmbedBuilder, GuildScheduledEvent } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildScheduledEventUpdateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(oldEvent: GuildScheduledEvent, newEvent: GuildScheduledEvent): Promise<void> {
		if (!oldEvent || !newEvent || !newEvent.guild) return;
		const { guild } = newEvent;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildScheduledEventUpdate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('event_update') + ' [Event bearbeitet](' + newEvent.url + ')\n\n'+
				'-# ' + this.emote('calendar') + ' **Event**: ' + newEvent.name + '\n' +
				'### ' + this.emote('edit') + ' Änderungen:\n';

			const changes: string[] = [];

			if(oldEvent.name !== newEvent.name) changes.push('-# ' + this.emote('quotes') + ' **Name**: ' + oldEvent.name + ' **➜** ' + newEvent.name);

			const oldLocation: string = oldEvent.channel ? oldEvent.channel.toString() : oldEvent.entityMetadata.location;
			const newLocation: string = newEvent.channel ? newEvent.channel.toString() : newEvent.entityMetadata.location;

			if(oldLocation !== newLocation) changes.push('-# ' + this.emote('pin') + ' **Ort**: ' + oldLocation + ' **➜** ' + newLocation);
			if(oldEvent.description !== newEvent.description) changes.push('-# ' + this.emote('text') + ' **Beschreibung**: ' + oldEvent.description + ' **➜** ' + newEvent.description);
			if(oldEvent.scheduledStartTimestamp !== newEvent.scheduledStartTimestamp) changes.push('-# ' + this.emote('reminder') + ' **Start-Zeitpunkt**: ' + this.formatUtils.discordTimestamp(oldEvent.scheduledStartTimestamp, 'F') + ' **➜** ' + this.formatUtils.discordTimestamp(newEvent.scheduledStartTimestamp, 'F'));
			if(oldEvent.scheduledEndTimestamp !== newEvent.scheduledEndTimestamp) changes.push('-# ' + this.emote('reminder') + ' **End-Zeitpunkt**: ' + this.formatUtils.discordTimestamp(oldEvent.scheduledEndTimestamp, 'F') + ' **➜** ' + this.formatUtils.discordTimestamp(newEvent.scheduledEndTimestamp, 'F'));
			if(changes.length === 0) return;

			const eventLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText + changes.join('\n'), null, 'normal').setThumbnail(newEvent.image);
			if(executor) eventLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(eventLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildScheduledEventUpdateEvent };