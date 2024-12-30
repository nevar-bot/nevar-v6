import { BaseClient } from '@core/BaseClient.js';
import { Guild, GuildMember, User } from 'discord.js';
import head, { AxiosResponse } from 'axios';

class ValidationUtils {
	private readonly client: BaseClient;
	constructor(client: BaseClient) {
		this.client = client;
	}

	/**
	 * Resolve a user from a query
	 * @param query
	 * @param exact
	 */
	public async resolveUser(query: string, exact: boolean = false): Promise<User> {
		// User mention pattern
		const USER_MENTION: RegExp = /<?@?!?(\d{17,20})>?/;
		if (!query) return;

		// Check if the query is a mention
		const patternMatch: RegExpExecArray | null = RegExp(USER_MENTION).exec(query);

		// If the query is a mention, fetch the user
		if (patternMatch) {
			const id: string = patternMatch[1];
			const fetchedUser: any = await this.client.users.fetch(id, { cache: true }).catch((): void => {});

			// Return the fetched user
			if (fetchedUser) return fetchedUser;
		}

		// Check if searched user is cached
		const matchingUsernames: any = this.client.users.cache.filter((user: any): boolean => user.username === query);
		if (matchingUsernames.size === 1) return matchingUsernames.first();

		if (!exact) {
			// Search for users with username including the query
			return this.client.users.cache.find(
				(x: any): any => x.username === query || x.username.toLowerCase().includes(query.toLowerCase()),
			);
		}
	}

	/**
	 * Resolve a member from a query
	 * @param guild
	 * @param query
	 * @param exact
	 */
	public async resolveMember(guild: Guild, query: string, exact: boolean = false): Promise<GuildMember> {
		if(!query) return;

		// User mention pattern
		const patternMatch: RegExpExecArray|null = RegExp(/<?@?!?(\d{17,20})>?/).exec(query);

		// If the query is a mention, fetch the user
		if(patternMatch){
			const fetched: any = await guild.members.fetch({ user: patternMatch[1] }).catch((): void => {});

			// Return the fetched user
			if(fetched) return fetched;
		}

		// Fetch member by query
		await guild.members.fetch({ query }).catch((): void => {});

		// Check for users with usernames including the query
		const matchingUsernames: any = guild.members.cache.filter((member: any): boolean => member.user.username.toLowerCase().includes(query.toLowerCase()) || member.displayName.toLowerCase().includes(query.toLowerCase()));
		if(matchingUsernames.size === 1) return matchingUsernames.first();
		if(!exact){
			return matchingUsernames.find((member: any): boolean => member.user.username === query);
		}
	}

	/**
	 * Check if a string is a valid URL
	 * @param url
	 */
	public stringIsUrl(url: string): boolean {
		return RegExp(/https?:\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/i).exec(url) != null;
	}

	/**
	 * Check if a URL has an image extension
	 * @param url
	 */
	public urlHasImageExtension(url: string): boolean {
		return RegExp(/^http[^]*.(jpg|jpeg|gif|png)(\?(.*))?$/i).exec(url) != null;
	}

	/**
	 * Check if a URL is an image
	 * @param url
	 */
	public async urlIsImage(url: string): Promise<boolean> {
		try{
			// Send a HEAD request to the URL
			const response: AxiosResponse = await head(url);

			// Check if the response content type is an image
			return response.headers['content-type'].toString().startsWith('image/');
		}catch(error: unknown){
			return false;
		}
	}

	/**
	 * Check if a string is a custom emoji
	 * @param str
	 */
	public stringIsCustomEmoji(str: string): boolean {
		return RegExp(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/).exec(str) != null;
	}

	/**
	 * Check if a string is a hex color
	 * @param str
	 */
	public stringIsHexColor(str: string): boolean {
		return RegExp(/^#?[0-9A-F]{6}$/i).exec(str) != null;
	}

	/**
	 * Check if a string is an RGB color
	 * @param str
	 */
	public stringIsRgbColor(str: string): boolean {
		return RegExp(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|0?\.\d+)\s*)?\)$|^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/i).test(str);
	}

	/**
	 * Check if a string is a valid emoji
	 * @param str
	 */
	public stringIsEmoji(str: string): boolean {
		return RegExp(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g).exec(str) != null;
	}

	/**
	 * Check if a string is valid JSON
	 * @param str
	 */
	public stringIsJson(str: string): boolean {
		try {
			JSON.parse(str);
		}catch(error) {
			return false;
		}
		return true;
	}

	/**
	 * Check if a string matches a pattern
	 * @param pattern
	 * @param str
	 */
	public stringMatches(pattern: RegExp, str: string): boolean {
		return new RegExp(pattern).exec(str) != null;
	}

	/**
	 * Get matches from a string
	 * @param pattern
	 * @param str
	 */
	public getMatches(pattern: RegExp, str: string): RegExpExecArray {
		return new RegExp(pattern).exec(str);
	}
}

export { ValidationUtils };