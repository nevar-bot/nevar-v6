import {
	CommandInteractionOptionResolver,
	EmbedBuilder,
	UserContextMenuCommandInteraction,
	ApplicationCommandType,
	ContextMenuCommandBuilder, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { BaseCommand } from '@core/BaseCommand.js'

class AvatarCommand extends BaseCommand<UserContextMenuCommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'avatar',
			dirname: import.meta.url,
			type: ApplicationCommandType.User,
			slashCommand: {
				register: true,
				data: new ContextMenuCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
			}

		});
	}

	public async run(): Promise<void> {
		const targetMember: any = this.interaction?.targetMember || this.interaction.targetUser;

		const description: string = '### ' + this.emote('image') + ' Avatar von ' + targetMember.toString();
		const avatarEmbed: EmbedBuilder = this.clientUtils.createEmbed(description, null, 'normal');
		avatarEmbed.setImage(targetMember.displayAvatarURL({ size: 256, extension: 'png' }));

		await this.interaction.followUp({ embeds: [avatarEmbed] });
	}
}

export { AvatarCommand };