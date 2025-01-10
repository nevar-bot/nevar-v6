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

class WelcomeCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'welcome',
			description: 'Begrüße neue Mitglieder auf deinem Server',
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
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('aktivieren')
						.setDescription('Aktiviere die Willkommensnachricht')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('deaktivieren')
						.setDescription('Deaktiviere die Willkommensnachricht')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('test')
						.setDescription('Teste die Willkommensnachricht')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('kanal')
						.setDescription('Lege den Kanal fest, in welchem die Willkommensnachricht gesendet wird')
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle den Kanal')
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText, ChannelType.PublicThread)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('farbe')
						.setDescription('Lege die Farbe des Embeds im Hex- oder RGB-Format fest')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('farbe')
							.setDescription('Gib die Farbe im Hex- oder RGB-Format ein')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('variablen')
						.setDescription('Zeige alle verfügbaren Variablen für die Willkommensnachricht an')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('nachricht')
						.setDescription('Lege die Willkommensnachricht fest')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('nachricht')
							.setDescription('Lege die Willkommensnachricht fest')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('avatar')
						.setDescription('Entscheide, ob das Avatar des Nutzers im Embed angezeigt wird')
						.addBooleanOption((booleanOption: SlashCommandBooleanOption) => booleanOption
							.setName('avatar')
							.setDescription('Wähle einen Status')
							.setRequired(true)
						)
					)
			},
		});
	}

	public async run(): Promise<void> {
		// Switch subcommands
		const subCommand: string = this.options.getSubcommand();

		switch(subCommand) {
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

	private async enable(): Promise<void> {
		// Welcome is already enabled
		if(this.data.guild.settings.welcome.enabled){
			const alreadyEnabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Willkommensnachricht** ist **bereits aktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyEnabledEmbed] });
			return;
		}

		// Enable welcome
		try {
			this.data.guild.settings.welcome.enabled = true;
			this.data.guild.markModified('settings.welcome.enabled');
			await this.data.guild.save();

			const enabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Willkommensnachricht** wurde **aktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [enabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async disable(): Promise<void> {
		// Welcome is already disabled
		if(!this.data.guild.settings.welcome.enabled){
			const alreadyDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Willkommensnachricht** ist **bereits deaktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyDisabledEmbed] });
			return;
		}

		// Disable welcome
		try {
			this.data.guild.settings.welcome.enabled = false;
			this.data.guild.markModified('settings.welcome.enabled');
			await this.data.guild.save();

			const enabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Willkommensnachricht** wurde **deaktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [enabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async test(): Promise<void> {
		// Check if welcome is enabled
		if(!this.data.guild.settings.welcome.enabled){
			const enableCommandMention: string = await this.commandUtils.commandMention('welcome', 'enable');
			const disabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst die **Willkommensnachricht mit {0} aktivieren**, bevor du sie testen kannst.', this.emote('error'), 'error', enableCommandMention);
			await this.interaction.followUp({ embeds: [disabledEmbed] });
			return;
		}

		// Check if welcome channel is set
		if(!this.data.guild.settings.welcome.channelId || !this.guild.channels.cache.has(this.data.guild.settings.welcome.channelId)){
			const setChannelCommandMention: string = await this.commandUtils.commandMention('welcome', 'channel');
			const channelEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst mit {0} einen **Kanal für die Willkommensnachricht festlegen**, bevor du sie testen kannst.', this.emote('error'), 'error', setChannelCommandMention);
			await this.interaction.followUp({ embeds: [channelEmbed] });
			return;
		}

		// Check if welcome message is set
		if(!this.data.guild.settings.welcome.message){
			const setMessageCommandMention: string = await this.commandUtils.commandMention('welcome', 'message');
			const messageEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst mit {0} **die Willkommensnachricht festlegen**, bevor du sie testen kannst.', this.emote('error'), 'error', setMessageCommandMention);
			await this.interaction.followUp({ embeds: [messageEmbed] });
			return;
		}

		// Check if welcome color is set
		if(!this.data.guild.settings.welcome.color){
			const setColorCommandMention: string = await this.commandUtils.commandMention('welcome', 'color');
			const colorEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst mit {0} **die Farbe der Willkommensnachricht festlegen**, bevor du sie testen kannst.', this.emote('error'), 'error', setColorCommandMention);
			await this.interaction.followUp({ embeds: [colorEmbed] });
			return;
		}

		try {
			const { member, guild } = this;
			function parseWelcomeMessage(message: string): string {
				return message
					.replaceAll('?user.displayName', member.displayName)
					.replaceAll('?user.name', member.user.username)
					.replaceAll('?user', member.toString())
					.replaceAll('?server.name', guild.name)
					.replaceAll('?server.memberCount', guild.memberCount.toString())
					.replaceAll('?newline', '\n');
			}

			// Get channel
			const channel: any = this.guild.channels.cache.get(this.data.guild.settings.welcome.channelId);

			// Check if bot can send messages in channel
			if(!this.guild.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)){
				const missingPermissionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich habe nicht die **Berechtigung, Nachrichten in {0} zu senden**.', this.emote('error'), 'error', channel.toString());
				await this.interaction.followUp({ embeds: [missingPermissionsEmbed] });
				return;
			}

			const parsedWelcomeMessage: string = parseWelcomeMessage(this.data.guild.settings.welcome.message);

			const welcomeEmbed: EmbedBuilder = new EmbedBuilder()
				.setDescription(parsedWelcomeMessage)
				.setColor(this.data.guild.settings.welcome.color as ColorResolvable)
				.setFooter({ text: config.get('embeds.footer_text') });

			if(this.data.guild.settings.welcome.avatar){
				welcomeEmbed.setThumbnail(this.member.displayAvatarURL());
			}

			await channel.send({ embeds: [welcomeEmbed], content: 'Test-Nachricht gesendet durch ' + this.member.toString() });

			const testEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Test-Willkommensnachricht** wurde in {0} gesendet.', this.emote('success'), 'success', channel.toString());
			await this.interaction.followUp({ embeds: [testEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async channel(): Promise<void> {
		// Get channel
		const channel = this.options.getChannel('kanal');

		// Check if welcome channel is already the same
		if(this.data.guild.settings.welcome.channelId === channel.id){
			const alreadySetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Willkommensnachricht **wird bereits in {0} gesendet**.', this.emote('error'), 'error', channel.toString());
			await this.interaction.followUp({ embeds: [alreadySetEmbed] });
			return;
		}

		// Set welcome channel
		try{
			this.data.guild.settings.welcome.channelId = channel.id;
			this.data.guild.markModified('settings.welcome.channelId');
			await this.data.guild.save();

			const channelSetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Willkommensnachricht **wird ab sofort in {0} gesendet**.', this.emote('success'), 'success', channel.toString());
			await this.interaction.followUp({ embeds: [channelSetEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async color(): Promise<void> {
		// Get color
		const color: string = this.options.getString('farbe');

		// Check if color is valid hex or rgb
		if(!this.validationUtils.stringIsHexColor(color as string) && !this.validationUtils.stringIsRgbColor(color as string)){
			const invalidColorEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die eingegebene Farbe entspricht **weder dem Hex- noch dem RGB-Format**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidColorEmbed] });
			return;
		}

		// Turn rgb color into hex
		let hexColor: string = color as string;
		if(this.validationUtils.stringIsRgbColor(color as string)){
			const normalizedColor: number[] = (color as string).split(',').map((color: string): number => parseInt(color));
			hexColor = this.formatUtils.rgbToHex(normalizedColor[0], normalizedColor[1], normalizedColor[2]);
		}

		// Set color
		try{
			this.data.guild.settings.welcome.color = hexColor;
			this.data.guild.markModified('settings.welcome.color');
			await this.data.guild.save();

			const colorSetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Farbe des Embeds wurde **auf {0} gesetzt**.', this.emote('success'), 'success', hexColor);
			await this.interaction.followUp({ embeds: [colorSetEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async variables(): Promise<void> {
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

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, formattedVariables, this.emote('list') + ' Variablen für die Willkommensnachricht', 'Es wurden noch keine Variablen festgelegt.');
	}

	private async message(): Promise<void> {
		// Get message
		const message: string = this.options.getString('nachricht');

		// Check if message is too long
		if(message.length > 4096){
			const tooLongEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Willkommensnachricht darf **maximal 4096 Zeichen lang sein**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [tooLongEmbed] });
			return;
		}

		// Set message
		try{
			this.data.guild.settings.welcome.message = message;
			this.data.guild.markModified('settings.welcome.message');
			await this.data.guild.save();

			const messageSetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Willkommensnachricht **wurde gespeichert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [messageSetEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async avatar(): Promise<void> {
		// Get boolean
		const showAvatar: boolean = this.options.getBoolean('avatar');

		// Check if avatar is already set to the same
		if(this.data.guild.settings.welcome.avatar === showAvatar){
			const showAvatarText: string = showAvatar ? 'Das Avatar im Embed **ist bereits aktiviert**.' : 'Das Avatar im Embed **ist bereits deaktiviert**.';
			const alreadySetEmbed: EmbedBuilder = this.clientUtils.createEmbed(showAvatarText, this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadySetEmbed] });
			return;
		}

		// Set avatar
		try{
			this.data.guild.settings.welcome.avatar = showAvatar;
			this.data.guild.markModified('settings.welcome.avatar');
			await this.data.guild.save();

			const showAvatarText: string = showAvatar ? 'Das Avatar im Embed **wurde aktiviert**.' : 'Das Avatar im Embed **wurde deaktiviert**.';
			const avatarSetEmbed: EmbedBuilder = this.clientUtils.createEmbed(showAvatarText, this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [avatarSetEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { WelcomeCommand };