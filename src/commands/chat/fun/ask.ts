import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction,
	CommandInteractionOptionResolver, EmbedBuilder, InteractionContextType,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class AskCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'ask',
			description: 'Stelle mir Fragen und ich werde sie beantworten',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName('frage')
						.setDescription('Was möchtest du wissen?')
						.setRequired(true)
					)
			},
		});
	}

	public async run(): Promise<void> {
		const randomAnswer: string = this.answers[Math.floor(Math.random() * this.answers.length)];

		const answerText: string = this.emote('question_mark') + ' ' + this.options.getString('frage') + '\n' + this.emote('arrow_right') + ' ' + randomAnswer;
		const answerEmbed: EmbedBuilder = this.clientUtils.createEmbed(answerText, null, 'normal');
		await this.interaction.followUp({ embeds: [answerEmbed] });
	}

	private readonly answers: string[] = [
		'Ja, definitiv!',
		'Nein, auf keinen Fall.',
		'Vielleicht später.',
		'Es ist möglich.',
		'Meine Quellen sagen Nein.',
		'Das sieht gut aus.',
		'Zweifelhaft.',
		'Nein, absolut nicht.',
		'Irgendwann in weiter Ferne, vielleicht. Jetzt nicht.',
		'In der Zukunft vielleicht.',
		'Die Zeichen deuten auf Nein.',
		'Ich kann das nicht vorhersagen.',
		'Gute Aussichten.',
		'Sieht nicht so gut aus.',
		'Ja, ohne Zweifel.',
		'Ich würde nicht darauf wetten.',
		'Frage deine Freunde, die wissen es.',
		'Träum weiter.',
		'Ja, aber sei geduldig.',
		'Ja, aber es wird noch eine Weile dauern.',
		'Noch nicht, aber bald.',
		'Nein, aber versuche es erneut.',
		'Kann ich jetzt nicht sagen.',
		'Die Antwort liegt in dir.',
		'Nicht in diesem Leben.',
		'Vielleicht in einer anderen Realität.',
		'Höchstens in einem Paralleluniversum.',
		'Weiß ich nicht',
		'Gute Frage!',
		'Ich bin mir nicht sicher.',
		'Auf diese Frage gibt es keine Antwort.',
		'Auf diese Frage habe ich keine Antwort.',
		'Ich kenne die Antwort, werde sie aber nicht sagen.',
		'Die Antwort würde dir nicht gefallen, also sage ich sie dir nicht.',
		'Das ist geheim.',
		'Selbstverständlich!',
		'Das kannst du vergessen.',
		'Verlasse dich besser nicht darauf.',
		'Sehr wahrscheinlich.',
		'Das ist unwahrscheinlich.',
		'Es besteht die Möglichkeit.',
		'Ich denke, das hängt von dir ab.',
		'Es ist sicher.',
		'Vertrau darauf, dass es passieren wird.',
		'Nicht in diesem Universum.',
		'Die Zeichen deuten auf Ja.',
		'Du musst einfach nur daran glauben.',
		'Du musst geduldig sein.',
		'Es ist entschieden.',
		'Höchstwahrscheinlich.',
		'Frag nicht nach.',
		'Ich sehe keine Probleme.',
		'Auf keinen Fall!',
		'Hoffentlich nicht',
		'Bitte nicht!',
		'Es ist möglich, aber unwahrscheinlich.',
		'Es ist unwahrscheinlich, aber möglich.',
		'Es ist wahrscheinlich, aber nicht sicher.',
		'Frag lieber nicht.',
		'Die Chancen stehen gut.',
		'Das ist unklar.',
		'Die Antwort könnte dich überraschen.',
		'Vertraue darauf, dass es passieren wird.',
		'Es besteht eine Möglichkeit.',
		'Die Sterne sagen Nein.',
		'Ich weiß es nicht.',
		'Ich würde darauf wetten.',
		'Ohne jeden Zweifel.',
		'Nein, definitiv nicht!',
		'Frag lieber jemand anderen.',
		'Frag später noch einmal nach.',
		'Ich möchte dich nicht enttäuschen, aber nein.',
		'Ich möchte dich nicht enttäuschen, aber ich muss.'
	]
}

export { AskCommand };