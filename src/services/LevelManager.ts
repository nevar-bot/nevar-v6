import { LevelsModel } from '@database/models/Levels.js';
import { BaseClient } from '@core/BaseClient.js';

class LevelManager {
	private readonly client: BaseClient;
	constructor(client: BaseClient) {
		this.client = client;
	};

	public async findOrCreateUser(userId: string, guildId: string): Promise<any> {
		try{
			const isUser: any = await LevelsModel.findOne({ userID: userId, guildID: guildId });
			if (isUser) return isUser;

			const newUser = new LevelsModel({ userID: userId, guildID: guildId });

			await newUser.save();
			return newUser;
		}catch(error: unknown){
			throw error;
		}
	}

	public async deleteUser(userId: string, guildId: string): Promise<any> {
		try{
			const user: any = await LevelsModel.findOne({ userID: userId, guildID: guildId });
			if (!user) return false;

			await LevelsModel.findOneAndDelete({ userID: userId, guildID: guildId });
			return user;
		}catch(error: unknown){
			throw error;
		}
	}

	public async appendXp(userId: string, guildId: string, xp: number): Promise<boolean> {
		try{
			if (xp <= 0 || !xp || isNaN(parseInt(String(xp)))) return false;

			const user = await this.findOrCreateUser(userId, guildId);

			user.xp += parseInt(String(xp), 10);
			user.level = Math.floor(0.1 * Math.sqrt(user.xp));
			user.lastUpdated = new Date(Date.now());

			await user.save();

			return Math.floor(0.1 * Math.sqrt((user.xp -= xp))) < user.level;
		}catch(error: unknown){
			throw error;
		}
	}

	public async appendLevel(userId: string, guildId: string, levels: number): Promise<any> {
		try{
			const user = await this.findOrCreateUser(userId, guildId);

			user.level += parseInt(String(levels), 10);
			user.xp = user.level * user.level * 100;
			user.lastUpdated = new Date(Date.now());

			user.save();

			return user;
		}catch(error: unknown){
			throw error;
		}
	}

	public async setXp(userId: string, guildId: string, xp: number): Promise<any> {
		try{
			if (xp <= 0 || !xp || isNaN(parseInt(String(xp)))) return false;

			const user = await this.findOrCreateUser(userId, guildId);

			user.xp = xp;
			user.level = Math.floor(0.1 * Math.sqrt(user.xp));
			user.lastUpdated = new Date();

			user.save();

			return user;
		}catch(error: unknown){
			throw error;
		}
	}

	public async setLevel(userId: string, guildId: string, level: number): Promise<any> {
		try{
			const user = await this.findOrCreateUser(userId, guildId);

			user.level = level;
			user.xp = level * level * 100;
			user.lastUpdated = new Date(Date.now());

			user.save();

			return user;
		}catch(error: unknown){
			throw error;
		}
	}

	public async fetch(userId: string, guildId: string, fetchPosition: boolean = false): Promise<any> {
		try{
			const user = await this.findOrCreateUser(userId, guildId);

			if (fetchPosition) {
				const leaderboard: any[] = await LevelsModel.find({ guildID: guildId })
					.sort([['xp', 'descending']])
					.exec();

				user.position = leaderboard.findIndex((i: any): boolean => i.userID === userId) + 1;
			}

			user.cleanXp = user.xp - this.xpFor(user.level);
			user.cleanNextLevelXp = this.xpFor(user.level + 1) - this.xpFor(user.level);
			user.nextLevelXp = this.xpFor(user.level + 1);

			return user;
		}catch(error: unknown){
			throw error;
		}
	}

	public async substractXp(userId: string, guildId: string, xp: number): Promise<any> {
		try{
			if (xp <= 0 || !xp || isNaN(parseInt(String(xp)))) return false;

			const user = await this.findOrCreateUser(userId, guildId);

			user.xp -= xp;
			user.level = Math.floor(0.1 * Math.sqrt(user.xp));
			user.lastUpdated = new Date(Date.now());

			user.save();

			return user;
		}catch(error: unknown){
			throw error;
		}
	}

	public async substractLevel(userId: string, guildId: string, levels: number): Promise<any> {
		try{
			const user = await this.findOrCreateUser(userId, guildId);

			user.level -= levels;
			user.xp = user.level * user.level * 100;
			user.lastUpdated = new Date(Date.now());

			user.save();

			return user;
		}catch(error: unknown){
			throw error;
		}
	}

	public async fetchLeaderboard(guildId: string, limit: number = 10): Promise<any> {
		try{
			return await LevelsModel.find({ guildID: guildId })
				.sort([['xp', 'descending']])
				.limit(limit)
				.exec();
		}catch(error: unknown){
			throw error;
		}

	}

	public async computeLeaderboard(leaderboard: any[], fetchUsers: boolean = false): Promise<any> {
		try{
			if (leaderboard.length < 1) return [];

			const computedArray: any[] = [];

			for(const key of leaderboard){
				let user: any = this.client.users.cache.get(key.userID);
				if(!user && fetchUsers) user = await this.client.users.fetch(key.userID);
				if(!user) continue;
				if(user.username.includes('Deleted User')){
					await this.deleteUser(key.userID, key.guildID);
					continue;
				}

				computedArray.push({
					user: {
						id: key.userID,
						username: user.username,
						displayName: user.displayName,
						avatar: user.displayAvatarURL()
					},
					guild: {
						id: key.guildID,
						name: this.client.guilds.cache.get(key.guildID)?.name || 'Unknown',
						icon: this.client.guilds.cache.get(key.guildID)?.iconURL() || this.client.user.displayAvatarURL()
					},
					level: key.level,
					xp: key.xp,
					nextLevelXp: this.xpFor(key.level + 1),
					cleanXp: key.xp - this.xpFor(key.level),
					cleanNextLevelXp: this.xpFor(key.level + 1) - this.xpFor(key.level),
					position: leaderboard.findIndex((i: any): boolean => i.guildID === key.guildID && i.userID === key.userID) + 1,
				});
			}

			return computedArray;
		}catch(error: unknown){
			throw error;
		}

	}

	public xpFor(level: number): any {
		if (level < 0) return false;

		return level * level * 100;
	}

	public async deleteGuild(guildId: string): Promise<any> {
		try{
			const guild: any = await LevelsModel.findOne({ guildID: guildId });
			if (!guild) return false;

			await LevelsModel.deleteMany({ guildID: guildId });

			return true;
		}catch(error: unknown){
			throw error;
		}
	}
}

export { LevelManager };