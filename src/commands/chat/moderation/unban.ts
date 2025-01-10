import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction,
	CommandInteractionOptionResolver, EmbedBuilder, GuildBan, InteractionContextType,
	SlashCommandBuilder,
	SlashCommandUserOption,
	User, PermissionsBitField
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class UnbanCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'unban',
			description: 'Entbanne ein Mitglied von deinem Server',
			dirname: import.meta.url,
			permissions: {
				bot: [Flags.BanMembers],
				user: [Flags.BanMembers]
			},
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('nutzer')
						.setDescription('Wähle ein Mitglied (auch IDs möglich)')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const user: User = this.options.getUser('nutzer');

		try{
			const guildBan: GuildBan|void = await this.guild.bans.fetch(user).catch(() => {});

			if(!guildBan){
				const userIsNotBannedText: string = user.username + ' ist **nicht gebannt**.';
				const userIsNotBannedEmbed: EmbedBuilder = this.clientUtils.createEmbed(userIsNotBannedText, this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [userIsNotBannedEmbed] });
				return;
			}

			await this.guild.bans.remove(user);

			const memberData: any = await this.databaseUtils.findOrCreateMember(user.id, this.guild.id);
			memberData.ban = {
				status: false,
				reason: null,
				moderator: null,
				bannedAt: null,
				duration: null,
				expiration: null
			};
			memberData.markModified('ban');
			await memberData.save();
			this.client.databaseCache.bannedUsers.delete(user.id + this.guild.id);

			const userUnbannedText: string = user.username + ' **wurde entbannt**.';
			const userUnbannedEmbed: EmbedBuilder = this.clientUtils.createEmbed(userUnbannedText, this.emote('success'), 'success')
				.setImage('https://c.tenor.com/NEZZkx4Tt6kAAAAM/unbanned-ben.gif');

			await this.interaction.followUp({ embeds: [userUnbannedEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}

	}
}

export { UnbanCommand };