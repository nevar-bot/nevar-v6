import { BaseCommand } from '@core/BaseCommand.js';
import { BaseClient } from '@core/BaseClient.js';

import {
	ChannelType, CommandInteraction, CommandInteractionOptionResolver,
	EmbedBuilder, SlashCommandBuilder, SlashCommandChannelOption,
	SlashCommandStringOption, SlashCommandSubcommandBuilder, PermissionsBitField,
	ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';

const { Flags } = PermissionsBitField;

class LoggingCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'logging',
			description: 'Protokolliere Ereignisse auf deinem Server',
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
				data:
					new SlashCommandBuilder()
						// Set application integration type
						.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
						.setContexts(InteractionContextType.Guild)

						// Add subcommand: set
						.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
							.setName('set')
							.setDescription('Lege die Kanäle fest, in denen Ereignisse protokolliert werden sollen')
							.addStringOption((stringOption: SlashCommandStringOption) => stringOption
								.setName('ereignis')
								.setDescription('Wähle das Ereignis, das protokolliert werden soll')
								.setRequired(true)
								.addChoices([
									{
										name: 'Moderation',
										value: 'moderation',
									},
									{
										name: 'Mitglieder',
										value: 'member',
									},
									{
										name: 'Server',
										value: 'guild',
									},
									{
										name: 'Rollen',
										value: 'role',
									},
									{
										name: 'Kanäle',
										value: 'channel',
									},
									{
										name: 'System',
										value: 'system'
									}
								])
							)
							.addChannelOption((channelOption: SlashCommandChannelOption) => channelOption
								.setName('kanal')
								.setDescription('Wähle den Kanal, in dem das Ereignis protokolliert werden soll')
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText, ChannelType.PublicThread)
							)
						)
						.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
							.setName('disable')
							.setDescription('Deaktiviere das Protokollieren von bestimmten Ereignissen')
							.addStringOption((stringOption: SlashCommandStringOption) => stringOption
								.setName('ereignis')
								.setDescription('Wähle das Ereignis, das nicht mehr protokolliert werden soll')
								.setRequired(true)
								.addChoices([
									{
										name: 'Moderation',
										value: 'moderation',
									},
									{
										name: 'Mitglieder',
										value: 'member',
									},
									{
										name: 'Server',
										value: 'guild',
									},
									{
										name: 'Rollen',
										value: 'role',
									},
									{
										name: 'Kanal',
										value: 'channel',
									},
									{
										name: 'System',
										value: 'system'
									}
								])
							)
						)
						.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
							.setName('view')
							.setDescription('Zeige alle Kanäle an, in denen Ereignisse protokolliert werden')
						)
						.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
							.setName('explain')
							.setDescription('Erhalte eine Erklärung zu den verschiedenen Protokollierungs-Ereignissen')
						)
			},
		});
	}

	private eventNames: {} = {
		'moderation': 'Moderation',
		'member': 'Mitglieder',
		'guild': 'Server',
		'role': 'Rollen',
		'channel': 'Kanal',
		'system': 'System'
	}

	public async run(): Promise<void> {
		// Switch subcommands
		const subCommand: string = this.options.getSubcommand();
		switch (subCommand) {
			case 'set':
				await this.set();
				break;
			case 'disable':
				await this.disable();
				break;
			case 'view':
				await this.view();
				break;
			case 'explain':
				await this.explain();
				break;
		}
	}

	private async set(): Promise<void> {
		// Get event and channel
		const event: string = this.options.getString('ereignis');
		const channel = this.options.getChannel('kanal');

		try{
			this.data.guild.settings.logging[event] = channel.id;
			this.data.guild.markModified('settings.logging');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed(this.eventNames[event] + '-Ereignisse werden **ab sofort in ' + channel.toString() + ' protokolliert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async disable(): Promise<void> {
		// Get event
		const event: string = this.options.getString('ereignis');

		try{
			if(!this.data.guild.settings.logging[event]){
				const doesNotExistEmbed: EmbedBuilder = this.clientUtils.createEmbed(this.eventNames[event] + '-Ereignisse werden aktuell **nicht protokolliert**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [doesNotExistEmbed] });
				return;
			}

			this.data.guild.settings.logging[event] = null;
			this.data.guild.markModified('settings.logging');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed(this.eventNames[event] + '-Ereignisse werden **ab sofort nicht weiter protokolliert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async view(): Promise<void> {
		let loggingText: string = '### ' + this.emote('flag') + ' In diesen Kanälen werden Ereignisse protokolliert:';

		try{
			const loggingEvents: {} = this.data.guild.settings.logging;

			for(const event in loggingEvents){
				const channel = this.guild.channels.cache.get(loggingEvents[event]);
				if(channel){
					loggingText += '\n** ' + this.emote('channel') + ' ' + this.eventNames[event] + '**: ' + channel.toString();
				}
			}

			const loggingEmbed: EmbedBuilder = this.clientUtils.createEmbed(loggingText, null, 'normal');
			await this.interaction.followUp({ embeds: [loggingEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async explain(): Promise<void> {
		const explanationTexts: {} = {
			'moderation': 'In dieser Kategorie werden **alle Moderations-Ereignisse protokolliert**. Dazu gehören beispielsweise das Löschen von Nachrichten, das Timeouten, Kicken oder Bannen von Mitgliedern und das Erteilen von Verwarnungen.',
			'member': 'In dieser Kategorie werden **alle Mitglieder-Ereignisse protokolliert**. Dazu gehören beispielsweise das Betreten oder Verlassen des Servers, das Ändern des Nicknames, die Zuweisung und Entfernung von Rollen sowie das Erreichen eines neuen Levels.',
			'guild': 'In dieser Kategorie werden **alle Server-Ereignisse protokolliert**. Dazu gehören beispielsweise das Ändern des Servernamens, des Server-Icons oder des Server-Banners sowie das Erreichen von neuen Boost-Stufen.',
			'role': 'In dieser Kategorie werden **alle Rollen-Ereignisse protokolliert**. Dazu gehören beispielsweise das Erstellen, Löschen oder Umbenennen von Rollen sowie das Hinzufügen oder Entfernen von Berechtigungen.',
			'channel': 'In dieser Kategorie werden **alle Kanal-Ereignisse protokolliert, darunter normale Kanäle und Threads**. Dazu gehören beispielsweise das Erstellen, Löschen oder Umbenennen von Kanälen, das Ändern der Kanal-Einstellungen und das Archivieren sowie Reaktivieren von Threads.',
			'system': 'In dieser Kategorie werden **alle System-Nachrichten protokolliert**. Dazu gehören aufgetretene Fehler, Warnungen und Informationen über den Bot.'
		}

		const explanations: string[] = [];
		for(const event in explanationTexts){
			const explanationText: string = '### ' + this.emote('info') + ' ' + this.eventNames[event] + '\n' + this.emote('arrow_right') + ' ' + explanationTexts[event];
			explanations.push(explanationText);
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, explanations, this.emote('flag') + ' Erklärung der Protokollierungs-Ereignisse', 'Es sind keine Protokollierungs-Ereignisse vorhanden.');
	}
}

export { LoggingCommand };