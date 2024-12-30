import { BaseCommand } from '@core/BaseCommand.js';
import {
	SlashCommandBuilder,
	EmbedBuilder,
	SlashCommandStringOption,
	parseEmoji,
	PartialEmoji,
	GuildEmoji,
	PermissionsBitField,
	CommandInteraction,
	CommandInteractionOptionResolver,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class AddemojiCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'addemoji',
			description: 'Füge einen neuen Emoji auf deinem Server hinzu',
			permissions: {
				bot: [Flags.CreateGuildExpressions, Flags.ManageGuildExpressions],
				user: [Flags.CreateGuildExpressions, Flags.ManageGuildExpressions]
			},
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('emoji')
						.setDescription('Gib hier den Emoji, oder Link zu einem Bild an')
						.setRequired(true)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('name')
						.setDescription('Lege den Namen des neuen Emojis fest')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		// Get emoji and name
		const emoji: string = this.options.getString('emoji');
		const name: string = this.options.getString('name');

		// Define emote object
		const emote = {
			name: undefined,
			url: undefined
		};

		// Check if emoji is valid discord emoji or url
		if(!this.validationUtils.stringIsCustomEmoji(emoji) && !this.validationUtils.stringIsUrl(emoji)){
			const invalidEmojiEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst einen **Emoji oder Link zu einem Bild** angeben, bevor du den Befehl absendest.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidEmojiEmbed] });
			return;
		}

		// Check if url heads to image
		if(this.validationUtils.stringIsUrl(emoji) && !(await this.validationUtils.urlIsImage(emoji))){
			const noImageEmbed: EmbedBuilder = this.clientUtils.createEmbed('Deine angegebene URL führt **nicht zu einem Bild**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [noImageEmbed] });
			return;
		}

		// Fill emote object
		if(this.validationUtils.stringIsCustomEmoji(emoji)){
			const parsedEmoji: PartialEmoji = parseEmoji(emoji);
			emote.name = name;
			emote.url = 'https://cdn.discordapp.com/emojis/' + parsedEmoji.id + (parsedEmoji.animated ? '.gif' : '.png');
		}else{
			emote.name = name;
			emote.url = emoji;
		}

		// Create emoji
		try{
			const createdEmoji: GuildEmoji = await this.guild.emojis.create({
				attachment: emote.url,
				name: emote.name,
				reason: '/addemoji'
			});


			const emojiCreatedEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich habe {0} erstellt.', this.emote('success'), 'success', createdEmoji.toString());
			await this.interaction.followUp({ embeds: [emojiCreatedEmbed] });
			return;
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { AddemojiCommand };