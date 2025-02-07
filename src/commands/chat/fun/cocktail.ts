import type { BaseClient } from '@core/BaseClient.js';
import { BaseCommand } from '@core/BaseCommand.js';
import axios from 'axios';
import {
	ApplicationIntegrationType,
	type CommandInteraction,
	type CommandInteractionOptionResolver,
	EmbedBuilder,
	InteractionContextType,
	SlashCommandBuilder,
} from 'discord.js';

interface Cocktail {
	strDrink: string;
	strDrinkThumb: string;
	strInstructionsDE: string;
	strCategory: string;
	strAlcoholic: string;
	strGlass: string;

	[key: string]: string | null;
}

class CocktailCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'cocktail',
			description: 'Lass dir einen zufälligen Cocktail empfehlen.',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(
						ApplicationIntegrationType.GuildInstall,
						ApplicationIntegrationType.UserInstall
					)
					.setContexts(
						InteractionContextType.Guild,
						InteractionContextType.PrivateChannel,
						InteractionContextType.BotDM
					),
			},
		});
	}

	public async run(): Promise<void> {
		try {
			const response = await axios.get(
				'https://www.thecocktaildb.com/api/json/v1/1/random.php'
			);
			const cocktail: Cocktail = response.data.drinks[0];

			const ingredients = this.getIngredients(cocktail);

			const embed = new EmbedBuilder()
				.setDescription(
					'## ' +
						this.emote('underage') +
						' ' +
						cocktail.strDrink +
						'\n\n' +
						`**${cocktail.strCategory}**\n**Glas:** ${cocktail.strGlass}`
				)
				.setImage(cocktail.strDrinkThumb)
				.addFields(
					{
						name: this.emote('arrow_right') + ' Zutaten',
						value: ingredients.join('\n'),
						inline: true,
					},
					{
						name: this.emote('arrow_right') + ' Zubereitung',
						value: cocktail.strInstructionsDE || 'Keine deutsche Anleitung verfügbar.',
					}
				)
				.setColor(this.config.embeds.colors.normal)
				.setFooter({
					text: 'Nicht für Personen unter 18 Jahren geeignet. Genieße verantwortungsbewusst!',
				});

			await this.interaction.followUp({ embeds: [embed] });
		} catch (error) {
			console.error('Error fetching cocktail:', error);
			await this.interaction.followUp(
				'Es gab einen Fehler beim Abrufen des Cocktails. Bitte versuche es später erneut.'
			);
		}
	}

	private getIngredients(cocktail: Cocktail): string[] {
		const ingredients: string[] = [];
		for (let i = 1; i <= 15; i++) {
			const ingredient = cocktail[`strIngredient${i}`];
			const measure = cocktail[`strMeasure${i}`];
			if (ingredient) {
				ingredients.push(`› ${measure ? measure.trim() + ' ' : ''}${ingredient}`);
			}
		}
		return ingredients;
	}
}

export { CocktailCommand };
