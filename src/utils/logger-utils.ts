import { cyan, bgBlue, bgMagenta, gray, black, red, bold, yellow, bgYellowBright, bgRedBright, bgGreenBright } from 'colorette';

class LoggerUtils {
	/**
	 * Get the current date and time
	 * @private
	 */
	private getDate(): string {
		return new Date(Date.now()).toLocaleString('de-DE', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	}

	/**
	 * Log a success message
	 * @param content
	 */
	public success(content: string): void {
		console.log(bgGreenBright(black('[' + this.getDate() + ']')) + ' ' + bgGreenBright(black(bold('SUCCESS'))) + ' ' + cyan(content));
	}

	/**
	 * Log an information message
	 * @param content
	 */
	public log(content: string): void {
		console.log(gray('[' + this.getDate() + ']') + ' ' + bgBlue(black(bold('INFO'))) + ' ' + cyan(content));
	}

	/**
	 * Log a warning message
	 * @param content
	 * @param warning
	 */
	public warn(content: string, warning: any = null): void {
		console.log(bgYellowBright(black('[' + this.getDate() + ']')) + ' ' + bgYellowBright(black(bold('WARNING'))) + ' ' + cyan(content));
		if(warning){
			if(warning?.stack){
				const stackLines: string[] = warning.stack.split('\n');
				stackLines.forEach((line: string): void => {
					console.log(black(bgYellowBright('[' + this.getDate() + ']')) + ' ' + yellow(bold(line)));
				});
			}else{
				console.log(bgYellowBright(black('[' + this.getDate() + ']')) + ' ' + yellow(bold(warning)));
			}
		}
	}

	/**
	 * Log an error message
	 * @param content
	 * @param ex
	 */
	public error(content: string, ex: any = null): void {
		console.log(bgRedBright('[' + this.getDate() + ']') + ' ' + bgRedBright(black(bold('ERROR'))) + ' ' + cyan(content));
		if(ex){
			if(ex?.stack){
				const stackLines: string[] = ex.stack.split('\n');
				stackLines.forEach((line: string): void => {
					console.log(bgRedBright('[' + this.getDate() + ']') + ' ' + red(bold(line)));
				});
			}else{
				console.log(bgRedBright('[' + this.getDate() + ']') + ' ' + red(bold(ex)));
			}
		}
	}

	/**
	 * Log a debug message
	 * @param content
	 */
	public debug(content: string): void {
		console.log(gray('[' + this.getDate() + ']') + ' ' + bgMagenta(black(bold('DEBUG'))) + ': ' + cyan(content));
	}
}

export { LoggerUtils };