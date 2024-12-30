import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, Role } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildRoleDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedRole: Role): Promise<any> {
		if (!deletedRole || !deletedRole.guild) return;

		const { guild } = deletedRole;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('role_delete') + ' Rolle gelöscht\n\n' +
				'-# ' + this.emote('roles') + ' **Rolle**: ' + deletedRole.name;

			const roleLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'error');
			if(executor) roleLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(roleLogEmbed, 'role');
		}catch(error: unknown){

		}
	}
}

export { GuildRoleDeleteEvent };