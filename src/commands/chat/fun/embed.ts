import { BaseCommand } from '@core/BaseCommand.js';
import {
	SlashCommandBuilder,
	EmbedBuilder,
	SlashCommandStringOption,
	SlashCommandAttachmentOption,
	Attachment,
	ColorResolvable,
	TextChannel,
	Webhook,
	CommandInteraction,
	CommandInteractionOptionResolver,
	PermissionsBitField,
	ApplicationIntegrationType, InteractionContextType,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
const { Flags } = PermissionsBitField;

class EmbedCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'embed',
			description: 'Sende dein eigenes Embed',
			dirname: import.meta.url,
			permissions: {
				bot: [],
				user: [Flags.ManageGuild]
			},
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)

					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('autor')
						.setDescription('Bestimme den Embed-Autor')
					)
					.addAttachmentOption((attachmentOption: SlashCommandAttachmentOption) => attachmentOption
						.setName('icon')
						.setDescription('Wähle das Avatar des Embed-Autors')
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('titel')
						.setDescription('Lege den Embed-Titel fest')
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('beschreibung')
						.setDescription('Setze die Beschreibung für dein Embed')
					)
					.addAttachmentOption((attachmentOption: SlashCommandAttachmentOption) => attachmentOption
						.setName('thumbnail')
						.setDescription('Wähle das Thumbnail-Bild für dein Embed')
					)
					.addAttachmentOption((attachmentOption: SlashCommandAttachmentOption) => attachmentOption
						.setName('bild')
						.setDescription('Wähle ein Bild für dein Embed')
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('fußzeile')
						.setDescription('Lege den Fußzeilentext deines Embeds fest')
					)
					.addAttachmentOption((attachmentOption: SlashCommandAttachmentOption) => attachmentOption
						.setName('fußzeilenbild')
						.setDescription('Wähle ein Bild für die Fußzeile deines Embeds')
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('farbe')
						.setDescription('Wähle die Farbe deines Embeds im Hex- oder RGB-Format')
					)
			},
		});
	}

	public async run(): Promise<void> {
		// Get embed data
		const author: string = this.options.getString('autor') || this.interaction.user.username;
		const authorIcon: Attachment = this.options.getAttachment('icon');
		const title: string = this.options.getString('titel');
		const description: string = this.options.getString('beschreibung');
		const thumbnail: Attachment = this.options.getAttachment('thumbnail');
		const image: Attachment = this.options.getAttachment('bild');
		const footerText: string = this.options.getString('fußzeile');
		const footerIcon: Attachment = this.options.getAttachment('fußzeilenbild');
		const color: ColorResolvable = this.options.getString('farbe') || this.config.get('embeds.colors.normal');

		// Check if color is valid hex or rgb
		if(!this.validationUtils.stringIsHexColor(color as string) && !this.validationUtils.stringIsRgbColor(color as string)){
			const invalidColorEmbed: EmbedBuilder = this.clientUtils.createEmbed('Die eingegebene Farbe entspricht **weder dem Hex- noch dem RGB-Format**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidColorEmbed] });
			return;
		}

		// Check if author icon attachment is image
		if(authorIcon && !authorIcon.contentType.startsWith('image/')){
			const invalidAuthorIconEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das ausgewählte Autor-Avatar ist **kein Bild**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidAuthorIconEmbed] });
			return;
		}

		// Check if thumbnail attachment is image
		if(thumbnail && !thumbnail.contentType.startsWith('image/')){
			const invalidThumbnailEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das ausgewählte Embed-Thumbnail ist **kein Bild**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidThumbnailEmbed] });
			return;
		}

		// Check if image attachment is image
		if(image && !image.contentType.startsWith('image/')){
			const invalidImageEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das ausgewählte Embed-Bild ist **kein Bild**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidImageEmbed] });
			return;
		}

		// Check if footer icon attachment is image
		if(footerIcon && !footerIcon.contentType.startsWith('image/')){
			const invalidFooterIconEmbed: EmbedBuilder = this.clientUtils.createEmbed('Das ausgewählte Fußzeilenbild ist **kein Bild**.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [invalidFooterIconEmbed] });
			return;
		}

		// Correct rgb color
		const correctColor: any = this.validationUtils.stringIsRgbColor(color as string) ? (color as string).split(',').map((color: string): number => parseInt(color)) : color

		// Prepare embed
		const generatedEmbed: EmbedBuilder = new EmbedBuilder()
			.setAuthor({ name: author, iconURL: authorIcon ? authorIcon.proxyURL : null, url: this.config.get('support.website') })
			.setTitle(title)
			.setDescription(description)
			.setThumbnail(thumbnail ? thumbnail.proxyURL : null)
			.setImage(image ? image.proxyURL : null)
			.setFooter({ text: footerText, iconURL: footerIcon ? footerIcon.proxyURL : null })
			.setColor(correctColor);


		// Send embed
		try{
			const channel: TextChannel = this.interaction.channel as TextChannel;
			const webhook: Webhook = await channel.createWebhook({ name: author, avatar: authorIcon ? authorIcon.proxyURL : null });

			await webhook.send({ embeds: [generatedEmbed] });
			await webhook.delete();

			const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('Dein personalisiertes Embed wurde **erfolgreich gesendet**.', this.emote('success'), 'success');
			await this.interaction.followUp({ embeds: [successEmbed] });
			return;
		}catch(error: unknown){
			await this.handleUnknownError(error);
		}
	}
}

export { EmbedCommand };