import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction, CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder, SlashCommandUserOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class RickrollCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'rickroll',
			description: 'Never gonna give you up, never gonna let you down...',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das Mitglied, welches du rickrollen möchtest')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const targetMember = this.options.getMember('mitglied');

		await this.interaction.deleteReply();
		await this.interaction.channel.send({ content: targetMember.toString(), files: [{ attachment: 'https://media1.tenor.com/m/x8v1oNUOmg4AAAAd/rickroll-roll.gif', name: 'SPOILER_rickroll.gif' }] });
	}
}

export { RickrollCommand };