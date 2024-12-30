import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction,
	CommandInteractionOptionResolver,
	GuildMember, InteractionContextType,
	SlashCommandBuilder,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class TimeoutlistCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'timeout-list',
			description: 'Listet alle Mitglieder auf, die sich im Timeout befinden',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
			},
		});
	}

	public async run(): Promise<void> {
		try{
			await this.guild.members.fetch();

			const timeoutedMembers: string[] = [];
			this.guild.members.cache.forEach((member: GuildMember): void => {
				if(member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()){
					const timeoutedUntilText: string =
						'### ' + this.emote('timeout') + ' ' + member.toString() + '\n' +
						'-# ' + this.emote('calendar') + ' **Timeout endet am**: ' + this.formatUtils.discordTimestamp(member.communicationDisabledUntilTimestamp, 'f') + '\n' +
						'-# ' + this.emote('reminder') + ' **Timeout endet**: ' + this.formatUtils.discordTimestamp(member.communicationDisabledUntilTimestamp, 'R');
					timeoutedMembers.push(timeoutedUntilText);
				}
			});

			await this.paginationUtils.sendPaginatedEmbed(this.interaction, 5, timeoutedMembers, this.emote('list') + ' Mitglieder im Timeout', 'Es sind aktuell keine Mitglieder im Timeout.');
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { TimeoutlistCommand };