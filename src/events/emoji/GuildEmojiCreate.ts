import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildEmoji } from "discord.js";
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildEmojiCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdEmoji: GuildEmoji): Promise<any> {
		if (!createdEmoji || !createdEmoji.guild) return;
		const { guild } = createdEmoji;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.EmojiCreate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('emoji_create') + ' [Emoji erstellt](' + createdEmoji.imageURL() + ')\n\n' +
				'-# ' + this.emote('shine') + ' **Emoji**: ' + createdEmoji.name;

			const emojiLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success').setThumbnail(createdEmoji.imageURL());
			if(executor) emojiLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(emojiLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildEmojiCreateEvent };