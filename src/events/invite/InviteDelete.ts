import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, Invite, InviteGuild } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class InviteDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedInvite: Invite): Promise<any> {
		if (!deletedInvite || !deletedInvite.guild) return;
		if(deletedInvite.guild instanceof InviteGuild) return;

		const { guild } = deletedInvite;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.InviteDelete, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('invite') + ' [Einladung gelöscht](' + deletedInvite.url + ')\n\n' +
				'-# ' + this.emote('id') + ' **Code**: ' + deletedInvite.code;

			const inviteLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error');
			if(executor) inviteLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(inviteLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { InviteDeleteEvent };