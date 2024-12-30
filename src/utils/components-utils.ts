import {
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	AnyComponentBuilder,
	AnyComponent,
	ActionRowData,
} from 'discord.js';

class ComponentsUtils {
	/**
	 * Create a button
	 * @param customId
	 * @param label
	 * @param style
	 * @param emote
	 * @param disabled
	 * @param url
	 */
	public createButton(customId: string|null, label: string|null, style: ButtonStyle, emote: string|null = null, disabled: boolean = false, url: string|null = null): ButtonBuilder {
		try{
			const button: ButtonBuilder = new ButtonBuilder()
				.setLabel(label || ' ')
				.setStyle(style)
				.setDisabled(disabled);

			if(emote) button.setEmoji(emote);
			if(url) button.setURL(url);
			if(customId) button.setCustomId(customId);

			return button;
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Create a components action row
	 * @param components
	 */
	public createActionRow(...components: AnyComponentBuilder[]): any {
		try{
			// Filter out null components
			const filteredComponents = components.filter((component: AnyComponentBuilder): boolean => component !== null);

			// Return new action row with filtered components
			return new ActionRowBuilder().addComponents(...filteredComponents);
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Disable all buttons in an array
	 * @param buttons
	 */
	public disableButtons(...buttons: ButtonBuilder[]): ButtonBuilder[] {
		try{
			// Loop through all buttons and disable them
			buttons.forEach((button: ButtonBuilder): void => {
				button.setDisabled(true);
			});

			// Return disabled buttons
			return buttons;
		}catch(error: unknown){
			throw error;
		}
	}

	/**
	 * Enable all buttons in an array
	 * @param buttons
	 */
	public enableButtons(...buttons: ButtonBuilder[]): ButtonBuilder[] {
		try{
			// Loop through all buttons and enable them
			buttons.forEach((button: ButtonBuilder): void => {
				button.setDisabled(false);
			});

			// Return enabled buttons
			return buttons;
		}catch(error: unknown){
			throw error;
		}
	}
}

export { ComponentsUtils };