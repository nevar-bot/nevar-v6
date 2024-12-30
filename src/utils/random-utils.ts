class RandomUtils {
	/**
	 * Generate a random string
	 * @param length
	 */
	public randomString(length: number): string {
		// Define characters
		const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		// Generate random string
		return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
	}

	/**
	 * Shuffle an array
	 * @param array
	 */
	public shuffleArray(array: any[]): any[] {
		// Shuffle an array
		return array.sort(() => Math.random() - 0.5);
	}

	/**
	 * Choose a random element from an array
	 * @param choices
	 */
	public randomChoice<T>(choices: T[]): T {
		// Choose a random element from an array
		return choices[Math.floor(Math.random() * choices.length)];
	}

	/**
	 * Generate a random color in hex format
	 */
	public randomColor(): string {
		// Generate a random color
		const randomColor: string = '#' + Math.floor(Math.random() * 16777215).toString(16);
		return randomColor.length === 7 ? randomColor : this.randomColor();
	}

	/**
	 * Generate a random number
	 * @param min
	 * @param max
	 */
	public randomNumber(min: number, max: number): number {
		// Generate a random number
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
}

export { RandomUtils };