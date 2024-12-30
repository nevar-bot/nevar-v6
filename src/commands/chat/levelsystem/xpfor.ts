import { BaseCommand } from '@core/BaseCommand.js';
import { LevelManager } from '@services/LevelManager.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder,
	SlashCommandIntegerOption, EmbedBuilder, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class XpforCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'xpfor',
			description: 'Erfahre, wieviel XP du für ein bestimmtes Level benötigst',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
					.addIntegerOption((integerOption: SlashCommandIntegerOption) => integerOption
						.setName('level')
						.setDescription('Gib das Level an')
						.setRequired(true)
						.setMinValue(1)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const levelManagerInstance: LevelManager = new LevelManager(this.client);

		const neededXp: number = levelManagerInstance.xpFor(this.options.getInteger('level'));

		const neededXpEmbed: EmbedBuilder = this.clientUtils.createEmbed('Für **Level {0} benötigst du {1} XP**.', this.emote('arrow_right'), 'normal', this.options.getInteger('level'), this.mathUtils.format(neededXp));
		await this.interaction.followUp({ embeds: [neededXpEmbed] });
	}
}

export { XpforCommand };