import { Model, model, Schema } from 'mongoose';

export const LogModel: typeof Model = model('Log', new Schema({
	command: { type: String, default: 'Unknown' },
	context: { type: String, default: 'Unknown' },
	type: { type: String, default: 'Unknown' },
	arguments: { type: Array, default: [] },
	date: { type: Number, default: Date.now() },
	user: { type: String, default: 'Unknown' },
	guild: { type: String, default: 'Unknown' },
	channel: { type: String, default: 'Unknown' },
}));