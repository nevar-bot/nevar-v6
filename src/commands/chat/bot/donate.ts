import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	ButtonBuilder, ButtonStyle, CommandInteraction,
	CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType, SlashCommandBuilder,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class DonateCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'donate',
			description: 'Wir freuen uns über jeden, der uns unterstützen möchte!',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
			},
		});
	}

	public async run(): Promise<void> {
		const donateText: string = 'Wir betreiben {0} **vollständig in unserer Freizeit** und **zahlen anfallende Kosten** - darunter zum Beispiel Server- und Domainkosten - **aus eigener Tasche.** Über den Button kannst uns einen Betrag spenden, der uns **ausschließlich zweckgebunden zur Verfügung steht**.';
		const donateEmbed: EmbedBuilder = this.clientUtils.createEmbed(donateText, this.emote('heart'), 'normal', this.client.user.displayName);
		const donateButton: ButtonBuilder = this.componentsUtils.createButton(null, 'Spenden', ButtonStyle.Link, this.emote('heart'), false, this.config.get('support.donate'));
		const donateActionRow = this.componentsUtils.createActionRow(donateButton);

		await this.interaction.followUp({ embeds: [donateEmbed], components: [donateActionRow] });
	}
}

export { DonateCommand };