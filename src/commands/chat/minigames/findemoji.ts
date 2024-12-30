import { BaseCommand } from '@core/BaseCommand.js';
import { BaseGame } from '@core/BaseGame.js';
import {
	CommandInteraction,
	CommandInteractionOptionResolver,
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class FindemojiCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'findemoji',
			description: 'Merke dir die Reihenfolge acht verschiedener Emojis, und wähle den Richtigen',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
			},
		});
	}

	public async run(): Promise<void> {
		const game: FindemojiGame = new FindemojiGame({
			interaction: this.interaction,
			client: this.client,
		});
		await game.startGame();
	}
}

export { FindemojiCommand };


class FindemojiGame extends BaseGame {
	public emojis: string[];
	public selected: any;
	public emoji: any;

	public constructor(options: any = {}) {
		super(options);
		this.emojis = ["🍉", "🍇", "🍊", "🍋", "🥭", "🍎", "🍏", "🥝", "🥥", "🍓", "🍒"];
		this.selected = null;
		this.emoji = null;
	}

	public async startGame(): Promise<void> {
		await this.interaction.deferReply().catch((e: any): void => {});

		this.emojis = this.randomUtils.shuffleArray(this.emojis).slice(0, 8);
		this.emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];

		const findEmojiEmbed: EmbedBuilder = this.clientUtils.createEmbed('Merke dir die **Reihenfolge der Emojis**, so gut du kannst!', this.clientUtils.emote('arrow_right'), 'normal');

		const msg: any = await this.sendMessage({
			embeds: [findEmojiEmbed],
			components: this.disableButtons(this.getComponents(true)),
		});

		const timeoutCallback: any = async (): Promise<void> => {
			findEmojiEmbed.setDescription('Wähle den ' + this.emoji + ' Emoji aus!',);
			await msg.edit({
				embeds: [findEmojiEmbed],
				components: this.getComponents(false),
			});
			const emojiCollector = msg.createMessageComponentCollector({
				filter: (btn: any): boolean => btn.user.id === this.interaction.user.id,
				idle: 30000,
			});

			emojiCollector.on("collect", async (btn: any): Promise<any> => {
				await btn.deferUpdate().catch((e: any): void => {});
				this.selected = this.emojis[parseInt(btn.customId.split("_")[2])];
				return emojiCollector.stop();
			});

			emojiCollector.on("end", async (_: any, reason: any): Promise<any> => {
				if (reason === "idle" || reason === "user") return this.endGame(msg, reason === "user");
			});
		};
		setTimeout(timeoutCallback, 5000);
	}

	private endGame(msg: any, result: any) {
		const resultMessage: "win" | "lose" = this.selected === this.emoji ? "win" : "lose";
		if (!result) this.selected = this.emoji;

		let finalMessage: string;
		if (resultMessage === "win") {
			finalMessage = 'Das war richtig, **du hast gewonnen**!';
		} else {
			finalMessage = 'Das war leider falsch! Der **Emoji wäre ' + this.emoji + ' gewesen**.';
		}

		const gameOverEmbed: EmbedBuilder = this.clientUtils.createEmbed(finalMessage, this.clientUtils.emote('arrow_right'), "normal");

		return msg.edit({
			embeds: [gameOverEmbed],
			components: this.disableButtons(this.getComponents(true)),
		});
	}

	private getComponents(showEmoji: any): any {
		const components: any[] = [];
		for (let x: number = 0; x < 2; x++) {
			const row: any = new ActionRowBuilder();
			for (let y: number = 0; y < 4; y++) {
				const buttonEmoji: string = this.emojis[x * 4 + y];

				const btn: ButtonBuilder = this.componentsUtils.createButton(
					"collector_findEmoji_" + (x * 4 + y),
					"\u200b",
					buttonEmoji === this.selected ? (this.selected === this.emoji ? ButtonStyle.Success : ButtonStyle.Danger) : ButtonStyle.Primary,
					showEmoji ? buttonEmoji : null,
				);
				row.addComponents(btn);
			}
			components.push(row);
		}
		return components;
	}
}
