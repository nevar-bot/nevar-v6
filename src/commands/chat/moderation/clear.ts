import { BaseCommand } from '@core/BaseCommand.js';
import {
	Collection,
	CommandInteraction,
	CommandInteractionOptionResolver,
	Message,
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandUserOption,
	User,
	PermissionsBitField,
	ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class ClearCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'clear',
			description: 'Lösche eine bestimmte Anzahl an Nachrichten',
			permissions: {
				bot: [Flags.ManageMessages],
				user: [Flags.ManageMessages]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addIntegerOption((integerOption: SlashCommandIntegerOption) => integerOption
						.setName('anzahl')
						.setDescription('Wähle die Anzahl an Nachrichten, die du löschen möchtest')
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(99)
					)
					.addUserOption((userOption: SlashCommandUserOption) => userOption
						.setName('mitglied')
						.setDescription('Wähle das Mitglied, dessen Nachrichten du löschen möchtest')
						.setRequired(false)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const amount: number = this.options.getInteger('anzahl');
		const user: User|void = this.options.getUser('mitglied');

		// Fetch messages
		const fetchedMessages: Collection<string, Message> = await this.interaction.channel.messages.fetch({ limit: amount + 1 });

		// Filter messages by author and pinned status
		const messages: Message[] = Array.from(fetchedMessages.values())
			.filter((message: Message): boolean => !message.pinned)
			.filter((message: Message): boolean => !user || message.author.id === user.id);

		// Remove the command message
		if(messages.length > 0 && messages[0].author.id === this.client.user.id) messages.shift();

		// Bulk delete messages
		this.interaction.channel.bulkDelete(messages, true);

		// Send confirmation embed
		const messagesDeletedText: string = user
			? 'Ich habe **' + messages.length + ' Nachrichten** von ' + user.toString() + ' gelöscht.'
			: 'Ich habe **' + messages.length + ' Nachrichten** gelöscht.';

		const messagesDeletedEmbed: EmbedBuilder = this.clientUtils.createEmbed(messagesDeletedText, this.emote('delete'), 'success');

		const messagesDeletedMessage = await this.interaction.followUp({ embeds: [messagesDeletedEmbed] });

		// Log action to moderation log channel
		const guildLoggingText: string =
			'### ' + this.emote('delete') + ' ' + messages.length + ' Nachrichten in ' + this.interaction.channel.toString() + ' gelöscht';

		const guildLoggingEmbed: EmbedBuilder = this.clientUtils.createEmbed(guildLoggingText, null, 'normal')
			.setAuthor({ name: this.interaction.user.username, iconURL: this.interaction.user.displayAvatarURL() });

		await this.guildUtils.log(guildLoggingEmbed, 'moderation');

		// Delete confirmation message after 7 seconds
		await this.clientUtils.wait(7 * 1000);
		messagesDeletedMessage.delete().catch((): void => {});
	}
}

export { ClearCommand };