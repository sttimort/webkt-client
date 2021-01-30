import log from 'loglevel';

import { WebKtApp } from './webkt-app';
import config from './config/app-config';

const webKtRootElement = document.createElement('div');
webKtRootElement.id = "web-kt-root";
document.body.appendChild(webKtRootElement);

log.setLevel(config.logLevel)
const app = new WebKtApp({
    serverUrl: 'ws://localhost:7000'
})

app.start();