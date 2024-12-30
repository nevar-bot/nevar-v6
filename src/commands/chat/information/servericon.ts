import { BaseCommand } from '@core/BaseCommand.js';
import { CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class ServericonCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'servericon',
			description: 'Zeige das Icon des Servers an',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
			},
		});
	}

	public async run(): Promise<void> {
		const description: string = '### ' + this.emote('image') + ' Servericon';
		const iconEmbed: EmbedBuilder = this.clientUtils.createEmbed(description, null, 'normal');
		iconEmbed.setImage(this.guild.iconURL({ size: 256}));

		await this.interaction.followUp({ embeds: [iconEmbed] });
	}
}

export { ServericonCommand };