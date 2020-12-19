import log from 'loglevel';

import { startWebKtApp } from './webkt-app';
import config from './config/app-config';

log.setLevel(config.logLevel)
startWebKtApp()