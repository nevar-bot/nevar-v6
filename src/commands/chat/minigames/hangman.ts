import { BaseCommand } from '@core/BaseCommand.js';
import { ActionRowBuilder, ApplicationIntegrationType, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType, Message, SlashCommandBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { BaseGame } from '@core/BaseGame.js';


class HangmanCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'hangman',
			description: 'Finde das Wort, bevor du gehängt wirst',
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
		const game: HangmanGame = new HangmanGame({
			interaction: this.interaction,
			client: this.client,
		});

		await game.startGame();
	}
}

export { HangmanCommand };

class HangmanGame extends BaseGame {
	public hangman: any;
	public word: string;
	public buttonPage: number;
	public guessed: string[];
	public damage: number;

	constructor(options) {
		super(options);

		const words: string[] = [
			'Auto', 'Haus', 'Stadt', 'Land', 'Fluss', 'Garten', 'Schule',
			'Bibliothek', 'Kino', 'Museum', 'Musik', 'Kunst', 'Sport', 'Urlaub',
			'Reise', 'Natur', 'Umwelt', 'Gesundheit', 'Lebensweise', 'Kochen', 'Backen',
			'Wein', 'Bier', 'Alkohol', 'Wasser', 'Feuer', 'Luft', 'Erde',
			'Himmel', 'Sonne', 'Mond', 'Sterne', 'Kosmos', 'Zeit', 'Geschichte',
			'Zukunft', 'Wissenschaft', 'Technologie', 'Innovation', 'Philosophie', 'Religion', 'Mythologie',
			'Fantasie', 'Literatur', 'Sprache', 'Grammatik', 'Vokabeln', 'Film', 'Fernsehen',
			'Serien', 'Dokumentation', 'Drama', 'Action', 'Thriller', 'Horror', 'Romanze',
			'Animation', 'Superhelden', 'Krieg', 'Frieden', 'Politik', 'Gesellschaft', 'Wirtschaft',
			'Arbeit', 'Karriere', 'Geld', 'Bank', 'Versicherung', 'Handel', 'Marketing',
			'Kunden', 'Produktion', 'Transport', 'Logistik', 'Internet', 'Socialmedia', 'Apps',
			'Spiele', 'Onlineshopping', 'Mode', 'Schmuck', 'Kosmetik', 'Geschenke', 'Haustiere',
			'Tiere', 'Pflanzen', 'Farben', 'Formen'
		];
		this.word = words[Math.floor(Math.random() * words.length)];
		this.buttonPage = 0;
		this.guessed = [];
		this.damage = 0;
	}

	private getAlphaEmoji(letter) {
		const letters: any = {
			A: '🇦', B: '🇧', C: '🇨', D: '🇩',
			E: '🇪', F: '🇫', G: '🇬', H: '🇭',
			I: '🇮', J: '🇯', K: '🇰', L: '🇱',
			M: '🇲', N: '🇳', O: '🇴', P: '🇵',
			Q: '🇶', R: '🇷', S: '🇸', T: '🇹',
			U: '🇺', V: '🇻',  W: '🇼', X: '🇽',
			Y: '🇾', Z: '🇿',
		};

		if (letter == 0) return Object.keys(letters).slice(0, 12);
		if (letter == 1) return Object.keys(letters).slice(12, 24);
		return letters[letter];
	}

	private getBoardContent(): string {
		let board: string = '```\n|‾‾‾‾‾‾| \n|      ';
		board += (this.damage > 0 ? '🎩' : ' ') + ' \n|      ';
		board += (this.damage > 1 ? '😟' : ' ') + ' \n|    ';
		board += (this.damage > 2 ? '🫲' : ' ') + '';
		board += (this.damage > 3 ? '👕' : ' ') + '';
		board += (this.damage > 4 ? '🫱' : ' ') + ' \n|      ';
		board += (this.damage > 5 ? '🩳' : ' ') + ' \n|     ';
		board += (this.damage > 6 ? '👞' : ' ') + '';
		board += (this.damage > 7 ? '👞' : ' ') +  '\n|     ';
		board += '\n|__________                      ```';
		return board;
	}

	/**
	 * Start the hangman game
	 * @returns {Promise<void>}
	 */
	public async startGame(): Promise<void> {
		// Generate embed description
		const embedDescription: string =
			'### ' + this.getWordEmojis() + '\n\n' +
			this.getBoardContent();

		// Create hangman embed
		const hangmanEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedDescription, null, 'normal');

		// Send hangman message
		const hangmanMessage: Message = await this.interaction.editReply({ embeds: [hangmanEmbed], components: this.getComponents() });

