import { BaseClient } from '@core/BaseClient.js';
import { BaseCommand } from '@core/BaseCommand.js';
import ems from 'enhanced-ms';

import {
	SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandChannelOption,
	ChannelType, PermissionsBitField, SlashCommandStringOption,
	EmbedBuilder, CommandInteraction, CommandInteractionOptionResolver,
	ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';

const { Flags } = PermissionsBitField;
const ms = ems('de');

class AutodeleteCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'autodelete',
			description: 'Automatisches Löschen von Nachrichten in ausgewählten Kanälen nach einer bestimmten Zeit',
			dirname: import.meta.url,

			permissions: {
				bot: [
					Flags.ManageMessages
				],
				user: [
					Flags.ManageMessages,
					Flags.ManageGuild
				]
			},

			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					// Set application integration type
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					// Add subcommand: add
					.addSubcommand((addSubCommand: SlashCommandSubcommandBuilder) => addSubCommand
						.setName('hinzufügen')
						.setDescription('Fügt einen Kanal hinzu, in dem Nachrichten automatisch nach einer festgelegten Dauer gelöscht werden')
						// Add channel option
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle deinen gewünschten Kanal')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildText, ChannelType.PublicThread)
						)
						// Add time options
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('dauer')
							.setDescription('Gib deine gewünschte Löschdauer an')
							.setRequired(true)
						)
					)

					// Add subcommand: remove
					.addSubcommand((removeSubCommand: SlashCommandSubcommandBuilder) => removeSubCommand
						.setName('entfernen')
						.setDescription('Deaktiviert das automatische Löschen von Nachrichten in einem Kanal')
						// Add channel option
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle deinen gewünschten Kanal')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildText, ChannelType.PublicThread)
						)
					)

					// Add subcommand: list
					.addSubcommand((listSubCommand: SlashCommandSubcommandBuilder) => listSubCommand
						.setName('liste')
						.setDescription('Zeigt alle Kanäle an, in denen Nachrichten automatisch gelöscht werden')
					)
			},
		});
	}

	/**
	 * Main command function
	 */
	public async run(): Promise<void> {
		// Switch subcommands
		const selectedSubCommand: string = this.options.getSubcommand();
		switch (selectedSubCommand) {
			case 'hinzufügen':
				await this.add();
				break;
			case 'entfernen':
				await this.remove();
				break;
			case 'liste':
				await this.list();
				break;
		}
	}

	/**
	 * Add autodelete to specified channel
	 * @private
	 */
	private async add(): Promise<void> {
		try{
			// Get channel and time options
			const channel = this.options.getChannel('kanal');
			const time: string = this.options.getString('dauer');

			// Validate time
			if(!ms(time)){
				const timeIsInvalidEmbed: EmbedBuilder = this.clientUtils.createEmbed('Gib eine **gültige Löschdauer** an, bevor du den Befehl absendest.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [timeIsInvalidEmbed] });
				return;
			}

			// Validate that time is at least one second
			if(ms(time) < 1000){
				const minTimeEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Löschdauer muss **mindestens eine Sekunde** betragen.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [minTimeEmbed] });
				return;
			}

			// Validate that time is at most seven days
			if(ms(time) > 7 * 24 * 60 * 60 * 1000){
				const maxTimeEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Löschdauer darf **maximal sieben Tage** betragen.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [maxTimeEmbed] });
				return;
			}

			// Check if autodelete already exists in specified channel
			if(this.data.guild.settings.autodelete.find((autoDelete: any): boolean => autoDelete.channelId === channel.id)){
				const autodeleteAlreadyInChannelEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neue Nachrichten werden in {0} **bereits automatisch gelöscht**.', this.emote('error'), 'error', channel.toString());
				await this.interaction.followUp({ embeds: [autodeleteAlreadyInChannelEmbed] });
				return;
			}

			// Save autodelete to database
			this.data.guild.settings.autodelete.push({
				channelId: channel.id,
				time: ms(time)
			});
			this.data.guild.markModified('settings.autodelete');
			await this.data.guild.save();

			// Send confirmation embed
			const autoDeleteCreatedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neue Nachrichten werden in {0} absofort **nach {1} automatisch gelöscht**.', this.emote('success'), 'success', channel.toString(), ms(ms(time)));
			await this.interaction.followUp({ embeds: [autoDeleteCreatedEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Remove autodelete from specified channel
	 * @private
	 */
	private async remove(): Promise<void> {
		try{
			// Get channel option
			const channel = this.options.getChannel('kanal');

			// Validate that autodelete exists in specified channel
			if(!this.data.guild.settings.autodelete.find((autoDelete: any): boolean => autoDelete.channelId === channel.id)){
				const doesNotExistEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neue Nachrichten werden in {0} **aktuell nicht automatisch gelöscht**.', this.emote('error'), 'error', channel.toString());
				await this.interaction.followUp({ embeds: [doesNotExistEmbed] });
				return;
			}

			// Remove autodelete from database
			this.data.guild.settings.autodelete = this.data.guild.settings.autodelete.filter((autoDelete: any): boolean => autoDelete.channelId !== channel.id);
			this.data.guild.markModified('settings.autodelete');
			await this.data.guild.save();

			// Send confirmation embed
			const autoDeleteRemovedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neue Nachrichten werden in {0} absofort **nicht mehr automatisch gelöscht**.', this.emote('success'), 'success', channel.toString());
			await this.interaction.followUp({ embeds: [autoDeleteRemovedEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * List all autodelete settings
	 * @private
	 */
	private async list(): Promise<void> {
		try{
			// Map autodelete settings to array
			const autoDeleteSettings: object[] = this.data.guild.settings.autodelete;

			const autoDeleteArray: string[] = autoDeleteSettings.map((autoDelete: any): string => {
				const channel: string = this.guild.channels.cache.get(autoDelete.channelId)?.toString() || 'Unbekannter Kanal';
				const time: string = ms(autoDelete.time);
				return this.emote('delete') + ' ' + channel + ' ➜ ' + time;
			});

			// Send paginated embed
			await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, autoDeleteArray, this.emote('list') + ' Autodelete', 'Aktuell werden **keine Nachrichten automatisch gelöscht**.');
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { AutodeleteCommand };