import { BaseCommand } from '@core/BaseCommand.js';
import { BaseClient } from '@core/BaseClient.js';
import config from 'config';

import {
	SlashCommandBuilder, SlashCommandSubcommandBuilder, EmbedBuilder,
	SlashCommandChannelOption, ChannelType, SlashCommandStringOption,
	SlashCommandBooleanOption, ColorResolvable, PermissionsBitField,
	CommandInteraction, CommandInteractionOptionResolver, ApplicationIntegrationType,
	InteractionContextType,
} from 'discord.js';

const { Flags } = PermissionsBitField;

class GoodbyeCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'goodbye',
			description: 'Automatisches Verabschieden von Mitgliedern welche den Server verlassen',
			dirname: import.meta.url,

			permissions: {
				bot: [

				],
				user: [
					Flags.ManageGuild
				]
			},

			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					// Set application integration type
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					// Add subcommand: enable
					.addSubcommand((enableSubCommand: SlashCommandSubcommandBuilder) => enableSubCommand
						.setName('aktivieren')
						.setDescription('Aktiviert die Verabschiedungsnachricht')
					)
					// Add subcommand: disable
					.addSubcommand((disableSubCommand: SlashCommandSubcommandBuilder) => disableSubCommand
						.setName('deaktivieren')
						.setDescription('Deaktiviert die Verabschiedungsnachricht')
					)
					// Add subcommand: test
					.addSubcommand((testSubCommand: SlashCommandSubcommandBuilder) => testSubCommand
						.setName('test')
						.setDescription('Testet die Verabschiedungsnachricht')
					)
					// Add subcommand: channel
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('kanal')
						.setDescription('Setzt den Kanal für die Verabschiedungsnachricht')
						// Add channel option
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle deinen gewünschten Kanal')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText, ChannelType.PublicThread)
						)
					)
					// Add subcommand: color
					.addSubcommand((colorSubCommand: SlashCommandSubcommandBuilder) => colorSubCommand
						.setName('farbe')
						.setDescription('Setzt die Farbe des Verabschiedungs-Embeds in Hex- oder RGB')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('farbe')
							.setDescription('Gib deine gewünschte Farbe an')
							.setRequired(true)
						)
					)
					// Add subcommand: variables
					.addSubcommand((variablesSubCommand: SlashCommandSubcommandBuilder) => variablesSubCommand
						.setName('variablen')
						.setDescription('Zeigt alle verfügbaren Variablen für die Verabschiedungsnachricht')
					)
					// Add subcommand: message
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('nachricht')
						.setDescription('Legt die Verabschiedungsnachricht fest')
						// Add message option
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('nachricht')
							.setDescription('Gib deine gewünschte Nachricht an')
							.setRequired(true)
						)
					)
					// Add subcommand: avatar
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('avatar')
						.setDescription('Aktiviert oder deaktiviert das Avatar im Verabschiedungs-Embed')
						.addBooleanOption((booleanOption: SlashCommandBooleanOption) => booleanOption
							.setName('avatar')
							.setDescription('Wähle deine gewünschte Option')
							.setRequired(true)
						)
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

		switch(selectedSubCommand) {
			case 'aktivieren':
				await this.enable();
				break;
			case 'deaktivieren':
				await this.disable();
				break;
			case 'test':
				await this.test();
				break;
			case 'kanal':
				await this.channel();
				break;
			case 'farbe':
				await this.color();
				break;
			case 'variablen':
				await this.variables();
				break;
			case 'nachricht':
				await this.message();
				break;
			case 'avatar':
				await this.avatar();
				break;
		}
	}

	/**
	 * Enable farewell
	 * @private
	 */
	private async enable(): Promise<void> {
		try{
			// Farewell is already enabled
			if(this.data.guild.settings.farewell.enabled){
				const alreadyEnabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht ist **bereits aktiviert**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [alreadyEnabledEmbed] });
				return;
			}

			// Enable farewell
			this.data.guild.settings.farewell.enabled = true;
			this.data.guild.markModified('settings.farewell.enabled');
			await this.data.guild.save();

			// Send confirmation embed
			const enabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht **wurde aktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [enabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Disable farewell
	 * @private
	 */
	private async disable(): Promise<void> {
		try{
			// Farewell is already disabled
			if(!this.data.guild.settings.farewell.enabled){
				const alreadyDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht ist **bereits deaktiviert**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [alreadyDisabledEmbed] });
				return;
			}

			// Disable farewell
			this.data.guild.settings.farewell.enabled = false;
			this.data.guild.markModified('settings.farewell.enabled');
			await this.data.guild.save();

			// Send confirmation embed
			const enabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht **wurde deaktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [enabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Test farewell
	 * @private
	 */
	private async test(): Promise<void> {
		try{
			// Check if farewell is enabled
			if(!this.data.guild.settings.farewell.enabled){
				const enableCommandMention: string = await this.commandUtils.commandMention('goodbye', 'enable');
				const disabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst die Verabschiedungsnachricht **mit {0} aktivieren**, bevor du sie testen kannst.', this.emote('error'), 'error', enableCommandMention);
				await this.interaction.followUp({ embeds: [disabledEmbed] });
				return;
			}

			// Check if farewell channel is set
			if(!this.data.guild.settings.farewell.channelId || !this.guild.channels.cache.has(this.data.guild.settings.farewell.channelId)){
				const setChannelCommandMention: string = await this.commandUtils.commandMention('goodbye', 'channel');
				const channelEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst einen Kanal für die Verabschiedungsnachricht **mit {0} festlegen**, bevor du sie testen kannst.', this.emote('error'), 'error', setChannelCommandMention);
				await this.interaction.followUp({ embeds: [channelEmbed] });
				return;
			}

			// Check if farewell message is set
			if(!this.data.guild.settings.farewell.message){
				const setMessageCommandMention: string = await this.commandUtils.commandMention('goodbye', 'message');
				const messageEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst die Verabschiedungsnachricht **mit {0} festlegen**, bevor du sie testen kannst.', this.emote('error'), 'error', setMessageCommandMention);
				await this.interaction.followUp({ embeds: [messageEmbed] });
				return;
			}

			// Check if farewell color is set
			if(!this.data.guild.settings.farewell.color){
				const setColorCommandMention: string = await this.commandUtils.commandMention('goodbye', 'color');
				const colorEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst die Farbe der Verabschiedungsnachricht **mit {0}** festlegen, bevor du sie testen kannst.', this.emote('error'), 'error', setColorCommandMention);
				await this.interaction.followUp({ embeds: [colorEmbed] });
				return;
			}

			const { member, guild } = this;
			function parseFarewellMessage(message: string): string {
				return message
					.replaceAll('?user.displayName', member.displayName)
					.replaceAll('?user.name', member.user.username)
					.replaceAll('?user', member.toString())
					.replaceAll('?server.name', guild.name)
					.replaceAll('?server.memberCount', guild.memberCount.toString())
					.replaceAll('?newline', '\n');
			}

			// Get channel
			const channel: any = this.guild.channels.cache.get(this.data.guild.settings.farewell.channelId);

			// Check if bot can send messages in channel
			if(!this.guild.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)){
				const missingPermissionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Mir **fehlt die Berechtigung**, Nachrichten in {0} zu senden.', this.emote('error'), 'error', channel.toString());
				await this.interaction.followUp({ embeds: [missingPermissionsEmbed] });
				return;
			}

			// Test farewell message
			const parsedFarewellMessage: string = parseFarewellMessage(this.data.guild.settings.farewell.message);

			const farewellEmbed: EmbedBuilder = new EmbedBuilder()
				.setDescription(parsedFarewellMessage)
				.setColor(this.data.guild.settings.farewell.color as ColorResolvable)
				.setFooter({ text: config.get('embeds.footer_text') });

			if(this.data.guild.settings.farewell.avatar){
				farewellEmbed.setThumbnail(this.member.displayAvatarURL());
			}

			await channel.send({ embeds: [farewellEmbed], content: 'Test-Nachricht gesendet durch ' + this.member.toString() });

			// Send confirmation embed
			const testEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Test-Verabschiedungsnachricht** wurde in {0} gesendet.', this.emote('success'), 'success', channel.toString());
			await this.interaction.followUp({ embeds: [testEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Set farewell channel
	 * @private
	 */
	private async channel(): Promise<void> {
		try{
			// Get channel
			const channel = this.options.getChannel('kanal');

			// Check if farewell channel is already the same
			if(this.data.guild.settings.farewell.channelId === channel.id){
				const alreadySetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht **wird bereits in {0} gesendet**.', this.emote('error'), 'error', channel.toString());
				await this.interaction.followUp({ embeds: [alreadySetEmbed] });
				return;
			}

			// Set farewell channel
			this.data.guild.settings.farewell.channelId = channel.id;
			this.data.guild.markModified('settings.farewell.channelId');
			await this.data.guild.save();

			// Send confirmation embed
			const channelSetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht **wird ab sofort in {0} gesendet**.', this.emote('success'), 'success', channel.toString());
			await this.interaction.followUp({ embeds: [channelSetEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Set farewell color
	 * @private
	 */
	private async color(): Promise<void> {
		try{
			// Get color
			const color: string = this.options.getString('farbe');

			// Check if color is valid hex or rgb
			if(!this.validationUtils.stringIsHexColor(color) && !this.validationUtils.stringIsRgbColor(color)){
				const invalidColorEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die eingegebene Farbe entspricht **weder dem Hex- noch dem RGB-Format**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [invalidColorEmbed] });
				return;
			}

			// Turn rgb color into hex
			let hexColor: string = color;
			if(this.validationUtils.stringIsRgbColor(color)){
				const normalizedColor: number[] = (color).split(',').map((color: string): number => parseInt(color));
				hexColor = this.formatUtils.rgbToHex(normalizedColor[0], normalizedColor[1], normalizedColor[2]);
			}

			// Set color
			this.data.guild.settings.farewell.color = hexColor;
			this.data.guild.markModified('settings.farewell.color');
			await this.data.guild.save();

			// Send confirmation embed
			const colorSetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Farbe des Embeds wurde **auf {0} gesetzt**.', this.emote('success'), 'success', hexColor);
			await this.interaction.followUp({ embeds: [colorSetEmbed] });

		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Show variables
	 * @private
	 */
	private async variables(): Promise<void> {
		try{
			const variables: string[][] = [
				['?user', 'Platzhalter für die Erwähnung des Mitglieds'],
				['?user.name', 'Platzhalter für den Nutzernamen des Mitglieds'],
				['?user.displayName', 'Platzhalter für den Anzeigenamen des Mitglieds'],
				['?server.name', 'Platzhalter für den Servernamen'],
				['?server.memberCount', 'Platzhalter für die Anzahl der Mitglieder auf dem Server'],
				['?newline', 'Platzhalter für einen Zeilenumbruch'],
			];

			const formattedVariables: string[] = [];

			for(const variable of variables){
				formattedVariables.push(this.emote('label') + ' **' + variable[0] + '**\n' + this.emote('text') + ' ' + variable[1] + '\n');
			}

			await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, formattedVariables, this.emote('list') + ' Variablen für die Verabschiedungsnachricht', 'Es wurden noch keine Variablen festgelegt.');

		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Set farewell message
	 * @private
	 */
	private async message(): Promise<void> {
		try{
			// Get message
			const message: string = this.options.getString('nachricht');

			// Check if message is too long
			if(message.length > 4096){
				const tooLongEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht darf **maximal 4096 Zeichen lang sein**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [tooLongEmbed] });
				return;
			}

			// Set message
			this.data.guild.settings.farewell.message = message;
			this.data.guild.markModified('settings.farewell.message');
			await this.data.guild.save();

			const messageSetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Verabschiedungsnachricht **wurde gespeichert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [messageSetEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Set farewell avatar
	 * @private
	 */
	private async avatar(): Promise<void> {
		try{
			// Get boolean
			const showAvatar: boolean = this.options.getBoolean('avatar');

			// Check if avatar is already set to the same
			if(this.data.guild.settings.farewell.avatar === showAvatar){
				const showAvatarText: string = showAvatar ? 'Das Avatar im Embed **ist bereits aktiviert**.' : 'Das Avatar im Embed **ist bereits deaktiviert**.';
				const alreadySetEmbed: EmbedBuilder = this.clientUtils.createEmbed(showAvatarText, this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [alreadySetEmbed] });
				return;
			}

			// Set avatar
			this.data.guild.settings.farewell.avatar = showAvatar;
			this.data.guild.markModified('settings.farewell.avatar');
			await this.data.guild.save();

			// Send confirmation embed
			const showAvatarText: string = showAvatar ? 'Das Avatar im Embed **wurde aktiviert**.' : 'Das Avatar im Embed **wurde deaktiviert**.';
			const avatarSetEmbed: EmbedBuilder = this.clientUtils.createEmbed(showAvatarText, this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [avatarSetEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { GoodbyeCommand };