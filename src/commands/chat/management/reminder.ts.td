import { NevarCommand } from "@core/NevarCommand.js";
import { NevarClient } from "@core/NevarClient";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import ems from "enhanced-ms";
const ms: any = ems("de");

export default class ReminderCommand extends NevarCommand {
	public constructor(client: NevarClient) {
		super(client, {
			name: "reminder",
			description: "Automatically remind yourself at a certain time",
			localizedDescriptions: {
				de: "Lasse dich automatisch in einer bestimmten Zeit erinnern",
			},
			cooldown: 2 * 1000,
			dirname: import.meta.url,
			slashCommand: {
				addCommand: true,
				data: new SlashCommandBuilder()
					.addStringOption((option: any) =>
						option
							.setName("action")
							.setNameLocalization("de", "aktion")
							.setDescription("Choose an action")
							.setDescriptionLocalization("de", "Wähle eine Aktion")
							.setRequired(true)
							.addChoices(
								{
									name: "add",
									name_localizations: { de: "erstellen" },
									value: "add",
								},
								{
									name: "delete",
									name_localizations: { de: "löschen" },
									value: "delete",
								},
								{
									name: "list",
									name_localizations: { de: "liste" },
									value: "list",
								},
							),
					)
					.addStringOption((option: any) =>
						option
							.setName("name")
							.setDescription("Enter the name of the reminder")
							.setDescriptionLocalization("de", "Gib den Namen der Erinnerung an")
							.setRequired(false)
							.setMaxLength(500),
					)
					.addStringOption((option: any) =>
						option
							.setName("duration")
							.setNameLocalization("de", "dauer")
							.setDescription("When should I remind you? (e.g. 1h, 1w, 1w, 1h 30m)")
							.setDescriptionLocalization("de", "Wann soll ich dich erinnern? (z.B. 1h, 1w, 1w, 1h 30m)")
							.setRequired(false),
					),
			},
		});
	}

	public async dispatch(interaction: any, data: any): Promise<void> {
		this.interaction = interaction;
		this.guild = interaction.guild;
		this.data = data;

		const action: string = interaction.options.getString("action");
		switch (action) {
			case "add":
				await this.addReminder(
					interaction.options.getString("name"),
					interaction.options.getString("duration")
				);
				break;
			case "delete":
				await this.deleteReminder(interaction.options.getString("name"));
				break;
			case "list":
				await this.listReminders();
				break;
		}
	}

	private async addReminder(name: string, duration: string): Promise<any> {
		if (!name || !duration || !ms(duration)) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:nameOrDurationIsMissing"),
				"error",
				"error",
			);
			return this.interaction.followUp({ embeds: [invalidOptionsEmbed] });
		}

		const reminder: any = {
			startDate: Date.now(),
			endDate: Date.now() + ms(duration),
			reason: name,
			channel: this.interaction.channel!.id,
		};

		this.data.member.reminders.push(reminder);
		this.data.member.markModified("reminders");
		await this.data.member.save();
		this.client.databaseCache.reminders.set(
			this.interaction.member!.user.id + this.interaction.guild!.id,
			this.data.member,
		);

		const successEmbed: EmbedBuilder = this.client.createEmbed(
			this.translate("reminderCreated", { duration: this.client.utils.getDiscordTimestamp(Date.now() + ms(duration), "R") }),
			"success",
			"success",
		);
		return this.interaction.followUp({ embeds: [successEmbed] });
	}

	private async deleteReminder(name: string): Promise<any> {
		if (!name) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:nameIsMissing"),
				"error",
				"error",
			);
			return this.interaction.followUp({ embeds: [invalidOptionsEmbed] });
		}
		const reminder: any = this.data.member.reminders.find((r: any): boolean => r.reason === name);
		if (!reminder) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:cantFindReminderWithThisName"),
				"error",
				"error",
			);
			return this.interaction.followUp({ embeds: [invalidOptionsEmbed] });
		}

		this.data.member.reminders.splice(this.data.member.reminders.indexOf(reminder), 1);
		this.data.member.markModified("reminders");
		await this.data.member.save();

		const successEmbed: EmbedBuilder = this.client.createEmbed(this.translate("reminderDeleted", { reminder: reminder.reason }), "success", "success");
		return this.interaction.followUp({ embeds: [successEmbed] });
	}

	private async listReminders(): Promise<any> {
		const reminders: any[] = [];
		for (const reminder of this.data.member.reminders) {
			const text: string =
				"### " +
				this.client.emotes.reminder +
				" " +
				reminder.reason +
				"\n" +
				this.client.emotes.arrow +
				" " +
				this.translate("list:reminderCreatedAt") +
				" " +
				this.client.utils.getDiscordTimestamp(reminder.startDate, "f") +
				"\n" +
				this.client.emotes.arrow +
				" " +
				this.translate("list:reminderEndsAt") +
				" " +
				this.client.utils.getDiscordTimestamp(reminder.endDate, "f") +
				"\n" +
				this.client.emotes.arrow +
				" " +
				this.translate("list:reminderEndsIn") +
				" " +
				this.client.utils.getDiscordTimestamp(reminder.endDate, "R");
			reminders.push(text);
		}

		await this.client.utils.sendPaginatedEmbed(
			this.interaction,
			5,
			reminders,
			this.translate("list:title"),
			this.translate("list:noRemindersCreated"),
		);
	}
}
