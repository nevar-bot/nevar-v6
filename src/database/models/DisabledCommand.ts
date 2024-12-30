import { Model, model, Schema } from 'mongoose';

export const DisabledCommandModel: typeof Model = model('DisabledCommand', new Schema({
	name: { type: String },
}));