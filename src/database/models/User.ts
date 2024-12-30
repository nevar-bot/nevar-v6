import { Model, model, Schema } from 'mongoose';

export const UserModel: typeof Model = model('User', new Schema({
	id: { type: String },
	blocked: {
		type: Object,
		default: {
			status: false,
			reason: null,
			date: null,
			moderator: null,
		},
	},
	staff: {
		type: Object,
		default: {
			status: false,
			role: null,
		},
	},
	notes: [],
}));