import { GuildMember, PermissionResolvable } from 'discord.js';

class PermissionUtils {
	/**
	 * Check if a user has a permission
	 * @param user
	 * @param permission
	 */
	public hasPermission(user: GuildMember, permission: PermissionResolvable): boolean {
		try{
			// Check if user has permission
			return user.permissions.has(permission);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Check if a user has a role
	 * @param user
	 * @param role
	 */
	public hasRole(user: GuildMember, role: string): boolean {
		try{
			// Check if user has role
			return user.roles.cache.has(role);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Check if a user has a channel permission
	 * @param user
	 * @param channel
	 * @param permission
	 */
	public hasChannelPermission(user: any, channel: string, permission: string): boolean {
		try{
			// Check if user has permission in channel
			return user.permissionsIn(channel).has(permission);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Get localized permission name
	 * @param permission
	 */
	public getPermissionName(permission: string): string {
		try{
			// Permission names
			const permissionLocalizations = {
				AddReactions: 'Reaktionen hinzufügen',
				Administrator: 'Administrator',
				AttachFiles: 'Dateien anhängen',
				BanMembers: 'Mitglieder bannen',
				ChangeNickname: 'Nickname ändern',
				Connect: 'Verbinden',
				CreateEvents: 'Events erstellen',
				CreateGuildExpressions: 'Ausdrücke erstellen',
				CreateInstantInvite: 'Einladung erstellen',
				CreatePrivateThreads: 'Private Threads erstellen',
				CreatePublicThreads: 'Öffentliche Threads erstellen',
				DeafenMembers: 'Ein- und Ausgabe von Mitgliedern deaktivieren',
				EmbedLinks: 'Links einbetten',
				KickMembers: 'Mitglieder kicken',
				ManageChannels: 'Kanäle verwalten',
				ManageEmojisAndStickers: 'Ausdrücke verwalten',
				ManageEvents: 'Events verwalten',
				ManageGuild: 'Server verwalten',
				ManageGuildExpressions: 'Ausdrücke verwalten',
				ManageMessages: 'Nachrichten verwalten',
				ManageNicknames: 'Nicknames verwalten',
				ManageRoles: 'Rollen verwalten',
				ManageThreads: 'Threads verwalten',
				ManageWebhooks: 'Webhooks verwalten',
				MentionEveryone: 'Erwähne @everyone, @here und „Alle Rollen“',
				ModerateMembers: 'Mitglieder im Timeout',
				MoveMembers: 'Mitglieder verschieben',
				MuteMembers: 'Mitglieder stummschalten',
				PrioritySpeaker: 'Very Important Speaker',
				ReadMessageHistory: 'Nachrichtenverlauf anzeigen',
				RequestToSpeak: 'Redeanfrage',
				SendMessages: 'Nachrichten senden',
				SendMessagesInThreads: 'Nachrichten in Threads senden',
				SendPolls: 'Umfragen erstellen',
				SendTTSMessages: 'Text-zu-Sprache-Nachrichten senden',
				SendVoiceMessages: 'Sprachnachrichten senden',
				Speak: 'Sprechen',
				Stream: 'Streamen',
				UseApplicationCommands: 'Anwendungsbefehle verwenden',
				UseEmbeddedActivities: 'Aktivitäten nutzen',
				UseExternalEmojis: 'Externe Emojis verwenden',
				UseExternalSounds: 'Externe Sounds verwenden',
				UseExternalStickers: 'Externe Sticker verwenden',
				UseSoundboard: 'Soundboard verwenden',
				UseVAD: 'Sprachaktivierung verwenden',
				ViewAuditLog: 'Audit-Log einsehen',
				ViewChannel: 'Kanäle ansehen',
				ViewCreatorMonetizationAnalytics: 'Monetarisierungsanalysen einsehen',
				ViewGuildInsights: 'Server-Insights einsehen',
			}

			// Return localized permission name
			return permissionLocalizations[permission];
		}catch(error: unknown){
			throw error;
		}
	}
}

export { PermissionUtils };