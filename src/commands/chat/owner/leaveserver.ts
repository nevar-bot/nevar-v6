import { BaseCommand } from '@core/BaseCommand.js';
import { Message, EmbedBuilder, Guild } from 'discord.js';
import { BaseClient } from '@core/BaseClient.js';
import config from 'config';

class LeaveserverCommand extends BaseCommand<Message, string[]> {
	constructor(client: BaseClient) {
		super(client, {
			name: 'leaveserver',
			description: 'Lässt den Bot einen Server verlassen',
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
		const guildId: string = this.options[0];

		if(!guildId){
			const invalidOptionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Du musst eine Server-ID angeben, **bevor du den Befehl absendest**.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidOptionsEmbed] });
			return;
		}

		const guild: Guild|undefined = this.client.guilds.cache.get(guildId);
		if(!guild){
			const invalidOptionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der angegebene Server wurde **nicht gefunden**.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidOptionsEmbed] });
			return;
		}

		if(config.get('support.id') === guild.id){
			const invalidOptionsEmbed: EmbedBuilder = this.clientUtils.createEmbed('Der **Support-Server** kann nicht verlassen werden.', this.emote('error'), 'error');
			await this.interaction.reply({ embeds: [invalidOptionsEmbed] });
			return;
		}

		await guild.leave();

		const successEmbed: EmbedBuilder = this.clientUtils.createEmbed('Ich habe **{0}** verlassen.', this.emote('success'), 'success', guild.name);
		await this.interaction.reply({ embeds: [successEmbed] });
	}
}

export { LeaveserverCommand };