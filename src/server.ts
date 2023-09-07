import channelManager from './channels-manager';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
    ChannelAction,
    ChannelEvent,
    ChannelNameResponse,
    ClientStatusResponse,
    ErrorResponse,
    EventAction,
    LoginResponse,
    LogoutResponse,
    SocketEvent,
} from '@bsr-comm/types';

const HOST = process.env.HOST || process.env.RENDER_EXTERNAL_HOSTNAME!;
const PORT = Number(process.env.PORT);

const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGINS?.split(','),
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    socket.on(
        SocketEvent.ClientStatus,
        //
        (callback?: (serverUpdate: ClientStatusResponse) => void) => {
            const channels = channelManager.getChannels();
            callback?.({ channels } as ClientStatusResponse);
        }
    );

    socket.on(
        SocketEvent.ChannelEvent,
        //
        (payload: EventAction, callback?: (event: ChannelEvent | null) => void) => {
            if (typeof payload.data !== 'object') {
                callback?.(null);
                return;
            }

            const event = channelManager.addEvent(payload);

            socket.broadcast.to(payload.channel).emit(SocketEvent.ChannelEvent, event);
            socket.broadcast.to(payload.channel).emit(SocketEvent.ChannelEvent, event);
            callback?.(event);
        }
    );

    socket.on(SocketEvent.ChannelName, (callback?: (response: ChannelNameResponse) => void) =>
        callback?.({ name: channelManager.getNewName() } as ChannelNameResponse)
    );

    socket.on(
        SocketEvent.ChannelLogin,
        (payload: ChannelAction, callback?: (response: LoginResponse | ErrorResponse) => void) => {
            const response = channelManager.channelLogin(payload);

            if ('error' in response) {
                callback?.(response);
                return;
            }

            socket.join(payload.channel);
            socket.broadcast.emit(SocketEvent.ChannelLogin, response);
            callback?.(response);
        }
    );

    socket.on(SocketEvent.ChannelLogout, (payload: ChannelAction, callback?: (response: LogoutResponse) => void) => {
        const response = channelManager.channelLogout(payload);
        socket.broadcast.emit(SocketEvent.ChannelLogout, response);
        socket.leave(payload.channel);
        callback?.(response);
    });
});

httpServer.listen(PORT, HOST, () => {
    console.info(`Server is running on http://${HOST}:${PORT}`);
});
