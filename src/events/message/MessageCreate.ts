import { BaseClient } from '@core/BaseClient.js';
import { BaseEvent } from '@core/BaseEvent.js';
import { LevelManager } from '@services/LevelManager.js';
import { GuildUtils } from '@utils/guild-utils.js';
import config from 'config';
import {
	ButtonBuilder, ButtonStyle, EmbedBuilder, Message,
	PermissionsBitField, Role, RoleResolvable,
} from 'discord.js';

class MessageCreateEvent extends BaseEvent {
	constructor(client: BaseClient) {
		super(client);
	}

	public async run(message: Message): Promise<void> {
		if(!message || !message.guild || !message.guild.available || !message.channel) return;

		const { guild, channel } = message;

		const guildData: any = await this.databaseUtils.findOrCreateGuild(guild.id);

		if(guildData.settings?.autodelete.length > 0){
			for(let autodelete of guildData.settings.autodelete){
				const { channelId, time } = autodelete;

				if ((channelId !== channel.id && channel.type !== 11) || (channel.type === 11 && channel.parentId !== channelId && channel.id !== channelId)) continue;

				this.clientUtils.wait(Number(time)).then(() => {
					if(!message.pinned) message.delete().catch(() => {});
				})
			}
		}

		if(!message.member) return;

		const { member } = message;

		const memberData: any = await this.databaseUtils.findOrCreateMember(member.user.id, guild.id);
		const userData: any = await this.databaseUtils.findOrCreateUser(member.user.id);

		const botMentionPattern: RegExp = new RegExp(`^<@!?${this.client.user.id}>( |)$`);
		if(this.regexUtils.stringMatches(botMentionPattern, message.content) && !message.author.bot){
			const currentHour: number = new Date().getHours();
			const greetings: { [key: string]: string } = {
				'0-5': 'Noch wach, ' + member.toString() + '?',
				'6-10': 'Moin, ' + member.toString(),
				'11-13': 'Mahlzeit, ' + member.toString(),
				'14-17': 'Tach, ' + member.toString(),
				'18-23': '\'n Abend, ' + member.toString()
			};

			const greeting: string = Object.keys(greetings).find((range: string) => {
				const [start, end] = range.split('-').map(Number);
				return currentHour >= start && currentHour <= end;
			});

			const helpCommand: string = await this.clientUtils.commandMention('help');
			const flooredGuildCount: number = Math.floor(this.client.guilds.cache.size / 10) * 10;

			const greetingText: string =
				'### ' + this.emote('wave') + ' ' + greetings[greeting] + '\n\n' +
				this.emote('logo_icon') + ' Ich bin ' + this.client.user.toString() + ' und **unterstütze derzeit über ' + flooredGuildCount + ' Server** bei Moderation und Verwaltung.\n\n' +
				'-# ' + this.emote('question_mark') + ' Mit ' + helpCommand + 'erhältst du eine **Übersicht meiner verfügbaren Befehle**.';

			const greetingEmbed: EmbedBuilder = this.clientUtils.createEmbed(greetingText, null, 'normal')
				.setThumbnail(this.client.user.displayAvatarURL());

			const inviteButton: ButtonBuilder = this.clientUtils.createButton(null, 'Einladen', ButtonStyle.Link, this.emote('logo_icon'), false, this.clientUtils.createInvite());
			const supportButton: ButtonBuilder = this.clientUtils.createButton(null, 'Support', ButtonStyle.Link, this.emote('discord'), false, config.get('support.invitation'));
			const buttonActionRow = this.clientUtils.createMessageComponentsRow(inviteButton, supportButton);

			await message.reply({ embeds: [greetingEmbed], components: [buttonActionRow] });
			return;
		} else if (message.content) {
			const [botMention, command, ...args] = message.content.split(' ');
			if(this.regexUtils.stringMatches(botMentionPattern, botMention)){
				const chatCommand = this.client.commands.chat.get(command);
				if(chatCommand && (chatCommand.restrictions.staffOnly || chatCommand.restrictions.ownerOnly)){
					if(!userData.staff.status && !config.get('client.owner_ids').includes(member.user.id)) return;
					if(chatCommand.general.category === 'owner' && userData.staff.role !== 'head-staff' && !config.get('client.owner_ids').includes(member.user.id)) return;

					chatCommand.interaction = message;
					chatCommand.options = args;
					chatCommand.guild = message.guild;
					chatCommand.member = message.member;
					chatCommand.user = message.member.user;
					chatCommand.data = { guildData, memberData, userData };
					chatCommand.guildUtils = new GuildUtils(this.client, guild);

					try{
						chatCommand.run();
					}catch(error: unknown){
						await this.clientUtils.sendToErrorLog(error, 'error');
						return;
					}
				}
			}
		}

		if(guildData.settings?.autoreact.length > 0){
			for(let autoreact of guildData.settings.autoreact){
				const { channelId, emoji } = autoreact;

				if ((channelId !== message.channel.id && message.channel.type !== 11) || (message.channel.type === 11 && message.channel.parentId !== channelId && message.channel.id !== channelId)) continue;

				message.react(emoji);
			}
		}

		if (message.author.bot) return;

		if(guildData.settings?.levelsystem.enabled){
			const levelManagerInstance: LevelManager = new LevelManager(this.client);
			const messageContent: string = message.content;

			const userMentionRegex: RegExp = /<@!?(\d+)>/g;
			const roleMentionRegex: RegExp = /<@&(\d+)>/g;
			const channelMentionRegex: RegExp = /<#(\d+)>/g;
			const emojiMentionRegex: RegExp = /<a?:\w+:(\d+)>/g;

			const filteredMessageContent: string = messageContent
				.replace(userMentionRegex, '')
				.replace(roleMentionRegex, '')
				.replace(channelMentionRegex, '')
				.replace(emojiMentionRegex, '')
				.trim();

			const originalLength: number = messageContent.length;
			const filteredLength: number = filteredMessageContent.length;

			// Verhältnis von gefilterter Länge zur originalen Länge berechnen, Wert zwischen 0.0 und 1.0
			const ratio: number = originalLength > 0 ? filteredLength / originalLength : 0;

			// Konstanten definieren
			const minLengthForXp: number = 3;
			const minLengthForMaxXp: number = 50;
			const maxPossibleXp: number = 35;

			let gainedXp: number = 0;

			// Länge gefilterter Nachricht ist lang genug für maximale XP
			if(filteredMessageContent.length >= minLengthForMaxXp){
				gainedXp = ratio * maxPossibleXp;
			// Länge gefilterter Nachricht ist qualifiziert für XP Vergabe, XP werden berechnet
			}else if(messageContent.length >= minLengthForXp){
				gainedXp = (ratio * maxPossibleXp) * (messageContent.length / minLengthForMaxXp);
			// Länge gefilterter Nachricht ist nicht qualifiziert für XP
			}else{
				gainedXp = 0;
			}

			// Erreichte XP auf einen vollen Wert runden
			gainedXp = Math.round(gainedXp);

			if(guildData.settings?.levelsystem.exclude.channelIds.length > 0){
				if(guildData.settings.levelsystem.exclude.channelIds.includes(channel.id)) gainedXp = 0;
			}

			if(guildData.settings?.levelsystem.exclude.roleIds.length > 0){
				const memberRoles = member.roles.cache.map((role: Role) => role.id);
				if(guildData.settings.levelsystem.exclude.roleIds.some((roleId: string): boolean => memberRoles.includes(roleId))) gainedXp = 0;
			}

			if(guildData.settings?.levelsystem.doubleXP.length > 0){
				const memberRoles = member.roles.cache.map((role: Role) => role.id);
				if(guildData.settings.levelsystem.doubleXP.some((roleId: string): boolean => memberRoles.includes(roleId))) gainedXp *= 2;
			}

			const userLeveledUp: boolean = await levelManagerInstance.appendXp(member.user.id, guild.id, gainedXp);
			if(userLeveledUp){
				const levelData = await levelManagerInstance.fetch(member.user.id, guild.id, true);

				if(guildData.settings?.levelsystem.roles.length > 0){
					const rolesToAdd = guildData.settings.levelsystem.roles
						.filter((role): boolean => levelData.level >= role.level)
						.map(role => role.roleId);

					const rolesToAssign: RoleResolvable[] = [];
					for(let roleId of rolesToAdd){
						const role: Role|void = guild.roles.cache.get(roleId);
						if(role && !member.roles.cache.some((r): boolean => r.id === role.id)){
							rolesToAssign.push(role);
						}
					}
					if(rolesToAssign.length > 0) member.roles.add(rolesToAssign).catch(() => {});
				}

				function parseLevelMessage(message: string): string {
					return message
						.replaceAll('?level', levelData.level.toString())
						.replaceAll('?user.displayName', member.displayName)
						.replaceAll('?user.name', member.user.username)
						.replaceAll('?user', member.toString())
						.replaceAll('?server.name', guild.name)
						.replaceAll('?server.memberCount', guild.memberCount.toString())
						.replaceAll('?newline', '\n');
				}

				const levelUpChannel: any = guild.channels.cache.get(guildData.settings.levelsystem.levelUpMessage.channelId || channel.id);

				if(!guild.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) return;

				const parsedLevelMessage: string = parseLevelMessage(guildData.settings.levelsystem.levelUpMessage.message);

				await levelUpChannel.send({ content: parsedLevelMessage }).catch(() => {});
			}
		}
	}
}

export { MessageCreateEvent };