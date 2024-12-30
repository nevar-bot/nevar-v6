import { NevarCommand } from "@core/NevarCommand.js";
import { NevarClient } from "@core/NevarClient";
import { EmbedBuilder } from "discord.js";
import mongoose from "mongoose";
import path from "path";

export default class StaffsCommand extends NevarCommand {
	public constructor(client: NevarClient) {
		super(client, {
			name: "staffs",
			description: "Manage the bot staff",
			localizedDescriptions: {
				de: "Verwalte die Bot-Staffs"
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

		if (!args[0]) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:actionIsMissing"),
				"error",
				"error",
			);
			return message.reply({ embeds: [invalidOptionsEmbed] });
		}
		switch (args[0]) {
			case "add":
				args.shift();
				await this.addStaff(args);
				break;
			case "remove":
				args.shift();
				await this.removeStaff(args);
				break;
			case "list":
				await this.listStaffs();
				break;
			default:
				const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
					this.translate("errors:actionIsMissing"),
					"error",
					"error",
				);
				return message.reply({ embeds: [invalidOptionsEmbed] });
		}
	}

	private async addStaff(args: any[]): Promise<any> {
		const member: any = await this.message.guild!.resolveMember(args[0]);
		if (!member) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.getBasicTranslation("errors:memberIsMissing"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}
		if (!args[1]) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:typeIsMissing"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}
		if (!["head-staff", "staff"].includes(args[1].toLowerCase())) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:typeIsMissing"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		const userdata: any = await this.client.findOrCreateUser(member.user.id);
		userdata.staff = {
			state: true,
			role: args[1].toLowerCase(),
		};
		userdata.markModified("staff");
		await userdata.save();

		const successEmbed: EmbedBuilder = this.client.createEmbed(
			args[1].toLowerCase() === "head-staff" ? this.translate("userAddedAsHeadStaff", { user: member.toString() }) : this.translate("userAddedAsStaff", { user: member.toString() }),
			"success",
			"success",
		);
		return this.message.reply({ embeds: [successEmbed] });
	}

	private async removeStaff(args: any[]): Promise<any> {
		const member = await this.message.guild!.resolveMember(args[0]);
		if (!member) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.getBasicTranslation("errors:memberIsMissing"),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		const userdata: any = await this.client.findOrCreateUser(member.user.id);
		if (!userdata.staff.state) {
			const invalidOptionsEmbed: EmbedBuilder = this.client.createEmbed(
				this.translate("errors:memberIsNotStaff", { user: member.toString() }),
				"error",
				"error",
			);
			return this.message.reply({ embeds: [invalidOptionsEmbed] });
		}

		userdata.staff = {
			state: false,
			role: null,
		};
		userdata.markModified("staff");
		await userdata.save();

		const successEmbed: EmbedBuilder = this.client.createEmbed(
			this.translate("userRemovedFromStaff", { user: member.toString() }),
			"success",
			"success"
		);
		return this.message.reply({ embeds: [successEmbed] });
	}

	private async listStaffs(): Promise<void> {
		const staffsdata: any = await (await mongoose.connection.db.collection("users"))
			.find({ "staff.state": true })
			.toArray();
		let staffs: any[] = [];
		for (const userdata of staffsdata) {
			const user: any = await this.client.users.fetch(userdata.id).catch(() => {});
			const role: string = userdata.staff.role === "head-staff" ? "Head-Staff" : "Staff";
			staffs.push(user.username + " (" + role + ")");
		}

		await this.client.utils.sendPaginatedEmbedMessage(this.message, 10, staffs, this.translate("list:title", { client: this.client.user!.displayName}), this.translate("list:noStaffs"))
	}
}
