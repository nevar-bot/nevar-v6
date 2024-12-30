import { BaseClient } from '@core/BaseClient.js';
import { GiveawayModel } from '@database/models/Giveaway.js';
import { ButtonBuilder, EmbedBuilder, Guild, ButtonStyle, User, Message, GuildMember } from 'discord.js';
import config from 'config';
import { ClientUtils } from '@utils/client-utils.js';
import { RandomUtils } from '@utils/random-utils.js';
import { FormatUtils } from '@utils/format-utils.js';
import { ComponentsUtils } from '@utils/components-utils.js';
import { LevelManager } from '@services/LevelManager.js';

class GiveawayManager {
	private readonly client: BaseClient;
	private readonly clientUtils: ClientUtils;
	private readonly componentUtils: ComponentsUtils;

	public constructor(client: BaseClient) {
		this.client = client;
		this.clientUtils = new ClientUtils(client);
		this.componentUtils = new ComponentsUtils();
	}

	/* Define supported requirements */
	private readonly requirementTexts: { [key: string]: string } = {
		role: 'Du **brauchst die {value} Rolle**, um teilzunehmen.',
		level: 'Du musst **mindestens Level {value} sein**, um teilzunehmen.',
		joinDate: 'Du musst **mindestens seit dem {value} auf dem Server** sein, um teilzunehmen.',
		createdDate: 'Du musst **mindestens seit dem {value} auf Discord** sein, um teilzunehmen.',
		boost: 'Du musst **den Server boosten**, um teilzunehmen.',
	}

	/* Return all giveaways */
	public async getGiveaways(): Promise<(typeof GiveawayModel)[]> {
		return GiveawayModel.find();
	}

	/* Creates a new giveaway */
	public async createGiveaway(giveawayData): Promise<typeof GiveawayModel | Error> {
		try{
			// Send main embed
			const message: any = await this.sendMainEmbed(giveawayData);

			// Save giveaway to database
			giveawayData.messageId = message.messageId;
			const giveaway: any = new GiveawayModel(giveawayData);
			await giveaway.save();
			return giveaway;
		}catch(error: unknown){
			throw error;
		}

	}

	/* Deletes a giveaway by messageId */
	public async deleteGiveaway(giveawayId: string): Promise<boolean> {
		try{
			// Get giveaway
			const giveaway = await GiveawayModel.findOne({ messageId: giveawayId });
			if (!giveaway) return false;

			// Delete giveaway from database
			await GiveawayModel.findOneAndDelete({ messageId: giveawayId });

			// Get guild
			const guild: Guild | null = this.client.guilds.cache.get(giveaway.guildId);
			if (!guild) return false;

			// Get channel
			const channel: any = guild.channels.cache.get(giveaway.channelId);
			if(!channel) return false;

			// Get message
			const message = await channel.messages.fetch(giveaway.messageId).catch(() => {});
			if(!message) return false;

			// Update giveaway message
			const giveawayDeletedEmbedDescription: string =
				'## ' + this.clientUtils.emote('gift') + ' ' + giveaway.prize + '\n\n' +
				'### ' + this.clientUtils.emote('error') + ' Es sind keine weiteren Teilnahmen mehr möglich!\n\n' +
				'### ' + this.clientUtils.emote('info') + ' Informationen\n' +
				this.clientUtils.emote('arrow_right') + ' Das Gewinnspiel wurde vom Ersteller beendet, ohne einen Gewinner zu ziehen.';

			const giveawayDeletedEmbed: EmbedBuilder = new EmbedBuilder()
				.setDescription(giveawayDeletedEmbedDescription)
				.setThumbnail(this.client.user.displayAvatarURL())
				.setColor(config.get('embeds.colors.error'));

			const participateButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participate', '\u200b', ButtonStyle.Primary, this.clientUtils.emote('tada'), true);
			const participantsButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participants', giveaway.entrantIds.length.toString(), ButtonStyle.Secondary, this.clientUtils.emote('users'), true);

			const giveawayButtonRow = this.componentUtils.createActionRow(participateButton, participantsButton);

			await message.edit({ embeds: [giveawayDeletedEmbed], components: [giveawayButtonRow ] });
			return true;
		}catch(error: unknown){
			throw error;
		}
	}

	/* Pick random winners */
	private async pickRandomWinners(giveaway): Promise<string[]> {
		// Initialize random utils
		const randomUtilsInstance: RandomUtils = new RandomUtils();

		const entrantIds: string[] = giveaway.entrantIds.slice();
		const winners: string[] = [];

		for(let i = 0; i < giveaway.winnerCount; i++) {
			const randomParticipantId: string = randomUtilsInstance.randomChoice(entrantIds);
			if(!randomParticipantId) continue;

			// Validate participation
			const isValid: boolean = await this.validateParticipation(giveaway, randomParticipantId);
			if(!isValid) continue;

			// Add winner, remove from entrants
			winners.push(randomParticipantId);
			entrantIds.splice(entrantIds.indexOf(randomParticipantId), 1);
		}
		return winners;
	}

