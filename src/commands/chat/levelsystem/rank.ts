import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder,
	SlashCommandUserOption, EmbedBuilder, AttachmentBuilder, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { LevelManager } from '@services/LevelManager.js';
import { RankcardBuilder } from '@services/RankcardBuilder.js';

class RankCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'rank',
			description: 'Schau dir deine Levelkarte an',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle ein Mitglied')
						.setRequired(false)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const levelManagerInstance: LevelManager = new LevelManager(this.client);
		const member: any = this.options.getMember('mitglied') || this.member;
		const levelData = await levelManagerInstance.fetch(member.user.id, this.guild.id, true);

		// Check if levelsystem is enabled
		if(!this.data.guild.settings.levelsystem.enabled){
			const levelsystemIsDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Levelsystem wurde auf diesem Server **noch nicht aktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [levelsystemIsDisabledEmbed] });
			return;
		}

		// Check if member is a bot
		if(member.user.bot){
			const botEmbed: EmbedBuilder = this.clientUtils.createEmbed('Bots können **keine XP sammeln**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [botEmbed] });
			return;
		}

		// Create rank card
		const rank = await new RankcardBuilder({
			currentLevel: levelData.level,
			currentRank: levelData.position,
			currentXp: levelData.cleanXp,
			requiredXp: levelData.cleanNextLevelXp,
			//currentXp: levelData.xp,
			//requiredXp: levelData.nextLevelXp,
			avatar: member.user.displayAvatarURL({ extension: 'png' }),
			displayName: member.displayName,
		}).build();

		// Build attachment
		const attachment = new AttachmentBuilder(rank.toBuffer(), { name: 'rank.png', description: 'Level-Karte für ' + member.displayName });

		// Send rank card
		await this.interaction.followUp({ files: [attachment]})
	}
}

export { RankCommand };