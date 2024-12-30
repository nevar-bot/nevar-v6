import { NevarCommand } from "@core/NevarCommand.js";
import { NevarClient } from "@core/NevarClient";
import { NevarGame } from "@core/NevarGame.js";
import { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } from "discord.js";
import path from "path";

export default class HangmanCommand extends NevarCommand {
	public constructor(client: NevarClient) {
		super(client, {
			name: "hangman",
			description: "Guess the word before you are hanged",
			localizedDescriptions: {
				de: "Errate das Wort, bevor du gehängt wirst",
			},
			cooldown: 1000,
			dirname: import.meta.url,
			slashCommand: {
				addCommand: true,
				data: new SlashCommandBuilder(),
			},
		});
	}

	public async dispatch(interaction: any, data: any): Promise<void> {
		this.interaction = interaction;
		this.guild = interaction.guild;
		this.data = data;
		await this.startGame();
	}

	private async startGame(): Promise<void> {
		const game: HangmanGame = new HangmanGame({
			interaction: this.interaction,
			client: this.client,
		});

		await game.startGame();
	}
}

class HangmanGame extends NevarGame {
	public hangman: any;
	public word: string;
	public buttonPage: number;
	public guessed: string[];
	public damage: number;

	constructor(options: any = {}) {
		super(options);
		options.hangman = {
			hat: "🎩",
			head: "😟",
			shirt: "👕",
			hand_left: "🫲",
			hand_right: "🫱",
			pants: "🩳",
			boots_left: "👞",
			boots_right: "👞",
		};

		const words: string[] = this.interaction.guild.translate("commands/minigames/hangman:wordList");
		options.theme = Object.keys(words)[Math.floor(Math.random() * Object.keys(words).length)];

		this.hangman = options.hangman;
		this.word = words[Math.floor(Math.random() * words.length)];
		this.buttonPage = 0;
		this.guessed = [];
		this.damage = 0;
	}

	private getAlphaEmoji(letter: any): any {
		const letters: any = {
			A: "🇦",
			B: "🇧",
			C: "🇨",
			D: "🇩",
			E: "🇪",
			F: "🇫",
			G: "🇬",
			H: "🇭",
			I: "🇮",
			J: "🇯",
			K: "🇰",
			L: "🇱",
			M: "🇲",
			N: "🇳",
			O: "🇴",
			P: "🇵",
			Q: "🇶",
			R: "🇷",
			S: "🇸",
			T: "🇹",
			U: "🇺",
			V: "🇻",
			W: "🇼",
			X: "🇽",
			Y: "🇾",
			Z: "🇿",
		};

		if (letter == 0) return Object.keys(letters).slice(0, 12);
		if (letter == 1) return Object.keys(letters).slice(12, 24);
		return letters[letter];
	}

	private getBoardContent(): string {
		let board: string = "```\n|‾‾‾‾‾‾| \n|      ";
		board += (this.damage > 0 ? this.hangman.hat : " ") + " \n|      ";
		board += (this.damage > 1 ? this.hangman.head : " ") + " \n|    ";
		board += (this.damage > 2 ? this.hangman.hand_left : " ") + "";
		board += (this.damage > 3 ? this.hangman.shirt : " ") + "";
		board += (this.damage > 4 ? this.hangman.hand_right : " ") + " \n|      ";
		board += (this.damage > 5 ? this.hangman.pants : " ") + " \n|     ";
		board += (this.damage > 6 ? this.hangman.boots_left : " ") + "";
		board += (this.damage > 7 ? this.hangman.boots_right : " ") +  "\n|     ";
		board += "\n|__________                      ```";
		return board;
	}

	public async startGame(): Promise<void> {
		await this.interaction.deferReply().catch((): void => {});

		const description: string =
			this.getBoardContent() +
			"\n" +
			this.interaction.guild.translate("commands/minigames/hangman:wordLengthText", {
				e: this.client.emotes,
				wordLength: this.word.length,
			}) +
			"\n" +
			this.getWordEmojis();
		const hangmanEmbed: EmbedBuilder = this.client.createEmbed(description, null, "normal");
		hangmanEmbed.setTitle("Hangman");

		const hangmanMessage: any = await this.sendMessage({
			embeds: [hangmanEmbed],
			components: this.getComponents(undefined),
		});
		return this.handleButtons(hangmanMessage);
	}

