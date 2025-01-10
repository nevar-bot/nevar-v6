import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	ButtonStyle,
	CommandInteraction,
	CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import * as math from 'mathjs';

class CalculatorCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'calculator',
			description: 'Benutz mich als Taschenrechner',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
			},
		});
	}

	public async run(): Promise<void> {
		const userId: string = this.user.id;

		const buttons = [
			[{ id: 'ac', label: 'AC', style: ButtonStyle.Danger }, { id: 'openbracket', label: '(', style: ButtonStyle.Primary }, { id: 'closebracket', label: ')', style: ButtonStyle.Primary }, { id: 'divide', label: '÷', style: ButtonStyle.Primary }],
			[{ id: '1', label: '1', style: ButtonStyle.Secondary }, { id: '2', label: '2', style: ButtonStyle.Secondary }, { id: '3', label: '3', style: ButtonStyle.Secondary }, { id: 'multiply', label: 'x', style: ButtonStyle.Primary }],
			[{ id: '4', label: '4', style: ButtonStyle.Secondary }, { id: '5', label: '5', style: ButtonStyle.Secondary }, { id: '6', label: '6', style: ButtonStyle.Secondary }, { id: 'minus', label: '-', style: ButtonStyle.Primary }],
			[{ id: '7', label: '7', style: ButtonStyle.Secondary }, { id: '8', label: '8', style: ButtonStyle.Secondary }, { id: '9', label: '9', style: ButtonStyle.Secondary }, { id: 'plus', label: '+', style: ButtonStyle.Primary }],
			[{ id: 'remove', label: '⌫', style: ButtonStyle.Primary }, { id: '0', label: '0', style: ButtonStyle.Secondary }, { id: 'comma', label: ',', style: ButtonStyle.Primary }, { id: 'equal', label: '=', style: ButtonStyle.Success }],
		];

		const rows = buttons.map(row =>
			this.componentsUtils.createActionRow(
				...row.map(button => this.componentsUtils.createButton('collector_' + button.id, button.label, button.style))
			)
		);

		const calculatorMessage = await this.interaction.followUp({
			embeds: [this.clientUtils.createEmbed('```\u200b```', null, 'normal')],
			components: rows
		});

		const buttonCollector = calculatorMessage.createMessageComponentCollector({
			filter: (button: any) => button.user.id === userId
		});

		let formula: string = '';

		const actions: Record<string, () => void> = {
			ac: () => (formula = '\u200b'),
			openbracket: () => (formula += '('),
			closebracket: () => (formula += ')'),
			divide: () => (formula += '÷'),
			multiply: () => (formula += 'x'),
			minus: () => (formula += '-'),
			plus: () => (formula += '+'),
			remove: () => (formula = formula.slice(0, -1)),
			comma: () => (formula += ','),
			equal: () => {
				try {
					formula = math.evaluate(formula.replace(/[x]/gi, '*').replace(/[÷]/gi, '/').replace(/[,]/gi, '.').replace('\u200b', ''))?.toString();
				} catch {
					formula = '\u200b';
				}
			}
		}

		for(let i = 0; i <= 9; i++) {
			actions[i.toString()] = () => (formula += i.toString());
		}

		buttonCollector.on('collect', async (buttonInteraction): Promise<void> => {
			const action = buttonInteraction.customId.split('_')[1];
			actions[action]?.();

			if (!formula || formula === '') formula = '\u200b';

			const embed = this.clientUtils.createEmbed('```\n' + formula.replace(/[.]/gi, ',') + '\n```', null, 'normal');
			await buttonInteraction.update({ embeds: [embed] });
		});
	}
}

export { CalculatorCommand };