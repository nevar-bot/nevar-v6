import { BaseClient } from '@core/BaseClient.js';
import { VoiceChannel, ChannelType, VoiceState } from 'discord.js';
import { BaseEvent } from '@core/BaseEvent.js';

class VoiceStateUpdateEvent extends BaseEvent {
	public constructor(client: BaseClient) {
		super(client);
	}

	public async run(oldVoiceState: VoiceState, newVoiceState: VoiceState): Promise<any> {
		if (!oldVoiceState || !newVoiceState || !newVoiceState.guild) return;
		const { guild } = newVoiceState;

		try{

			const guildData: any = await this.databaseUtils.findOrCreateGuild(guild.id);
			const tempChannelSettings = guildData.settings.tempChannels;

			if(tempChannelSettings.enabled){
				if(oldVoiceState.channel && tempChannelSettings.list.includes(oldVoiceState.channelId)){
					try{
						if(oldVoiceState.channel?.members.size === 0){
							await oldVoiceState.channel.delete();
							guildData.settings.tempChannels.list = guildData.settings.tempChannels.list.filter((c: string) => c !== oldVoiceState.channelId);
							guildData.markModified('settings.tempChannels');
							await guildData.save();
						}
					}catch(error: unknown){

					}
				}

				if(newVoiceState.channel && newVoiceState.channelId === tempChannelSettings.channelId){
					try{
						const channelName: string = tempChannelSettings.defaultName
							.replaceAll("?count", tempChannelSettings.list.length || 1)
							.replaceAll("?user", newVoiceState.member.displayName);

						const createdTempChannel: VoiceChannel = await guild.channels.create({
							name: channelName,
							type: ChannelType.GuildVoice,
							parent: tempChannelSettings.categoryId || newVoiceState.channel.parentId,
							position: newVoiceState.channel.rawPosition,
							userLimit: tempChannelSettings.userLimit

						});

						await createdTempChannel.lockPermissions();

						await createdTempChannel.permissionOverwrites.create(newVoiceState.member.user, {
							Connect: true,
							Speak: true,
							ViewChannel: true,
							ManageChannels: true,
							Stream: true,
							MuteMembers: true,
							DeafenMembers: true,
							MoveMembers: true,
						});

						await newVoiceState.setChannel(createdTempChannel);

						guildData.settings.tempChannels.list.push(createdTempChannel.id);
						guildData.markModified('settings.tempChannels.list');
						await guildData.save();
					}catch(error: unknown){

					}
				}
			}
		}catch(error: unknown){

		}
	}
}

export { VoiceStateUpdateEvent };