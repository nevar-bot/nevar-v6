import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationCommandType, ApplicationIntegrationType,
	CommandInteractionOptionResolver,
	ContextMenuCommandBuilder,
	EmbedBuilder, InteractionContextType,
	UserContextMenuCommandInteraction,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class JoindateCommand extends BaseCommand<UserContextMenuCommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'joindate',
			dirname: import.meta.url,
			type: ApplicationCommandType.User,
			slashCommand: {
				register: true,
				data: new ContextMenuCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
			}
		});
	}

	public async run(): Promise<void> {
		const targetMember: any = this.interaction.targetMember;

		const description: string =
			'### ' + this.emote('user') + ' ' + targetMember.toString() + '\n' +
			this.emote('discord') + ' Discord betreten am ' + this.formatUtils.discordTimestamp(targetMember.user.createdTimestamp, 'F') + '\n' +
			this.emote('join') + ' **' + this.guild.name + '** betreten am ' + this.formatUtils.discordTimestamp(targetMember.joinedTimestamp, 'F');
		const avatarEmbed: EmbedBuilder = this.clientUtils.createEmbed(description, null, 'normal');

		await this.interaction.followUp({ embeds: [avatarEmbed] });
	}
}

export { JoindateCommand };