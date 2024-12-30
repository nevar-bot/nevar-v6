import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction,
	CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder, EmbedBuilder
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { LevelManager } from '@services/LevelManager.js';


class LeaderboardCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'leaderboard',
			description: 'Schau dir das Server-Leaderboard an',
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
		if(!this.data.guild.settings.levelsystem.enabled){
			const errorEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Levelsystem muss **zuerst aktiviert werden**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [errorEmbed] });
			return;
		}

		const levelManagerInstance: LevelManager = new LevelManager(this.client);

		const leaderboardData = [
			...(await levelManagerInstance.computeLeaderboard(
				await levelManagerInstance.fetchLeaderboard(this.guild.id, this.guild.memberCount),
				true
			))
		];

		const formattedLeaderboard = [];
		const emoteNames = { 1: 'one', 2: 'two', 3: 'three' };
		for (const user of leaderboardData) {
			const emote: any = user.position < 4 ? this.emote(emoteNames[user.position]) : this.emote('arrow_right');
			formattedLeaderboard.push(
				'### ' + emote + ' ' + user.user.username + '\n' +
				this.emote('rocket') + ' Level ' + user.level + ' - ' + this.mathUtils.format(user.cleanXp) + ' XP\n' +
				this.emote('magic') + ' Platz ' + user.position
			);
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 5, formattedLeaderboard, 'Leaderboard für ' + this.guild.name, 'Es gibt noch keine Mitglieder, die XP gesammelt haben.');
	}
}

export { LeaderboardCommand };