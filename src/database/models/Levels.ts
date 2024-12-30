import { Model, model, Schema } from 'mongoose';

export const LevelsModel: typeof Model = model('Levels', new Schema({
	userID: { type: String },
	guildID: { type: String },
	xp: { type: Number, default: 0 },
	level: { type: Number, default: 0 },
	lastUpdated: { type: Number, default: new Date() }
}));