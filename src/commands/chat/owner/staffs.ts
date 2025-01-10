import { BaseCommand } from '@core/BaseCommand.js';
import { Message, EmbedBuilder, User } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import mongoose from 'mongoose';

class StaffsCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'staffs',
			description: 'Verwaltet die Bot-Staffs',
			dirname: import.meta.url,
			restrictions: {
				ownerOnly: true
			},
			slashCommand: {
				register: false,
			},
		});
	}

	public async run(): Promise<void> {
		const action: string = this.options[0];

		switch(action){
			case 'add':
				await this.addStaff();
				break;
			case 'remove':
				await this.removeStaff();
				break;
			case 'list':
				await this.listStaffs();
				break;
			default:
				const missingActionEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine Aktion zwischen `add`, `remove` und `list` wählen', this.emote('error'), 'error');
				await this.interaction.reply({ embeds: [missingActionEmbed] });
				break;
		}
		
	}

	private async addStaff(): Promise<void> {
		if(!this.options[1]){
			const missingUserEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst einen Benutzer angeben.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [missingUserEmbed] });
			return;
		}

		if(!['head-staff', 'staff'].includes(this.options[2])){
			const invalidRoleEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst als Rolle entweder `staff` oder `head-staff` angeben.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidRoleEmbed] });
			return;
		}


		const user: User = await this.validationUtils.resolveUser(this.options[1]);

		if(!user){
			const invalidUserEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der Benutzer konnte nicht gefunden werden.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidUserEmbed] });
			return;
		}

		const userData: any = await this.databaseUtils.findOrCreateUser(user.id);

		userData.staff = {
			status: true,
			role: this.options[2]
		}

		userData.markModified('staff');
		await userData.save();

		const role: string = this.options[2] === 'head-staff' ? 'Head-Staff' : 'Staff';
		const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wurde als {1} hinzugefügt.', this.emote('success'), 'success', user.username, role);
		await this.interaction.reply({ embeds: [successEmbed] });
	}

	private async removeStaff(): Promise<void> {
		if(!this.options[1]){
			const missingUserEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst einen Benutzer angeben.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [missingUserEmbed] });
			return;
		}

		const user: User = await this.validationUtils.resolveUser(this.options[1]);

		if(!user){
			const invalidUserEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der Benutzer konnte nicht gefunden werden.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidUserEmbed] });
			return;
		}

		const userData: any = await this.databaseUtils.findOrCreateUser(user.id);

		if(!userData.staff.status){
			const invalidUserEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist kein Staff.', this.emote('error'), 'error', user.username);
			await this.interaction.reply({ embeds: [invalidUserEmbed] });
			return;
		}

		userData.staff = {
			status: false,
			role: null
		}

		userData.markModified('staff');
		await userData.save();

		const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wurde als Staff entfernt.', this.emote('success'), 'success', user.username);
		await this.interaction.reply({ embeds: [successEmbed] });
	}
	
	private async listStaffs(): Promise<void> {
		const staffsData = await mongoose.connection.db.collection('users').find({'staff.status': true }).toArray();

		const staffs: string[] = [];

		for(const userData of staffsData){
			const user: User|void = await this.client.users.fetch(userData.id).catch(() => {});
			if(!user) continue;
			const role: string = userData.staff.role === 'head-staff' ? 'Head-Staff' : 'Staff';
			staffs.push(this.emote('user') + ' ' + user.username + ' (' + role + ')');
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 5, staffs, this.emote('list') + ' Staff-Liste', 'Es gibt noch keine Staffs.');
	}
}

export { StaffsCommand };