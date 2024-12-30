import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction,
	CommandInteractionOptionResolver,
	PermissionsBitField,
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class LevelsystemCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'levelsystem',
			description: 'Aktiviere oder deaktiviere das Levelsystem',
			permissions: {
				bot: [],
				user: [Flags.ManageGuild]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('enable')
						.setDescription('Aktiviere das Levelsystem')
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('disable')
						.setDescription('Deaktiviere das Levelsystem')
					)
			},
		});
	}

	public async run(): Promise<void> {
		// Switch subcommands
		const subCommand: string = this.options.getSubcommand();

		switch(subCommand){
			case 'enable':
				await this.enable();
				break;
			case 'disable':
				await this.disable();
				break;
		}
	}

	private async enable(): Promise<void> {
		// Check if the level system is already enabled
		if(this.data.guild.settings.levelsystem.enabled){
			const alreadyEnabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Levelsystem ist **bereits aktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyEnabledEmbed] });
			return;
		}

		// Enable the level system
		try{
			this.data.guild.settings.levelsystem.enabled = true;
			this.data.guild.markModified('settings.levelsystem.enabled');
			await this.data.guild.save();

			const enabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Levelsystem **wurde aktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [enabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async disable(): Promise<void> {
		// Check if the level system is already disabled
		if(!this.data.guild.settings.levelsystem.enabled){
			const alreadyDisabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Levelsystem ist **bereits deaktiviert**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [alreadyDisabledEmbed] });
			return;
		}

		// Disable the level system
		try{
			this.data.guild.settings.levelsystem.enabled = false;
			this.data.guild.markModified('settings.levelsystem.enabled');
			await this.data.guild.save();

			const disabledEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das Levelsystem **wurde deaktiviert**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [disabledEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { LevelsystemCommand };