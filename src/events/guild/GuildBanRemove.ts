import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildBan } from "discord.js";
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildBanRemoveEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(removedBan: GuildBan): Promise<any> {
		if (!removedBan || !removedBan.guild) return;
		const { guild } = removedBan;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('member_create') + ' Mitglied entbannt\n\n' +
				'-# ' + this.emote('user') + ' **Mitglied**: ' + removedBan.user.username;

			const banLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success').setThumbnail(removedBan.user.displayAvatarURL());
			if(executor) banLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(banLogEmbed, 'moderation');
		}catch(error: unknown){

		}
	}
}

export { GuildBanRemoveEvent };