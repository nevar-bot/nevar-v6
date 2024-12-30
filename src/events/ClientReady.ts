import { BaseEvent } from '@core/BaseEvent.js';
import { scheduleJob } from 'node-schedule';

import { PresenceUpdater } from '@jobs/PresenceUpdater.js';
import { Reminder } from '@jobs/Reminder.js';
import { AutoUnban } from '@jobs/AutoUnban.js';
import { GiveawayFinisher } from '@jobs/GiveawayFinisher.js';
import { BaseClient } from '@core/BaseClient.js';
import { LoggerUtils } from '@utils/logger-utils.js';
import { ApplicationEmoji, Collection } from 'discord.js';


class ClientReadyEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(): Promise<any> {
		const logger: LoggerUtils = new LoggerUtils();

		// Running jobs
		const autoUnban: AutoUnban = new AutoUnban(this.client);
		const giveawayFinisher: GiveawayFinisher = new GiveawayFinisher(this.client);
		const presenceUpdater: PresenceUpdater = new PresenceUpdater(this.client);
		const reminder: Reminder = new Reminder(this.client);
		scheduleJob('*/30 * * * * *', async (): Promise<void> => {
			await autoUnban.unban();
			await giveawayFinisher.finish();
			await presenceUpdater.update();
			await reminder.remind();
		});

		/* Load application emojis */
		const applicationEmojis: Collection<string, ApplicationEmoji> = await this.client.application.emojis.fetch();
		this.client.applicationEmojis = applicationEmojis;


		logger.success(this.client.user.displayName + ' is ready and listening!');
	}
}

export { ClientReadyEvent };