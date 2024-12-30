import { BaseCommand } from '@core/BaseCommand.js';
import {
	EmbedBuilder,
	Message,
	GuildMember,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class AnnounceCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'announce',
			description: 'Leite eine Nachricht an alle Server-Eigentümer weiter',
			dirname: import.meta.url,
			restrictions: {
				ownerOnly: true
			},
			slashCommand: {
				register: false,
			},
		});
	}

	public async run(): Promise<void> {
		const messageId: string = this.options[0];
		if (!messageId) {
			const invalidOptionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine Nachrichten-ID angeben, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidOptionsEmbed] });
			return;
		}

		if (messageId === 'help') {
			const variables: string[] = [
				'?user - Erwähnt den Eigentümer',
				'?guild - Erwähnt den Server',
			];

			const helpText: string =
				this.emote('question_mark') + ' **Folgende Variablen können verwendet werden:**\n\n' +
				this.emote('text') + variables.join('\n' + this.emote('text'));
			const helpEmbed: EmbedBuilder = this.clientUtils.createEmbed(helpText, null, 'normal');
			await this.interaction.reply({ embeds: [helpEmbed] });
			return;
		}

		const message: Message = await this.interaction.channel.messages.fetch(messageId).catch(() => null);
		if (!message) {
			const invalidMessageEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die angegebene **Nachricht existiert nicht**.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidMessageEmbed] });
			return;
		}

		const messageContent: string =
			message.content + '\n\n' +
			'-# ' + this.emote('logo_icon') + ' Diese Nachricht wurde vom [' + this.client.user.username + '-Team](' + this.client.support + ') gesendet.';

		let sendTo: number = 0;
		for (const guild of this.client.guilds.cache.values()) {
			const owner: GuildMember =
				guild.members.cache.find((member: GuildMember) => member.id === guild.ownerId) ||
				await guild.fetchOwner().catch(() => null);

			if (!owner) continue;

			const messageContentWithVariables: string = messageContent
				.replace('?user', owner.displayName)
				.replace('?guild', guild.name);

			await owner.send({ content: messageContentWithVariables }).catch(() => {});
			sendTo++;
		}

		const sendToEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die Nachricht wurde an **' + sendTo + ' Server-Eigentümer** gesendet.', this.emote('success'), 'success');

		await this.interaction.reply({ embeds: [sendToEmbed] });
	}
}

export { AnnounceCommand };