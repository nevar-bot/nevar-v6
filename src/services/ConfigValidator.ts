import fs from 'fs';
import { LoggerUtils } from '@utils/logger-utils.js';
import config from 'config';

export class ConfigValidator {
    private logger: LoggerUtils;
    public constructor() {
        this.logger = new LoggerUtils();
    }

    private silent: boolean;
    public async start(): Promise<void|Error> {
        this.silent = process.argv[2] === 'commands';
        try{
            if(!this.silent) this.logger.log('CONFIG: Validating config file...');

            // Check if config file exists
            const configPath: string = './config/default.json';
            const sampleConfigPath: string = './config/default.sample.json';

            if (!fs.existsSync(configPath)) {
                const errMsg: string = fs.existsSync(sampleConfigPath) ? 'Make sure to rename config.sample.json to config.json' : 'Make sure to run \'npm run create\'';
                this.logger.error(`CONFIG: ${configPath} does not exist. ${errMsg}`);
                return process.exit();
            }

            // Check mandatory fields
            this.checkMandatoryFields([
                'client.token',
                'client.intents',
                'client.partials',
                'database.login_uri',
                'support.id',
                'support.invitation',
                'support.website',
                'support.channels.logs',
                'support.channels.errors',
                'embeds.footer_text',
                'invitation.scopes',
                'invitation.permissions'
            ]);

            // Check mandatory fields for correct type
            this.checkFieldsType([
                ['client.token', 'string'],
                ['client.intents', 'array'],
                ['client.partials', 'array'],
                ['database.login_uri', 'string'],
                ['support.id', 'string'],
                ['support.invitation', 'string'],
                ['support.website', 'string'],
                ['support.channels.logs', 'string'],
                ['support.channels.errors', 'string'],
                ['embeds.footer_text', 'string'],
                ['invitation.scopes', 'object'],
                ['invitation.permissions', 'object']
            ]);

            // Check optional fields
            this.checkOptionalFields([
                'client.owner_ids',
                'embeds.colors.normal',
                'embeds.colors.success',
                'embeds.colors.warning',
                'embeds.colors.error',
                'embeds.colors.transparent',
                'api_keys.weather',
                'presences'
            ]);

            if(!this.silent) this.logger.success('CONFIG: Validated config file');
        }catch(error: unknown){
            throw error;
        }
    }

    private checkMandatoryFields(keys: string[]): void {
        for (const key of keys) {
            if(config.has(key)){
                if(typeof config.get(key) === 'undefined' || config.get(key) === ''){
                    this.logger.error('CONFIG: ' + key + ' cannot be empty');
                    process.exit();
                }
            }else{
                this.logger.error('CONFIG: ' + key + ' cannot be empty');
                process.exit();
            }
        }
    }

    private checkOptionalFields(keys: string[]): void {
        for(const key of keys){
            if(!config.has(key)){
                if(!this.silent) this.logger.warn('CONFIG: ' + key + ' is empty');
            }
        }
    }

    private checkFieldsType(keys: string[][]): void {
        for (const [key, type] of keys) {
            if(type === 'array'){
                if(!Array.isArray(config.get(key))) {
                    this.logger.error('CONFIG: Type of ' + key + ' must be ' + type);
                    process.exit();
                }
            }else{
                if(typeof config.get(key) !== type){
                    this.logger.error('CONFIG: Type of ' + key + ' must be ' + type);
                    process.exit();
                }
            }
        }
    }
}
