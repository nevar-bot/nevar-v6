import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction,
	CommandInteractionOptionResolver,
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandRoleOption,
	SlashCommandSubcommandBuilder,
	PermissionsBitField,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class LevelrolesCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'levelroles',
			description: 'Verteile Rollen beim Erreichen eines bestimmten Levels',
			permissions: {
				bot: [],
				user: [Flags.ManageGuild, Flags.ManageRoles]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('add')
						.setDescription('Füge eine Level-Rolle hinzu')
						.addRoleOption((roleOption: SlashCommandRoleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle eine Rolle')
							.setRequired(true)
						)
						.addIntegerOption((integerOption: SlashCommandIntegerOption) => integerOption
							.setName('level')
							.setDescription('Wähle, bei welchem Level die Rolle vergeben werden soll')
							.setRequired(true)
							.setMinValue(1)
							.setMaxValue(200)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('remove')
						.setDescription('Entferne eine Level-Rolle')
						.addRoleOption((roleOption: SlashCommandRoleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle eine Rolle')
							.setRequired(true)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('list')
						.setDescription('Listet alle Level-Rollen')
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
		// Get role and level
		const role = this.options.getRole('rolle');
		const level: number = this.options.getInteger('level');

		// Check if role is already in the database
		if(this.data.guild.settings.levelsystem.roles.find((levelRole): boolean => levelRole.roleId === role.id)){
			const levelRole = this.data.guild.settings.levelsystem.roles.find((levelRole): boolean => levelRole.roleId === role.id);
			const alreadyExistsEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist bereits für **Level {1} als Levelrolle eingestellt**.', this.emote('error'), 'error', role.toString(), levelRole.level.toString());
			await this.interaction.followUp({ embeds: [alreadyExistsEmbed] });
			return;
		}

		// Check if role is managed
		if(role.managed){
			const managedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} kann **nicht als Levelrolle hinzugefügt werden**, da die Rolle **durch eine Integration verwaltet** wird.', this.emote('error'), 'error', role.toString());
			await this.interaction.followUp({ embeds: [managedEmbed] });
			return;
		}

		// Check if role is everyone
		if(role.id === this.guild.id){
			const everyoneEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **@everyone** Rolle kann **nicht als Levelrolle hinzugefügt werden**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [everyoneEmbed] });
			return;
		}

		// Add role to database
		try{
			const levelRole = {
				roleId: role.id,
				level: level
			};

			this.data.guild.settings.levelsystem.roles.push(levelRole);
			this.data.guild.markModified('settings.levelsystem.roles');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wurde für **Level {1} als Levelrolle hinzugefügt**.', this.emote('success'), 'success', role.toString(), level.toString());
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async remove(): Promise<void> {
		// Get role
		const role = this.options.getRole('rolle');

		// Check if role is in the database
		if(!this.data.guild.settings.levelsystem.roles.find((levelRole): boolean => levelRole.roleId === role.id)){
			const notFoundEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist **keine Levelrolle**.', this.emote('error'), 'error', role.toString());
			await this.interaction.followUp({ embeds: [notFoundEmbed] });
			return;
		}

		// Remove role from database
		try{
			this.data.guild.settings.levelsystem.roles = this.data.guild.settings.levelsystem.roles.filter((levelRole): boolean => levelRole.roleId !== role.id);
			this.data.guild.markModified('settings.levelsystem.roles');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wurde **als Levelrolle entfernt**.', this.emote('success'), 'success', role.toString());
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async list(): Promise<void> {
		const sortedLevelRoles: number[][] = [];

		for(let levelRole of this.data.guild.settings.levelsystem.roles){
			const role = this.guild.roles.cache.get(levelRole.roleId);
			if(role) sortedLevelRoles.push([levelRole.level, role.toString()]);
		}
		sortedLevelRoles.sort((a, b) => a[0] - b[0]);

		const formattedLevelRoles: string[] = [];
		for(let levelRole of sortedLevelRoles){
			formattedLevelRoles.push(this.emote('magic') + ' **Level ' + levelRole[0] + '**: ' + levelRole[1]);
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, formattedLevelRoles, this.emote('list') + ' Level-Rollen', 'Es wurden noch keine Level-Rollen hinzugefügt.');
	}
}

export { LevelrolesCommand };