import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, Sticker } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildStickerDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedSticker: Sticker): Promise<any> {
		if (!deletedSticker || !deletedSticker.guild) return;
		const { guild } = deletedSticker;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.StickerDelete, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('sticker_delete') + ' [Sticker gelöscht](' + deletedSticker.url + ')\n\n' +
				'-# ' + this.emote('shine') + ' **Sticker**: #' + deletedSticker.name;

			const stickerLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(deletedSticker.url);
			if(executor) stickerLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(stickerLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildStickerDeleteEvent };