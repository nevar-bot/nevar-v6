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
			const formatUtils: FormatUtils = new FormatUtils();
			const clientUtils: ClientUtils = new ClientUtils(this.client);
			for(const memberData of [...this.client.databaseCache.reminders.values()]){
				memberData.reminders.forEach((reminder: any): void => {
					if (reminder.endDate <= Date.now()) {
						const guild: Guild|undefined = this.client.guilds.cache.get(memberData.guildID);
						if (!guild) return;

						const channel: any = guild.channels.cache.get(reminder.channel);
						if (!channel) return;

						guild.members.fetch(memberData.id).then((member: GuildMember): void => {
							const reminderAgo: string = formatUtils.discordTimestamp(reminder.startDate, "R");
							const text: string = '### ' + this.client.emotes.reminder + ' Hier ist deine Erinnerung, die du vor {0} erstellt hast: {1}';

							const remindEmbed: EmbedBuilder = clientUtils.createEmbed(text, null, "normal", reminderAgo, reminder.reason);
							channel.send({ content: member.toString(), embeds: [remindEmbed] });

							memberData.reminders = memberData.reminders.filter((r: any): boolean => r.startDate !== reminder.startDate);
							memberData.markModified("reminders");
							memberData.save();
						});
					}
				});
			}
		}catch(error: unknown){
			throw error;
		}
	}
}

export { Reminder }