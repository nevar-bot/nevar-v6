import { BaseClient } from '@core/BaseClient.js';
import { BaseEvent } from '@core/BaseEvent.js';
import { ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, Guild, PermissionsBitField } from 'discord.js';

class GuildCreateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(createdGuild: Guild): Promise<any> {
		await createdGuild.fetch().catch((e: any): void => {});
		if (!createdGuild || !createdGuild.available || !createdGuild.id) return;

		try{
			// After invite message
			const firstChannel: any = createdGuild.channels.cache
				.filter((channel: any): boolean => channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)
				.find((channel: any): boolean => channel.permissionsFor(createdGuild.members.me).has(PermissionsBitField.Flags.SendMessages));

			const helpCommand: string = await this.clientUtils.commandMention('help');
			const flooredGuildCount: number = Math.floor(this.client.guilds.cache.size / 10) * 10;

			const afterInviteMessage: string =
				'### ' + this.emote('logo_icon') + ' Danke, dass ich hier sein darf!\n\n' +
				this.emote('shine') + ' Ich bin ' + this.client.user.username + ' und darf **derzeit über ' + flooredGuildCount + ' Server unterstützen**.\n' +
				this.emote('arrow_right') + ' Eine **Liste meiner Befehle** erhältst du über den **' + helpCommand + ' Befehl**.\n\n' +
				'-# ' + this.emote('question_mark') + ' Du hast **Fragen, Anregungen oder Probleme**? Auf meinem **[Support-Server](' + this.client.support + ') sind wir gerne für dich da**!';

			const afterInviteEmbed: EmbedBuilder = this.clientUtils.createEmbed(afterInviteMessage, null, 'normal').setThumbnail(this.client.user.displayAvatarURL());

			const inviteButton: ButtonBuilder = this.clientUtils.createButton(null, 'Einladen', ButtonStyle.Link, this.emote('logo_icon'), false, this.clientUtils.createInvite());
			const supportButton: ButtonBuilder = this.clientUtils.createButton(null, 'Support', ButtonStyle.Link, this.emote('discord'), false, this.client.support);
			const voteButton: ButtonBuilder = this.clientUtils.createButton(null, 'Vote für mich', ButtonStyle.Link, this.emote('heart'), false, 'https://top.gg/bot/' + this.client.user.id + '/vote');
			const donateButton: ButtonBuilder = this.clientUtils.createButton(null, 'Unterstützen', ButtonStyle.Link, this.emote('gift'), false, 'https://prohosting24.de/cp/donate/nevar');

			const afterInviteComponentsRow = this.clientUtils.createMessageComponentsRow(inviteButton, supportButton, voteButton, donateButton);

			await firstChannel.send({ embeds: [afterInviteEmbed], components: [afterInviteComponentsRow] });
			await firstChannel.send({ content: this.client.support });

			// Support log
			const createdAt: string = this.formatUtils.discordTimestamp(createdGuild.createdTimestamp, 'f');
			const createdAgo: string = this.formatUtils.discordTimestamp(createdGuild.createdTimestamp, 'R');

			const supportLogMessage: string =
				'### ' + this.emote('logo_icon') + ' ' + this.client.user.username + ' wurde auf einen Server eingeladen!\n\n' +
				'-# ' + this.emote('quotes') + ' **Name**: ' + createdGuild.name + '\n' +
				'-# ' + this.emote('id') + ' **ID**: ' + createdGuild.id + '\n' +
				'-# ' + this.emote('users') + ' **Mitglieder**: ' + createdGuild.memberCount + '\n' +
				'-# ' + this.emote('calendar') + ' **Erstellt am**: ' + createdAt + '\n' +
				'-# ' + this.emote('reminder') + ' **Erstellt vor**: ' + createdAgo;

			const supportLogEmbed: EmbedBuilder = this.clientUtils.createEmbed(supportLogMessage, null, 'success');
			this.clientUtils.sendEmbedToLog(supportLogEmbed);
		}catch(error: unknown){

		}
	}
}

export { GuildCreateEvent };