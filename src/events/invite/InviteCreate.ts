import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, Invite, InviteGuild } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class InviteCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdInvite: Invite): Promise<any> {
		if (!createdInvite || !createdInvite.guild) return;
		if(createdInvite.guild instanceof InviteGuild) return;

		const { guild } = createdInvite;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.InviteCreate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('invite') + ' [Einladung erstellt](' + createdInvite.url + ')\n\n' +
				'-# ' + this.emote('id') + ' **Code**: ' + createdInvite.code;

			const inviteLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success');
			if(executor) inviteLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(inviteLogEmbed, 'guild');
		}catch(error: unknown){

		}
	}
}

export { InviteCreateEvent };