		// Handle buttons
		return this.handleButtons(hangmanMessage);
	}

	/**
	 * Handle button interactions
	 * @param msg 
	 * @returns {void} 
	 */
	private handleButtons(msg: Message): void {
		// Create message component collector
		const hangmanCollector = msg.createMessageComponentCollector({
			filter: (btn: ButtonInteraction): boolean => btn.user.id === this.interaction.user.id,
		});

		// Handle collector events
		hangmanCollector.on('collect', async (btn: ButtonInteraction): Promise<any> => {
			// Defer button update
			await btn.deferUpdate().catch(() => {});

			// Get user guess
			const guess: any = btn.customId.split('_')[2];

			// Stop game if user wants to
			if (guess === 'stop') return hangmanCollector.stop();

			// Handle page change
			if (guess == 0 || guess == 1)
				return msg.edit({ components: this.getComponents(parseInt(guess)) });

			// Check if letter was already guessed
			if (this.guessed.includes(guess)) return;

			// Add letter to guessed list
			this.guessed.push(guess);

			// Check if letter is in searched word
			if (!this.word.toUpperCase().includes(guess)) this.damage += 1;

			// End game if damage is greater than 7 or word was found
			if (this.damage > 7 || this.foundWord()) return hangmanCollector.stop();

			// Generate new hangman embed description
			const description: string =
				'### ' + this.getWordEmojis() + '\n\n' +
				this.getBoardContent();

			// Create new hangman embed
			const hangmanEmbed: EmbedBuilder = this.clientUtils.createEmbed(description, null, 'normal');

			// Edit message
			return msg.edit({ embeds: [hangmanEmbed], components: this.getComponents() });
		});

		// Handle collector end event
		hangmanCollector.on('end', (_: any, reason: string) => {
			// End game
			if (reason === 'idle' || reason === 'user') return this.endGame(msg, this.foundWord());
		});
	}

	/**
	 * End the hangman game
	 * @param msg 
	 * @param result 
	 * @returns {void}
	 */
	private endGame(msg: Message, result: boolean): void {
		// Generate game over message
		const GameOverMessage: string = result
			? '### ' + this.getWordEmojis() + '\n\n' + this.getBoardContent()
			: '### ' + this.getWordEmojis() + '\n\n' + this.getBoardContent() + '\n' + this.clientUtils.emote('arrow_right') + ' Das gesuchte Wort war **' + this.word + '**';

		// Create game over embed
		const gameOverEmbed: EmbedBuilder = this.clientUtils.createEmbed(GameOverMessage, null, 'normal');

		// Edit message
		msg.edit({ embeds: [gameOverEmbed], components: [] });
	}

	/**
	 * Check if the word was found
	 * @returns {boolean}
	 */
	private foundWord(): boolean {
		// Check if all letters are guessed
		return this.word
			.toUpperCase()
			.replace(/ /g, '')
			.split('')
			.every((l: string): boolean => this.guessed.includes(l));
	}

	/**
	 * Get the word with emojis
	 * @returns {string}
	 */
	private getWordEmojis(): string {
		return this.word
			.toUpperCase()
			.split('')
			.map((l: string): boolean =>
				this.guessed.includes(l) ? this.getAlphaEmoji(l) : l === ' ' ? '⬜' : '⬜',
			)
			.join(' ');
	}

	/**
	 * Get the hangman components
	 * @param page 
	 * @returns {any}
	 */
	private getComponents(page: number|undefined = undefined): any {
		const components = [];
		if (page == 0 || page == 1) this.buttonPage = page;

		// Get letters for specific page
		const letters = this.getAlphaEmoji(this.buttonPage ?? 0);
		const pageID: string = 'collector_hangman_' + (this.buttonPage ? 0 : 1);

		// Create action rows with letter buttons
		for (let y: number = 0; y < 3; y++) {
			const row: any = new ActionRowBuilder();
			for (let x: number = 0; x < 4; x++) {
				const letter = letters[y * 4 + x];
				const btn: ButtonBuilder = this.componentsUtils.createButton('collector_hangman_' + letter, letter, ButtonStyle.Primary, null, this.guessed.includes(letter));
				row.addComponents(btn);
			}
			components.push(row);
		}

		// Create action row with stop and page button as well as Y and Z buttons if needed
		const row4: ActionRowBuilder = new ActionRowBuilder();
		const stop: ButtonBuilder = this.componentsUtils.createButton('collector_hangman_stop', 'Stop', ButtonStyle.Danger);
		const pageBtn: ButtonBuilder = this.componentsUtils.createButton(pageID, null, ButtonStyle.Primary, this.buttonPage ? this.clientUtils.emote('arrow_left') : this.clientUtils.emote('arrow_right'));
		const letterY: ButtonBuilder = this.componentsUtils.createButton('collector_hangman_Y', 'Y', ButtonStyle.Primary, null, this.guessed.includes('Y'));
		const letterZ: ButtonBuilder = this.componentsUtils.createButton('collector_hangman_Z', 'Z', ButtonStyle.Primary, null, this.guessed.includes('Z'));
		row4.addComponents(pageBtn, stop);
		if (this.buttonPage) row4.addComponents(letterY, letterZ);

		components.push(row4);
		return components;
	}
}