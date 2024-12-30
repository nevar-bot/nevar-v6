import * as path from 'path';
import {
	Guild, CommandInteraction, EmbedBuilder,
	GuildMember, ApplicationEmoji, Message,
	User, SlashCommandBuilder,
} from 'discord.js';
import config from 'config';


import { ClientUtils } from '@utils/client-utils.js';
import { DatabaseUtils } from '@utils/database-utils.js';
import { FormatUtils } from '@utils/format-utils.js';
import { GuildUtils } from '@utils/guild-utils.js';
import { MathUtils } from '@utils/math-utils.js';
import { PaginationUtils } from '@utils/pagination-utils.js';
import { PermissionUtils } from '@utils/permission-utils.js';
import { RandomUtils } from '@utils/random-utils.js';
import { ValidationUtils } from '@utils/validation-utils.js';
import { ComponentsUtils } from '@utils/components-utils.js';
import { LoggerUtils } from '@utils/logger-utils.js';
import { CommandUtils } from '@utils/command-utils.js';

import { BaseClient } from '@core/BaseClient.js';

class BaseCommand<TInteraction, TOptions> {
	// Base properties
	protected client: BaseClient;
	protected data: any;
	protected emotes: any;
	protected config: config;
	protected interaction: TInteraction;
	protected options: TOptions;
	protected guild: Guild;
	protected member: GuildMember;
	protected user: User;

	// Base utils
	protected clientUtils: ClientUtils;
	protected databaseUtils: DatabaseUtils;
	protected formatUtils: FormatUtils;
	protected guildUtils: GuildUtils;
	protected mathUtils: MathUtils;
	protected paginationUtils: PaginationUtils;
	protected permissionUtils: PermissionUtils;
	protected randomUtils: RandomUtils;
	protected validationUtils: ValidationUtils;
	protected componentsUtils: ComponentsUtils;
	protected loggerUtils: LoggerUtils;
	protected commandUtils: CommandUtils;

	// Command properties
	public general: {
		name: string | null;
		type: string | null;
		description: string | null;
		category: string;
	};

	public permissions: {
		bot: string[];
		user: string[];
	};

	public restrictions: {
		ownerOnly: boolean;
		staffOnly: boolean;
	};

	public slashCommand: {
		register: boolean;
		data: SlashCommandBuilder;
	};

	constructor(client: BaseClient, options){
		this.client = client;
		this.general = {
			name: options.name,
			type: options.type,
			description: options.description,
			category: path.basename(path.dirname(options.dirname)).toLowerCase()
		};

		this.permissions = options.permissions || { bot: [], user: [] };
		this.restrictions = options.restrictions;
		this.slashCommand = options.slashCommand;
		this.config = config;

		this.clientUtils = new ClientUtils(this.client);
		this.databaseUtils = new DatabaseUtils(this.client);
		this.formatUtils = new FormatUtils();
		this.mathUtils = new MathUtils();
		this.paginationUtils = new PaginationUtils(this.client);
		this.permissionUtils = new PermissionUtils();
		this.randomUtils = new RandomUtils();
		this.validationUtils = new ValidationUtils(this.client);
		this.componentsUtils = new ComponentsUtils();
		this.loggerUtils = new LoggerUtils();
		this.commandUtils = new CommandUtils(this.client);
	}

	public async run(): Promise<void> {
		throw new Error('Method not implemented for ' + this.general.name + ' command');
	}

	public async handleUnknownError(error: unknown): Promise<void> {
		const errorId: string =
			this.randomUtils.randomString(this.randomUtils.randomNumber(3, 8)) + '.' +
			this.randomUtils.randomString(this.randomUtils.randomNumber(3, 8)) + '.' +
			this.randomUtils.randomString(this.randomUtils.randomNumber(3, 8));
		const errorText: string =
			'### ' + this.emote('error') + ' Ein unerwarteter Fehler ist aufgetreten!\n' +
			this.emote('discord') + ' Bitte **kontaktiere uns** auf unserem **[Support-Server]({0})**.\n' +
			this.emote('id') + ' Teile uns dabei folgende Fehlernummer mit: **{1}**';
		const unknownErrorEmbed: EmbedBuilder = this.clientUtils.createEmbed(errorText, null, 'error', this.client.support, errorId);

		if(this.interaction instanceof CommandInteraction) await this.interaction.followUp({ embeds: [unknownErrorEmbed] });
		if(this.interaction instanceof Message) await this.interaction.reply({ embeds: [unknownErrorEmbed] });
		this.clientUtils.sendToErrorLog(error, 'error', errorId);
	}

	protected emote(name: string): string {
		const applicationEmoji: ApplicationEmoji = this.client.applicationEmojis.find((applicationEmoji: ApplicationEmoji): boolean => applicationEmoji.name === name);

		if(applicationEmoji) {
			if(applicationEmoji.animated) return '<a:' + applicationEmoji.name + ':' + applicationEmoji.id + '>';
			return '<:' + applicationEmoji.name + ':' + applicationEmoji.id + '>';
		}
		return '';
	}
}

export { BaseCommand };