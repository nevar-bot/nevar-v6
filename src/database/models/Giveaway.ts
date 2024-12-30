import { Model, model, Schema } from 'mongoose';

export const GiveawayModel: typeof Model = model('Giveaway', new Schema({
	messageId: String,
	channelId: String,
	guildId: String,
	startAt: Number,
	endAt: Number,
	ended: Boolean,
	winnerCount: Number,
	prize: String,
	entrantIds: { type: [String], default: undefined },
	hostedBy: String,
	winnerIds: { type: [String], default: undefined },
	exemptMembers: { type: [String], default: undefined },
	requirements: { type: Object, default: undefined },
}));