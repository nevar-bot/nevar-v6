// Import necessary modules
import config from 'config';

// Import necessary Discord.js classes
import { ApplicationEmoji, Client as DiscordClient, Collection, GatewayIntentBits, Partials } from 'discord.js';

export class BaseClient extends DiscordClient {
	public applicationEmojis: Collection<string, ApplicationEmoji>;
	public support: string;

	public databaseCache: {
		users: Collection<string, any>;
		guilds: Collection<string, any>;
		members: Collection<string, any>;
		bannedUsers: Collection<string, any>;
		mutedUsers: Collection<string, any>;
		reminders: Collection<string, any>;
	};

	public commands: {
		chat: Collection<string, any>,
		user: Collection<string, any>,
		message: Collection<string, any>,
	};

	constructor() {
		super({
			intents: config.get('client.intents').map((intent: string) => GatewayIntentBits[intent]).filter(Boolean),
			partials: config.get('client.partials').map((partial: string) => Partials[partial]).filter(Boolean),
			allowedMentions: {
				parse: config.get('client.allowedMentions')
			},
		});

		this.support = config.get('support.invitation');

		this.commands = {
			chat: new Collection(),
			user: new Collection(),
			message: new Collection(),
		}

		this.databaseCache = {
			users: new Collection(),
			guilds: new Collection(),
			members: new Collection(),
			bannedUsers: new Collection(),
			mutedUsers: new Collection(),
			reminders: new Collection(),
		};
	}
}