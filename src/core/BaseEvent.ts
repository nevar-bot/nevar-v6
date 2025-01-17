import { BaseClient } from '@core/BaseClient.js';
import { ClientUtils } from '@utils/client-utils.js';
import { CommandUtils } from '@utils/command-utils.js';
import { DatabaseUtils } from '@utils/database-utils.js';
import { FormatUtils } from '@utils/format-utils.js';
import { MathUtils } from '@utils/math-utils.js';
import { PaginationUtils } from '@utils/pagination-utils.js';
import { PermissionUtils } from '@utils/permission-utils.js';
import { RandomUtils } from '@utils/random-utils.js';
import { ValidationUtils } from '@utils/validation-utils.js';
import config from 'config';
import { ApplicationEmoji, Guild } from 'discord.js';

class BaseEvent {
	public general: any;
	public permissions: any;
	public restrictions: any;
	public slash: any;
	protected client: BaseClient;
	protected guild: Guild;
	protected data: any;
	protected emotes: any;
	protected config: config;
	// Predefined utils
	protected clientUtils: ClientUtils;
	protected databaseUtils: DatabaseUtils;
	protected formatUtils: FormatUtils;
	protected mathUtils: MathUtils;
	protected paginationUtils: PaginationUtils;
	protected permissionUtils: PermissionUtils;
	protected randomUtils: RandomUtils;
	protected regexUtils: ValidationUtils;
	protected commandUtils: CommandUtils;

	constructor(client: BaseClient) {
		this.client = client;
		this.config = config;

		this.clientUtils = new ClientUtils(this.client);
		this.databaseUtils = new DatabaseUtils(this.client);
		this.formatUtils = new FormatUtils();
		this.mathUtils = new MathUtils();
		this.paginationUtils = new PaginationUtils(this.client);
		this.permissionUtils = new PermissionUtils();
		this.randomUtils = new RandomUtils();
		this.regexUtils = new ValidationUtils(this.client);
		this.commandUtils = new CommandUtils(this.client);
	}

	protected emote(name: string): string {
		const applicationEmoji: ApplicationEmoji = this.client.applicationEmojis.find(
			(applicationEmoji: ApplicationEmoji): boolean => applicationEmoji.name === name
		);

		if (applicationEmoji) {
			return '<:' + applicationEmoji.name + ':' + applicationEmoji.id + '>';
		}
		return '';
	}
}

export { BaseEvent };
