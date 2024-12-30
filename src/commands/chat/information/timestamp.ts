import { BaseCommand } from '@core/BaseCommand.js';
import {
	ApplicationIntegrationType,
	CommandInteraction, EmbedBuilder,
	CommandInteractionOptionResolver, InteractionContextType,
	SlashCommandBuilder, SlashCommandStringOption,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { parse, isValid } from 'date-fns';

class TimestampCommand extends BaseCommand<CommandInteraction, CommandInteractionOptionResolver> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'timestamp',
			description: 'Erstelle einen Discord-Zeitstempel',
			dirname: import.meta.url,
			slashCommand: {
				register: true,
				data: new SlashCommandBuilder()
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
					.setContexts(InteractionContextType.Guild)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName("datum")
						.setDescription("Gib hier das Datum im deutschen Format an (Datum & Zeit, nur Datum oder nur Zeit)")
						.setRequired(true)
					)
					.addStringOption((stringOption: SlashCommandStringOption) => stringOption
						.setName("format")
						.setDescription("Wähle, wie der Timestamp angezeigt werden soll")
						.setRequired(true)
						.addChoices(
							{ name: "Kurze Zeit (bspw. 09:01)", value: "t" },
							{ name: "Lange Zeit (bspw. 09:01:00)", value: "T" },
							{ name: "Kurzes Datum (bspw. 28.11.2024)", value: "d" },
							{ name: "Langes Datum (bspw. 28. November 2024)", value: "D" },
							{ name: "Kurzes Datum und kurze Zeit (bspw. 28. November 2024 09:01)", value: "f" },
							{ name: "Langes Datum und lange Zeit (bspw. Donnerstag, 28. November 2024 09:01)", value: "F" },
							{ name: "Relative Zeit (bspw. vor 3 Jahren)", value: "R" },
						),
					)
			},
		});
	}

	public async run(): Promise<void> {
		const datetime: string = this.options.getString('datum');
		const type: string = this.options.getString('format');

		const unixTime: number|null = this.parseDateTime(datetime);

		if(!unixTime){
			const errorEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du hast ein **ungültiges Datum** oder eine **ungültige Zeit** angegeben.', this.emote('error'), 'error');
			await this.interaction.followUp({ embeds: [errorEmbed] });
			return;
		}

		const timestamp: string = "<t:" + unixTime + ":" + type + ">";

		const timestampEmbed: EmbedBuilder = this.clientUtils.createEmbed('Dein Zeitstempel: {0}', this.emote('calendar'), 'normal', timestamp);
		await this.interaction.followUp({ embeds: [timestampEmbed], content: '`' + timestamp + '`'});
	}

	private parseDateTime(inputString: string): number | null {
		const formats = [
			{ regex: /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/, format: "dd.MM.yyyy HH:mm" },
			{ regex: /^\d{2}:\d{2}$/, format: "HH:mm" },
			{ regex: /^\d{2}\.\d{2}\.\d{4}$/, format: "dd.MM.yyyy" },
		];

		for (const { regex, format } of formats) {
			if (regex.test(inputString)) {
				const parsedDate: Date = parse(inputString, format, new Date());
				if(isValid(parsedDate)){
					return Math.floor(parsedDate.getTime() / 1000);
				}
			}
		}

		return null;
	}
}

export { TimestampCommand };