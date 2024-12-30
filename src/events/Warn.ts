import { BaseEvent } from '@core/BaseEvent.js';
import { BaseClient } from '@core/BaseClient.js';
import { ClientUtils } from '@utils/client-utils.js';

class WarnEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(w): Promise<void> {
		const clientUtilsInstance: ClientUtils = new ClientUtils(this.client);
		console.error(w);
		clientUtilsInstance.sendToErrorLog(w, 'warning')
	}
}

export { WarnEvent };