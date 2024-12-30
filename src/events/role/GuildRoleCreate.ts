import { BaseClient } from '@core/BaseClient.js';
import { EmbedBuilder, AuditLogEvent, Role } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';

class GuildRoleCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdRole: Role): Promise<any> {
		if (!createdRole || !createdRole.guild) return;
		const { guild } = createdRole;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('role_create') + ' Rolle erstellt\n\n' +
				'-# ' + this.emote('roles') + ' **Rolle**: ' + createdRole.toString();

			const roleLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText, null, 'success');
			if(executor) roleLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(roleLogEmbed, 'role');
		}catch(error: unknown){

		}
	}
}

export { GuildRoleCreateEvent };