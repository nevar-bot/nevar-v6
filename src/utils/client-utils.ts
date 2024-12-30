import { BaseClient } from '@core/BaseClient.js';
import {
    EmbedBuilder, Guild, OAuth2Scopes,
    PermissionsBitField, ApplicationEmoji
} from 'discord.js';
import fs from 'fs';
import config from 'config';

class ClientUtils {
    private readonly client: BaseClient;
    constructor(client: BaseClient) {
        this.client = client;
    }

    /**
     * Create a pre styled embed
     * @param message
     * @param emote
     * @param type
     * @param args
     */
    public createEmbed(message: string|null, emote: string|null, type: 'normal'|'success'|'warning'|'error'|'transparent', ...variables: any): EmbedBuilder {
        try {
            // Replace placeholders in message
            const formattedMessage: string|null =
                variables.reduce(
                    (msg: string, variable: string, i: number) => msg.replace(new RegExp('\\{' + i + '\\}', 'g'), variable), message
                );

            // Return embed
            return new EmbedBuilder()
                .setDescription((emote || '') + ' ' + (formattedMessage || ' '))
                .setColor(config.get('embeds.colors.' + type))
                .setTimestamp()
                .setFooter({ text: config.get('embeds.footer_text').replace('{{version}}', this.getVersion()) });
        }catch(error: unknown){
            throw error;
        }
    }

    /**
     * Create an invitation link
     */
    public createInvite(): string {
        try {
            // Generate invite link
            return this.client.generateInvite({
                scopes: config.get('invitation.scopes').map((scope: string) => OAuth2Scopes[scope]).filter(Boolean),
                permissions: config.get('invitation.permissions').map((permission: string) => PermissionsBitField.Flags[permission]).filter(Boolean)
            });
        }catch(error: unknown){
            throw error;
        }
    }

    /**
     * Send an exception alert to error log channel
     * @param exception
     * @param color
     * @param errorId
     */
    public sendToErrorLog(exception: any, color: 'normal'|'success'|'warning'|'error'|'transparent', errorId: string = null): void {
        try{
            const supportGuild: Guild|undefined = this.client.guilds.cache.get(config.get('support.id'));
            const errorLogChannel: any = supportGuild?.channels.cache.get(config.get('support.channels.errors'));

            const exceptionEmbed: EmbedBuilder = this.createEmbed(null, null, 'error');
            if(errorId){
                exceptionEmbed.setDescription('### ' + this.emote('error') + ' Es ist ein Fehler aufgetreten\n' + this.emote('id') + 'Fehler-ID: **' + errorId +'**\n```js\n' + exception?.stack + '```');
            }else{
                exceptionEmbed.setDescription('### ' + this.emote('error') + ' Es ist ein Fehler aufgetreten\n```js\n' + exception?.stack + '```');
            }

            errorLogChannel.send({ embeds: [exceptionEmbed] });
        }catch(error: unknown){
            throw error;
        }
    }

    /**
     * Send an embed to the log channel
     * @param embed
     */
    public sendEmbedToLog(embed: EmbedBuilder): void {
        try{
            const supportGuild: Guild|undefined = this.client.guilds.cache.get(config.get('support.id'));
            const logChannel: any = supportGuild?.channels.cache.get(config.get('support.channels.logs'));

            logChannel.send({ embeds: [embed] });
        }catch(error: unknown){
            throw error;
        }
    }

    /**
     * Wait for a specified time
     * @param time
     */
    public wait(time: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    /**
     * Get the current client version
     */
    public getVersion(): string {
        const project = JSON.parse(fs.readFileSync("./package.json", "utf-8").toString());
        return project.version;
    }

    /**
     * Get the markdown of an emoji
     * @param name
     */
    public emote(name: string): string {
        const applicationEmoji: ApplicationEmoji = this.client.applicationEmojis.find((applicationEmoji: ApplicationEmoji): boolean => applicationEmoji.name === name);

        if(applicationEmoji) {
            return '<:' + applicationEmoji.name + ':' + applicationEmoji.id + '>';
        }
        return '';
    }
}

export { ClientUtils };