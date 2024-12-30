import { BaseCommand } from '@core/BaseCommand.js';
import {
	ChannelType,
	CommandInteraction,
	CommandInteractionOptionResolver,
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	PermissionsBitField,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class LevelexcludeCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'levelexclude',
			description: 'Schließe Rollen oder Kanäle vom Levelsystem aus',
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
						.setName('add')
						.setDescription('Schließe eine Rolle oder einen Kanal vom Levelsystem aus')
						.addRoleOption((roleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle eine Rolle aus')
							.setRequired(false)
						)
						.addChannelOption((channelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle einen Kanal aus')
							.setRequired(false)
							.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildCategory, ChannelType.PublicThread, ChannelType.GuildForum)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('remove')
						.setDescription('Füge eine Rolle oder einen Kanal wieder dem Levelsystem hinzu')
						.addRoleOption((roleOption) => roleOption
							.setName('rolle')
							.setDescription('Wähle eine Rolle aus')
							.setRequired(false)
						)
						.addChannelOption((channelOption) => channelOption
							.setName('kanal')
							.setDescription('Wähle einen Kanal aus')
							.setRequired(false)
							.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildCategory, ChannelType.PublicThread, ChannelType.GuildForum)
						)
					)
					.addSubcommand((subCommand: SlashCommandSubcommandBuilder) => subCommand
						.setName('list')
						.setDescription('Listet alle vom Levelsystem ausgeschlossenen Rollen und Kanäle')
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
		// Get item to exclude
		const item: any = this.options.getRole('rolle') ?? this.options.getChannel('kanal');

		// Check if item is set
		if(!item){
			const missingItemEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine **Rolle oder einen Kanal** angeben, bevor du du den Befehl absendest.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [missingItemEmbed] });
			return;
		}

		const isRole: boolean = item.constructor.name === 'Role';

		// Check if item is already in the database
		if(this.data.guild.settings.levelsystem.exclude[isRole ? 'roleIds' : 'channelIds'].includes(item.id)){
			const alreadyAddedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wurde **bereits vom Levelsystem ausgeschlossen**.', this.emote('error'), 'error', item.toString());
			await this.interaction.followUp({ embeds: [alreadyAddedEmbed] });
			return;
		}

		// Role specific checks
		if(isRole){
			// Check if role is managed
			if(item.managed){
				const managedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} kann **nicht vom Levelsystem ausgeschlossen werden**, da die Rolle **durch eine Integration verwaltet** wird.', this.emote('error'), 'error', item.toString());
				await this.interaction.followUp({ embeds: [managedEmbed] });
				return;
			}

			// Check if role is everyone
			if(item.id === this.guild.id){
				const everyoneEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die **@everyone** Rolle kann **nicht vom Levelsystem ausgeschlossen werden**.', this.emote('error'), 'error');
				await this.interaction.followUp({ embeds: [everyoneEmbed] });
				return;
			}
		}

		// Update database
		try{
			this.data.guild.settings.levelsystem.exclude[isRole ? 'roleIds' : 'channelIds'].push(item.id);
			this.data.guild.markModified('settings.levelsystem.exclude');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wird ab sofort **vom Levelsystem ausgeschlossen**.', this.emote('success'), 'success', item.toString());
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async remove(): Promise<void> {
		// Get item to include
		const item: any = this.options.getRole('rolle') ?? this.options.getChannel('kanal');

		// Check if item is set
		if(!item){
			const missingItemEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine **Rolle oder einen Kanal** angeben, bevor du du den Befehl absendest.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [missingItemEmbed] });
			return;
		}

		const isRole: boolean = item.constructor.name === 'Role';

		// Check if item is not in the database
		if(!this.data.guild.settings.levelsystem.exclude[isRole ? 'roleIds' : 'channelIds'].includes(item.id)){
			const notAddedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wurde **nicht vom Levelsystem ausgeschlossen**.', this.emote('error'), 'error', item.toString());
			await this.interaction.followUp({ embeds: [notAddedEmbed] });
			return;
		}

		// Update database
		try {
			this.data.guild.settings.levelsystem.exclude[isRole ? 'roleIds' : 'channelIds'] = this.data.guild.settings.levelsystem.exclude[isRole ? 'roleIds' : 'channelIds'].filter((id: string) => id !== item.id);
			this.data.guild.markModified('settings.levelsystem.exclude');
			await this.data.guild.save();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} wird ab sofort **nicht mehr vom Levelsystem ausgeschlossen**.', this.emote('success'), 'success', item.toString());
			await this.interaction.followUp({ embeds: [successEmbed] });
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}

	private async list(): Promise<void> {
		const roles: string[] = [];
		const channels: string[] = [];

		// Get excluded roles
		for(const roleId of this.data.guild.settings.levelsystem.exclude.roleIds){
			const role = this.guild.roles.cache.get(roleId);
			if(role) roles.push(this.emote('roles') + ' ' + role.toString());
		}

		// Get excluded channels
		for(const channelId of this.data.guild.settings.levelsystem.exclude.channelIds){
			const channel = this.guild.channels.cache.get(channelId);
			if(channel) channels.push(this.emote('channel') + ' ' + channel.toString());
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 10, roles.concat(channels), this.emote('list') + ' Ausgeschlossene Rollen und Kanäle', 'Es wurden noch keine Rollen oder Kanäle vom Levelsystem ausgeschlossen.');
	}
}

export { LevelexcludeCommand };