	private handleButtons(msg: any): void {
		const hangmanCollector: any = msg.createMessageComponentCollector({
			filter: (btn: any): boolean => btn.user.id === this.interaction.user.id,
		});

		hangmanCollector.on("collect", async (btn: any): Promise<any> => {
			await btn.deferUpdate().catch(() => {});

			const guess: any = btn.customId.split("_")[1];
			if (guess === "stop") return hangmanCollector.stop();
			if (guess == 0 || guess == 1)
				return msg.edit({
					components: this.getComponents(parseInt(guess)),
				});
			if (this.guessed.includes(guess)) return;
			this.guessed.push(guess);

			if (!this.word.toUpperCase().includes(guess)) this.damage += 1;
			if (this.damage > 7 || this.foundWord()) return hangmanCollector.stop();

			const description: string =
				this.getBoardContent() +
				"\n" +
				this.interaction.guild.translate("commands/minigames/hangman:alreadyGuessedLetters", {
					e: this.client.emotes,
				}) +
				"\n" +
				this.client.emotes.arrow +
				" " +
				this.guessed.join(", ") +
				"\n\n" +
				this.interaction.guild.translate("commands/minigames/hangman:wordLengthText", {
					e: this.client.emotes,
					wordLength: this.word.length,
				}) +
				"\n" +
				this.getWordEmojis();

			const hangmanEmbed: EmbedBuilder = this.client.createEmbed(description, null, "normal");
			hangmanEmbed.setTitle("Hangman");

			return msg.edit({
				embeds: [hangmanEmbed],
				components: this.getComponents(undefined),
			});
		});

		hangmanCollector.on("end", (_: any, reason: any) => {
			if (reason === "idle" || reason === "user") return this.endGame(msg, this.foundWord());
		});
	}

	private endGame(msg: any, result: any): any {
		const GameOverMessage: string = result
			? this.interaction.guild.translate("commands/minigames/hangman:youWonTheGame", { word: this.word })
			: this.interaction.guild.translate("commands/minigames/hangman:youLostTheGame", { word: this.word });

		const description: string =
			this.getBoardContent() +
			"\n" +
			(this.guessed.length
				? this.interaction.guild.translate("commands/minigames/hangman:alreadyGuessedLetters", {
						e: this.client.emotes,
					}) +
					"\n" +
					this.client.emotes.arrow +
					" " +
					this.guessed.join(", ") +
					"\n\n"
				: "") +
			this.client.emotes.arrow +
			" " +
			GameOverMessage;
		this.getWordEmojis();

		const gameOverEmbed: EmbedBuilder = this.client.createEmbed(description, null, "normal");
		gameOverEmbed.setTitle("Hangman");

		return msg.edit({ embeds: [gameOverEmbed], components: [] });
	}

	private foundWord(): boolean {
		return this.word
			.toUpperCase()
			.replace(/ /g, "")
			.split("")
			.every((l: string): boolean => this.guessed.includes(l));
	}

	private getWordEmojis(): string {
		return this.word
			.toUpperCase()
			.split("")
			.map((l: string): boolean =>
				this.guessed.includes(l) ? this.getAlphaEmoji(l) : l === " " ? "⬜" : this.client.emotes.question,
			)
			.join(" ");
	}

	private getComponents(page: any): any {
		const components: any[] = [];
		if (page == 0 || page == 1) this.buttonPage = page;
		const letters = this.getAlphaEmoji(this.buttonPage ?? 0);
		const pageID: string = "hangman_" + (this.buttonPage ? 0 : 1);

		for (let y: number = 0; y < 3; y++) {
			const row: any = new ActionRowBuilder();
			for (let x: number = 0; x < 4; x++) {
				const letter = letters[y * 4 + x];
				const btn: ButtonBuilder = this.client.createButton(
					"hangman_" + letter,
					letter,
					"Primary",
					null,
					this.guessed.includes(letter),
					null,
				);
				row.addComponents(btn);
			}
			components.push(row);
		}

		const row4: ActionRowBuilder = new ActionRowBuilder();
		const stop: ButtonBuilder = this.client.createButton("hangman_stop", "Stop", "Danger");
		const pageBtn: ButtonBuilder = this.client.createButton(
			pageID,
			null,
			"Secondary",
			this.buttonPage ? this.client.emotes.arrows.left : this.client.emotes.arrows.right,
		);
		const letterY: ButtonBuilder = this.client.createButton(
			"hangman_Y",
			"Y",
			"Primary",
			null,
			this.guessed.includes("Y"),
		);
		const letterZ: ButtonBuilder = this.client.createButton(
			"hangman_Z",
			"Z",
			"Primary",
			null,
			this.guessed.includes("Z"),
		);
		row4.addComponents(pageBtn, stop);
		if (this.buttonPage) row4.addComponents(letterY, letterZ);

		components.push(row4);
		return components;
	}
}
