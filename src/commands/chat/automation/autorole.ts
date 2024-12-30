import { BaseCommand } from '@core/BaseCommand.js';
import { BaseClient } from '@core/BaseClient.js';

import {
	SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandRoleOption,
	EmbedBuilder, CommandInteraction, CommandInteractionOptionResolver,
	PermissionsBitField, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';

const { Flags } = PermissionsBitField;

class AutoroleCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'autorole',
			description: 'Automatisches Zuweisen von Rollen an neue Mitglieder',
			dirname: import.meta.url,

			permissions: {
				bot: [
					Flags.ManageRoles
				],
				user: [
					Flags.ManageRoles,
					Flags.ManageGuild,
				]
			},

			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					// Set application integration type
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					// Add subcommand: add
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('hinzufügen')
						.setDescription('Weist neuen Mitgliedern automatisch eine Rolle zu')
						// Add role option
						.addRoleOption((roleOption: SlashCommandRoleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle deine gewünschte Rolle')
							.setRequired(true)
						)
					)
					// Add subcommand: remove
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('entfernen')
						.setDescription('Weist eine Rolle neuen Mitgliedern nicht mehr automatisch zu')
						// Add role option
						.addRoleOption((roleOption: SlashCommandRoleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle die zu entfernende Rolle')
							.setRequired(true)
						)
					)
					// Add subcommand: list
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('liste')
						.setDescription('Zeigt alle Rollen an, die neuen Mitgliedern automatisch zugewiesen werden')
					)
			},
		});
	}

	/**
	 * Main command function
	 */
	public async run(): Promise<void> {
		// Switch subcommands
		const selectedSubCommand: string = this.options.getSubcommand();
		switch (selectedSubCommand) {
			case 'hinzufügen':
				await this.add();
				break;
			case 'entfernen':
				await this.remove();
				break;
			case 'liste':
				await this.list();
				break;
		}
	}

	/**
	 * Add autorole
	 * @private
	 */
	private async add(): Promise<void> {
		try{
			// Get role options
			const role = this.options.getRole('rolle');

			// Check if role is already set as auto role
			if(this.data.guild.settings.welcome.autoroles.includes(role.id)){
				const alreadyExistsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neuen Mitgliedern wird {0} **bereits automatisch zugewiesen**.', this.emote('error'), 'error', role.toString());
				await this.interaction.followUp({ embeds: [alreadyExistsEmbed] });
				return;
			}

			// Check if role is @everyone
			if(role.id === this.guild.roles.everyone.id){
				const isEveryoneEmbed: EmbedBuilder = this.clientUtils.createEmbed('@everyone kann **nicht als eine Autorolle ausgewählt werden**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [isEveryoneEmbed] });
				return;
			}

			// Check if role is managed by integration
			if(role.managed){
				const isManagedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wird von einer Integration verwaltet, und kann **nicht als eine Autorolle ausgewählt werden**.', this.emote('error'), 'error', role.toString());
				await this.interaction.followUp({ embeds: [isManagedEmbed] });
				return;
			}

			// Check if role is higher than bot's highest role
			if(this.guild.members.me.roles.highest.position <= role.position){
				const isTooHighEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} hat eine höhere Position als meine höchste Rolle, und kann **nicht als eine Autorolle ausgewählt werden**.', this.emote('error'), 'error', role.toString());
				await this.interaction.followUp({ embeds: [isTooHighEmbed] });
				return;
			}

			// Save autorole to database
			this.data.guild.settings.welcome.autoroles.push(role.id);
			this.data.guild.markModified('settings.welcome.autoroles');
			await this.data.guild.save();

			// Send confirmation embed
			const autoroleCreatedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neuen Mitgliedern wird absofort {0} **automatisch zugewiesen**.', this.emote('success'), 'success', role.toString());
			await this.interaction.followUp({ embeds: [autoroleCreatedEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * Remove autorole from database
	 * @private
	 */
	private async remove(): Promise<void> {
		try{
			// Get role option
			const role = this.options.getRole('rolle');

			// Check if autorole exists
			if(!this.data.guild.settings.welcome.autoroles.includes(role.id)){
				const doesNotExistEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neuen Mitgliedern wird {0} aktuell **nicht automatisch zugewiesen**.', this.emote('error'), 'error', role.toString());
				await this.interaction.followUp({ embeds: [doesNotExistEmbed] });
				return;
			}

			// Remove autorole from database
			this.data.guild.settings.welcome.autoroles = this.data.guild.settings.welcome.autoroles.filter((roleId: string): boolean => roleId !== role.id);
			this.data.guild.markModified('settings.welcome.autoroles');
			await this.data.guild.save();

			// Send confirmation embed
			const autoRoleRemovedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Neuen Mitgliedern wird {0} absofort **nicht mehr automatisch zugewiesen**.', this.emote('success'), 'success', role.toString());
			await this.interaction.editReply({ embeds: [autoRoleRemovedEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	/**
	 * List all autoroles
	 * @private
	 */
	private async list(): Promise<void> {
		try{
			// Map autorole settings to array
			const autoRoleSettings: object[] = this.data.guild.settings.welcome.autoroles;
			const autoRoleArray: string[] = autoRoleSettings.map((autoRole: any): string => {
				const role: string = this.guild.roles.cache.get(autoRole)?.toString() || 'Unbekannte Rolle';
				return this.emote('flag') + ' ' + role;
			});

			// Send paginated embed
			await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, autoRoleArray, this.emote('list') + ' Autorollen', 'Neuen Mitgliedern werden **aktuell keine Rollen automatisch zugewiesen**.');

		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { AutoroleCommand }