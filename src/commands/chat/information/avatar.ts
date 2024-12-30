import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType,
	SlashCommandBuilder, SlashCommandUserOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class AvatarCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'avatar',
			description: 'Schaue dir das Profilbild eines Mitglieds an',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle, wessen Profilbild du sehen möchtest')
						.setRequired(false)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const targetMember: any = this.options.getMember('mitglied') ?? this.member;

		const description: string = '### ' + this.emote('image') + ' Avatar von ' + targetMember.toString();
		const avatarEmbed: EmbedBuilder = this.clientUtils.createEmbed(description, null, 'normal');
		avatarEmbed.setImage(targetMember.displayAvatarURL({ size: 256, extension: 'png' }));

		await this.interaction.followUp({ embeds: [avatarEmbed] });
	}
}

export { AvatarCommand };