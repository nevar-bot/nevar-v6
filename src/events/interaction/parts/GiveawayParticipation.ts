import { BaseClient } from '@core/BaseClient.js';
import { BaseEvent } from '@core/BaseEvent.js';
import { GiveawayManager } from '@services/GiveawayManager.js';

class GiveawayParticipation extends BaseEvent {
	constructor(client: BaseClient) {
		super(client);
	}

	public async run(interaction: any): Promise<any> {
		// Initialize GiveawayManager
		const giveawayManagerInstance: GiveawayManager = new GiveawayManager(this.client);

		// Get giveaway
		const giveaways = await giveawayManagerInstance.getGiveaways();
		if (!giveaways) return;

		const giveaway: any = giveaways.find((g: any): boolean => g.messageId === interaction.message.id);
		if (!giveaway) return;
		if (giveaway.ended) return;

		// Toggle participation
		if (giveaway.entrantIds.includes(interaction.user.id)) {
			// Remove entrant
			await giveawayManagerInstance.removeEntrant(interaction.message.id, interaction.user.id);
			await interaction.reply({ content: '### ' + this.emote('tada') + ' Du nimmst nun nicht mehr am Gewinnspiel teil.', ephemeral: true });
		} else {
			// Validate participation
			const valid: boolean = await giveawayManagerInstance.validateParticipation(giveaway, interaction.user.id);
			if(!valid){
				return await interaction.reply({ content: '### ' + this.emote('warning') + ' Du erfüllst nicht alle Voraussetzungen, um am Gewinnspiel teilnehmen zu dürfen!', ephemeral: true });
			}
			await interaction.reply({ content: '### ' + this.emote('tada') + ' Du nimmst nun am Gewinnspiel teil. Viel Erfolg!', ephemeral: true });
			await giveawayManagerInstance.addEntrant(interaction.message.id, interaction.user.id);
		}
	}
}

export { GiveawayParticipation };