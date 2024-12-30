import * as mongoose from "mongoose";
import { LoggerUtils as Log } from "@utils/logger-utils.js";
import config from 'config';

export class Database {
	public async initiate (): Promise<void|Error> {
		const Logger: Log = new Log();
		Logger.log('Establishing MongoDB connection...');

		try{
			mongoose.set('strictQuery', false);
			await mongoose.connect(config.get('database.login_uri'));
			Logger.success('MongoDB connection established');
		}catch(error: unknown) {
			throw error;
		}
	}
}
