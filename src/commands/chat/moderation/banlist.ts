import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	Collection, CommandInteraction, CommandInteractionOptionResolver,
	EmbedBuilder, GuildBan, InteractionContextType, PermissionsBitField, SlashCommandBuilder,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class BanlistCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'banlist',
			description: 'Erhalte eine Liste aller gebannten Nutzer',
			permissions: {
				bot: [Flags.BanMembers],
				user: [Flags.BanMembers]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
			},
		});
	}

	public async run(): Promise<void> {
		try{
			const fetchedBans: Collection<string, GuildBan> = await this.guild.bans.fetch();

			if(fetchedBans.size === 0){
				const noBansEmbed: EmbedBuilder = this.clientUtils.createEmbed('Aktuell sind **keine Nutzer gebannt**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [noBansEmbed] });
				return;
			}

			const bans: string[] = [];

			for(const fetchedBan of fetchedBans){
				const ban: GuildBan = fetchedBan[1];

				const memberData = await this.databaseUtils.findOrCreateMember(ban.user.id, this.guild.id);

				// Check if member is banned via ban command
				if(memberData.ban.status){
					const { reason, moderator, bannedAt, expiration } = memberData.ban;

					// Get time data
					const bannedAtText: string = this.formatUtils.discordTimestamp(bannedAt, 'f');
					const bannedUntilText: string = this.formatUtils.discordTimestamp(expiration, 'f');
					const unbanInText: string = this.formatUtils.discordTimestamp(expiration, 'R');

					// Get moderator
					const moderatorUser = await this.client.users.fetch(moderator).catch((): void => {});
					const moderatorMember = await this.guild.members.fetch(moderator).catch((): void => {});

					// Mention moderator if possible, otherwise show username, and as a last fallback, show ID
					const moderatorText: string = moderatorMember ? moderatorMember.toString() : moderatorUser ? moderatorUser.username : moderator;

					const banInformationText: string =
						'### ' + this.emote('ban') + ' ' + ban.user.username + '\n' +
						'-# ' + this.emote('text') + ' **Grund**: ' + reason + '\n' +
						'-# ' + this.emote('user') + ' **Moderator**: ' + moderatorText + '\n' +
						'-# ' + this.emote('calendar') + ' **Gebannt am**: ' + bannedAtText + '\n' +
						'-# ' + this.emote('calendar') + ' **Gebannt bis**: ' + bannedUntilText + '\n' +
						'-# ' + this.emote('reminder') + ' **Entbannung**: ' + unbanInText;

					bans.push(banInformationText);
				}else{
					const reason: string = ban.reason || 'Kein Grund angegeben';

					const banInformationText: string =
						'### ' + this.emote('ban') + ' ' + ban.user.username + '\n' +
						'-# ' + this.emote('text') + ' **Grund**: ' + reason;

					bans.push(banInformationText);
				}
			}

			await this.paginationUtils.sendPaginatedEmbed(this.interaction, 3, bans, this.emote('list') + ' Gebannte Nutzer', 'Es wurden noch keine Nutzer gebannt.');


		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { BanlistCommand };