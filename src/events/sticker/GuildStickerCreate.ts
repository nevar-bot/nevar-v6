import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, Sticker } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildStickerCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdSticker: Sticker): Promise<any> {
		if (!createdSticker || !createdSticker.guild) return;
		const { guild } = createdSticker;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.StickerCreate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('sticker_create') + ' [Sticker erstellt](' + createdSticker.url + ')\n\n' +
				'-# ' + this.emote('shine') + ' **Sticker**: ' + createdSticker.name;

			const stickerLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success').setThumbnail(createdSticker.url);
			if(executor) stickerLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(stickerLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildStickerCreateEvent };