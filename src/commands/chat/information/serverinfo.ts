import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType, Channel,
	CommandInteraction,
	CommandInteractionOptionResolver, GuildMember, InteractionContextType,
	SlashCommandBuilder, ChannelType, EmbedBuilder, GuildEmoji,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class ServerinfoCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'serverinfo',
			description: 'Auf welchem Server bin ich eigentlich?',
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
		const owner: GuildMember = await this.guild.fetchOwner();
		await this.guild.channels.fetch().catch(() => {});
		const channelCounts = {
			total: this.guild.channels.cache.size.toString(),
			text: this.guild.channels.cache.filter((channel: Channel): boolean => channel.type === ChannelType.GuildText).size.toString(),
			voice: this.guild.channels.cache.filter((channel: Channel): boolean => channel.type === ChannelType.GuildVoice).size.toString(),
			category: this.guild.channels.cache.filter((channel: Channel): boolean => channel.type === ChannelType.GuildCategory).size.toString(),
			thread: this.guild.channels.cache.filter((channel: Channel): boolean => channel.type === ChannelType.PublicThread).size.toString(),
			forum: this.guild.channels.cache.filter((channel: Channel): boolean => channel.type === ChannelType.GuildForum).size.toString(),
			staging: this.guild.channels.cache.filter((channel: Channel): boolean => channel.type === ChannelType.GuildStageVoice).size.toString()
		};

		const emojiCount = {
			total: this.guild.emojis.cache.size.toString(),
			animated: this.guild.emojis.cache.filter((emoji: GuildEmoji): boolean => emoji.animated).size.toString(),
			static: this.guild.emojis.cache.filter((emoji: GuildEmoji): boolean => !emoji.animated).size.toString()
		};

		const createdAt: string = this.formatUtils.discordTimestamp(this.guild.createdTimestamp, 'F');
		const createdAgo: string = this.formatUtils.discordTimestamp(this.guild.createdTimestamp, 'R');

		const serverInfoText: string = '### ' + this.emote('discord') + ' Informationen über ' + this.guild.name;
		const serverInfoEmbed: EmbedBuilder = this.clientUtils.createEmbed(serverInfoText, null, 'normal')
			.setThumbnail(this.guild.iconURL())
			.addFields(
				{ name: this.emote('crown') + ' Besitzer', value: owner.toString(), inline: true },
				{ name: this.emote('boost') + ' Boost-Level', value: 'Level ' + this.guild.premiumTier, inline: true },
				{ name: this.emote('users') + ' Mitglieder', value: this.mathUtils.format(this.guild.memberCount).toString(), inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: this.emote('channel') + ' Textkanäle', value: channelCounts.text, inline: true },
				{ name: this.emote('sound') + ' Sprachkanäle', value: channelCounts.voice, inline: true },
				{ name: this.emote('folder') + ' Kategorien', value: channelCounts.category, inline: true },
				{ name: this.emote('thread') + ' Threads', value: channelCounts.thread, inline: true },
				{ name: this.emote('forum') + ' Foren', value: channelCounts.forum, inline: true },
				{ name: this.emote('stage') + ' Stage', value: channelCounts.staging, inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: this.emote('emoji_create') + ' Emojis', value: emojiCount.total, inline: true },
				{ name: this.emote('rabbit_animated') + ' Animiert', value: emojiCount.animated, inline: true },
				{ name: this.emote('rabbit_static') + ' Statisch', value: emojiCount.static, inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: this.emote('calendar') + ' Erstellt am', value: createdAt + ' (' + createdAgo + ')' },
			);

		await this.interaction.followUp({ embeds: [serverInfoEmbed] });
	}
}

export { ServerinfoCommand };