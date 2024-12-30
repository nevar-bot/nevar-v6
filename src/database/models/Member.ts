import { Model, model, Schema } from 'mongoose';

export const MemberModel: typeof Model = model('Member', new Schema({
	id: { type: String },
	guildID: { type: String },
	warnings: { type: Array, default: [] },
	ban: {
		type: Object,
		default: {
			status: false,
			reason: null,
			moderator: null,
			bannedAt: null,
			duration: null,
			expiration: null,
		},
	},
	reminders: []
}));