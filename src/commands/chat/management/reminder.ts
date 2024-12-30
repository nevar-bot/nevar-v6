import { BaseCommand } from '@core/BaseCommand.js';
import { CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import ems from 'enhanced-ms';
const ms = ems('de');

class ReminderCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'reminder',
			description: 'Erinnert dich automatisch in einer bestimmten Zeit',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('hinzufügen')
						.setDescription('Erstelle eine Erinnerung')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('name')
							.setDescription('Gib den Namen der Erinnerung an')
							.setRequired(true)
						)
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('dauer')
							.setDescription('Wann soll ich dich erinnern? (z.B. 1h, 1w, 1w, 1h 30m)')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('löschen')
						.setDescription('Lösche eine Erinnerung')
						.addStringOption((stringOption: SlashCommandStringOption) => stringOption
							.setName('name')
							.setDescription('Gib den Namen der Erinnerung an')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('liste')
						.setDescription('Liste alle Erinnerungen auf')
					)
			},
		});
	}

	public async run(): Promise<void> {
		const subCommand: string = this.options.getSubcommand();

		switch(subCommand){
			case 'hinzufügen':
				await this.add();
				break;
			case 'löschen':
				await this.remove();
				break;
			case 'liste':
				await this.list();
				break;
		}
	}

	private async add(): Promise<void> {
		const name: string = this.options.getString('name');
		const duration: string = this.options.getString('dauer');

		// Check if duration is valid
		if(!ms(duration)){
			const invalidDurationEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine gültige Dauer angeben, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidDurationEmbed] });
			return;
		}

		// Check if user already has a reminder with the same name
		if(this.data.member.reminders.find((reminder): boolean => reminder.reason === name)){
			const reminderAlreadyExistsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du hast bereits eine Erinnerung mit dem Namen **{0}**.', this.emote('error'), 'error', name);
			await this.interaction.followUp({ embeds: [reminderAlreadyExistsEmbed] });
			return;
		}

		// Save reminder to database
		this.data.member.reminders.push({
			start: Date.now(),
			end: Date.now() + ms(duration),
			reason: name,
			channel: this.interaction.channel.id
		});
		this.data.member.markModified('reminders');
		await this.data.member.save();

		// Add reminder to cache
		this.client.databaseCache.reminders.set(this.user.id + this.guild.id, this.data.member);

		// Send success message
		const remindInTimestamp: string = this.formatUtils.discordTimestamp(Date.now() + ms(duration), 'R');
		const reminderAddedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich werde dich **in {0} erinnern**.', this.emote('success'), 'normal', remindInTimestamp);
		await this.interaction.followUp({ embeds: [reminderAddedEmbed] });
	}

	private async remove(): Promise<void> {
		const name: string = this.options.getString('name');

		// Check if user has a reminder with the given name
		const reminderIndex: number = this.data.member.reminders.findIndex((reminder): boolean => reminder.reason === name);
		if(reminderIndex === -1){
			const reminderNotFoundEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich konnte keine Erinnerung mit dem Namen **{0}** finden.', this.emote('error'), 'error', name);
			await this.interaction.followUp({ embeds: [reminderNotFoundEmbed] });
			return;
		}

		// Remove reminder from database
		this.data.member.reminders.splice(reminderIndex, 1);
		this.data.member.markModified('reminders');
		await this.data.member.save();

		// Send success message
		const reminderRemovedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich habe die Erinnerung **{0}** entfernt.', this.emote('success'), 'normal', name);
		await this.interaction.followUp({ embeds: [reminderRemovedEmbed] });
	}

	private async list(): Promise<void> {
		const reminders: string[] = [];

		for(const reminder of this.data.member.reminders) {
			const reminderText: string =
				'### ' + this.emote('reminder') + ' ' + reminder.reason + '\n' +
				'-# ' + this.emote('calendar') + ' Erstellt vor: **' + this.formatUtils.discordTimestamp(reminder.start, 'R') + '**\n' +
				'-# ' + this.emote('calendar') + ' Endet in: **' + this.formatUtils.discordTimestamp(reminder.end, 'R') + '**';
			
			reminders.push(reminderText);
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 5, reminders, this.emote('list') + ' Deine Erinnerungen', 'Du hast noch keine Erinnerungen erstellt.');
	}
}

export { ReminderCommand };