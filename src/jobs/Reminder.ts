import { Guild, GuildMember, EmbedBuilder } from "discord.js";
import { BaseClient } from '@core/BaseClient.js';
import { MemberModel } from '@database/models/Member.js';
import { FormatUtils } from '@utils/format-utils.js';
import { ClientUtils } from '@utils/client-utils.js';

class Reminder {
	private readonly client: BaseClient;
	private readonly membersData: typeof MemberModel;

	public constructor(client: BaseClient) {
		this.client = client;
		this.membersData = MemberModel;
		this.membersData.find({ 'reminders.0': { $exists: true } }).then((members: typeof MemberModel[]): void => {
			members.forEach((member: any): void => {
				this.client.databaseCache.reminders.set(member.id + member.guildID, member);
			});
		});
	}

	public async remind(): Promise<void> {
		try{
			const formatUtilsInstance: FormatUtils = new FormatUtils();
			const clientUtilsInstance: ClientUtils = new ClientUtils(this.client);
			for(const memberData of [...this.client.databaseCache.reminders.values()]){
				memberData.reminders.forEach((reminder): void => {
					if (reminder.end <= Date.now()) {
						const guild: Guild|undefined = this.client.guilds.cache.get(memberData.guildID);
						if (!guild) return;

						const channel: any = guild.channels.cache.get(reminder.channel);
						if (!channel) return;

						// Send reminder
						const createdBeforeTimestamp: string = formatUtilsInstance.discordTimestamp(reminder.start, 'R');
						const reminderText: string = 
							'### ' + clientUtilsInstance.emote('reminder') + ' ' + reminder.reason + '\n' +
							'-# ' + clientUtilsInstance.emote('calendar') + ' Erstellt vor: **' + createdBeforeTimestamp + '**';

						const remindEmbed: EmbedBuilder = clientUtilsInstance.createEmbed(reminderText, null, 'normal');

						channel.send({ content: '<@' + memberData.id + '>', embeds: [remindEmbed]});

						// Remove reminder from database
						memberData.reminders = memberData.reminders.filter((r): boolean => r.start !== reminder.start);
						memberData.markModified('reminders');
						memberData.save();
					}
				});
			}
		}catch(error: unknown){
			throw error;
		}
	}
}

export { Reminder }