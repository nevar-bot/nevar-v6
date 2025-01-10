import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder,
	SlashCommandChannelOption, SlashCommandSubcommandBuilder, ChannelType,
	SlashCommandStringOption, SlashCommandIntegerOption, EmbedBuilder,
	StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
	MessageComponentInteraction, Message, PermissionsBitField,
	ApplicationIntegrationType,
	InteractionContextType
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import ems from "enhanced-ms";
import { parse, isValid } from 'date-fns';
const ms: any = ems("de");
import { GiveawayManager } from '@services/GiveawayManager.js';
const { Flags } = PermissionsBitField;

class GiveawayCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'giveaway',
			description: 'Starte und verwalte Gewinnspiele auf deinem Server',
			permissions: {
				bot: [],
				user: [
					Flags.ManageGuild, 
				]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addSubcommand((createSubCommand: SlashCommandSubcommandBuilder) => createSubCommand
						.setName('erstellen')
						.setDescription('Starte ein neues Gewinnspiel')
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle einen Kanal')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread),
						)
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('gewinn')
							.setDescription('Lege den Gewinn fest')
							.setRequired(true),
						)
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('dauer')
							.setDescription('Lege die Dauer fest (z.B. 1h, 1d, 1w, 1h 30m)')
							.setRequired(true),
						)
						.addIntegerOption((integerOption: SlashCommandIntegerOption) => integerOption
							.setName('gewinner')
							.setDescription('Lege fest, wie viele Gewinner es geben soll')
							.setRequired(true)
							.setMinValue(1)
							.setMaxValue(100),
						)
					)
					.addSubcommand((endSubCommand: SlashCommandSubcommandBuilder) => endSubCommand
						.setName('beenden')
						.setDescription('Beende ein laufendes Gewinnspiel vorzeitig')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('id')
							.setDescription('Gib die Nachrichten-ID des Gewinnspiels an')
							.setRequired(true),
						)
					)
					.addSubcommand((rerollSubCommand: SlashCommandSubcommandBuilder) => rerollSubCommand
						.setName('neulosen')
						.setDescription('Lose neue Gewinner für ein Gewinnspiel aus')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('id')
							.setDescription('Gib die Nachrichten-ID des Gewinnspiels an')
							.setRequired(true),
						)
					)
					.addSubcommand((deleteSubCommand: SlashCommandSubcommandBuilder) => deleteSubCommand
						.setName('löschen')
						.setDescription('Lösche ein Gewinnspiel ohne Gewinner zu ziehen')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('id')
							.setDescription('Gib die Nachrichten-ID des Gewinnspiels an')
							.setRequired(true),
						)
					)
					.addSubcommand((listSubCommand: SlashCommandSubcommandBuilder) => listSubCommand
						.setName('liste')
						.setDescription('Sieh dir alle laufenden Gewinnspiele an')
					),
			},
		});
	}

	public async run(): Promise<void> {
		const subCommand: string = this.options.getSubcommand();

		switch(subCommand){
			case 'erstellen':
				await this.createGiveaway();
				break;
			case 'beenden':
				await this.endGiveaway();
				break;
			case 'neulosen':
				await this.rerollGiveaway();
				break;
			case 'löschen':
				await this.deleteGiveaway();
				break;
			case 'liste':
				await this.listGiveaways();
				break;
		}
	}

	private async createGiveaway(): Promise<void> {
		const channel: any = this.options.getChannel('kanal');
		const prize: string = this.options.getString('gewinn');
		const duration: string = this.options.getString('dauer');
		const winners: number = this.options.getInteger('gewinner');

		if(!ms(duration)){
			const invalidDurationEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine gültige Dauer angeben, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidDurationEmbed] });
			return;
		}

		// Ask user for requirements
		const requirements: {key: string, name: string, description: string}[] = [
			{ key: 'role', name: 'Rolle', description: 'Muss eine bestimmte Rolle haben' },
			{ key: 'level', name: 'Level', description: 'Muss ein bestimmtes Level haben' },
			{ key: 'joinDate', name: 'Beitrittsdatum', description: 'Muss den Server vor einem bestimmten Datum betreten haben' },
			{ key: 'createdDate', name: 'Erstellungsdatum', description: 'Muss den Account vor einem bestimmten Datum erstellt haben' },
			{ key: 'boost', name: 'Booster', description: 'Muss Booster des Servers sein' },
		];

		const requirementsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Wähle Anforderungen, die Mitglieder erfüllen müssen, um am Gewinnspiel teilzunehmen', this.emote('arrow_right'), 'normal');

		// Create select menu
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('collector_requirements')
			.setPlaceholder('Wähle die gewünschten Anforderungen')
			.setMinValues(0)
			.setMaxValues(requirements.length)
			.addOptions(
				requirements.map((requirement: { key: string, name: string, description: string }) => ({
					label: requirement.name,
					value: requirement.key,
					description: requirement.description,
				})),
			);

		// Create no requirements button
		const noRequirementsButton: ButtonBuilder = this.componentsUtils.createButton('collector_noRequirements', 'Ohne Anforderungen fortfahren', ButtonStyle.Secondary, this.emote('error'));

		// Send select menu
		const selectRequirementsRow = this.componentsUtils.createActionRow(selectMenu);
		const noRequirementsRow = this.componentsUtils.createActionRow(noRequirementsButton);

		// Send message
		const message: any = await this.interaction.followUp({ embeds: [requirementsEmbed], components: [selectRequirementsRow, noRequirementsRow] });

		// Create message component collector
		const requirementsCollector = message.createMessageComponentCollector({
			filter: (btn: MessageComponentInteraction): boolean =>
				btn.user.id === this.user.id &&
				(btn.customId === 'collector_requirements' || btn.customId === 'collector_noRequirements'),
		});

		// Handle requirements collector
		requirementsCollector.on('collect', async (requirementsInteraction: any): Promise<void> => {
			// Stop collector
			requirementsCollector.stop();
			await requirementsInteraction.deferUpdate();

			// Check if user selected requirements or no requirements
			const selectedRequirements: string[] = requirementsInteraction.customId === 'collector_noRequirements' ? [] : requirementsInteraction.values;

			// Ask user for requirement values
			const requirementsValues = [];

			// Loop through selected requirements and ask for values
			for(const requirement of selectedRequirements){
				let requirementText: string = '';
				switch(requirement){
					case 'role':
						requirementText = 'Welche Rolle müssen Mitglieder haben, um teilnehmen zu dürfen?';
						break;
					case 'level':
						requirementText = 'Welches Level müssen Mitglieder haben, um teilnehmen zu dürfen?';
						break;
					case 'joinDate':
						requirementText = 'Vor welchem Datum müssen Mitglieder den Server betreten haben, um teilnehmen zu dürfen?';
						break;
					case 'createdDate':
						requirementText = 'Vor welchem Datum müssen Mitglieder ihren Discord-Account erstellt haben, um teilnehmen zu dürfen?';
						break;
					case 'boost':
						requirementsValues.push('1');
						continue;
				}

				// Ask for requirement value
				const requirementValueEmbed: EmbedBuilder = this.clientUtils.createEmbed(requirementText, this.emote('arrow_right'), 'normal');
				await message.edit({ embeds: [requirementValueEmbed], components: [] });

				// Collect requirement value
				const collectedValue = await new Promise<string|number>((resolve) => {
					// Create message collector
					const messageCollector = message.channel.createMessageCollector({
						filter: (m: any): boolean => m.author.id === this.user.id
					});

					// Handle message collector
					messageCollector.on('collect', async (msg: Message): Promise<void> => {
						msg.delete().catch(() => {});
						// Validate requirement value
						switch(requirement) {
							case 'role':
								const role = msg.mentions.roles.first();
								if (!role) {
									const noRoleEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine Rolle erwähnen.', this.emote('error'), 'error');
									await message.edit({ embeds: [noRoleEmbed] });
								} else {
									messageCollector.stop();
									resolve(role.id);
								}
								break;
							case 'level':
								if (isNaN(parseInt(msg.content))) {
									const noLevelEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine Zahl eingeben.', this.emote('error'), 'error');
									await message.edit({ embeds: [noLevelEmbed] });
								} else {
									messageCollector.stop();
									resolve(msg.content);
								}
								break;
							case 'joinDate':
								if(!isValid(parse(msg.content, 'dd.MM.yyyy', new Date()))) {
									const invalidDateEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst ein Datum eingeben.', this.emote('error'), 'error');
									await message.edit({ embeds: [invalidDateEmbed] });
								}else{
									messageCollector.stop();
									const parsedDate = parse(msg.content, 'dd.MM.yyyy', new Date());
									resolve(parsedDate.getTime());
								}
								break;
							case 'createdDate':
								if(!isValid(parse(msg.content, 'dd.MM.yyyy', new Date()))) {
									const invalidDateEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst ein Datum eingeben.', this.emote('error'), 'error');
									await message.edit({ embeds: [invalidDateEmbed] });
								}else{
									messageCollector.stop();
									const parsedDate = parse(msg.content, 'dd.MM.yyyy', new Date());
									resolve(parsedDate.getTime());
								}
								break;
						}
					})
				})

				requirementsValues.push(collectedValue);
			}

			// Initialize giveaway manager
			const giveawayManagerInstance: GiveawayManager = new GiveawayManager(this.client);

			// Create giveaway
			await giveawayManagerInstance.createGiveaway({
				messageId: null,
				channelId: channel.id,
				guildId: this.guild.id,
				startAt: Date.now(),
				endAt: Date.now() + ms(duration),
				ended: false,
				winnerCount: winners,
				prize: prize,
				entrantIds: [],
				hostedBy: this.user.id,
				winnerIds: [],
				exemptMembers: [],
				requirements: selectedRequirements.reduce((acc, key, index) => {
					acc[key] = requirementsValues[index];
					return acc;
				}, {}),
			})

			// Send confirmation message
			const embed: EmbedBuilder = this.clientUtils.createEmbed('Das Gewinnspiel wurde erstellt.', this.emote('success'), 'normal');
			await message.edit({ embeds: [embed], components: [] });
		});
	}

	private async endGiveaway(): Promise<void> {
		const messageId: string = this.options.getString('id');

		// Initialize giveaway manager
		const giveawayManagerInstance: GiveawayManager = new GiveawayManager(this.client);

		// End giveaway
		const endGiveaway: boolean|Object = await giveawayManagerInstance.endGiveaway(messageId);

		if(!endGiveaway){
			const invalidGiveawayEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Gewinnspiel konnte nicht beendet werden.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidGiveawayEmbed] });
			return;
		}

		const embed: EmbedBuilder = this.clientUtils.createEmbed('Das Gewinnspiel wurde beendet.', this.emote('success'), 'normal');
		await this.interaction.followUp({ embeds: [embed] });
	}

	private async rerollGiveaway(): Promise<void> {
		const messageId: string = this.options.getString('id');

		// Initialize giveaway manager
		const giveawayManagerInstance: GiveawayManager = new GiveawayManager(this.client);

		// Reroll giveaway
		const rerollGiveaway: boolean|Object = await giveawayManagerInstance.rerollGiveaway(messageId);

		if(!rerollGiveaway){
			const invalidGiveawayEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Gewinnspiel konnte nicht neu ausgelost werden.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidGiveawayEmbed] });
			return;
		}

		const embed: EmbedBuilder = this.clientUtils.createEmbed('Das Gewinnspiel wurde neu ausgelost.', this.emote('success'), 'normal');
		await this.interaction.followUp({ embeds: [embed] });
	}

	private async deleteGiveaway(): Promise<void> {
		const messageId: string = this.options.getString('id');

		// Initialize giveaway manager
		const giveawayManagerInstance: GiveawayManager = new GiveawayManager(this.client);

		// Delete giveaway
		const deleteGiveaway: boolean|Object = await giveawayManagerInstance.deleteGiveaway(messageId);

		if(!deleteGiveaway){
			const invalidGiveawayEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Gewinnspiel konnte nicht gelöscht werden.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidGiveawayEmbed] });
			return;
		}

		const embed: EmbedBuilder = this.clientUtils.createEmbed('Das Gewinnspiel wurde gelöscht.', this.emote('success'), 'normal');
		await this.interaction.followUp({ embeds: [embed] });
	}

	private async listGiveaways(): Promise<void> {
		const giveawayManagerInstance: GiveawayManager = new GiveawayManager(this.client);
		const giveaways: any = await giveawayManagerInstance.getGiveaways();

		const formattedGiveaways: string[] = [];

		for(let giveaway of giveaways){
			if(giveaway.ended) continue;
			const giveawayText: string =
				'### ' + this.emote('gift') + ' ' + giveaway.prize + '\n' +
				'-# **ID**: ' + giveaway.messageId + '\n' +
				'-# **Kanal**: <#' + giveaway.channelId + '>\n' +
				'-# **Gewinner**: ' + giveaway.winnerCount + '\n' +
				'-# **Endet am**: ' + this.formatUtils.discordTimestamp(giveaway.endAt, 'f') + '\n' +
				'-# **Endet**: ' + this.formatUtils.discordTimestamp(giveaway.endAt, 'R');

			formattedGiveaways.push(giveawayText);
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 2, formattedGiveaways, 'Laufende Gewinnspiele', 'Es gibt keine laufenden Gewinnspiele.');
	}
}

export { GiveawayCommand };