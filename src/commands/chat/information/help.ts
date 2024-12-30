import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType, ComponentType, ApplicationCommandOptionType,
	CommandInteraction, EmbedBuilder, StringSelectMenuBuilder,
	ButtonBuilder, CommandInteractionOptionResolver, InteractionContextType,
	Message, SlashCommandBuilder,
	StringSelectMenuInteraction, ButtonStyle, ActionRowBuilder,
	ApplicationCommandType, ButtonInteraction,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import config from 'config';

class HelpCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'help',
			description: 'Zeigt eine Übersicht aller Befehle, oder Hilfe zu einem bestimmten Befehl',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
			},
		});
	}

	public async run(): Promise<void> {
		// Categories
		const categories: {} = {
			automation: 'Automatisierung',
			bot: 'Bot',
			fun: 'Spaß',
			information: 'Information',
			levelsystem: 'Levelsystem',
			management: 'Verwaltung',
			minigames: 'Minispiele',
			moderation: 'Moderation',
			owner: 'Eigentümer',
			staff: 'Staff'
		}

		// Main embed
		const mainEmbedDescription: string =
			'### ' + this.emote('logo_icon') + ' ' + this.client.user.displayName + ' ist ein Bot, der aktuell auf mehr als ' + Math.floor(this.client.guilds.cache.size / 10) * 10 + ' Servern genutzt wird!\n\n' +
			this.emote('discover') + ' Dieser Befehl **soll dir helfen**, dich **mit meinen Befehlen vertraut zu machen**.\n\n' +
			'### ▬ [Einladen](' + this.clientUtils.createInvite() + ') ▬ [Support](' + this.client.support + ') ▬ [Unterstützen](https://prohosting24.de/cp/donate/nevar) ▬ [Voten](https://top.gg/bot/' + this.client.user.id + '/vote) ▬';

		const mainEmbed: EmbedBuilder = this.clientUtils.createEmbed(mainEmbedDescription, null, 'normal')
			.setImage('https://i.ibb.co/cY6gSjX/Banner.png');

		// Category select menu
		const userRole: string|null = this.data.user.staff?.role || null;
		const isOwner: boolean = config.get('client.owner_ids').includes(this.member.user.id);

		const filteredCategories = Object.entries(categories).filter(([key]) => {
			if(key === 'staff') return userRole === 'staff' || userRole === 'head-staff' || isOwner;
			if(key === 'owner') return userRole === 'head-staff' || isOwner;
			return true;
		});

		const categorySelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
			.setCustomId('collector_category')
			.setPlaceholder('Wähle eine Kategorie, um ihre Befehle anzuzeigen')
			.addOptions(
				filteredCategories.map(([value, label]) => ({
					label: label.toString(),
					value: value.toString(),
					emoji: this.emote('shine')
				}))
			);

		const categoryActionRow = this.componentsUtils.createActionRow(categorySelectMenu);

		// Send main embed
		const helpMsg: Message = await this.interaction.followUp({ embeds: [mainEmbed], components: [categoryActionRow] });

		// Create category collector
		const categoryCollector = helpMsg.createMessageComponentCollector({
			filter: (i: StringSelectMenuInteraction): boolean => i.user.id === this.member.user.id,
			componentType: ComponentType.StringSelect
		});

		// Handle category selection
		categoryCollector.on('collect', async (interaction: StringSelectMenuInteraction): Promise<void> => {
			// Get chosen category
			const category: string = interaction.values[0];

			// Fetch application commands
			const applicationCommands = await this.client.application.commands.fetch();
			const commands: string[] = [];
			const formattedCommands: string[] = [];

			// Loop through application commands
			for(const [id, command] of applicationCommands){
				// Check if command is in the correct category and is a chat command
				if(!this.client.commands.chat.find((c) => c.general.name === command.name && c.general.category === category)) continue;
				if(command.type !== ApplicationCommandType.ChatInput) continue;

				// Search for subcommands
				const commandIsDisabled: boolean = await this.databaseUtils.commandIsDisabled(command.name);
				for(const option of command.options){
					if(option.type === ApplicationCommandOptionType.Subcommand){
						// Push subcommand to formatted commands array
						const commandMentionString: string =
							this.emote('command') + ' ' + (commandIsDisabled ? '~~' : '') + await this.commandUtils.commandMention(command.name, option.name) + (commandIsDisabled ? '~~' : '') + '\n' +
							this.emote('text') + ' ' + option.description + '\n';
						formattedCommands.push(commandMentionString);
					}
				}

				// Push command to formatted commands array if there are no subcommands
				if(command.options.length === 0 || !command.options.find((option: any) => option.type === ApplicationCommandOptionType.Subcommand)){
					const commandMentionString: string =
						this.emote('command') + ' ' + (commandIsDisabled ? '~~' : '') + await this.commandUtils.commandMention(command.name) + (commandIsDisabled ? '~~' : '') + '\n' +
						this.emote('text') + ' ' + command.description + '\n';
					formattedCommands.push(commandMentionString);
				}
				commands.push(command.name);
			}

			// Loop through client commands collection, and add commands that are not in the application commands collection
			for(const [name, command] of this.client.commands.chat){
				// Check if command is in the correct category
				if(command.general.category !== category) continue;

				// Check if command is already in the application commands collection
				if(commands.includes(command.general.name)) continue;

				// Push command to formatted commands array
				const commandIsDisabled: boolean = await this.databaseUtils.commandIsDisabled(command.general.name);
				const commandMentionString: string =
					this.emote('command') + ' ' + (commandIsDisabled ? '~~' : '') + await this.commandUtils.commandMention(command.general.name) + (commandIsDisabled ? '~~' : '') + '\n' +
					this.emote('text') + ' ' + command.general.description + '\n';
				formattedCommands.push(commandMentionString);
			}

			// Pagination
			let currentIndex: number = 0;

			// Create pagination buttons
			const backId: string = 'collector_' + this.member.user.id + "_back";
			const forwardId: string = 'collector_' + this.member.user.id + "_forward";
			const homeId: string = 'collector_' + this.member.user.id + "_home";

			const backButton: ButtonBuilder = this.componentsUtils.createButton(backId, 'Zurück', ButtonStyle.Secondary, this.emote('arrow_left'));
			const forwardButton: ButtonBuilder = this.componentsUtils.createButton(forwardId, 'Weiter', ButtonStyle.Secondary, this.emote('arrow_right'));
			const homeButton: ButtonBuilder = this.componentsUtils.createButton(homeId, 'Zur Startseite', ButtonStyle.Primary, this.emote('discover'));

			// Generate embed with paginated data
			const generateEmbed = async (start: number): Promise<EmbedBuilder> => {
				// Get data to display
				const current: string[] = formattedCommands.slice(start, start + 5);

				// Calculate pages
				const pages = {
					total: Math.ceil(formattedCommands.length / 5),
					current: Math.round(start / 5) + 1
				};
				if (pages.total === 0) pages.total = 1;

				// Create embed
				const text: string = current.map((item) => "\n" + item).join("");
				const paginatedEmbed: EmbedBuilder = this.clientUtils.createEmbed(null, null, "normal");
				if(pages.total > 1){
					paginatedEmbed.setDescription('### ' + this.emote('logo_icon') + ' ' + categories[category] + " • Seite " + pages.current + ' von ' + pages.total + '\n\n' + text);
				} else {
					paginatedEmbed.setDescription('### ' + this.emote('logo_icon') + ' ' + categories[category] + '\n\n' + text);
				}

				paginatedEmbed.setThumbnail(this.client.user.displayAvatarURL());
				return paginatedEmbed;
			};

			// Check if shown commands fit on one page
			const canFitOnePage: boolean = formattedCommands.length <= 5;

			// Send paginated embed
			await interaction.update({ embeds: [await generateEmbed(0)], components: canFitOnePage ? [this.componentsUtils.createActionRow(homeButton)] : [this.componentsUtils.createActionRow(forwardButton, homeButton)] });

			// Create pagination collector
			const paginationCollector = helpMsg.createMessageComponentCollector({
				filter: (i: ButtonInteraction): boolean => i.user.id === this.interaction.user.id && (i.customId === backId || i.customId === forwardId || i.customId === homeId),
				componentType: ComponentType.Button
			});
			if (canFitOnePage) paginationCollector.stop();

			if (!canFitOnePage) {
				currentIndex = 0;

				// Handle pagination buttons
				paginationCollector.on("collect", async (paginationInteraction: ButtonInteraction): Promise<void> => {
					// Check if user clicked on a pagination button
					if (paginationInteraction.customId === backId || paginationInteraction.customId === forwardId) {
						// Update current index
						paginationInteraction.customId === backId ? (currentIndex -= 5) : (currentIndex += 5);

						// Update message
						await paginationInteraction.deferUpdate().catch(() => {});
						await helpMsg.edit({ embeds: [await generateEmbed(currentIndex)], components: [this.componentsUtils.createActionRow(...(currentIndex ? [backButton] : []), ...(currentIndex + 5 < formattedCommands.length ? [forwardButton] : []), homeButton)] });
					}
				});
			}

			// Create home collector
			const homeCollector = helpMsg.createMessageComponentCollector({
				filter: (i: any): boolean => i.user.id === this.interaction.user.id && i.customId === homeId,
				componentType: ComponentType.Button
			});

			// Handle home button
			homeCollector.on("collect", async (homeInteraction: any): Promise<void> => {
				// Stop pagination collector
				paginationCollector.stop();

				// Update message
				await homeInteraction.deferUpdate().catch((): void => {});
				await helpMsg.edit({ embeds: [mainEmbed], components: [categoryActionRow] });
				currentIndex = 0;
			});
		});
	}
}

export { HelpCommand };