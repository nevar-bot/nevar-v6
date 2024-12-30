import { BaseCommand } from '@core/BaseCommand.js';
import { EmbedBuilder, Message } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

import { DatabaseMigrator } from '@services/DatabaseMigrator.js';
import { GiveawayModel } from '@database/models/Giveaway.js';
import { GuildModel } from '@database/models/Guild.js';
import { LevelsModel } from '@database/models/Levels.js';
import { LogModel } from '@database/models/Log.js';
import { MemberModel } from '@database/models/Member.js';
import { UserModel } from '@database/models/User.js';

class MigrateCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'migrate',
			description: 'Migriert Datensätze an das aktuelle Datenbankschema',
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
		const databaseMigratorInstance: DatabaseMigrator = new DatabaseMigrator();

		const models: string[] = [
			'Giveaway',
			'Guild',
			'Levels',
			'Log',
			'Member',
			'User'
		];

		const model: string = this.options[0];
		if(!model){
			const invalidOptionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst ein Model angeben, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidOptionsEmbed] });
			return;
		}

		if(!models.includes(model)){
			const invalidModelEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das angegebene Model existiert nicht.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidModelEmbed] });
			return;
		}

		let count: number;

		switch(model){
			case 'Giveaway':
				count = await databaseMigratorInstance.migrateData(GiveawayModel, ['messageId', 'channelId', 'guildId']);
				break;
			case 'Guild':
				count = await databaseMigratorInstance.migrateData(GuildModel, ['id']);
				break;
			case 'Levels':
				count = await databaseMigratorInstance.migrateData(LevelsModel, ['userID', 'guildID']);
				break;
			case 'Log':
				count = await databaseMigratorInstance.migrateData(LogModel, ['date', 'user', 'guild', 'channel']);
				break;
			case 'Member':
				count = await databaseMigratorInstance.migrateData(MemberModel, ['id', 'guildID']);
				break;
			case 'User':
				count = await databaseMigratorInstance.migrateData(UserModel, ['id']);
				break;
		}

		const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('Es wurden **{0}** Datensätze migriert.', this.emote('success'), 'success', count);
		await this.interaction.reply({ embeds: [successEmbed] });
	}
}

export { MigrateCommand };