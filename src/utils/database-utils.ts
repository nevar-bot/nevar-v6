import { BaseClient } from '@core/BaseClient.js';
import { GuildModel } from '@database/models/Guild.js';
import { UserModel } from '@database/models/User.js';
import { MemberModel } from '@database/models/Member.js';
import { DisabledCommandModel } from '@database/models/DisabledCommand.js';

class DatabaseUtils {
	private readonly client: BaseClient;
	private readonly guildsData: typeof GuildModel;
	private readonly usersData: typeof UserModel;
	private readonly membersData: typeof MemberModel;

	constructor(client: BaseClient) {
		this.client = client;
		this.guildsData = GuildModel;
		this.usersData = UserModel;
		this.membersData = MemberModel;
	}

	/**
	 * Find or create a user in the database
	 * @param userID
	 * @param isLean
	 */
	public async findOrCreateUser(userID: string, isLean: boolean = false): Promise<typeof UserModel|Error> {
		try{
			// Check if user is cached
			const cachedUser = this.client.databaseCache.users.get(userID);

			// Return cached user if found
			if (cachedUser) return isLean ? cachedUser.toJSON() : cachedUser;

			// Find user in database
			let userData = isLean
				? await this.usersData.findOne({ id: userID }).lean()
				: await this.usersData.findOne({ id: userID });

			// Create user if not found
			if (!userData) userData = await this.usersData.create({ id: userID });

			// Cache user
			this.client.databaseCache.users.set(userID, userData);

			// Return user
			return isLean ? userData.toJSON() : userData;
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Find a user in the database
	 * @param userID
	 */
	public async findUser(userID: string): Promise<typeof UserModel|Error> {
		try{
			// Check if user is cached
			const cachedUser: typeof UserModel = this.client.databaseCache.users.get(userID);

			// Return cached user if found else find user in database
			return cachedUser || await this.usersData.findOne({ id: userID });
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Delete a user from the database
	 * @param userID
	 */
	public async deleteUser(userID: string): Promise<void|Error> {
		try{
			// Delete user from database
			await this.usersData.findOneAndDelete({ id: userID });

			// Delete user from cache
			this.client.databaseCache.users.delete(userID);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Find or create a member in the database
	 * @param memberID
	 * @param guildID
	 * @param isLean
	 */
	public async findOrCreateMember(memberID: string, guildID: string, isLean: boolean = false): Promise<any> {
		try{
			// Check if member is cached
			const cachedMember = this.client.databaseCache.members.get(memberID + guildID);

			// Return cached member if found
			if (cachedMember) return isLean ? cachedMember.toJSON() : cachedMember;

			// Find member in database
			let memberData = isLean
				? await this.membersData.findOne({ guildID, id: memberID }).lean()
				: await this.membersData.findOne({ guildID, id: memberID });

			// Create member if not found
			if (!memberData) {
				// Create member
				memberData = new this.membersData({ id: memberID, guildID: guildID });
				await memberData.save();

				// Cache member
				this.client.databaseCache.members.set(memberID + guildID, memberData);

				// Find or create guild
				const guild: any = await this.findOrCreateGuild(guildID);
				if (guild) {
					// Add member to guild
					guild.members.push(memberData._id);
					await guild.save();
				}
			}

			// Return member
			return isLean ? memberData.toJSON() : memberData;
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Find a member in the database
	 * @param memberID
	 * @param guildID
	 */
	public async findMember(memberID: string, guildID: string): Promise<typeof MemberModel|Error> {
		try{
			// Check if member is cached
			const cachedMember: any = this.client.databaseCache.members.get(memberID + guildID);

			// Return cached member if found else find member in database
			return cachedMember || await this.membersData.findOne({ id: memberID, guildID: guildID });
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Delete a member from the database
	 * @param memberID
	 * @param guildID
	 */
	public async deleteMember(memberID: string, guildID: string): Promise<void|Error> {
		try{
			// Delete member from database
			await this.membersData.findOne({ id: memberID, guildID: guildID }).deleteOne().exec();

			// Delete member from cache
			this.client.databaseCache.members.delete(memberID + guildID);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Find or create a guild in the database
	 * @param guildID
	 * @param isLean
	 */
	public async findOrCreateGuild(guildID: string, isLean: boolean = false): Promise<typeof GuildModel|Error> {
		try{
			// Check if guild is cached
			const cachedGuild = this.client.databaseCache.guilds.get(guildID);

			// Return cached guild if found
			if (cachedGuild) return isLean ? cachedGuild.toJSON() : cachedGuild;

			// Find guild in database
			let guildData = isLean
				? await this.guildsData.findOne({ id: guildID }).populate('members').lean()
				: await this.guildsData.findOne({ id: guildID }).populate('members');

			// Create guild if not found
			if (!guildData) {
				// Create guild
				guildData = new this.guildsData({ id: guildID });
				await guildData.save();

				// Cache guild
				this.client.databaseCache.guilds.set(guildID, guildData);
			}

			// Return guild
			return isLean ? guildData.toJSON() : guildData;
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Find a guild in the database
	 * @param guildID
	 */
	public async findGuild(guildID: string): Promise<typeof GuildModel|Error> {
		try{
			// Check if guild is cached
			const cachedGuild = this.client.databaseCache.guilds.get(guildID);

			// Return cached guild if found else find guild in database
			return cachedGuild || await this.guildsData.findOne({ id: guildID });
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Delete a guild from the database
	 * @param guildID
	 */
	public async deleteGuild(guildID: string): Promise<void|Error> {
		try{
			// Delete guild from database
			await this.guildsData.findOne({ id: guildID }).deleteOne().exec();

			// Delete guild from cache
			this.client.databaseCache.guilds.delete(guildID);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Disable a command in the database
	 * @param commandName
	 */
	public async disableCommand(commandName: string): Promise<boolean> {
		try{
			// Check if command is already disabled
			const existingCommand = await DisabledCommandModel.findOne({ name: commandName });
			if (existingCommand) return false;

			// Disable command
			await new DisabledCommandModel({ name: commandName }).save();
			return true
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Enable a command in the database
	 * @param commandName
	 */
	public async enableCommand(commandName: string): Promise<boolean> {
		try{
			// Check if command is disabled
			const existingCommand = await DisabledCommandModel.findOne({ name: commandName });
			if (!existingCommand) return false;

			// Enable command
			await existingCommand.deleteOne();
			return true;
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Check if a command is disabled
	 * @param commandName
	 */
	public async commandIsDisabled(commandName: string): Promise<boolean> {
		try{
			// Check if command is disabled
			const existingCommand = await DisabledCommandModel.findOne({ name: commandName });
			return !!existingCommand;
		}catch(error: unknown){
			throw error;
		}
	}
}

export { DatabaseUtils };