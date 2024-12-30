import { BaseClient } from '@core/BaseClient.js';
import { DatabaseUtils } from '@utils/database-utils.js';
import { EmbedBuilder, Guild } from 'discord.js';

class GuildUtils {
	private readonly client: BaseClient;
	private readonly guild: Guild;
	constructor(client: BaseClient, guild: Guild){
		this.client = client;
		this.guild = guild;
	}

	/**
	 * Log an event to the guild's logging channel
	 * @param embed
	 * @param type
	 */
	public async log(embed: EmbedBuilder, type: 'moderation'|'member'|'guild'|'role'|'system'|'channel'): Promise<void> {
		try {
			// Initialize database utils
			const databaseUtils: DatabaseUtils = new DatabaseUtils(this.client);

			// Find or create guild
			const guildData: any = await databaseUtils.findOrCreateGuild(this.guild.id);

			// Get log channel
			const logChannel: any = this.guild.channels.cache.get(guildData.settings.logging[type]);

			// Send log
			if (logChannel) logChannel.send({ embeds: [embed] });
		}catch(error: unknown){
			throw error;
		}
	}
}

export { GuildUtils };