	/* End a giveaway by messageId */
	public async endGiveaway(giveawayId: string): Promise<boolean | Object> {
		try{
			// Get giveaway
			const giveaway = await GiveawayModel.findOne({ messageId: giveawayId });
			if (!giveaway) return false;

			// Check if giveaway has already ended
			if (giveaway.ended) return false;

			// Get winners
			const winners: string[] = await this.pickRandomWinners(giveaway);

			// Update giveaway in database
			giveaway.ended = true;
			giveaway.winnerIds = winners;
			await giveaway.save();

			// Update giveaway message
			await this.sendEndEmbed(giveaway);

			// Return end data
			return {
				winnerCount: giveaway.winnerCount,
				actualWinnerCount: winners.length,
				winners: winners,
				prize: giveaway.prize,
				message: giveaway.messageId,
				channel: giveaway.channelId,
				guild: giveaway.guildId,
			};
		}catch(error: unknown){
			throw error;
		}
	}

	/* Reroll a giveaway by messageId */
	public async rerollGiveaway(giveawayId: string): Promise<boolean | Object> {
		try{
			// Get giveaway
			const giveaway = await GiveawayModel.findOne({ messageId: giveawayId });
			if (!giveaway) return false;

			// Check if giveaway has already ended
			if (!giveaway.ended) return false;

			// Get winners
			const winners: string[] = await this.pickRandomWinners(giveaway);

			// Update giveaway in database
			giveaway.ended = true;
			giveaway.winnerIds = winners;
			await giveaway.save();

			// Update giveaway message
			await this.sendEndEmbed(giveaway);

			// Return reroll data
			return {
				winnerCount: giveaway.winnerCount,
				actualWinnerCount: winners.length,
				winners: winners,
				prize: giveaway.prize,
				message: giveaway.messageId,
				channel: giveaway.channelId,
				guild: giveaway.guildId,
			};
		}catch(error: unknown){
			throw error;
		}
	}

	/* Send main embed */
	private async sendMainEmbed(giveaway: any): Promise<any> {
		try{
			// Initialize format utils
			const formatUtilsInstance: FormatUtils = new FormatUtils();

			// Get guild
			const guild: Guild = this.client.guilds.cache.get(giveaway.guildId);
			if (!guild) return;

			// Get channel
			const channel: any = guild.channels.cache.get(giveaway.channelId);
			if (!channel) return;

			// Get giveaway creator
			const creator: User|void = await this.client.users.fetch(giveaway.hostedBy).catch(() => {});

			// Create embed description
			let embedDescription: string =
				'## ' + this.clientUtils.emote('gift') + ' ' + giveaway.prize + '\n\n' +
				'### ' + this.clientUtils.emote('arrow_right') + ' Drücke den ' + this.clientUtils.emote('tada') + ' Button, um teilzunehmen!\n\n' +
				'### ' + this.clientUtils.emote('info') + ' Informationen\n' +
				(creator ? this.clientUtils.emote('user') + ' Veranstalter: ' + creator.toString() + '\n' : '') +
				this.clientUtils.emote('tada') + 'Gewinner: **' + giveaway.winnerCount + '**' + '\n' +
				this.clientUtils.emote('calendar') + ' Endet am: ' + formatUtilsInstance.discordTimestamp(giveaway.endAt, 'f') + '\n' +
				this.clientUtils.emote('reminder') + ' Endet: ' + formatUtilsInstance.discordTimestamp(giveaway.endAt, 'R') + '\n\n';

			// Add requirements to embed description
			if (giveaway.requirements && Object.keys(giveaway.requirements).length > 0) {
				embedDescription += '### ' + this.clientUtils.emote('info') + ' Teilnahmebedingungen\n';

				for (const [key, value] of Object.entries(giveaway.requirements) as [string, string|number][]) {
					let item;
					switch(key){
						case 'role':
							item = guild.roles.cache.get(value as string);
							break;
						case 'level':
							item = value;
							break;
						case 'joinDate':
							item = formatUtilsInstance.discordTimestamp(value, 'D');
							break;
						case 'createdDate':
							item = formatUtilsInstance.discordTimestamp(value, 'D');
							break;
						case 'boost':
							item = '';
							break;
					}

					embedDescription += this.clientUtils.emote('arrow_right') + ' ' + this.requirementTexts[key].replace('{value}', item.toString()) + '\n';
				}
			}

			// Create embed
			const giveawayEmbed: EmbedBuilder = new EmbedBuilder()
				.setDescription(embedDescription)
				.setThumbnail(this.client.user.displayAvatarURL())
				.setColor(config.get('embeds.colors.normal'));

			// Create participate button
			const participateButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participate', '\u200b', ButtonStyle.Primary, this.clientUtils.emote('tada'));

			// Create participants button
			const participantsButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participants', giveaway.entrantIds.length.toString(), ButtonStyle.Secondary, this.clientUtils.emote('users'), true);

			// Create button row
			const giveawayButtonRow: any = this.componentUtils.createActionRow(participateButton, participantsButton);

			// Check if message already exists
			if (giveaway.messageId) {
				// Update existing message
				const message: Message = await channel.messages.fetch(giveaway.messageId).catch(() => {});
				if (message) {
					await message.edit({ embeds: [giveawayEmbed], components: [giveawayButtonRow] });
					return { messageId: giveaway.messageId };
				}
			} else {
				// Send new message
				const giveawayMessage: Message = await channel.send({ embeds: [giveawayEmbed], components: [giveawayButtonRow] });
				if (!giveawayMessage) return;
				return { messageId: giveawayMessage.id };
			}
		}catch(error: unknown){
			throw error;
		}
	}

