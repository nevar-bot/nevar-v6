import { BaseCommand } from '@core/BaseCommand.js';
import { Message, EmbedBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class EnableCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'enable',
			description: 'Aktiviert einen Befehl',
			dirname: import.meta.url,
			restrictions: {
				ownerOnly: true
			},
			slashCommand: {
				register: false
			},
		});
	}

	public async run(): Promise<void> {
		const command: string = this.options[0];

		if(!command){
			const invalidOptionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst einen Befehl angeben, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidOptionsEmbed] });
			return;
		}

		// Check if command exists
		const commandExists = this.client.commands.chat.get(command) || this.client.commands.message.get(command) || this.client.commands.user.get(command);

		if(!commandExists){
			const invalidCommandEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der angegebene Befehl existiert nicht.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidCommandEmbed] });
			return;
		}

		// Check if command is disabled
		const commandIsEnabled = !await this.databaseUtils.commandIsDisabled(command);
		if(commandIsEnabled){
			const notDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der angegebene Befehl ist bereits aktiviert.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [notDisabledEmbed] });
			return;
		}

		// Disable command
		await this.databaseUtils.enableCommand(command);
		const disabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der **{0}-Befehl wurde aktiviert**.', this.emote('success'), 'success', command.charAt(0).toUpperCase() + command.slice(1));
		await this.interaction.reply({ embeds: [disabledEmbed] });
	}
}

export { EnableCommand };