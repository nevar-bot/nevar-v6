import { BaseClient } from '@core/BaseClient.js';
import { GiveawayManager } from '@services/GiveawayManager.js';

class GiveawayFinisher {
	private readonly client: BaseClient;
	private readonly giveawayManager: GiveawayManager;
	constructor(client: BaseClient) {
		this.client = client;
		this.giveawayManager = new GiveawayManager(client);
	}

	public async finish(): Promise<void> {
		const giveaways: any = await this.giveawayManager.getGiveaways();
		for(const giveaway of giveaways){
			if(giveaway.ended) continue;
			if(giveaway.endAt > Date.now()) continue;

			const guild: any = this.client.guilds.cache.get(giveaway.guildId);
			if(!guild) continue;

			const channel: any = guild.channels.cache.get(giveaway.channelId);
			if(!channel) continue;

			await this.giveawayManager.endGiveaway(giveaway.messageId);
		}
	}
}

export { GiveawayFinisher }