	/* Send end embed */
	public async sendEndEmbed(giveaway: any): Promise<any> {
		try{
			// Initialize format utils
			const formatUtilsInstance: FormatUtils = new FormatUtils();

			// Get guild
			const guild: Guild = this.client.guilds.cache.get(giveaway.guildId);
			if (!guild) return;

			// Get channel
			const channel: any = guild.channels.cache.get(giveaway.channelId);
			if (!channel) return;

			// Get message
			const message: Message = await channel.messages.fetch(giveaway.messageId);
			if (!message) return;

			// Get giveaway creator
			const creator: User|void = await this.client.users.fetch(giveaway.hostedBy).catch(() => {});

			// Get winner mentions
			const winners: string[] = [];

			for (const winnerId of giveaway.winnerIds) {
				const winner: User|void = await this.client.users.fetch(winnerId).catch(() => {});
				if (!winner) continue;
				winners.push(winner.toString());
			}

			// Send end embed
			if (winners.length >= 1) {
				// Create winners embed
				const giveawayEndEmbedDescription: string =
						'## ' + this.clientUtils.emote('gift') + ' ' + giveaway.prize + '\n\n' +
						'### ' + this.clientUtils.emote('error') + ' Es sind keine weiteren Teilnahmen mehr möglich!\n\n' +
						'### ' + this.clientUtils.emote('info') + ' Informationen\n' +
						(creator ? this.clientUtils.emote('heart') + ' Veranstalter: ' + creator.toString() + '\n' : '') +
						this.clientUtils.emote('calendar') + ' Endete am: ' + formatUtilsInstance.discordTimestamp(giveaway.endAt, 'f') + '\n' +
						this.clientUtils.emote('reminder') + ' Endete: ' + formatUtilsInstance.discordTimestamp(giveaway.endAt, 'R') + '\n' +
						this.clientUtils.emote('tada') + ' **' + giveaway.winnerCount + '** Gewinner\n\n' +
						'### ' + this.clientUtils.emote('tada') + ' Gewinner\n' +
						this.clientUtils.emote('user') + ' ' + winners.join(', ');

				const giveawayEndEmbed: EmbedBuilder = new EmbedBuilder()
					.setDescription(giveawayEndEmbedDescription)
					.setThumbnail(this.client.user.displayAvatarURL())
					.setColor(config.get('embeds.colors.error'));

				// Create participate button
				const participateButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participate', '\u200b', ButtonStyle.Primary, this.clientUtils.emote('tada'), true);

				// Create participants button
				const participantsButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participants', giveaway.entrantIds.length.toString(), ButtonStyle.Secondary, this.clientUtils.emote('users'), true);

				// Create button row
				const giveawayButtonRow: any = this.componentUtils.createActionRow(participateButton, participantsButton);

				// Update message
				await message.edit({ embeds: [giveawayEndEmbed], components: [giveawayButtonRow] }).catch((): null => null);

				// Create congratulations message
				const congratulationsMessage: string = '### ' + this.clientUtils.emote('tada') + ' Herzlichen Glückwunsch, ' + winners.join(', ') + '!';
				await message.reply({ content: congratulationsMessage });
			} else {
				// Create no winners embed
				const giveawayEndEmbedDescription: string =
					'## ' + this.clientUtils.emote('gift') + ' ' + giveaway.prize + '\n\n' +
					'### ' + this.clientUtils.emote('error') + ' Es sind keine weiteren Teilnahmen mehr möglich!\n\n' +
					'### ' + this.clientUtils.emote('info') + ' Informationen\n' +
					(creator ? this.clientUtils.emote('heart') + ' Veranstalter: ' + creator.toString() + '\n' : '') +
					this.clientUtils.emote('calendar') + ' Endete am: ' + formatUtilsInstance.discordTimestamp(giveaway.endAt, 'f') + '\n' +
					this.clientUtils.emote('reminder') + ' Endete: ' + formatUtilsInstance.discordTimestamp(giveaway.endAt, 'R') + '\n' +
					this.clientUtils.emote('tada') + ' **' + giveaway.winnerCount + '** Gewinner\n\n' +
					'### ' + this.clientUtils.emote('tada') + ' Gewinner\n' +
					this.clientUtils.emote('user') + ' Es gibt keine Gewinner, da es keine Teilnahmen gab.';

				const giveawayEndEmbed: EmbedBuilder = new EmbedBuilder()
					.setDescription(giveawayEndEmbedDescription)
					.setThumbnail(this.client.user.displayAvatarURL())
					.setColor(config.get('embeds.colors.error'));

				// Create participate button
				const participateButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participate', '\u200b', ButtonStyle.Primary, this.clientUtils.emote('tada'), true);

				// Create participants button
				const participantsButton: ButtonBuilder = this.componentUtils.createButton('giveaway_participants', giveaway.entrantIds.length.toString(), ButtonStyle.Secondary, this.clientUtils.emote('users'), true);

				// Create button row
				const giveawayButtonRow: any = this.componentUtils.createActionRow(participateButton, participantsButton);

				// Update message
				await message.edit({ embeds: [giveawayEndEmbed], components: [giveawayButtonRow] }).catch(() => {});

				// Create congratulations message
				const congratulationsMessage: string = '### ' + this.clientUtils.emote('tada') + ' Es gibt keine Gewinner!';
				await message.reply({ content: congratulationsMessage });
			}
		}catch(error: unknown){
			throw error;
		}
	}

