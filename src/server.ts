import { createServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { SocketServer } from '@bsr-comm/utils';
import crypto from 'crypto';

const HOST = process.env.HOST || process.env.RENDER_EXTERNAL_HOSTNAME!;
const PORT = Number(process.env.PORT);

const httpServer = createServer();

const options: Partial<ServerOptions> = {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(','),
        methods: ['GET', 'POST'],
        allowedHeaders: '*',
    },
};

const io = new Server(httpServer, options);

const getUid = () => crypto.randomBytes(16).toString('hex');

io.on('connection', (socket) => {
    SocketServer({ socket, getUid, maxUsers: 5 });
});

httpServer.listen(PORT, HOST, () => {
    console.info(`Server is running on http://${HOST}:${PORT}`);
    console.info(`Options: ${JSON.stringify(options, null, '\t')}`);
});
