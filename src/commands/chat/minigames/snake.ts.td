import { NevarCommand } from "@core/NevarCommand.js";
import { NevarClient } from "@core/NevarClient";
import { NevarGame } from "@core/NevarGame.js";
import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder } from "discord.js";
import path from "path";

export default class SnakeCommand extends NevarCommand {
	public constructor(client: NevarClient) {
		super(client, {
			name: "snake",
			description: "Get as long as possible by eating apples",
			localizedDescriptions: {
				de: "Werde so lang wie möglich, indem du Äpfel isst",
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
		const game: SnakeGame = new SnakeGame({
			interaction: this.interaction,
			client: this.client,
		});
		await game.startGame();
	}
}

class SnakeGame extends NevarGame {
	public snake: any[];
	public apple: any;
	public snakeLength: number;
	public gameBoard: any[];
	public score: number;

	public constructor(options: any = {}) {
		super(options);
		options.snake = {
			head: "🐍",
			body: "🟩",
			tail: "🟢",
			skull: "💀",
		};

		options.emojis = {
			board: "⬛",
			food: "🍎",
			up: options.client.emotes.arrows.up,
			down: options.client.emotes.arrows.down,
			left: options.client.emotes.arrows.left,
			right: options.client.emotes.arrows.right,
		};

		options.foods = [];
		options.stopButton = "Stop";

		this.snake = [{ x: 5, y: 5 }];
		this.apple = { x: 1, y: 1 };
		this.snakeLength = 1;
		this.gameBoard = [];
		this.score = 0;

		for (let y: number = 0; y < 10; y++) {
			for (let x: number = 0; x < 15; x++) {
				this.gameBoard[y * 15 + x] = options.emojis.board;
			}
		}
	}

	private getBoardContent(isSkull: any): string {
		const emojis: any = this.options.snake;
		let board: string = "";

		for (let y: number = 0; y < 10; y++) {
			for (let x: number = 0; x < 15; x++) {
				if (x == this.apple.x && y == this.apple.y) {
					board += this.options.emojis.food;
					continue;
				}

				if (this.isSnake({ x: x, y: y })) {
					const pos: number = this.snake.indexOf(this.isSnake({ x: x, y: y }));
					if (pos === 0) {
						const isHead: boolean = !isSkull || this.snakeLength >= 10 * 15;
						board += isHead ? emojis.head : emojis.skull;
					} else if (pos === this.snake.length - 1) {
						board += emojis.tail;
					} else {
						board += emojis.body;
					}
				}

				if (!this.isSnake({ x: x, y: y })) board += this.gameBoard[y * 15 + x];
			}
			board += "\n";
		}
		return board;
	}

	private isSnake(pos: any): any {
		return this.snake.find((snake) => snake.x == pos.x && snake.y == pos.y) ?? false;
	}

	private updateFoodLoc(): void {
		let applePos: any = { x: 0, y: 0 };
		do {
			applePos = {
				x: parseInt(String(Math.random() * 15)),
				y: parseInt(String(Math.random() * 10)),
			};
		} while (this.isSnake(applePos));

		const foods: any = this.options.foods;
		if (foods.length) this.options.emojis.food = foods[Math.floor(Math.random() * foods.length)];
		this.apple = { x: applePos.x, y: applePos.y };
	}

	public async startGame(): Promise<void> {
		await this.interaction.deferReply().catch((e: any): void => {});

		const emojis: any = this.options.emojis;
		this.updateFoodLoc();

		const snakeEmbed: EmbedBuilder = this.client.createEmbed(
			" " +
				this.interaction.guild.translate("commands/minigames/snake:currentScore") +
				" " +
				this.score +
				"\n\n" +
				this.getBoardContent(undefined),
			"arrow",
			"normal",
		);
		snakeEmbed.setTitle("Snake");

		const up: ButtonBuilder = this.client.createButton("snake_up", null, "Primary", this.client.emotes.arrows.up);
		const down: ButtonBuilder = this.client.createButton(
			"snake_down",
			null,
			"Primary",
			this.client.emotes.arrows.down,
		);
		const left: ButtonBuilder = this.client.createButton(
			"snake_left",
			null,
			"Primary",
			this.client.emotes.arrows.left,
		);
		const right: ButtonBuilder = this.client.createButton(
			"snake_right",
			null,
			"Primary",
			this.client.emotes.arrows.right,
		);
		const stop: ButtonBuilder = this.client.createButton("snake_stop", "Stop", "Danger");

		const dis1: ButtonBuilder = this.client.createButton("dis1", "\u200b", "Secondary", null, true);
		const dis2: ButtonBuilder = this.client.createButton("dis2", "\u200b", "Secondary", null, true);

		const row1: any = this.client.createMessageComponentsRow(dis1, up, dis2, stop);
		const row2: any = this.client.createMessageComponentsRow(left, down, right);

		const msg: any = await this.sendMessage({
			embeds: [snakeEmbed],
			components: [row1, row2],
		});
		return this.handleButtons(msg);
	}

	private updateGame(msg: any): any {
		if (this.apple.x == this.snake[0].x && this.apple.y == this.snake[0].y) {
			this.score += 1;
			this.snakeLength += 1;
			this.updateFoodLoc();
		}

		const snakeEmbed: EmbedBuilder = this.client.createEmbed(
			" " +
				this.interaction.guild.translate("commands/minigames/snake:currentScore") +
				" " +
				this.score +
				"\n\n" +
				this.getBoardContent(undefined),
			"arrow",
			"normal",
		);
		snakeEmbed.setTitle("Snake");

		return msg.edit({ embeds: [snakeEmbed] });
	}

	private endGame(msg: any): any {
		const gameOverEmbed: EmbedBuilder = this.client.createEmbed(
			this.interaction.guild.translate("commands/minigames/snake:gameEnd", { points: this.score }) +
				"\n\n" +
				this.getBoardContent(true),
			"arrow",
			"normal",
		);
		gameOverEmbed.setTitle("Snake");

		return msg.edit({
			embeds: [gameOverEmbed],
			components: this.disableButtons(msg.components),
		});
	}

	private handleButtons(msg: any): void {
		const snakeCollector: any = msg.createMessageComponentCollector({
			filter: (btn: any): boolean => btn.user.id === this.interaction.user.id,
		});

		snakeCollector.on("collect", async (btn: any): Promise<any> => {
			await btn.deferUpdate().catch((e: any): void => {});

			const snakeHead = this.snake[0];
			const nextPos: any = { x: snakeHead.x, y: snakeHead.y };
			const ButtonID = btn.customId.split("_")[1];

			if (ButtonID === "left") nextPos.x = snakeHead.x - 1;
			else if (ButtonID === "right") nextPos.x = snakeHead.x + 1;
			else if (ButtonID === "down") nextPos.y = snakeHead.y + 1;
			else if (ButtonID === "up") nextPos.y = snakeHead.y - 1;

			if (nextPos.x < 0 || nextPos.x >= 15) {
				nextPos.x = nextPos.x < 0 ? 0 : 15 - 1;
				return snakeCollector.stop();
			}

			if (nextPos.y < 0 || nextPos.y >= 10) {
				nextPos.y = nextPos.y < 0 ? 0 : 10 - 1;
				return snakeCollector.stop();
			}

			if (this.isSnake(nextPos) || ButtonID === "stop") return snakeCollector.stop();
			else {
				this.snake.unshift(nextPos);
				if (this.snake.length > this.snakeLength) this.snake.pop();
				this.updateGame(msg);
			}
		});

		snakeCollector.on("end", async (_: any, reason: any): Promise<any> => {
			if (reason === "idle" || reason === "user") return this.endGame(msg);
		});
	}
}
