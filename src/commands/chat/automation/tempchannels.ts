import { BaseCommand } from '@core/BaseCommand.js';
import { BaseClient } from '@core/BaseClient.js';

import {
	SlashCommandBuilder, EmbedBuilder, SlashCommandStringOption,
	SlashCommandSubcommandBuilder, SlashCommandChannelOption, ChannelType,
	SlashCommandIntegerOption, CommandInteraction, CommandInteractionOptionResolver,
	PermissionsBitField, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';

const { Flags } = PermissionsBitField;

class TempchannelsCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'tempchannels',
			description: 'Erschaffe temporäre Sprachkanäle für deine Mitglieder',
			permissions: {
				bot: [Flags.ManageChannels],
				user: [Flags.ManageGuild]
			},
			dirname: import.meta.url,
			slash: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('enable')
						.setDescription('Aktiviere das Erstellen von temporären Sprachkanälen')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('disable')
						.setDescription('Deaktiviere das Erstellen von temporären Sprachkanälen')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('setup')
						.setDescription('Richte das Erstellen von temporären Sprachkanälen ein')
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Durch welchen Kanal die Mitglieder ihre temporären Sprachkanäle erstellen können')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
						)
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('name')
							.setDescription('Bestimme den Namen der temporären Sprachkanäle (Platzhalter: ?user und ?count)')
							.setRequired(true)
							.setMaxLength(100)
						)
						.addIntegerOption((integerOption: SlashCommandIntegerOption) => integerOption
							.setName('limit')
							.setDescription('Setze die maximale Anzahl an Nutzern in einem temporären Sprachkanal')
							.setMinValue(1)
							.setMaxValue(99)
						)
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kategorie')
							.setDescription('Wähle die Kategorie, in welcher die temporären Sprachkanäle erstellt werden')
							.addChannelTypes(ChannelType.GuildCategory)
						)
					)

			},
		});
	}

	public async run(): Promise<void> {
		// Switch subcommands
		const subCommand: string = this.options.getSubcommand();

		switch(subCommand){
			case 'enable':
				await this.enable();
				break;
			case 'disable':
				await this.disable();
				break;
			case 'setup':
				await this.setup();
				break;
		}
	}

	private async enable(): Promise<void> {
		// Check if temp channels are already enabled
		if(this.data.guild.settings.tempChannels.enabled){
			const alreadyEnabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Temporäre Sprachkanäle **sind bereits aktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyEnabledEmbed] });
			return;
		}

		// Enable tempchannels
		try{
			this.data.guild.settings.tempChannels.enabled = true;
			this.data.guild.markModified('settings.tempChannels.enabled');
			await this.data.guild.save();

			const enabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Temporäre Sprachkanäle **wurden aktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [enabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async disable(): Promise<void> {
		// Check if temp channels are already disabled
		if(!this.data.guild.settings.tempChannels.enabled){
			const alreadyDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Temporäre Sprachkanäle **sind bereits deaktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyDisabledEmbed] });
			return;
		}

		// Disable tempchannels
		try{
			this.data.guild.settings.tempChannels.enabled = false;
			this.data.guild.markModified('settings.tempChannels.enabled');
			await this.data.guild.save();

			const disabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Temporäre Sprachkanäle **wurden deaktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [disabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async setup(): Promise<void> {
		// Get options
		const channel = this.options.getChannel('kanal');
		const name: string = this.options.getString('name');
		const limit: number = this.options.getInteger('limit');
		const category = this.options.getChannel('kategorie');

		// Setup tempchannels
		try{
			this.data.guild.settings.tempChannels.channelId = channel.id;
			this.data.guild.settings.tempChannels.defaultName = name;
			this.data.guild.settings.tempChannels.userLimit = limit || null;
			this.data.guild.settings.tempChannels.categoryId = category?.id || null;
			this.data.guild.markModified('settings.tempChannels');
			await this.data.guild.save();

			const setupEmbed: EmbedBuilder = this.clientUtils.createEmbed('Temporäre Sprachkanäle **wurden eingerichtet**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [setupEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { TempchannelsCommand };