import { BaseCommand } from '@core/BaseCommand.js';
import {
	SlashCommandBuilder, Message, AttachmentBuilder, BufferResolvable,
} from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import mongoose from "mongoose";
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

class CommandusageCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'commandusage',
			description: 'Schau dir die Nutzungsstatistiken eines Befehls an',
			dirname: import.meta.url,
			restrictions: {
				staffOnly: true
			},
			slashCommand: {
				register: false,
				data: new SlashCommandBuilder()
			},
		});
	}

	public async run(): Promise<void> {
		if (!this.options[0]) {
			const noCommandEmbed = this.clientUtils.createEmbed('Du musst einen Befehl angeben, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [noCommandEmbed] });
			return;
		}

		try {
			const commandLogs = await mongoose.connection.db.collection('logs').find({ command: this.options[0] }).toArray();

			if (commandLogs.length === 0) {
				const noLogsEmbed = this.clientUtils.createEmbed('Es gibt keine Logs für den angegebenen Befehl.', this.emote('error'), 'error');
				await this.interaction.reply({ embeds: [noLogsEmbed] });
				return;
			}

			const usageMap = new Map<string, number>();

			commandLogs.forEach((log: any) => {
				const date = new Date(log.date).toLocaleDateString('de-DE');

				usageMap.set(date, (usageMap.get(date) || 0) + 1);

				if (usageMap.size >= 30) {
					return;
				}
			});

			const labels = Array.from(usageMap.keys()); // X-Achse (Datum)
			const data = Array.from(usageMap.values());  // Y-Achse (Werte)

			const width = 800;
			const height = 600;
			const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

			const configuration: any = {
				type: 'line',
				data: {
					labels: labels,
					datasets: [{
						label: 'Nutzungsstatistik des ' + this.options[0] + '-Befehls',
						data: data,
						fill: false,
						borderColor: 'rgb(75, 192, 192)',
						tension: 0.1
					}]
				},
				options: {
					scales: {
						x: {
							title: {
								display: true,
								text: 'Datum'
							}
						},
						y: {
							title: {
								display: true,
								text: 'Nutzung'
							},
							beginAtZero: true,
							suggestedMax: Math.max(...data) + 1,
							ticks: {
								stepSize: 1,
								callback: (value: number) => Number.isInteger(value) ? value : ''
							}
						}
					},
					plugins: {
						background: {
							color: 'white'
						}
					},
				},
				plugins: [{
					id: 'customCanvasBackgroundColor',
					beforeDraw: (chart: any): void => {
						const ctx = chart.canvas.getContext('2d');
						ctx.save();
						ctx.globalCompositeOperation = 'destination-over';
						ctx.fillStyle = 'white';
						ctx.fillRect(0, 0, chart.width, chart.height);
						ctx.restore();
					}
				}]
			};

			const image: BufferResolvable = await chartJSNodeCanvas.renderToBuffer(configuration);
			const attachment: AttachmentBuilder = new AttachmentBuilder(image, { name: 'chart.png', description: 'Nutzungsstatistik des ' + this.options[0] + '-Befehls' });

			const commandUsageEmbed = this.clientUtils.createEmbed('### ' + this.emote('chart_up') + ' Nutzungsstatistik des ' + this.options[0] + '-Befehls', null, 'normal')
				.setImage('attachment://chart.png');

			await this.interaction.reply({ embeds: [commandUsageEmbed], files: [attachment] });
		} catch (error) {
			await this.handleUnknownError(error);
		}
	}
}

export { CommandusageCommand };