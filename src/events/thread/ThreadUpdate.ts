import { BaseClient } from '@core/BaseClient.js';
import { AuditLogEvent, EmbedBuilder, ThreadChannel } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class ThreadUpdateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(oldThread: ThreadChannel, newThread: ThreadChannel): Promise<void> {
		if (!oldThread || !newThread || !newThread.guild) return;
		const { guild } = newThread;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.ThreadUpdate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const threadType: string = this.formatUtils.localizedChannelType(newThread.type);

			const embedText: string =
				'### ' + this.emote('thread_update') + ' [' + threadType + ' bearbeitet](' + newThread.url + ')\n\n'+
				'-# ' + this.emote('thread') + ' **Thread**: ' + newThread.toString() + '\n' +
				'### ' + this.emote('edit') + ' Änderungen:\n';

			const changes: string[] = [];

			if(oldThread.name !== newThread.name) changes.push('-# ' + this.emote('quotes') + ' **Name**: ' + oldThread.name + ' **➜** ' + newThread.name);
			if(oldThread.archived !== newThread.archived) changes.push('-# ' + this.emote('protected') + ' **Archiviert**: ' + (oldThread.archived ? 'Ja' : 'Nein') + ' **➜** ' + (newThread.archived ? 'Ja' : 'Nein'));
			if(oldThread.locked !== newThread.locked) changes.push('-# ' + this.emote('vip') + ' **Gesperrt**: ' + (oldThread.locked ? 'Ja' : 'Nein') + ' **➜** ' + (newThread.locked ? 'Ja' : 'Nein'));
			if(oldThread.rateLimitPerUser !== newThread.rateLimitPerUser) changes.push('-# ' + this.emote('timeout') + ' **Slow-Modus**: ' + (oldThread.rateLimitPerUser ? oldThread.rateLimitPerUser + 's' : '0s') + ' **➜** ' + (newThread.rateLimitPerUser ? newThread.rateLimitPerUser + 's' : '0s'));

			if(changes.length === 0) return;

			const threadLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText + changes.join('\n'), null, 'normal');
			if(executor) threadLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(threadLogEmbed, 'channel');
		}catch(error: unknown){

		}
	}
}

export { ThreadUpdateEvent };