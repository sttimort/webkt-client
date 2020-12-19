
import {LogLevelDesc} from 'loglevel';

export class AppConfig {
    readonly logLevel: LogLevelDesc = 'trace'
}

const appConfig = new AppConfig()
export default appConfig