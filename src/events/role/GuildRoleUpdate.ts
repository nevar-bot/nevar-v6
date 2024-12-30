import { BaseClient } from '@core/BaseClient.js';
import { AuditLogEvent, EmbedBuilder, Role, PermissionsBitField } from 'discord.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { BaseEvent } from '@core/BaseEvent.js';
import { PermissionUtils } from '@utils/permission-utils.js';

class GuildRoleUpdateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(oldRole: Role, newRole: Role): Promise<void> {
		if (!oldRole || !newRole || !newRole.guild) return;
		const { guild } = newRole;
		const guildUtils: GuildUtils = new GuildUtils(this.client, guild);

		try{
			const auditLogEntry = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 }).catch(() => {});
			const executor = auditLogEntry ? auditLogEntry.entries.first().executor : null;

			const embedText: string =
				'### ' + this.emote('role_update') + ' Rolle bearbeitet\n\n'+
				'-# ' + this.emote('roles') + ' **Rolle**: ' + newRole.toString() + '\n' +
				'### ' + this.emote('edit') + ' Änderungen:\n';

			const changes: string[] = [];

			if(oldRole.name !== newRole.name) changes.push('-# ' + this.emote('quotes') + ' **Name**: ' + oldRole.name + ' **➜** ' + newRole.name);
			if(oldRole.hexColor !== newRole.hexColor) changes.push('-# ' + this.emote('shine') + ' **Farbe**: ' + oldRole.hexColor + ' **➜** ' + newRole.hexColor);
			if(oldRole.icon !== newRole.icon) changes.push('-# ' + this.emote('rocket') + ' **Icon**: [Alt](' + oldRole.iconURL() + ') **➜** [Neu](' + newRole.iconURL() + ')');
			if(oldRole.icon !== newRole.icon) changes.push('-# ' + this.emote('rocket') + ' **Icon**: ' + oldRole.iconURL() + ' **➜** ' + newRole.iconURL());

			if(oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
				const oldPermissions: PermissionsBitField = oldRole.permissions;
				const newPermissions: PermissionsBitField = newRole.permissions;

				const permissionUtilsInstance: PermissionUtils = new PermissionUtils(this.client);

				const addedPermissions: string[] = [];
				const removedPermissions: string[] = [];

				for(const [permission, value] of Object.entries(PermissionsBitField.Flags)){
					const oldHasPermission: boolean = oldPermissions.has(value);
					const newHasPermission: boolean = newPermissions.has(value);
					const permissionName: string = permissionUtilsInstance.getPermissionName(permission);

					if(oldHasPermission && !newHasPermission) removedPermissions.push(permissionName);
					if(!oldHasPermission && newHasPermission) addedPermissions.push(permissionName);
				}

				if(addedPermissions.length > 0) changes.push('-# ' + this.emote('success') + ' **Berechtigungen hinzugefügt:** ' + addedPermissions.join(', '));
				if(removedPermissions.length > 0) changes.push('-# ' + this.emote('error') + ' **Berechtigungen entfernt:** ' + removedPermissions.join(', '));
			}
			if(changes.length === 0) return;

			const roleLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText + changes.join('\n'), null, 'normal');
			if(executor) roleLogEmbed.setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() });

			await guildUtils.log(roleLogEmbed, 'channel');
		}catch(error: unknown){

		}
	}
}

export { GuildRoleUpdateEvent };