import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction,
	CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder, SlashCommandUserOption, PermissionsBitField
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class WarningsCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'warnings',
			description: 'Zeigt alle Verwarnungen eines Mitgliedes an',
			dirname: import.meta.url,
			permissions: {
				bot: [Flags.KickMembers],
				user: [Flags.KickMembers]
			},
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das Mitglied')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const member: any = this.options.getMember('mitglied');

		const memberData = await this.databaseUtils.findOrCreateMember(member.user.id, this.guild.id);

		const warnings: { moderator: string, reason: string, date: number }[] = memberData.warnings;

		const warnList: string[] = [];

		for(let i = 0; i < warnings.length; i++){
			const warning = warnings[i];
			const moderator = this.client.users.cache.get(warning.moderator) || await this.client.users.fetch(warning.moderator).catch(() => {});
			warnList.push(
				'### ' + this.emote('warning') + ' Verwarnung ' + (i + 1) + '\n' +
				this.emote('certifiedmoderator') + ' Moderator: ' + (moderator ? moderator.toString() : 'Unbekannt') + '\n' +
				this.emote('text') + ' Grund: ' + warning.reason + '\n' +
				this.emote('calendar') + ' Verwarnt am ' + this.formatUtils.discordTimestamp(warning.date, 'f') + ' (' + this.formatUtils.discordTimestamp(warning.date, 'R') + ')'
			);
		}

		await this.paginationUtils.sendPaginatedEmbed(this.interaction, 5, warnList, this.emote('list') + ' Verwarnungen von ' + member.toString(), member.toString() + ' wurde bisher noch nicht verwarnt.');
	}
}

export { WarningsCommand };