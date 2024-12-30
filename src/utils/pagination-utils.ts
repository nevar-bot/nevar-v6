import { BaseClient } from '@core/BaseClient.js';
import {
	CommandInteraction, ButtonBuilder, ButtonStyle,
	EmbedBuilder, Message, InteractionCollector,
	ButtonInteraction,
} from 'discord.js';
import { ComponentsUtils } from '@utils/components-utils.js';
import { ClientUtils } from '@utils/client-utils.js';



class PaginationUtils {
	private readonly client: BaseClient;
	constructor(client: BaseClient) {
		this.client = client;
	}

	/**
	 * Send a paginated embed
	 * @param interaction
	 * @param entriesPerPage
	 * @param data
	 * @param title
	 * @param empty
	 */
	public async sendPaginatedEmbed<T>(interaction: CommandInteraction|Message, entriesPerPage: number, data: string[], title: string, empty: string): Promise<void> {
		// Initialize utils
		const clientUtilsInstance: ClientUtils = new ClientUtils(this.client);
		const componentsUtilsInstance: ComponentsUtils = new ComponentsUtils();

		// Get user ID
		const userId: string = interaction instanceof CommandInteraction ? interaction.user.id : interaction.author.id;

		// Create pagination buttons
		const pageBackId: string = 'collector_' + userId + '_back';
		const pageForwardId: string = 'collector_' + userId + '_forward';

		const pageBackButton: ButtonBuilder|Error = componentsUtilsInstance.createButton(pageBackId, 'Zurück', ButtonStyle.Secondary, clientUtilsInstance.emote('arrow_left'));
		const pageForwardButton: ButtonBuilder|Error = componentsUtilsInstance.createButton(pageForwardId, 'Weiter', ButtonStyle.Secondary, clientUtilsInstance.emote('arrow_right'));

		/**
		 * Generate a paginated embed
		 * @param start
		 */
		async function generatePaginatedEmbed(start: number): Promise<EmbedBuilder> {
			// Get data for the current page
			const current: string[] = data.slice(start, start + entriesPerPage);

			// Calculate total pages and current page
			const pages = {
				total: Math.ceil(data.length / entriesPerPage),
				current: Math.round(start / entriesPerPage) + 1,
			};

			if (pages.total === 0) pages.total = 1;

			// Create text for the embed
			let text: string = current.map((item: string): string => '\n' + item).join('');

			// If no data is found, display an empty message
			if(data.length === 0) text = clientUtilsInstance.emote('error') + ' ' + empty;

			// Create embed description
			let description: string = '### ' + title;
			if(pages.total > 1){
				description = '### ' + title + ' • Seite ' + pages.current + ' von ' + pages.total;
			}

			// Create and return the embed
			return clientUtilsInstance.createEmbed(description + '\n' + text, null, 'normal');
		}

		// Check if all data can fit on one page
		const canFitOnePage: boolean = data.length <= entriesPerPage;

		// Send initial message
		let repliedMessage: Message;

		if(interaction instanceof CommandInteraction){
			// Follow up to command interaction
			repliedMessage = await interaction.followUp({
				embeds: [await generatePaginatedEmbed(0)],
				components: canFitOnePage ? [] : [componentsUtilsInstance.createActionRow(pageForwardButton)],
			});
		}else if(interaction instanceof Message){
			// Reply to message
			repliedMessage = await interaction.reply({
				embeds: [await generatePaginatedEmbed(0)],
				components: canFitOnePage ? [] : [componentsUtilsInstance.createActionRow(pageForwardButton)],
			});
		}

		// Create pagination collector
		const paginationCollector: InteractionCollector<any> = repliedMessage.createMessageComponentCollector({
			filter: (i: ButtonInteraction): boolean => i.user.id === userId,
		});

		// Set current page
		let currentPage: number = 0;

		// Handle pagination button click
		paginationCollector.on('collect', async (i: ButtonInteraction): Promise<void> => {
			// Check if user clicked forward or back
			i.customId === pageBackId ? (currentPage -= entriesPerPage) : (currentPage += entriesPerPage);

			// Update message
			await i.update({
				embeds: [await generatePaginatedEmbed(currentPage)],
				components: [
					componentsUtilsInstance.createActionRow((currentPage ? pageBackButton : null), (currentPage + entriesPerPage < data.length ? pageForwardButton : null))
				],
			});
		})
	}
}

export { PaginationUtils };