import { Guild } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { MemberModel } from '@database/models/Member.js';

class AutoUnban {
	private readonly client: BaseClient;
	private readonly membersData: typeof MemberModel;

	public constructor(client: BaseClient) {
		this.client = client;
		this.membersData = MemberModel;

	}

	public async unban(): Promise<void> {
		this.membersData.find({ 'ban.status': true }).then((members: typeof MemberModel[]): void => {
			members.forEach((member: any): void => {
				this.client.databaseCache.bannedUsers.set(member.id + member.guildID, member);
			});
		});
		for(const memberData of [...this.client.databaseCache.bannedUsers.values()].filter((m: any): boolean => m.ban.expiration <= Date.now())){
			try{
				const guild: Guild|undefined = this.client.guilds.cache.get(memberData.guildID);
				if(!guild) continue;

				await guild.bans.remove(memberData.id, 'Auto-Unban');

				memberData.ban = {
					status: false,
					reason: null,
					moderator: null,
					bannedAt: null,
					duration: null,
					expiration: null
				};
				memberData.markModified('ban');
				await memberData.save()

				this.client.databaseCache.bannedUsers.delete(memberData.id + memberData.guildID);
			}catch(error: unknown){
				throw error;
			}
		}
	}
}

export { AutoUnban }