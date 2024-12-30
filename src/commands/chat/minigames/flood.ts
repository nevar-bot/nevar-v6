import { BaseCommand } from '@core/BaseCommand.js';
import { BaseGame } from '@core/BaseGame.js';
import {
	CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder,
	EmbedBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, Message,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class FloodCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'flood',
			description: 'Fülle das komplette Spielfeld mit einer Farbe',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
			},
		});
	}

	public async run(): Promise<void> {
		const game: FloodGame = new FloodGame({
			interaction: this.interaction,
			client: this.client,
		});

		await game.startGame();
	}
}

export { FloodCommand };

class FloodGame extends BaseGame {
	public length: number;
	public gameBoard: string[];
	public maxTurns: number;
	public turns: number;
	public squares: string[] = [
		'🟥', // Red
		'🟦', // Blue
		'🟫', // Brown
		'🟨', // Yellow
		'🟩', // Green
	];

	public mainMessage: string;
	public winMessage: string;
	public loseMessage: string;

	public constructor(options = {}) {
		super(options);

		// Initiating the game
		this.length = 13;
		this.gameBoard = [];
		this.maxTurns = 0;
		this.turns = 0;

		this.mainMessage = 'Du hast noch **{0}** Züge übrig!';
		this.winMessage = 'Du hast nach **{0}** Zügen gewonnen!';
		this.loseMessage = 'Du hast nach **{0}** Zügen leider verloren!';

		// Generate random game board
		for (let y: number = 0; y < this.length; y++) {
			for (let x: number = 0; x < this.length; x++) {
				this.gameBoard[y * this.length + x] = this.squares[Math.floor(Math.random() * this.squares.length)];
			}
		}
	}

	/**
	 * Start the game
	 */
	public async startGame(): Promise<void> {
		// Calculate the maximum number of turns
		this.maxTurns = Math.floor((25 * (this.length * 2)) / 26);

		// Create game embed
		const embed: EmbedBuilder = this.clientUtils.createEmbed(this.mainMessage + '\n\n' + this.getBoardContent(), this.clientUtils.emote('shine'), 'normal', (this.maxTurns - this.turns));

		// Create buttons
		const btn1: ButtonBuilder = this.componentsUtils.createButton('collector_0', null, ButtonStyle.Primary, this.squares[0]);
		const btn2: ButtonBuilder = this.componentsUtils.createButton('collector_1', null, ButtonStyle.Primary, this.squares[1]);
		const btn3: ButtonBuilder = this.componentsUtils.createButton('collector_2', null, ButtonStyle.Primary, this.squares[2]);
		const btn4: ButtonBuilder = this.componentsUtils.createButton('collector_3', null, ButtonStyle.Primary, this.squares[3]);
		const btn5: ButtonBuilder = this.componentsUtils.createButton('collector_4', null, ButtonStyle.Primary, this.squares[4]);
		const btnRow = this.componentsUtils.createActionRow(btn1, btn2, btn3, btn4, btn5);

		// Send the game message
		const msg: Message = await this.sendMessage({ embeds: [embed], components: [btnRow] });

		// Create collector
		const collector = msg.createMessageComponentCollector({
			filter: (btn: ButtonInteraction): boolean => btn.user.id === this.interaction.user.id,
		});

		// Handle button click
		collector.on('collect', async (btn: ButtonInteraction): Promise<Message|void> => {
			await btn.deferUpdate().catch(() => {});

			// Get button index
			const buttonIndex = btn.customId.split('_')[1];

			// Update game board
			const update: boolean|undefined = await this.updateGame(this.squares[buttonIndex], msg);
			if (!update && update !== false) return collector.stop();
			if (!update) return;

			// Create updated embed
			const embed: EmbedBuilder = this.clientUtils.createEmbed(this.mainMessage + '\n\n' + this.getBoardContent(), this.clientUtils.emote('shine'), 'normal', (this.maxTurns - this.turns));

			// Update buttons, disable the selected button
			const updatedButtons = [btn1, btn2, btn3, btn4, btn5].map((button, index) => {
				if (index === parseInt(buttonIndex)) {
					return ButtonBuilder.from(button).setStyle(ButtonStyle.Secondary).setDisabled(true);
				}
				return button;
			});
			const updatedRow = this.componentsUtils.createActionRow(...updatedButtons);

			// Edit the message
			return await msg.edit({ embeds: [embed], components: [updatedRow] });
		});

		// Handle game end
		collector.on('end', (_: ButtonInteraction, reason: string) => {
			if (reason === 'idle') return this.endGame(msg, false);
		});
	}

	/**
	 * Get the board content
	 * @private
	 */
	private getBoardContent(): string {
		let board: string = '';
		for (let y: number = 0; y < this.length; y++) {
			for (let x: number = 0; x < this.length; x++) {
				board += this.gameBoard[y * this.length + x];
			}
			board += '\n';
		}
		return board;
	}

	/**
	 * End the game
	 * @param msg
	 * @param result
	 * @private
	 */
	private endGame(msg: Message, result: boolean): Promise<Message> {
		const GameOverMessage: string = result
			? this.clientUtils.emote('thumbs_up') + ' ' + this.winMessage
			: this.clientUtils.emote('thumbs_down') + ' ' +  this.loseMessage;

		// Create the final embed
		const embed: EmbedBuilder = this.clientUtils.createEmbed(GameOverMessage + '\n\n' + this.getBoardContent(), null, 'normal', this.turns);

		// Send final embed and disable buttons
		return msg.edit({
			embeds: [embed],
			components: this.disableButtons(msg.components),
		});
	}

	/**
	 * Update the game board
	 * @param selected
	 * @param msg
	 * @private
	 */
	private async updateGame(selected: string, msg: Message): Promise<boolean> {
		if (selected === this.gameBoard[0]) return false;
		const firstBlock = this.gameBoard[0];
		const queue: { x: number, y: number }[] = [{ x: 0, y: 0 }];
		const visited: {y: number, x: number}[] = [];
		this.turns += 1;

		// Flood fill algorithm
		while (queue.length > 0) {
			const block = queue.shift();

			// Skip if block is already visited
			if (!block || visited.some((v) => v.x === block.x && v.y === block.y)) continue;

			// Get block index
			const index = block.y * this.length + block.x;

			// Mark block as visited
			visited.push(block);

			if (this.gameBoard[index] === firstBlock) {
				this.gameBoard[index] = selected;

				// Check surrounding blocks
				const up = { x: block.x, y: block.y - 1 };
				if (!visited.some((v) => v.x === up.x && v.y === up.y) && up.y >= 0) queue.push(up);

				const down = { x: block.x, y: block.y + 1 };
				if (!visited.some((v) => v.x === down.x && v.y === down.y) && down.y < this.length) queue.push(down);

				const left = { x: block.x - 1, y: block.y };
				if (!visited.some((v) => v.x === left.x && v.y === left.y) && left.x >= 0) queue.push(left);

				const right = { x: block.x + 1, y: block.y };
				if (!visited.some((v) => v.x === right.x && v.y === right.y) && right.x < this.length) queue.push(right);
			}
		}

		// Check if game is over
		let gameOver: boolean = true;
		for (let y: number = 0; y < this.length; y++) {
			for (let x: number = 0; x < this.length; x++) {
				if (this.gameBoard[y * this.length + x] !== selected) gameOver = false;
			}
		}

		// Check if user has reached the maximum number of turns
		if (this.turns >= this.maxTurns && !gameOver) return void this.endGame(msg, false);
		if (gameOver) return void this.endGame(msg, true);

		return true;
	}
}
