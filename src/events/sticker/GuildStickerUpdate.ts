import { BaseClient } from '@core/BaseClient.js';
import { AuditLogEvent, EmbedBuilder, Sticker } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildStickerUpdateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(oldSticker: Sticker, newSticker: Sticker): Promise<void> {
		if (!oldSticker || !newSticker || !newSticker.guild) return;
		const { guild } = newSticker;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.StickerUpdate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;


			const embedText: string =
				'### ' + this.emote('sticker_update') + ' [Sticker bearbeitet](' + newSticker.url + ')\n\n'+
				'-# ' + this.emote('shine') + ' **Sticker**: ' + newSticker.name + '\n' +
				'### ' + this.emote('edit') + ' Änderungen:\n';

			const changes: string[] = [];

			if(oldSticker.name !== newSticker.name) changes.push('-# ' + this.emote('quotes') + ' **Name**: ' + oldSticker.name + ' **➜** ' + newSticker.name);
			if(changes.length === 0) return;

			const stickerLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText + changes.join('\n'), null, 'normal').setThumbnail(newSticker.url);
			if(executor) stickerLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(stickerLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { GuildStickerUpdateEvent };