import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, ThreadChannel } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class ThreadDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedThread: ThreadChannel): Promise<any> {
		if (!deletedThread || !deletedThread.guild) return;
		const { guild } = deletedThread;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.ThreadDelete, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const threadType: string = this.formatUtils.localizedChannelType(deletedThread.type);
			const embedText: string =
				'### ' + this.emote('thread_delete') + ' [' + threadType + ' gelöscht](' + deletedThread.url + ')\n\n' +
				'-# ' + this.emote('thread') + ' **Thread**: #' + deletedThread.name;

			const threadLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error');
			if(executor) threadLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(threadLogEmbed, 'channel');
		}catch(error: unknown){

		}
	}
}

export { ThreadDeleteEvent };