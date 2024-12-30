import { BaseCommand } from '@core/BaseCommand.js';
import { Message, EmbedBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class RebootCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'reboot',
			description: 'Starte den Bot neu',
			dirname: import.meta.url,
			restrictions: {
				ownerOnly: true
			},
			slashCommand: {
				register: false,
			},
		});
	}

	public async run(): Promise<void> {
		const rebootEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der Bot wird **neugestartet**.', this.emote('warning'), 'warning');
		await this.interaction.reply({ embeds: [rebootEmbed] });
		process.exit(1);
	}
}

export { RebootCommand };