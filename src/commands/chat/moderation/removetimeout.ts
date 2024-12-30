import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder,
	SlashCommandUserOption, EmbedBuilder, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class RemovetimeoutCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'remove-timeout',
			description: 'Hole ein Mitglied aus dem Timeout',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das Mitglied, welches du aus dem Timeout holen möchtest')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const member: any = this.options.getMember('mitglied');

		if(!member){
			const memberIsMissingEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst ein Mitglied auswählen, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [memberIsMissingEmbed] });
			return;
		}

		if(!member.communicationDisabledUntil || member.communicationDisabledUntil < Date.now()){
			const memberIsNotTimeoutedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist **nicht getimeouted**.', this.emote('error'), 'error', member.toString());
			await this.interaction.followUp({ embeds: [memberIsNotTimeoutedEmbed] });
			return;
		}

		try{
			await member.timeout(null, this.member.user.username + ' - /remove-timeout');

			const memberUntimeoutedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der Timeout von {0} **wurde aufgehoben**.', this.emote('success'), 'success', member.toString())
				.setImage('https://c.tenor.com/u9_jlCh0j_oAAAAC/tenor.gif');
			await this.interaction.followUp({ embeds: [memberUntimeoutedEmbed] });

			const logMessageText: string =
				'### ' + this.emote('timeout') + ' Timeout von ' + member.toString() + ' aufgehoben';

			const logMessageEmbed: EmbedBuilder = this.clientUtils.createEmbed(logMessageText, null, 'normal')
				.setAuthor({ name: this.member.user.tag, iconURL: this.member.displayAvatarURL() });

			return this.guildUtils.log(logMessageEmbed, 'moderation');
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { RemovetimeoutCommand };