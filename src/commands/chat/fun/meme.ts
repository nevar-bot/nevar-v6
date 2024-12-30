import { BaseClient } from '@core/BaseClient.js';
import { BaseCommand } from '@core/BaseCommand.js';
import axios from 'axios';
import {
	ApplicationIntegrationType, ButtonBuilder, ButtonStyle,
	CommandInteraction, CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder,
} from 'discord.js';

class MemeCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'meme',
			description: 'Theoretisch könnten hier lustige Sachen kommen',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
			},
		});
	}

	public async run(): Promise<void> {
		const memes: any = this.randomUtils.shuffleArray(
			(await axios.get('https://reddit.com/r/ich_iel/top.json?sort=top&t=day&limit=1000')).data.data.children
		);

		const reloadButton: ButtonBuilder = this.componentsUtils.createButton('collector_reload', 'Neuladen', ButtonStyle.Secondary, this.emote('reload'));

		const createMemeEmbed = () => {
			const meme = memes[Math.floor(Math.random() * memes.length)];

			return this.clientUtils.createEmbed(null, null, 'normal')
				.setImage(meme.data.url)
				.setTitle(meme.data.title)
				.setTimestamp(new Date(meme.data.created_utc * 1000))
				.setFooter({ text: meme.data.author + ' • 👍 ' + meme.data.ups });
		}

		const memeMessage = await this.interaction.followUp({
			embeds: [createMemeEmbed()],
			components: [this.componentsUtils.createActionRow(reloadButton)]
		});

		const buttonCollector = memeMessage.createMessageComponentCollector({
			filter: ({ user} ): boolean => user.id === this.user.id
		});

		buttonCollector.on('collect', async (buttonInteraction): Promise<void> => {
			buttonInteraction.update({
				embeds: [createMemeEmbed()],
				components: [this.componentsUtils.createActionRow(reloadButton)]
			});
		});
	}
}

export { MemeCommand };