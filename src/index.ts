import * as http from 'http';
import debug from 'debug';
// import * as dotenv from 'dotenv';
import App from './app';

// Load environment variables from .env file, where API keys and passwords are configured
// dotenv.config({ path: '../.env' });

debug('ts-express:server');

const port = normalizePort(process.env.PORT || 8080);
App.set('port', port);

const server = http.createServer(App);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: number | string): number | string | boolean {
    const portCheck: number = typeof val === 'string' ? parseInt(val, 10) : val;
    // tslint:disable-next-line:curly
    if (isNaN(portCheck)) return val;
    // tslint:disable-next-line:curly
    else if (portCheck >= 0) return portCheck;
    // tslint:disable-next-line:curly
    else return false;
}

function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening(): void {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Listening on ${bind}`);
    debug(`Listening on ${bind}`);
}