	/* Add entrant to giveaway */
	public async addEntrant(giveawayId: string, entrantId: string): Promise<boolean> {
		try{
			// Get giveaway
			const giveaway = await GiveawayModel.findOne({ messageId: giveawayId });
			if (!giveaway) return false;

			// Check if user already participated
			if (giveaway.entrantIds.includes(entrantId)) return false;

			// Validate participation
			const isValid: boolean = await this.validateParticipation(giveaway, entrantId);
			if(!isValid) return false;

			// Add entrant to database
			giveaway.entrantIds.push(entrantId);
			await giveaway.save();

			// Update giveaway message
			await this.sendMainEmbed(giveaway);
			return true;
		}catch(error: unknown){
			throw error;
		}
	}

	/* Remove entrant from giveaway */
	public async removeEntrant(giveawayId: string, entrantId: string): Promise<boolean> {
		try{
			// Get giveaway
			const giveaway = await GiveawayModel.findOne({ messageId: giveawayId });
			if (!giveaway) return false;

			// User did not participate
			if (!giveaway.entrantIds.includes(entrantId)) return;

			// Remove entrant from database
			giveaway.entrantIds.splice(giveaway.entrantIds.indexOf(entrantId), 1);
			await giveaway.save();

			// Update giveaway message
			await this.sendMainEmbed(giveaway);
			return true;
		}catch(error: unknown){
			throw error;
		}
	}

	/* Validate participation requirements */
	public async validateParticipation(giveaway: any, userId: string): Promise<boolean> {
		try{
			// Get guild
			const guild: Guild = this.client.guilds.cache.get(giveaway.guildId);
			if (!guild) return false;

			// Get member
			const member: GuildMember|void = await guild.members.fetch(userId).catch(() => {});
			if (!member) return false;

			// Check if member is in exempt list
			if (giveaway.exemptMembers.includes(userId)) return false;

			// Check if member is already participating
			if (giveaway.requirements && Object.keys(giveaway.requirements).length > 0) {
				for (const [key, value] of Object.entries(giveaway.requirements) as [string, string|number][]) {
					// Check role requirement
					if(key === 'role') {
						if(!member.roles.cache.has(value.toString())) return false;
					}

					// Check level requirement
					if(key === 'level') {
						const levelManagerInstance: LevelManager = new LevelManager(this.client);
						const levelData = await levelManagerInstance.fetch(userId, guild.id, false);
						if(levelData.level < value) return false;
					}

					// Check join date requirement
					if(key === 'joinDate') {
						if(member.joinedTimestamp > Number(value)) return false;
					}

					// Check created date requirement
					if(key === 'createdDate') {
						if(member.user.createdTimestamp > Number(value)) return false;
					}

					// Check boost requirement
					if(key === 'boost') {
						if(!member.premiumSinceTimestamp) return false;
					}
				}
			}

			return true;
		}catch(error: unknown){
			throw error;
		}
	}
}

export { GiveawayManager };