import { BaseClient } from '@core/BaseClient.js';
import { AuditLogEvent, EmbedBuilder, GuildEmoji } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildEmojiUpdateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(oldEmoji: GuildEmoji, newEmoji: GuildEmoji): Promise<void> {
		if (!oldEmoji || !newEmoji || !newEmoji.guild) return;
		const { guild } = newEmoji;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.EmojiUpdate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;


			const embedText: string =
				'### ' + this.emote('emoji_update') + ' [Emoji bearbeitet](' + newEmoji.imageURL() + ')\n\n'+
				'-# ' + this.emote('shine') + ' **Emoji**: ' + newEmoji.name + '\n' +
				'### ' + this.emote('edit') + ' Änderungen:\n';

			const changes: string[] = [];

			if(oldEmoji.name !== newEmoji.name) changes.push('-# ' + this.emote('quotes') + ' **Name**: ' + oldEmoji.name + ' **➜** ' + newEmoji.name);
			if(changes.length === 0) return;

			const emojiLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText + changes.join('\n'), null, 'normal').setThumbnail(newEmoji.imageURL());
			if(executor) emojiLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(emojiLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildEmojiUpdateEvent };