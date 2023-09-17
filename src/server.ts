import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketServer } from '@bsr-comms/utils';
import crypto from 'crypto';

const HOST = process.env.HOST || process.env.RENDER_EXTERNAL_HOSTNAME!;
const PORT = Number(process.env.PORT);

const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGINS?.split(','),
        methods: ['GET', 'POST'],
    },
});

const getUid = () => crypto.randomBytes(16).toString('hex');

io.on('connection', (socket) => {
    SocketServer({ socket, getUid, maxUsers: 5 });
});

httpServer.listen(PORT, HOST, () => {
    console.info(`Server is running on http://${HOST}:${PORT}`);
});
