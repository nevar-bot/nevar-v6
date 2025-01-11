import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, PermissionsBitField,
	SlashCommandStringOption, EmbedBuilder, SlashCommandUserOption, ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import ems from "enhanced-ms";
const ms = ems("de");
const { Flags } = PermissionsBitField;

class TimeoutCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'timeout',
			description: 'Sperre ein Mitglied für eine bestimmte Zeit',
			dirname: import.meta.url,
			permissions: {
				bot: [Flags.ModerateMembers],
				user: [Flags.ModerateMembers]
			},
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das Mitglied, welches du timeouten möchtest')
						.setRequired(true)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('dauer')
						.setDescription('Wähle eine Dauer (z.B. 1h, 1d, 1h 30m, etc.)')
						.setRequired(true)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('grund')
						.setDescription('Begründe den Timeout')
						.setRequired(false)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const member: any = this.options.getMember('mitglied');
		const duration: string = this.options.getString('dauer');
		const convertedDuration: number|void = ms(duration);
		const reason: string = this.options.getString('grund') || 'Kein Grund angegeben';

		if(!member){
			const memberIsMissingEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst ein Mitglied auswählen, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [memberIsMissingEmbed] });
			return;
		}

		// Check if user tries to ban himself
		if(member.user.id === this.member.user.id){
			const cantTimeoutYourselfEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du kannst **dich nicht selbst timeouten**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantTimeoutYourselfEmbed] });
			return;
		}

		// Check if user tries to ban the bot
		if(member.user.id === this.client.user.id){
			const cantTimeoutMyselfEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich kann **mich nicht selbst timeouten**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantTimeoutMyselfEmbed] });
			return;
		}

		// Check if target member has a higher role
		if (member.roles.highest.position >= this.member.roles.highest.position) {
			const higherRoleEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} hat eine **höhere oder gleich hohe Rolle** als du.', this.emote('error'), 'error', member.toString());
			await this.interaction.followUp({ embeds: [higherRoleEmbed] });
			return;
		}

		// Check if target member is moderatable
		if(member && !member?.moderatable){
			const notModeratableEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist **nicht moderierbar**.', this.emote('error'), 'error', member.toString());
			await this.interaction.followUp({ embeds: [notModeratableEmbed] });
			return;
		}

		// Check if user is already timeouted
		if(member.communicationDisabledUntil && member.communicationDisabledUntilTimestamp > Date.now()){
			const timeoutedUntilString: string = this.formatUtils.discordTimestamp(member.communicationDisabledUntilTimestamp, 'R')
			const alreadyTimeoutedEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} ist **bereits bis {1} getimeouted**.', this.emote('error'), 'error', member.toString(), timeoutedUntilString);
			await this.interaction.followUp({ embeds: [alreadyTimeoutedEmbed] });
			return;
		}

		// Check if duration is valid
		if(!convertedDuration){
			const invalidDurationEmbed: EmbedBuilder = this.clientUtils.createEmbed('Gib eine **gültige Dauer an, bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidDurationEmbed] });
			return;
		}

		// Check if duration is more than 28 days
		if(convertedDuration > 28 * 24 * 60 * 60 * 1000){
			const tooLongDurationEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Dauer kann maximal **28 Tage betragen**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [tooLongDurationEmbed] });
			return;
		}


		const timeoutedUntilStringRelative: string = this.formatUtils.discordTimestamp(Date.now() + convertedDuration, 'R');
		const timeoutedUntilString: string = this.formatUtils.discordTimestamp(Date.now() + convertedDuration, 'F');

		try{
			await member.timeout(convertedDuration, this.member.user.username + ' - ' + reason);

			// Inform target user about the ban
			const privateTimeoutInformationText: string =
				'### ' + this.emote('timeout') + ' Du wurdest auf ' + this.guild.name + ' getimeouted!\n\n' +
				'-# ' + this.emote('text') + ' **Grund**: ' + reason + '\n' +
				'-# ' + this.emote('calendar') + ' **Timeout endet am**: ' + timeoutedUntilString + '\n' +
				'-# ' + this.emote('reminder') + ' **Timeout endet**: ' + timeoutedUntilStringRelative + '\n' +
				'-# ' + this.emote('user') + ' **Moderator**: ' + this.member.user.toString();

			const privateTimeoutInformationEmbed: EmbedBuilder = this.clientUtils.createEmbed(privateTimeoutInformationText, null, 'error');
			await member.user.send({ embeds: [privateTimeoutInformationEmbed] }).catch((): void => {});

			// Inform the guild about the ban
			const publicTimeoutInformationText: string =
				'### ' + this.emote('timeout') + ' ' + member.toString() + ' wurde getimeouted!\n\n' +
				'-# ' + this.emote('text') + ' **Grund**: ' + reason + '\n' +
				'-# ' + this.emote('calendar') + ' **Timeout endet am**: ' + timeoutedUntilString + '\n' +
				'-# ' + this.emote('reminder') + ' **Timeout endet**: ' + timeoutedUntilStringRelative + '\n';
			const publicTimeoutInformationEmbed: EmbedBuilder = this.clientUtils.createEmbed(publicTimeoutInformationText, null, 'error');

			const timeoutGifs: string[] = [
				'https://y.yarn.co/afa74a80-1e0c-4137-ad26-978ed1d6934b_text.gif',
				'https://c.tenor.com/CUEZfVScac0AAAAd/tenor.gif',
				'https://c.tenor.com/kgPZdXWdLnEAAAAd/tenor.gif',
				'https://c.tenor.com/_21JbI4Kht4AAAAd/tenor.gif',
				'https://c.tenor.com/eQudwJAYWjsAAAAd/tenor.gif'
			];

			const randomTimeoutGif: string = this.randomUtils.randomChoice(timeoutGifs);

			publicTimeoutInformationEmbed.setImage(randomTimeoutGif);

			await this.interaction.followUp({ embeds: [publicTimeoutInformationEmbed] });

			// Log the timeout
			const logMessage: string =
				'### ' + this.emote('timeout') + ' ' + member.toString() + ' getimeouted\n\n' +
				'-# ' + this.emote('text') + ' **Grund**: ' + reason + '\n' +
				'-# ' + this.emote('calendar') + ' **Timeout endet am**: ' + timeoutedUntilString + '\n' +
				'-# ' + this.emote('reminder') + ' **Timeout endet**: ' + timeoutedUntilStringRelative;

			const logEmbed: EmbedBuilder = this.clientUtils.createEmbed(logMessage, null, 'normal')
				.setAuthor({ name: this.member.user.username, iconURL: this.member.user.displayAvatarURL() });

			await this.guildUtils.log(logEmbed, 'moderation');

		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { TimeoutCommand };