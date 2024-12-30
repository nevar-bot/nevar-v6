import { BaseClient } from '@core/BaseClient.js';
import { ClientUtils } from '@utils/client-utils.js';
import { RandomUtils } from '@utils/random-utils.js';
import { CommandInteraction } from 'discord.js';
import { ComponentsUtils } from '@utils/components-utils.js';

class BaseGame {
	protected client: BaseClient;
	protected interaction: CommandInteraction;
	protected options: any;
	protected randomUtils: RandomUtils;
	protected clientUtils: ClientUtils;
	protected componentsUtils: ComponentsUtils;

	constructor(options: any = {}) {
		this.client = options.client;
		this.interaction = options.interaction;
		this.options = options;
		this.randomUtils = new RandomUtils();
		this.clientUtils = new ClientUtils(this.client);
		this.componentsUtils = new ComponentsUtils();
	}

	protected disableButtons(components: any): any {
		for (const element of components) {
			for (const component of element.components) {
				component.data.disabled = true;
			}
		}

		return components;
	}

	protected async sendMessage(data): Promise<any> {
		return await this.interaction.editReply(data);
	}
}

export { BaseGame };