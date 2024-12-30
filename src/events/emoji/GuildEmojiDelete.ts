import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildEmoji } from "discord.js";
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildEmojiDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedEmoji: GuildEmoji): Promise<any> {
		if (!deletedEmoji || !deletedEmoji.guild) return;
		const { guild } = deletedEmoji;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.EmojiDelete, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('emoji_delete') + ' [Emoji gelöscht](' + deletedEmoji.imageURL() + ')\n\n' +
				'-# ' + this.emote('shine') + ' **Emoji**: #' + deletedEmoji.name;

			const emojiLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(deletedEmoji.imageURL());
			if(executor) emojiLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(emojiLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildEmojiDeleteEvent };