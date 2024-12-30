import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, ThreadChannel } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class ThreadCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdThread: ThreadChannel): Promise<any> {
		if (!createdThread || !createdThread.guild) return;
		const { guild } = createdThread;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.ThreadCreate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const threadType: string = this.formatUtils.localizedChannelType(createdThread.type);
			const embedText: string =
				'### ' + this.emote('thread_create') + ' [' + threadType + ' erstellt](' + createdThread.url + ')\n\n' +
				'-# ' + this.emote('thread') + ' **Thread**: ' + createdThread.toString();

			const threadLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success');
			if(executor) threadLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(threadLogEmbed, 'channel');
		}catch(error: unknown){

		}
	}
}

export { ThreadCreateEvent };