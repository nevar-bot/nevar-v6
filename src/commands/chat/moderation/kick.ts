import { BaseCommand } from '@core/BaseCommand.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder,
	SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption, PermissionsBitField,
	ApplicationIntegrationType,
	InteractionContextType
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class KickCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'kick',
			description: 'Kicke ein Mitglied vom Server',
			permissions: {
				bot: [Flags.KickMembers],
				user: [Flags.KickMembers]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das Mitglied, das du kicken möchtest')
						.setRequired(true)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('grund')
						.setDescription('Gib ggf. einen Grund an')
						.setRequired(false)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const member: any = this.options.getMember('mitglied');
		const reason: string = this.options.getString('grund') || 'Kein Grund angegeben';

		// Check if member is valid
		if(!member){
			const missingMemberEmbed: EmbedBuilder = this.clientUtils.createEmbed('Wähle ein Servermitglied aus, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [missingMemberEmbed] });
			return;
		}

		// Check if user tries to kick himself
		if(member.user.id === this.interaction.user.id){
			const cantKickYourselfEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du kannst dich **nicht selbst kicken**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantKickYourselfEmbed] });
			return;
		}

		// Check if user tries to kick the bot
		if(member.user.id === this.client.user.id){
			const cantKickBotEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich kann mich **nicht selbst kicken**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [cantKickBotEmbed] });
			return;
		}

		// Check if member is kickable
		if(!member.kickable){
			const cantKickEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} **kann nicht gekickt** werden.', this.emote('error'), 'error', member.toString());
			await this.interaction.followUp({ embeds: [cantKickEmbed] });
			return;
		}

		// Check if member has higher or equal role
		if(member.roles.highest.position >= this.member.roles.highest.position){
			const higherRoleEmbed: EmbedBuilder = this.clientUtils.createEmbed('{0} hat eine **höhere oder gleich hohe Rolle** als du.', this.emote('error'), 'error', member.toString());
			await this.interaction.followUp({ embeds: [higherRoleEmbed] });
			return;
		}

		// Send private message to member
		const privateKickInformationText: string =
			'### ' + this.emote('ban') + ' Du wurdest von ' + this.guild.name + ' gekickt!\n\n' +
			'-# ' + this.emote('text') + ' **Grund**: ' + reason + '\n' +
			'-# ' + this.emote('user') + ' **Moderator**: ' + this.member.user.toString();

		const privateKickInformationEmbed: EmbedBuilder = this.clientUtils.createEmbed(privateKickInformationText, null, 'error');
		const privateKickInformationMessage: any = await member.user.send({ embeds: [privateKickInformationEmbed] }).catch((): void => {});

		try{
			// Kick member
			await member.kick(reason);

			// Send public information message
			const publicKickInformationText: string =
				'### ' + this.emote('ban') + ' ' + member.toString() + ' wurde gekickt!';
			const publicKickInformationEmbed: EmbedBuilder = this.clientUtils.createEmbed(publicKickInformationText, null, 'error')
				.setImage('https://media.tenor.com/f-oMe23cM2UAAAAd/discord-server.gif');

			await this.interaction.followUp({ embeds: [publicKickInformationEmbed] });

			// Log action to moderation log channel
			const guildLoggingText: string =
				'### ' + this.emote('ban') + ' ' + member.toString() + ' vom Server gekickt\n\n' +
				'-# ' + this.emote('text') + ' **Grund**: ' + reason;

			const guildLoggingEmbed: EmbedBuilder = this.clientUtils.createEmbed(guildLoggingText, null, 'normal')
				.setAuthor({ name: this.interaction.user.username, iconURL: this.interaction.user.displayAvatarURL() });

			await this.guildUtils.log(guildLoggingEmbed, 'moderation');

		}catch(error: unknown){
			await this.handleUnknownError(error);
			privateKickInformationMessage?.delete().catch((): void => {});
		}
	}
}

export { KickCommand };