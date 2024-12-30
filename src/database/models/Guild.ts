import { Model, model, Schema } from 'mongoose';

export const GuildModel: typeof Model = model('Guild', new Schema({
	id: { type: String, default: null },
	membersData: { type: Object, default: {} },
	members: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Member',
		}
	],
	blocked: {
		type: Object,
		default: {
			state: false,
			reason: null,
			date: null,
			moderator: null,
		},
	},
	settings: {
		type: Object,
		default: {
			logging: {
				moderation: null,
				member: null,
				guild: null,
				role: null,
				channel: null,
				system: null,
			},
			tempChannels: {
				enabled: false,
				channelId: null,
				categoryId: null,
				userLimit: null,
				defaultName: null,
				list: []
			},
			levelsystem: {
				enabled: false,
				levelUpMessage: {
					enabled: false,
					channelId: null,
					message: 'GG ?user, du bist nun Level ?level!',
				},
				roles: [],
				doubleXP: [],
				exclude: {
					channelIds: [],
					roleIds: []
				},
			},
			welcome: {
				enabled: false,
				channelId: null,
				message: null,
				avatar: true,
				color: null,
				autoroles: [],
			},
			farewell: {
				enabled: false,
				channelId: null,
				message: null,
				avatar: true,
				color: null,
			},
			autodelete: [],
			autoreact: [],
		}
	}
}));