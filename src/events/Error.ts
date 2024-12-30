import { BaseEvent } from '@core/BaseEvent.js';
import { BaseClient } from '@core/BaseClient.js';
import { ClientUtils } from '@utils/client-utils.js';

class ErrorEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(e: Error): Promise<void> {
		const clientUtilsInstance: ClientUtils = new ClientUtils(this.client);
		console.error(e);
		clientUtilsInstance.sendToErrorLog(e, 'error')
	}
}

export { ErrorEvent };