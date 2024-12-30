import { GuildUtils } from '@utils/guild-utils.js';
import {
	EmbedBuilder,
	PermissionsBitField,
	CommandInteraction,
	CommandInteractionOptionResolver,
	ApplicationCommand, Collection, ApplicationCommandType, ApplicationCommandOptionType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { LogModel } from '@database/models/Log.js';
import { GiveawayParticipation } from '@events/interaction/parts/GiveawayParticipation.js';
import config from 'config';
import { BaseEvent } from '@core/BaseEvent.js';

class InteractionCreateEvent extends BaseEvent {
	private interaction: any;
	constructor(client: BaseClient) {
		super(client);
	}

	public async run(interaction: any): Promise<any> {
		if (!interaction || !interaction.type) return;

		this.interaction = interaction;

		if(interaction?.customId && interaction.customId.startsWith('collector')) return;

		if (interaction.isButton()) {
			const buttonIdSplitted: string[] = interaction.customId.split("_");
			if (!buttonIdSplitted) return;

			if (buttonIdSplitted[0] === "giveaway") {
				if(buttonIdSplitted[1] === 'participate'){
					const giveawayParticipation: GiveawayParticipation = new GiveawayParticipation(this.client);
					await giveawayParticipation.run(interaction);
				}
				return;
			}
		}

		await interaction.deferReply().catch(async (error: Error): Promise<void> => {
			return await this.handleError(error);
		});

		// User installable app support
		switch(interaction.context){
			// Guild
			case 0:
				await this.handleGuildInteraction();
				break;
			// BotDM
			case 1:
				await this.handleBotDMAndPrivateChannelInteraction();
				break;
			// PrivateChannel
			case 2:
				await this.handleBotDMAndPrivateChannelInteraction();
				break;
		}
	}

	private async handleGuildInteraction(): Promise<void> {
		const { guildId, member, channelId }: any = this.interaction;

		const data: any = {
			guild: await this.databaseUtils.findOrCreateGuild(guildId),
			member: await this.databaseUtils.findOrCreateMember(member.user.id, guildId),
			user: await this.databaseUtils.findOrCreateUser(member.user.id)
		};

		if(this.interaction.isCommand()){
			if (data.user.blocked.state) {
				const reason: string = data.user.blocked.reason || 'Kein Grund angegeben';

				const userIsBlockedMessage: string =
					'### ' + this.emote('critical') + ' Du wurdest von der Nutzung von ' + this.client.user.username + ' ausgeschlossen!\n\n' +
					'-# ' + this.emote('text') + ' **Begründung**: ' + reason;

				const userIsBlockedEmbed: EmbedBuilder = this.clientUtils.createEmbed(userIsBlockedMessage, null, 'error');
				return this.interaction.reply({ embeds: [userIsBlockedEmbed], ephemeral: true });
			}

			if (data.guild.blocked.state) {
				const reason: string = data.guild.blocked.reason || 'Kein Grund angegeben';

				const guildIsBlockedMessage: string =
					'### ' + this.emote('critical') + ' Dieser Server wurde von der Nutzung von ' + this.client.user.username + ' ausgeschlossen!\n\n' +
					'-# ' + this.emote('text') + ' **Begründung**: ' + reason;

				const guildIsBlockedEmbed: EmbedBuilder = this.clientUtils.createEmbed(guildIsBlockedMessage, null, 'error');
				return this.interaction.followUp({ embeds: [guildIsBlockedEmbed] });
			}
		}

		const type: string = this.interaction.isChatInputCommand() ? 'chat' : this.interaction.isUserContextMenuCommand() ? 'user' : 'message';

		const command: any = this.client.commands[type].get(this.interaction.commandName);
		if(!command) return;

		const commandIsDisabled: boolean = await this.databaseUtils.commandIsDisabled(command.general.name);
		if(commandIsDisabled){
			if(!data.user.staff.state && !config.get('client.owner_ids').includes(member.user.id)){
				const commandIsDisabledMessage: string =
					'### ' + this.emote('critical') + ' Dieser Befehl ist aktuell deaktiviert!\n\n' +
					'-# ' + this.emote('discord') + ' Für **mehr Informationen**, schau gerne auf **meinem [Support-Discord](' + this.client.support + ') vorbei**.';
				const commandIsDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed(commandIsDisabledMessage, null, 'error');
				return this.interaction.followUp({ embeds: [commandIsDisabledEmbed] });
			}
		}

		// Check if bot has necessary permissions
		const neededBotPermissions: any[] = [];
		if (!command.permissions.bot.includes(PermissionsBitField.Flags.EmbedLinks)) command.permissions.bot.push(PermissionsBitField.Flags.EmbedLinks);
		for (const neededBotPermission of command.permissions.bot) {
			const permissions: PermissionsBitField = this.interaction.appPermissions;
			if(!permissions.has(neededBotPermission)){
				const permissions = Object.entries(PermissionsBitField.Flags);
				const permissionName = permissions.find(([name, value]) => value === neededBotPermission)[0];

				neededBotPermissions.push(this.permissionUtils.getPermissionName(permissionName));
			}
		}
		if (neededBotPermissions.length > 0) {
			const botIsMissingPermissionsMessage: string =
				'### ' + this.emote('critical') + ' Mir fehlen Berechtigungen, um diesen Befehl auszuführen!\n\n' +
				this.emote('text') + ' **Benötigte Berechtigungen**:\n' +
				'-# ' + this.emote('arrow_right') + ' ' + neededBotPermissions.join('\n-# ' + this.emote('arrow_right') + ' ');

			const botIsMissingPermissionsEmbed: EmbedBuilder = this.clientUtils.createEmbed(botIsMissingPermissionsMessage, null, 'error');
			return this.interaction.followUp({ embeds: [botIsMissingPermissionsEmbed] });
		}

		await new LogModel({
			command: command.general.name,
			context: this.interaction.context,
			type: type + ' command',
			arguments: this.interaction.options?._hoistedOptions || [],
			date: new Date(Date.now()),
			user: member.user.id,
			guild: guildId,
			channel: channelId,
		}).save();


		command.interaction = this.interaction;
		command.options = this.interaction.options;
		command.member = this.interaction.member;
		command.user = this.interaction.user;
		command.data = data;
		if(this.interaction.guild) command.guild = this.interaction.guild;
		if(this.interaction.guild) command.guildUtils = new GuildUtils(this.client, this.interaction.guild);

		try {
			return command.run();
		} catch (error: unknown) {
			return await this.handleError(error);
		}
	}

	private async handleBotDMAndPrivateChannelInteraction(): Promise<void> {
		const data: any = {
			user: await this.databaseUtils.findOrCreateUser(this.interaction.user.id)
		};

		if(this.interaction.isCommand()){
			if (data.user.blocked.state) {
				const reason: string = data.user.blocked.reason || 'Kein Grund angegeben';

				const userIsBlockedMessage: string =
					'### ' + this.emote('critical') + ' Du wurdest von der Nutzung von ' + this.client.user.username + ' ausgeschlossen!\n\n' +
					'-# ' + this.emote('text') + ' **Begründung**: ' + reason;

				const userIsBlockedEmbed: EmbedBuilder = this.clientUtils.createEmbed(userIsBlockedMessage, null, 'error');
				return this.interaction.reply({ embeds: [userIsBlockedEmbed], ephemeral: true });
			}
		}

		const type: string = this.interaction.isChatInputCommand() ? 'chat' : this.interaction.isUserContextMenuCommand() ? 'user' : 'message';

		const command: any = this.client.commands[type].get(this.interaction.commandName);
		if(!command) return;

		const commandIsDisabled: boolean = await this.databaseUtils.commandIsDisabled(command.general.name);
		if(commandIsDisabled){
			if(!data.user.staff.state && !config.get('client.owner_ids').includes(this.interaction.user.id)){
				const commandIsDisabledMessage: string =
					'### ' + this.emote('critical') + ' Dieser Befehl ist aktuell deaktiviert!\n\n' +
					'-# ' + this.emote('discord') + ' Für **mehr Informationen**, schau gerne auf **meinem [Support-Discord](' + this.client.support + ') vorbei**.';
				const commandIsDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed(commandIsDisabledMessage, null, 'error');
				return this.interaction.followUp({ embeds: [commandIsDisabledEmbed] });
			}
		}

		await new LogModel({
			command: command.general.name,
			context: this.interaction.context,
			type: type + ' command',
			arguments: this.interaction.options?._hoistedOptions || [],
			date: new Date(Date.now()),
			user: this.interaction.user.id,
			guild: null,
			channel: this.interaction.channelId,
		}).save();


		command.interaction = this.interaction;
		command.options = this.interaction.options;
		command.user = this.interaction.user;
		command.data = data;

		try {
			return command.run();
		} catch (error: unknown) {
			return await this.handleError(error);
		}
	}

	private async handleError(error: unknown): Promise<void> {
		const errorId: string =
			this.randomUtils.randomString(this.randomUtils.randomNumber(3, 8)) + '.' +
			this.randomUtils.randomString(this.randomUtils.randomNumber(3, 8)) + '.' +
			this.randomUtils.randomString(this.randomUtils.randomNumber(3, 8));
		const errorText: string =
			'### ' + this.emote('error') + ' Ein unerwarteter Fehler ist aufgetreten!\n' +
			this.emote('discord') + ' Bitte **kontaktiere uns** auf unserem **[Support-Server]({0})**.\n' +
			this.emote('id') + ' Teile uns dabei folgende Fehlernummer mit: **{1}**';
		const unknownErrorEmbed: EmbedBuilder = this.clientUtils.createEmbed(errorText, null, 'error', this.client.support, errorId);

		this.clientUtils.sendToErrorLog(error, 'error', errorId);
		await this.interaction.reply({ embeds: [unknownErrorEmbed] });
	}
}

export { InteractionCreateEvent };