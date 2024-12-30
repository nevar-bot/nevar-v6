import { NevarCommand } from "@core/NevarCommand.js";
import { NevarClient } from "@core/NevarClient";
import {
	EmbedBuilder,
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ButtonBuilder,
} from "discord.js";

export default class ChangelogCommand extends NevarCommand {
	public constructor(client: NevarClient) {
		super(client, {
			name: "changelog",
			description: "Send a changelog as a clear message",
			localizedDescriptions: {
				de: "Sende einen Changelog als übersichtliche Nachricht"
			},
			ownerOnly: true,
			dirname: import.meta.url,
			slashCommand: {
				addCommand: false,
				data: null,
			},
		});
	}


	public async dispatch(message: any, args: any[], data: any): Promise<void> {
		this.message = message;
		this.guild = message.guild;
		this.data = data;
		await this.sendChangelog();
	}

	private async sendChangelog(): Promise<void> {
		const createButton: ButtonBuilder = this.client.createButton(
			"create",
			this.translate("createChangelogButtonLabel"),
			"Secondary",
			"text",
		);
		const createEmbed: EmbedBuilder = this.client.createEmbed(
			this.translate("createChangelogEmbedDescription"),
			"arrow",
			"normal",
		);
		const buttonRow: any = this.client.createMessageComponentsRow(createButton);

		const embedMessage: any = await this.message.reply({
			embeds: [createEmbed],
			components: [buttonRow],
		});

		const buttonCollector: any = embedMessage.createMessageComponentCollector({
			filter: (i: any): boolean => i.user.id === this.message.author.id,
		});
		buttonCollector.on("collect", async (interaction: any): Promise<void> => {
			// Create changelog modal
			const modal: ModalBuilder = new ModalBuilder().setCustomId("changelog").setTitle(this.translate("changelogModal:title"))

			const newInput: TextInputBuilder = new TextInputBuilder()
				.setCustomId("new")
				.setLabel(this.translate("changelogModal:newFeatures"))
				.setRequired(false)
				.setStyle(TextInputStyle.Paragraph);

			const improvedInput: TextInputBuilder = new TextInputBuilder()
				.setCustomId("improved")
				.setLabel(this.translate("changelogModal:improvedFeatures"))
				.setRequired(false)
				.setStyle(TextInputStyle.Paragraph);

			const fixedInput: TextInputBuilder = new TextInputBuilder()
				.setCustomId("fixed")
				.setLabel(this.translate("changelogModal:bugFixes"))
				.setRequired(false)
				.setStyle(TextInputStyle.Paragraph);

			const removedInput: TextInputBuilder = new TextInputBuilder()
				.setCustomId("removed")
				.setLabel(this.translate("changelogModal:removedFeatures"))
				.setRequired(false)
				.setStyle(TextInputStyle.Paragraph);

			const newActionRow: any = new ActionRowBuilder().addComponents(newInput);
			const fixedActionRow: any = new ActionRowBuilder().addComponents(fixedInput);
			const improvedActionRow: any = new ActionRowBuilder().addComponents(improvedInput);
			const removedActionRow: any = new ActionRowBuilder().addComponents(removedInput);
			await modal.addComponents(newActionRow, fixedActionRow, improvedActionRow, removedActionRow);

			await interaction.showModal(modal);
			interaction
				.awaitModalSubmit({
					filter: (int: any): boolean => int.user.id === this.message.author.id,
					time: 10 * 60 * 1000,
				})
				.then(async (int: any): Promise<void> => {
					let newFeatures: any = int.fields.getTextInputValue("new");
					let improvedFeatures: any = int.fields.getTextInputValue("improved");
					let fixedFeatures: any = int.fields.getTextInputValue("fixed");
					let removedFeatures: any = int.fields.getTextInputValue("removed");

					if (newFeatures === "") newFeatures = "/";
					newFeatures = newFeatures.split(/\r?\n/);

					if (improvedFeatures === "") improvedFeatures = "/";
					improvedFeatures = improvedFeatures.split(/\r?\n/);

					if (fixedFeatures === "") fixedFeatures = "/";
					fixedFeatures = fixedFeatures.split(/\r?\n/);

					if (removedFeatures === "") removedFeatures = "/";
					removedFeatures = removedFeatures.split(/\r?\n/);

					const date: string = this.client.utils.getDiscordTimestamp(Date.now(), "F");

					const text: string =
						"### " +
						this.client.emotes.shine +
						this.translate("changelogModal:newFeatures") + "\n" +
						this.client.emotes.arrow +
						" " +
						newFeatures.join("\n" + this.client.emotes.arrow + " ") +
						"\n\n\n\n" +
						"### " +
						this.client.emotes.rocket +
						this.translate("changelogModal:improvedFeatures") + "\n" +
						this.client.emotes.arrow +
						" " +
						improvedFeatures.join("\n" + this.client.emotes.arrow + " ") +
						"\n\n\n\n" +
						"### " +
						this.client.emotes.bug +
						this.translate("changelogModal:bugFixes") + "\n" +
						this.client.emotes.arrow +
						" " +
						fixedFeatures.join("\n" + this.client.emotes.arrow + " ") +
						"\n\n\n\n" +
						"### " +
						this.client.emotes.error +
						this.translate("changelogModal:removedFeatures") + "\n" +
						this.client.emotes.arrow +
						" " +
						removedFeatures.join("\n" + this.client.emotes.arrow + " ") +
						"\n\n\n\n";

					const changelogEmbed: EmbedBuilder = this.client.createEmbed("{0}", null, "normal", text);
					changelogEmbed.setThumbnail(this.client.user!.displayAvatarURL());
					changelogEmbed.setTitle(this.translate("changelogTitle", { date }));
					this.message.channel.send({ embeds: [changelogEmbed] });

					// Delete messages and close modal
					const sentEmbed: EmbedBuilder = await this.client.createEmbed(
						this.translate("changelogSent"),
						"success",
						"success",
					);
					await int.update({
						embeds: [sentEmbed],
						components: [],
					});
					await this.message.delete().catch((): void => {});
				});
		});
	}
}
