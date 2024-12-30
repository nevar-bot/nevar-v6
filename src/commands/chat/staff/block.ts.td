import { NevarCommand } from "@core/NevarCommand.js";
import { NevarClient } from "@core/NevarClient";
import { EmbedBuilder } from "discord.js";
import path from "path";

export default class BlockCommand extends NevarCommand {
	public constructor(client: NevarClient) {
		super(client, {
			name: "block",
			description: "Block users or servers",
			localizedDescriptions: {
				de: "Blockiere Nutzer oder Server"
			},
			staffOnly: true,
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

		const action: string = args[0].toLowerCase();
		args.shift();
		switch (action) {
			case "add":
				await this.block(args);
				break;
			case "remove":
				await this.unblock(args);
				break;
			case "list":
				await this.listBlocked();
				break;
			default:
				const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
					this.translate("errors:actionIsMissing"),
					"error",
					"error",
				);
				await message.reply({ embeds: [invalidOptionsEmbed] });
				break;
		}
	}

	private async block(args: any[]): Promise<any> {
		// get id and reason
		const id: string = args.shift();
		const reason: string = args.join(" ") || this.translate("noBlockReasonSpecified");

		// check if target is a user or guild
		const type: string = (await this.client.users.fetch(id).catch(() => {})) ? "user" : "guild";

		// fetch target guild/user
		const target: any =
			type === "user"
				? await this.client.users.fetch(id).catch(() => {})
				: await this.client.guilds.fetch(id).catch(() => {});

		// no target found
		if (!target) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:targetNotFound"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// target is client
		if (target.id === this.client.user!.id) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:cantBlockMySelf"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// target is message author
		if (target.id === this.message.author.id) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:cantBlockYourself"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// target is support server
		if (target.id === this.client.config.support["ID"]) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:cantBlockSupportserver"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// target is bot owner
		if (this.client.config.general["OWNER_IDS"].includes(target.id)) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:cantBlockBotOwner"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// get target data
		const targetData: any =
			type === "user" ? await this.client.findOrCreateUser(id) : await this.client.findOrCreateGuild(id);

		// target is already blocked
		if (targetData.blocked.state) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:targetIsAlreadyBlocked"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// save to database
		targetData.blocked = {
			state: true,
			reason: reason,
			date: Date.now(),
			moderator: this.message.author!.id,
		};
		targetData.markModified("blocked");
		await targetData.save();

		const successEmbed: EmbedBuilder = this.client.createEmbed(
			this.translate("blocked", { name: (type === "user" ? target.username : target.name) }),
			"success",
			"success",
		);
		return this.message.reply({ embeds: [successEmbed] });
	}

	private async unblock(args: any[]): Promise<any> {
		// get id
		const id: string = args.shift();

		if (!id) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:targetNotFound"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// get target user/guild data
		const type: string = (await this.client.users.fetch(id).catch((): void => {})) ? "user" : "guild";
		const targetData: any =
			type === "user" ? await this.client.findOrCreateUser(id) : await this.client.findOrCreateGuild(id);

		// no target found
		if (!targetData) {
			const noTargetEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:targetNotFound"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [noTargetEmbed] });
		}

		// target is not blocked
		if (!targetData.blocked.state) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:targetIsNotBlocked"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		// unblock target
		const target: any = type === "user"? await this.client.users.fetch(id).catch(() => {}) : await this.client.guilds.fetch(id).catch(() => {});
		const name: string = targetData.blocked.name;
		targetData.blocked = {
			state: false,
			reason: null,
			date: null,
			moderator: null,
		};
		targetData.markModified("blocked");
		await targetData.save();

		const successEmbed: EmbedBuilder = this.client.createEmbed(
			this.translate("unblocked", { name: ((type === "user" ? target.username : target.name) || "/") }),
			"success",
			"success",
		);
		return this.message.reply({ embeds: [successEmbed] });
	}

	private async listBlocked(): Promise<any> {
		const blocked: any[] = [];

		// blocked users
		const blockedUsers = await this.client.usersData.find({
			"blocked.state": true,
		});
		for (const userData of blockedUsers) {
			const user: any = await this.client.users.fetch(userData.id).catch(() => {});
			const moderator: any = await this.client.users.fetch(userData.blocked.moderator).catch(() => {});
			const text: string =
				this.client.emotes.user + " **" + user.username + "** (" + user.id + ")\n" +
				this.client.emotes.text + " " + this.getBasicTranslation("reason") + ": " + userData.blocked.reason + "\n" +
				this.client.emotes.calendar + " " + this.translate("blockedAt") + ": " + this.client.utils.getDiscordTimestamp(userData.blocked.date, "F") + "\n" +
				this.client.emotes.flags.CertifiedModerator + " " + this.getBasicTranslation("moderator") + ": " + moderator.username + "\n";
			blocked.push(text);
		}

		// blocked guilds
		const blockedGuilds = await this.client.guildsData.find({
			"blocked.state": true,
		});
		for (const guildData of blockedGuilds) {
			const guild: any = await this.client.guilds.fetch(guildData.id).catch((): void => {});
			const moderator: any = await this.client.users.fetch(guildData.blocked.moderator).catch(() => {});
			const text: string =
				this.client.emotes.discord + " **" + (guild?.name || "/") + "** (" + guild.id + ")\n" +
				this.client.emotes.text + " " + this.getBasicTranslation("reason") + ": " + guildData.blocked.reason + "\n" +
				this.client.emotes.calendar + " " + this.translate("blockedAt") + ": " + this.client.utils.getDiscordTimestamp(guildData.blocked.date, "F") + "\n" +
				this.client.emotes.flags.CertifiedModerator + " " + this.getBasicTranslation("moderator") + ": " + moderator.username + "\n";
			blocked.push(text);
		}

		await this.client.utils.sendPaginatedEmbedMessage(
			this.message,
			3,
			blocked,
			this.translate("list:title"),
			this.translate("list:noBlockedUsersOrGuilds"),
		);
	}
}
