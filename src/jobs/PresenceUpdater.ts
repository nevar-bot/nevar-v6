import { ActivityType } from "discord.js";
import { BaseClient } from '@core/BaseClient.js';
import config from 'config';
import { MathUtils } from '@utils/math-utils.js';

class PresenceUpdater {
	private readonly client: BaseClient;
	private presenceIndicator: number = 0;

	public constructor(client: BaseClient) {
		this.client = client;
		this.update();
	}

	public async update(): Promise<void> {
		const mathUtils: MathUtils = new MathUtils();

		const presences: any[] = config.get('presences');
		const presence: any = presences[this.presenceIndicator];
		const guildCount: number = this.client.guilds.cache.size;
		const memberCount: number = this.client.guilds.cache.reduce((total: any, guild: any) => total + guild.memberCount, 0);
		const message: string = presence.message
			.replace("{guilds}", mathUtils.format(guildCount))
			.replace("{users}", mathUtils.format(memberCount));

		this.client.user.setPresence({
			status: presence["STATUS"],
			activities: [
				{
					name: message,
					type: ActivityType[presence.type as keyof ActivityType],
					url: presence.url ?? null,
				},
			],
		});

		this.presenceIndicator = (this.presenceIndicator + 1) % presences.length;
	}
}

export { PresenceUpdater };