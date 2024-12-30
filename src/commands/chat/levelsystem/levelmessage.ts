import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	ChannelType, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType,
	PermissionsBitField, SlashCommandBuilder, SlashCommandChannelOption,
	SlashCommandStringOption, SlashCommandSubcommandBuilder,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class LevelmessageCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'levelmessage',
			description: 'Konfiguriere die Level-Up Nachrichten auf deinem Server',
			permissions: {
				bot: [],
				user: [Flags.ManageGuild]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('enable')
						.setDescription('Aktiviere die Level-Up Nachrichten')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('disable')
						.setDescription('Deaktiviere die Level-Up Nachrichten')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('channel')
						.setDescription('Lege den Kanal fest, in welchem die Level-Up Nachrichten gesendet werden')
						.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle den Kanal aus. Leer lassen, um den jeweils aktuellen Kanal zu verwenden')
							.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('message')
						.setDescription('Lege die Level-Up Nachricht fest')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('nachricht')
							.setDescription('Gib die Nachricht ein')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('test')
						.setDescription('Teste die Level-Up Nachricht')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('variables')
						.setDescription('Zeige alle verfügbaren Variablen')
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
			case 'channel':
				await this.channel();
				break;
			case 'message':
				await this.message();
				break;
			case 'test':
				await this.test();
				break;
			case 'variables':
				await this.variables();
				break;
		}
	}

	private async enable(): Promise<void> {
		// Check if level up messages are already enabled
		if(this.data.guild.settings.levelsystem.levelUpMessage.enabled){
			const alreadyEnabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Level-Up Nachricht** ist **bereits aktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyEnabledEmbed] });
			return;
		}

		// Enable level up messages
		try{
			this.data.guild.settings.levelsystem.levelUpMessage.enabled = true;
			this.data.guild.markModified('settings.levelsystem.levelUpMessage.enabled');
			await this.data.guild.save();

			const enabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Level-Up Nachricht** wurde **aktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [enabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async disable(): Promise<void> {
		// Check if level up messages are already disabled
		if(!this.data.guild.settings.levelsystem.levelUpMessage.enabled){
			const alreadyDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Level-Up Nachricht** ist **bereits deaktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyDisabledEmbed] });
			return;
		}

		// Disable level up messages
		try{
			this.data.guild.settings.levelsystem.levelUpMessage.enabled = false;
			this.data.guild.markModified('settings.levelsystem.levelUpMessage.enabled');
			await this.data.guild.save();

			const disabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Level-Up Nachricht** wurde **deaktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [disabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async channel(): Promise<void> {
		// Get channel
		const channel = this.options.getChannel('kanal');


		// Check if level up channel is already set to the selected channel
		if(channel){
			if(this.data.guild.settings.levelsystem.levelUpMessage.channelId === channel.id){
				const alreadySetEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Level-Up Nachricht** wird **bereits in {0} gesendet**.', this.emote('error'), 'error', channel.toString());
				await this.interaction.followUp({ embeds: [alreadySetEmbed] });
				return;
			}
		}

		// Set level up channel
		try{
			this.data.guild.settings.levelsystem.levelUpMessage.channelId = channel ? channel.id : null;
			this.data.guild.markModified('settings.levelsystem.levelUpMessage.channelId');
			await this.data.guild.save();

			const channelText: string = channel ? 'in ' + channel.toString() : 'im jeweils aktuellen Kanal';
			const setEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Level-Up Nachricht** wird ab sofort **{0}** gesendet.', this.emote('success'), 'success', channelText);
			await this.interaction.followUp({ embeds: [setEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async message(): Promise<void> {
		// Get message
		const message: string = this.options.getString('nachricht');

		// Check if level up message is too long
		if(message.length > 2000){
			const tooLongEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Level-Up Nachricht** darf **maximal 2000 Zeichen** lang sein.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [tooLongEmbed] });
			return;
		}

		// Set level up message
		try{
			this.data.guild.settings.levelsystem.levelUpMessage.message = message;
			this.data.guild.markModified('settings.levelsystem.levelUpMessage.message');
			await this.data.guild.save();

			const setEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Level-Up Nachricht **wurde gespeichert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [setEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async test(): Promise<void> {
		// Check if level up message is enabled
		if(!this.data.guild.settings.levelsystem.levelUpMessage.enabled){
			const enableCommandMention: string = await this.commandUtils.commandMention('levelmessage', 'enable');
			const disabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst die **Level-Up Nachricht mit {0} aktivieren**, bevor du sie testen kannst.', this.emote('error'), 'error', enableCommandMention);
			await this.interaction.followUp({ embeds: [disabledEmbed] });
			return;
		}

		// Check if level up message is set
		if(!this.data.guild.settings.levelsystem.levelUpMessage.message){
			const setMessageCommandMention: string = await this.commandUtils.commandMention('levelmessage', 'message');
			const messageEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst mit {0} **die Level-Up Nachricht festlegen**, bevor du sie testen kannst.', this.emote('error'), 'error', setMessageCommandMention);
			await this.interaction.followUp({ embeds: [messageEmbed] });
			return;
		}

		try {
			const { member, guild } = this;
			function parseLevelMessage(message: string): string {
				return message
					.replaceAll('?level', '25')
					.replaceAll('?user.displayName', member.displayName)
					.replaceAll('?user.name', member.user.username)
					.replaceAll('?user', member.toString())
					.replaceAll('?server.name', guild.name)
					.replaceAll('?server.memberCount', guild.memberCount.toString())
					.replaceAll('?newline', '\n');
			}

			// Get channel
			const channel: any = this.guild.channels.cache.get(this.data.guild.settings.levelsystem.levelUpMessage.channelId || this.interaction.channel.id);

			// Check if bot can send messages in channel
			if(!this.guild.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)){
				const missingPermissionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich habe nicht die **Berechtigung, Nachrichten in {0} zu senden**.', this.emote('error'), 'error', channel.toString());
				await this.interaction.followUp({ embeds: [missingPermissionsEmbed] });
				return;
			}

			const parsedLevelMessage: string = parseLevelMessage(this.data.guild.settings.levelsystem.levelUpMessage.message);

			await channel.send({ content: parsedLevelMessage });

			const testEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **Test-Level-Up Nachricht** wurde in {0} gesendet.', this.emote('success'), 'success', channel.toString());
			await this.interaction.followUp({ embeds: [testEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async variables(): Promise<void> {
		const variables: string[][] = [
			['?level', 'Platzhalter für das erreichte Level'],
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

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, formattedVariables, this.emote('list') + ' Variablen für die Level-Up Nachricht', 'Es wurden noch keine Variablen festgelegt.');
	}
}

export { LevelmessageCommand };