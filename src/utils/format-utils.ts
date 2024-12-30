import { Guild } from 'discord.js';
import { isValid, parse } from 'date-fns';

class FormatUtils {
	/**
	 * Creates a role mention string
	 * @param guild
	 * @param discordId
	 */
	public roleMention(guild: Guild, discordId: string): string {
		if(discordId === '@here') return '@here';
		if(discordId === guild.id) return '@everyone';
		return '<@&' + discordId + '>';
	}

	/**
	 * Creates a channel mention string
	 * @param discordId
	 */
	public channelMention(discordId: string): string {
		return '<#' + discordId + '>';
	}

	/**
	 * Creates a user mention string
	 * @param discordId
	 */
	public userMention(discordId: string): string {
		return '<@!' + discordId + '>';
	}

	/**
	 * Creates a discord timestamp string
	 * @param {number} time - Timestamp in Sekunden oder Millisekunden
	 * @param {'t'|'T'|'d'|'D'|'f'|'F'|'r'|undefined} type - Typ
	 *   - undefined: Standard Zeitformat (z.B. '28. November 2023, 09:01')
	 *   - 't': Kurzes Zeitformat (z.B. '09:01')
	 *   - 'T': Langes Zeitformat (z.B. '09:01:00')
	 *   - 'd': Kurzes Datumsformat (z.B. '28.11.2023')
	 *   - 'D': Langes Datumsformat (z.B. '28. November 2023')
	 *   - 'f': Kurzes Datum und Uhrzeitformat (z.B. '28. November 2023 09:01')
	 *   - 'F': Langes Datum und Uhrzeitformat (z.B. 'Dienstag, 28. November 2023 09:01')
	 *   - 'R': Relatives Zeitformat (z.B. 'vor 5 Minuten')
	 */
	public discordTimestamp(time: number, type: 't'|'T'|'d'|'D'|'f'|'F'|'R'|undefined): string {
		const unixTimestamp: typeof time = time > 10000000000 ? Math.floor(time / 1000) : time

		return '<t:' + unixTimestamp + (type ? ':' + type : '') + '>';
	}

	/**
	 * Converts rgb to hex
	 * @param r
	 * @param g
	 * @param b
	 */
	public rgbToHex(r: number, g: number, b: number): string {
		// Clamp values
		r = Math.max(0, Math.min(255, r));
		g = Math.max(0, Math.min(255, g));
		b = Math.max(0, Math.min(255, b));

		// Convert to hex
		const hexR: string = r.toString(16).padStart(2, '0');
		const hexG: string = g.toString(16).padStart(2, '0');
		const hexB: string = b.toString(16).padStart(2, '0');

		// Return hex
		return '#' + hexR + hexG + hexB;
	}

	/**
	 * Converts hex to rgb
	 * @param hex
	 */
	public hexToRgb(hex: string): { r: number; g: number; b: number } {
		// Remove hash
		hex = hex.replace(/^#/, '');

		// Convert short hex to long hex
		if(hex.length === 3){
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}

		// Convert to rgb
		const r: number = parseInt(hex.substring(0, 2), 16);
		const g: number = parseInt(hex.substring(2, 4), 16);
		const b: number = parseInt(hex.substring(4, 6), 16);

		// Return rgb
		return { r, g, b };
	}

	/**
	 * Converts hex to rgba
	 * @param hex
	 * @param opacity
	 */
	public hexToRgbA(hex: string, opacity = 1): string {
		// Remove hash
		if (hex.length === 9 && hex.includes('#')) hex = hex.slice(0, 7);

		// Check if hex is valid
		const match = /^#([A-Fa-f0-9]{3}){1,2}$/.exec(hex);

		let c = match[1];
		if (c.length === 3) c = c.split('').map(x => x + x).join('');

		// Convert to rgba
		const rgba = parseInt(c, 16);

		// Return rgba
		return `rgba(${(rgba >> 16) & 255}, ${(rgba >> 8) & 255}, ${rgba & 255}, ${opacity})`;
	}

	/**
	 * Get localized channel type name
	 * @param type
	 */
	public localizedChannelType(type: number): string {
		try{
			const localizedChannelTypes = {
				0: 'Textkanal',
				1: 'Privatnachricht',
				2: 'Sprachkanal',
				3: 'Gruppen-Privatnachricht',
				4: 'Kategorie',
				5: 'Ankündigungskanal',

				10: 'Ankündigungs-Thread',
				11: 'Öffentlicher Thread',
				12: 'Privater Thread',
				13: 'Etappenkanal',
				14: 'Server-Verzeichnis',
				15: 'Forum',
				16: 'Medien-Kanal',
			};

			return localizedChannelTypes[type];
		}catch(error: unknown){
			throw error;
		}
	}
}

export { FormatUtils };