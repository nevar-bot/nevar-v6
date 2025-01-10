import { BaseCommand } from '@core/BaseCommand.js';
import { BaseClient } from '@core/BaseClient.js';

import {
	GuildEmoji, SlashCommandBuilder, SlashCommandChannelOption,
	SlashCommandStringOption, SlashCommandSubcommandBuilder, ChannelType,
	EmbedBuilder, CommandInteraction, CommandInteractionOptionResolver,
	PermissionsBitField, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';

const { Flags } = PermissionsBitField;

class AutoreactCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'autoreact',
			description: 'Lege fest, dass Nachrichten eine bestimmte Reaktion automatisch erhalten',
			dirname: import.meta.url,

			permissions: {
				bot: [
					Flags.AddReactions
				],
				user: [
					Flags.AddReactions,
					Flags.ManageGuild,
					Flags.ManageChannels
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
						.setDescription('Fügt eine Autoreaktion in einem Kanal hinzu')
						// Add channel option
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle deinen gewünschten Kanal')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildText, ChannelType.PublicThread)
						)
						// Add emoji option
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('emoji')
							.setDescription('Gib dein gewünschtes Emoji an')
							.setRequired(true)
						)
					)
					// Add subcommand: remove
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('entfernen')
						.setDescription('Entfernt eine Autoreaktion in einem Kanal')
						// Add channel option
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle deinen gewünschten Kanal')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildText, ChannelType.PublicThread)
						)
						// Add emoji option
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('emoji')
							.setDescription('Gib das zu entfernende Emoji an')
							.setRequired(true)
						)
					)
					// Add subcommand: list
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('liste')
						.setDescription('Zeigt alle Kanäle an, in denen automatisch reagiert wird')
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
	 * Add autoreact to specified channel
	 * @private
	 */
	private async add(): Promise<void> {
		try{
			// Get channel and emoji options
			const channel = this.options.getChannel('kanal');
			const emoji: string = this.options.getString('emoji');

			// Validate emoji input
			if(!this.validationUtils.stringIsEmoji(emoji) && !this.validationUtils.stringIsCustomEmoji(emoji)){
				const invalidEmojiEmbed: EmbedBuilder = this.clientUtils.createEmbed('Gib einen **gültigen Emoji** an, bevor du den Befehl absendest.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [invalidEmojiEmbed] });
				return;
			}

			// Get emoji id from custom emoji
			const emote: string = this.validationUtils.stringIsCustomEmoji(emoji) ? emoji.replace(/<a?:\w+:(\d+)>/g, '$1') : emoji;

			// Check if client can use the emoji
			if(this.validationUtils.stringIsCustomEmoji(emoji)){
				if(!this.client.emojis.cache.find((cachedEmoji: GuildEmoji): boolean => cachedEmoji.id === emote)){
					const unusableEmojiEmbed: EmbedBuilder = this.clientUtils.createEmbed('Gib einen Emoji an, **welchen ich verwenden kann**.', this.emote('error'), 'error');
					await this.interaction.followUp({ embeds: [unusableEmojiEmbed] });
					return;
				}
			}

			// Emoji is already added to this channel
			if(this.data.guild.settings.autoreact.find((autoReact): boolean => autoReact.channelId === channel.id && autoReact.emoji === emote)){
				const alreadyExistsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neue Nachrichten in {0} erhalten **bereits automatisch die {1}-Reaktion**.', this.emote('error'), 'error', channel.toString(), emoji);
				await this.interaction.followUp({ embeds: [alreadyExistsEmbed] });
				return;
			}

			// Save autoreact to database
			this.data.guild.settings.autoreact.push({
				channelId: channel.id,
				emoji: emote
			});
			this.data.guild.markModified('settings.autoreact');
			await this.data.guild.save();

			// Send confirmation embed
			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neue Nachrichten in {0} **erhalten absofort automatisch die {1}-Reaktion**.', this.emote('success'), 'success', channel.toString(), emoji);
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Remove autoreact from specified channel
	 * @private
	 */
	private async remove(): Promise<void> {
		try{
			// Get channel and emoji options
			const channel = this.options.getChannel('kanal');
			const emoji: string = this.options.getString('emoji');

			// Validate emoji input
			if(!this.validationUtils.stringIsEmoji(emoji) && !this.validationUtils.stringIsCustomEmoji(emoji)){
				const invalidEmojiEmbed: EmbedBuilder = this.clientUtils.createEmbed('Gib einen **gültigen Emoji** an, bevor du den Befehl absendest.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [invalidEmojiEmbed] });
				return;
			}

			// Get emoji id from custom emoji
			const emote: string = this.validationUtils.stringIsCustomEmoji(emoji) ? emoji.replace(/<a?:\w+:(\d+)>/g, '$1') : emoji;

			// Check if emoji is added to this channel
			if(!this.data.guild.settings.autoreact.find((autoReact): boolean => autoReact.channelId === channel.id && autoReact.emoji === emote)){
				const doesNotExistEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neue Nachrichten in {0} erhalten aktuell **nicht automatisch die {1}-Reaktion**.', this.emote('error'), 'error', channel.toString(), emoji);
				await this.interaction.followUp({ embeds: [doesNotExistEmbed] });
				return;
			}

			// Remove autoreact from database
			this.data.guild.settings.autoreact = this.data.guild.settings.autoreact.filter((autoReact): boolean => autoReact.channelId !== channel.id || autoReact.emoji !== emote);
			this.data.guild.markModified('settings.autoreact');
			await this.data.guild.save();

			// Send confirmation embed
			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('In {0} wird **ab sofort nicht mehr automatisch mit {1} reagiert**.', this.emote('success'), 'success', channel.toString(), emoji);
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * List all autoreact settings
	 * @private
	 */
	private async list(): Promise<void> {
		try{
			const autoreacts: string[][] = [];

			// Get autoreact settings
			for(let autoreact of this.data.guild.settings.autoreact){
				// Get channel from cache
				const channel = this.guild.channels.cache.get(autoreact.channelId);
				if(!channel) continue;

				// Add channel id to list
				if(!autoreacts[channel.id]){
					autoreacts[channel.id] = [];
				}

				// Add emoji to list
				if(this.validationUtils.stringIsEmoji(autoreact.emoji)){
					autoreacts[channel.id].push(autoreact.emoji);
				}else{
					// Get cached emoji
					const cachedEmoji: GuildEmoji = this.guild.emojis.cache.get(autoreact.emoji);
					if(cachedEmoji) autoreacts[channel.id].push(this.guild.emojis.cache.get(autoreact.emoji).toString());
				}
			}

			const autoreactList: string[] = [];

			// Format autoreact list
			for (const [channelId, emojis] of Object.entries(autoreacts)) {
				const channel = this.guild.channels.cache.get(channelId);
				if (!channel) continue;

				const autoreactString: string = '### ' + channel.toString() + '\n\n# ' + emojis.join(' ');
				autoreactList.push(autoreactString);
			}

			// Send paginated embed
			await this.paginationUtils.sendPaginatedEmbed(this.interaction, 1, autoreactList, this.emote('list') + ' Autoreaktionen', 'Aktuell wird **in keinem Kanal automatisch reagiert**.');
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { AutoreactCommand };