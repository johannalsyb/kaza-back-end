import { API, DAEMON, PORT } from './config';

import app from "./app"
import daemon from './daemon';

API && app.listen(PORT)
DAEMON && daemon()

process.on('SIGINT', (signal) => {
    console.log('SIGINT received');
    process.exit(1);
})