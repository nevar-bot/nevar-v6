import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction,
	CommandInteractionOptionResolver,
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandRoleOption,
	SlashCommandSubcommandBuilder,
	PermissionsBitField,
	ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class DoublexpCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'doublexp',
			description: 'Verwalte doppelte XP im Levelsystem',
			permissions: {
				bot: [],
				user: [
					Flags.ManageGuild, 
					Flags.ManageRoles
				]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('add')
						.setDescription('Aktiviere doppeltes XP für eine Rolle')
						.addRoleOption((roleOption: SlashCommandRoleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle eine Rolle')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('remove')
						.setDescription('Deaktiviere doppeltes XP für eine Rolle')
						.addRoleOption((roleOption: SlashCommandRoleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle eine Rolle')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('list')
						.setDescription('Zeige alle Rollen, welche doppeltes XP erhalten')
					)
			},
		});
	}

	public async run(): Promise<void> {
		// Switch subcommands
		const subCommand: string = this.options.getSubcommand();

		switch(subCommand){
			case 'add':
				await this.add();
				break;
			case 'remove':
				await this.remove();
				break;
			case 'list':
				await this.list();
				break;
		}
	}

	private async add(): Promise<void> {
		// Get role
		const role = this.options.getRole('rolle');

		// Check if role is already in the database
		if(this.data.guild.settings.levelsystem.doubleXP.includes(role.id)){
			const alreadyAddedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} erhält **bereits doppeltes XP**.', this.emote('error'), 'error', role.toString());
			await this.interaction.followUp({ embeds: [alreadyAddedEmbed] });
			return;
		}

		// Check if role is managed
		if(role.managed){
			const managedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} kann **kein doppeltes XP** erhalten, da die Rolle **durch eine Integration verwaltet** wird.', this.emote('error'), 'error', role.toString());
			await this.interaction.followUp({ embeds: [managedEmbed] });
			return;
		}

		// Check if role is everyone
		if(role.id === this.guild.id){
			const everyoneEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **@everyone** Rolle kann **kein doppeltes XP** erhalten.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [everyoneEmbed] });
			return;
		}

		// Check if guild has reached limit
		if(this.data.guild.settings.levelsystem.doubleXP.length >= this.config.get('databaseLimits.doublexp')){
			const reachedLimitEmbed: EmbedBuilder = this.clientUtils.createEmbed('Es können **maximal {0} Rollen** doppeltes XP erhalten.', this.emote('error'), 'error', this.config.get('databaseLimits.doublexp'));
			await this.interaction.editReply({ embeds: [reachedLimitEmbed] });
			return;
		}

		// Add role to database
		try{
			this.data.guild.settings.levelsystem.doubleXP.push(role.id);
			this.data.guild.markModified('settings.levelsystem.doubleXP');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} erhält ab sofort **doppeltes XP**.', this.emote('success'), 'success', role.toString());
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async remove(): Promise<void> {
		// Get role
		const role = this.options.getRole('rolle');

		// Check if role is not in the database
		if(!this.data.guild.settings.levelsystem.doubleXP.includes(role.id)){
			const notAddedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} erhält **kein doppeltes XP**.', this.emote('error'), 'error', role.toString());
			await this.interaction.followUp({ embeds: [notAddedEmbed] });
			return;
		}

		// Remove role from database
		try{
			this.data.guild.settings.levelsystem.doubleXP = this.data.guild.settings.levelsystem.doubleXP.filter((id: string) => id !== role.id);
			this.data.guild.markModified('settings.levelsystem.doubleXP');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} erhält ab sofort **kein doppeltes XP mehr**.', this.emote('success'), 'success', role.toString());
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async list(): Promise<void> {
		const roles: string[] = [];

		for(let roleId of this.data.guild.settings.levelsystem.doubleXP){
			const role = this.guild.roles.cache.get(roleId);
			if(role) roles.push(this.emote('roles') + ' ' + role.toString());
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, roles, this.emote('list') + ' Rollen mit doppeltem XP', 'Es erhalten noch keine Rollen doppeltes XP.');
	}
}

export { DoublexpCommand };