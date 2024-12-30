import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, GuildBan } from "discord.js";
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildBanAddEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(addedBan: GuildBan): Promise<any> {
		if (!addedBan || !addedBan.guild) return;
		const { guild } = addedBan;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			await addedBan.fetch().catch(() => {});
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('ban') + ' Mitglied gebannt\n\n' +
				'-# ' + this.emote('user') + ' **Mitglied**: ' + addedBan.user.toString() + '\n' +
				'-# ' + this.emote('text') + ' **Grund**: ' + (addedBan.reason ? addedBan.reason : 'N/A');

			const banLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error').setThumbnail(addedBan.user.displayAvatarURL());
			if(executor) banLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(banLogEmbed, 'moderation');
		}catch(error: unknown){

		}
	}
}

export { GuildBanAddEvent };