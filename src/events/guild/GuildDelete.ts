import { BaseClient } from '@core/BaseClient.js';
import { BaseEvent } from '@core/BaseEvent.js';
import { EmbedBuilder, Guild } from 'discord.js';

class GuildDeleteEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(deletedGuild: Guild): Promise<any> {
		if (!deletedGuild || !deletedGuild.id) return;

		try{
			const createdAt: string = this.formatUtils.discordTimestamp(deletedGuild.createdTimestamp, 'f');
			const createdAgo: string = this.formatUtils.discordTimestamp(deletedGuild.createdTimestamp, 'R');

			const supportLogMessage: string =
				'### ' + this.emote('logo_icon') + ' ' + this.client.user.username + ' wurde von einem Server entfernt!\n\n' +
				'-# ' + this.emote('quotes') + ' **Name**: ' + deletedGuild.name + '\n' +
				'-# ' + this.emote('id') + ' **ID**: ' + deletedGuild.id + '\n' +
				'-# ' + this.emote('users') + ' **Mitglieder**: ' + deletedGuild.memberCount + '\n' +
				'-# ' + this.emote('calendar') + ' **Erstellt am**: ' + createdAt + '\n' +
				'-# ' + this.emote('reminder') + ' **Erstellt vor**: ' + createdAgo;

			const supportLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(supportLogMessage, null, 'error');
			this.clientUtils.sendEmbedToLog(supportLogEmbed);
		}catch(error: unknown){

		}
	}
}

export { GuildDeleteEvent };