import { BaseClient } from '@core/BaseClient.js';
import { BaseEvent } from '@core/BaseEvent.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { GuildMember, EmbedBuilder, Role } from 'discord.js';

class GuildMemberUpdateEvent extends BaseEvent {
	constructor(client: BaseClient) {
		super(client);
	}

	async run(oldGuildMember: GuildMember, newGuildMember: GuildMember){
		if(oldGuildMember.pending && !newGuildMember.pending) this.client.emit('guildMemberAdd', newGuildMember);

		if(!oldGuildMember || !newGuildMember || !newGuildMember.guild || oldGuildMember.partial) return;

		const guildUtilsInstance: GuildUtils = new GuildUtils(this.client, newGuildMember.guild);

		const embedText: string =
			'### ' + this.emote('member_update') + ' Mitglied aktualisiert\n\n';

		const changes: string[] = [];

		if(oldGuildMember.displayName !== newGuildMember.displayName) changes.push('-# ' + this.emote('quotes') + ' **Anzeigename**: ' + oldGuildMember.displayName + ' **➜** ' + newGuildMember.displayName);
		if(oldGuildMember.premiumSince && !newGuildMember.premiumSince) changes.push('-# ' + this.emote('nitro') + ' **Boost**: ' + 'Boost entfernt');
		if(!oldGuildMember.premiumSince && newGuildMember.premiumSince) changes.push('-# ' + this.emote('nitro') + ' **Boost**: ' + 'Boost hinzugefügt');
		if(!oldGuildMember.communicationDisabledUntil && newGuildMember.communicationDisabledUntil) changes.push('-# ' + this.emote('timeout') + ' **Timeout**: ' + 'Timeout bis ' + this.formatUtils.discordTimestamp(newGuildMember.communicationDisabledUntilTimestamp, 'f') + ' hinzugefügt');
		if(oldGuildMember.communicationDisabledUntil && !newGuildMember.communicationDisabledUntil) changes.push('-# ' + this.emote('timeout') + ' **Timeout**: ' + 'Timeout entfernt');

		oldGuildMember.roles.cache.forEach((role: Role): void => {
			if(!newGuildMember.roles.cache.has(role.id)){
				changes.push('-# ' + this.emote('role_delete') + ' ' + role.toString() + ' entfernt');
			}
		});

		newGuildMember.roles.cache.forEach((role: Role): void => {
			if(!oldGuildMember.roles.cache.has(role.id)){
				changes.push('-# ' + this.emote('role_create') + ' ' + role.toString() + ' hinzugefügt');
			}
		});


		if(changes.length === 0) return;

		const memberLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedText + changes.join('\n'), null, 'normal')
			.setAuthor({ name: newGuildMember.user.username, iconURL: newGuildMember.displayAvatarURL() });

		await guildUtilsInstance.log(memberLogEmbed, 'member');
	}
}

export { GuildMemberUpdateEvent };