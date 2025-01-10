import { BaseCommand } from '@core/BaseCommand.js';
import { Message, TextChannel, EmbedBuilder, ReadonlyCollection } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';

class ChangelogCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'changelog',
			description: 'Sendet einen Changelog',
			dirname: import.meta.url,
			restrictions: {
				staffOnly: true
			},
			slashCommand: {
				register: false,
			},
		});
	}

	public async run(): Promise<void> {
		const channel: TextChannel = this.interaction.channel as TextChannel;

		const stepEmbeds: Map<Number, EmbedBuilder> = new Map();
		const stepValues: Map<Number, string> = new Map();

		stepEmbeds.set(1, this.clientUtils.createEmbed('Sende die neuen Features, oder `-` um es leer zu lassen', this.emote('arrow_right'), 'normal'));
		stepEmbeds.set(2, this.clientUtils.createEmbed('Sende die entfernten Features, oder `-` um es leer zu lassen', this.emote('arrow_right'), 'normal'));
		stepEmbeds.set(3, this.clientUtils.createEmbed('Sende die verbesserten Features, oder `-` um es leer zu lassen', this.emote('arrow_right'), 'normal'));
		stepEmbeds.set(4, this.clientUtils.createEmbed('Sende die Bugfixes, oder `-` um es leer zu lassen', this.emote('arrow_right'), 'normal'));

		let stepIndex = 1;
		const botMsg: Message = await this.interaction.reply({ embeds: [stepEmbeds.get(1)]});

		const messageCollector = channel.createMessageCollector({
			filter: (msg: Message) => msg.author.id === this.user.id
		});

		messageCollector
			.on('collect', async (message: Message) => {
				const messageContent: string = message.content !== '-' ? message.content : null;

				stepValues.set(stepIndex, messageContent);
				await message.delete().catch(() => {});

				stepIndex++;
				if(stepIndex > stepEmbeds.size) {
					messageCollector.stop("steps_end");
					return;
				}
				botMsg.edit({ embeds: [stepEmbeds.get(stepIndex)] });
			})

		
			.on("end", async (_: ReadonlyCollection<string, Message>, reason: string) => {
				if(reason === 'steps_end'){
					await this.interaction.delete().catch(() => {});
					await botMsg.delete();

					const changelogEmbed: EmbedBuilder = this.clientUtils.createEmbed(null, null, 'normal');

					let changelogEmbedDescription: string =
						'## ' + this.emote('logo_icon') + ' Changelog vom ' + this.formatUtils.discordTimestamp(Date.now(), 'D') + '\n\n';

					if(stepValues.get(1)){
						changelogEmbedDescription +=
							'### ' + this.emote('join') + ' Neue Funktionen\n\n' +
							this.emote('edit') + ' ' + stepValues.get(1).split('\n').join('\n' + this.emote('edit') + ' ') + '\n\n';
					}

					if(stepValues.get(2)){
						changelogEmbedDescription +=
							'### ' + this.emote('leave') + ' Entfernte Funktionen\n\n' +
							this.emote('edit') + ' ' + stepValues.get(2).split('\n').join('\n' + this.emote('edit') + ' ') + '\n\n';
					}

					if(stepValues.get(3)){
						changelogEmbedDescription +=
							'### ' + this.emote('settings2') + ' Verbesserte Funktionen\n\n' +
							this.emote('edit') + ' ' + stepValues.get(3).split('\n').join('\n' + this.emote('edit') + ' ') + '\n\n';
					}

					if(stepValues.get(4)){
						changelogEmbedDescription +=
							'### ' + this.emote('bughunter') + ' Behobene Fehler\n\n' +
							this.emote('edit') + ' ' + stepValues.get(4).split('\n').join('\n' + this.emote('edit') + ' ') + '\n\n';
					}

					changelogEmbed
						.setDescription(changelogEmbedDescription)
						.setThumbnail(this.client.user.displayAvatarURL());

					await channel.send({ embeds: [changelogEmbed] });
					return;
				}	
			})
		
	}
}

export { ChangelogCommand };