class MathUtils {
	/**
	 * Format a number in german style
	 * @param integer
	 */
	public format(integer: number): string {
		return new Intl.NumberFormat('de-DE').format(integer);
	}

	/**
	 * Calculate the sum of an array of numbers
	 * @param numbers
	 */
	public sum(numbers: number[]): number {
		return numbers.reduce((a: number, b: number) => a + b, 0);
	}

	/**
	 * Generate an array of consecutive numbers starting from a given value
	 * @param start
	 * @param size
	 */
	public range(start: number, size: number): number[] {
		return [...Array(size).keys()].map((i: number) => i + start);
	}

	/**
	 * Round a number up to the nearest multiple of a given value
	 * @param input
	 * @param multiple
	 */
	public ceilToMultiple(input: number, multiple: number): number {
		return Math.ceil(input / multiple) * multiple;
	}

	/**
	 * Get the average of an array of numbers
	 * @param numbers
	 */
	public average(numbers: number[]): number {
		if(numbers.length === 0) return 0;
		return this.sum(numbers) / numbers.length;
	}

	/**
	 * Get the median of an array of numbers
	 * @param numbers
	 */
	public median(numbers: number[]): number {
		if(numbers.length === 0) return 0;
		const sortedNumbers: number[] = numbers.slice().sort((a: number, b: number) => a - b);
		const middle: number = Math.floor(sortedNumbers.length / 2);
		if(sortedNumbers.length % 2 === 0){
			return (sortedNumbers[middle - 1] + sortedNumbers[middle]) / 2;
		}else{
			return sortedNumbers[middle];
		}
	}

	/**
	 * Get the factorial of a number
	 * @param n
	 */
	public factorial(n: number): number {
		if(n === 0 || n === 1) return 1;
		let result: number = 1;
		for(let i = 2; i <= n; i++){
			result *= i;
		}
		return result;
	}

	/**
	 * Power a number
	 * @param base
	 * @param exponent
	 */
	public power(base: number, exponent: number): number {
		return Math.pow(base, exponent);
	}
}

export { MathUtils };