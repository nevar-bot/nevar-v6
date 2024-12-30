import { BaseCommand } from '@core/BaseCommand.js';
import { CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class UptimeCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'uptime',
			description: 'Zeigt die Betriebszeit des Bots an',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
			},
		});
	}

	public async run(): Promise<void> {
		const uptime: number = this.client.uptime;

		const uptimeTimestampRelative: string = this.formatUtils.discordTimestamp(Date.now() - uptime, 'R');
		const uptimeTimestamp: string = this.formatUtils.discordTimestamp(Date.now() - uptime, 'F');

		const uptimeMessage: string = 'Ich laufe seit {0}. Das war {1}.';
		const uptimeEmbed: EmbedBuilder = this.clientUtils.createEmbed(uptimeMessage, this.emote('calendar'), 'normal', uptimeTimestamp, uptimeTimestampRelative);

		await this.interaction.followUp({ embeds: [uptimeEmbed] });
	}
}

export { UptimeCommand };