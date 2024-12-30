import { BaseCommand } from '@core/BaseCommand.js';
import { Guild, Message } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class ServerlistCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'serverlist',
			description: 'Listet alle Server sortiert nach Mitgliederanzahl auf',
			dirname: import.meta.url,
			restrictions: {
				staffOnly: true
			},
			slashCommand: {
				register: false,
			},
		});
	}

	public async run(): Promise<void> {
		const serverList: { text: string; memberCount: number }[] = [];

		this.client.guilds.cache.forEach((guild: Guild): void => {
			const serverText: string =
				'### ' + this.emote('discord') + ' ' + guild.name + '\n' +
				this.emote('arrow_right') + ' Mitglieder: ' + this.mathUtils.format(guild.memberCount) + '\n' +
				this.emote('arrow_right') + ' ID: ' + guild.id + '\n';

			serverList.push({
				text: serverText,
				memberCount: guild.memberCount
			});
		});

		serverList.sort((a: { memberCount: number; }, b: { memberCount: number; }): number => b.memberCount - a.memberCount);

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 5, serverList.map((server) => server.text), this.emote('list') + ' Serverliste', 'Ich bin noch auf keinem Server.');
	}
}

export { ServerlistCommand };