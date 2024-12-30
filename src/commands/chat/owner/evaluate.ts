import { BaseCommand } from '@core/BaseCommand.js';
import { EmbedBuilder, Message, AttachmentBuilder } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import { inspect } from 'util';

class EvaluateCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'evaluate',
			description: 'Führe Code aus',
			dirname: import.meta.url,
			restrictions: {
				ownerOnly: true
			},
			slashCommand: {
				register: false,
			},
		});
	}

	public async run(): Promise<void> {
		const code: string = this.options.join(' ')
			.replace(/[""]/g, '"')
			.replace(/['']/g, "'");

		const embedTitle: string = '### ' + this.emote('logo_icon') + ' Evaluate';
		try{
			const start: bigint = process.hrtime.bigint();

			let evaled = eval(code);

			if(evaled instanceof Promise){
				evaled = await evaled;
			}

			const stop: bigint = process.hrtime.bigint();
			const time: number = Number(stop - start) / 1e6;

			const outputResponse: string = inspect(evaled, { depth: 0 });

			if(outputResponse.length <= 1024){
				const responseEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedTitle, null, 'normal')
					.addFields(
						{ name: this.emote('code') + ' Input', value: '```js\n' + code + '```', inline: false },
						{ name: this.emote('reminder') + ' Ausführgeschwindigkeit', value: '```' + time + 'ms```', inline: false },
						{ name: this.emote('code') + ' Output', value: '```js\n' + outputResponse.substring(0, 1024) + '```', inline: false },

					);

				await this.interaction.reply({ embeds: [responseEmbed] });
			}else{
				const output: AttachmentBuilder = new AttachmentBuilder(Buffer.from(outputResponse), { name: 'output.txt' });

				const embed: EmbedBuilder = this.clientUtils.createEmbed(embedTitle, null, 'normal')
					.addFields(
						{ name: this.emote('code') + ' Input', value: '```js\n' + code + '```', inline: false },
						{ name: this.emote('reminder') + ' Ausführgeschwindigkeit', value: time + 'ms', inline: false }
					);

				await this.interaction.reply({ embeds: [embed], files: [output] });
			}

		}catch(error: unknown){
			const errorEmbed: EmbedBuilder = this.clientUtils.createEmbed(embedTitle, null, 'error')
				.addFields(
					{ name: this.emote('code') + ' Input', value: '```js\n' + code + '```', inline: false },
					{ name: this.emote('error') + ' Fehler', value: '```' + error.toString() + '```', inline: false }
				)

			await this.interaction.reply({ embeds: [errorEmbed] });
		}
	}
}

export { EvaluateCommand };