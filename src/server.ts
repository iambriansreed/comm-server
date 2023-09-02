import roomManager, { getNewName } from './room-manager';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
    SocketEvent,
    Room,
    PayloadRoomJoin,
    PayloadRoomLeave,
    PayloadClientInit,
    PayloadRoomMessage,
    EventMessage,
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
    const onRoomRejoin = (payload: PayloadRoomJoin, callback: (room: Room | false) => void) => {
        socket.join(payload.room);

        const room = roomManager.roomJoin(payload, true);

        callback(room);
    };

    const onRoomJoin = (payload: PayloadRoomJoin, callback: (room: Room | false) => void) => {
        socket.join(payload.room);

        const room = roomManager.roomJoin(payload);

        socket.to(payload.room).emit(SocketEvent.RoomEvent, room.events[room.events.length - 1]);

        callback(room);
    };

    const onRoomLeave = (payload: PayloadRoomLeave) => {
        const event = roomManager.roomLeave(payload);

        if (event) socket.to(payload.room).emit(SocketEvent.RoomEvent, event);
    };

    const onRoomEvent = (payload: PayloadRoomMessage, callback: (newEvent: EventMessage) => void) => {
        const event = roomManager.addEvent(payload);

        socket.to(payload.room).emit(SocketEvent.RoomEvent, event);

        callback(event);
    };

    const onRoomNewName = (callback: (roomName: string) => void) => callback(getNewName());

    const onClientInit = (callback: (serverUpdate: PayloadClientInit) => {}) => {
        callback({ rooms: roomManager.getNames() });
    };

    socket.on(SocketEvent.ClientInit, onClientInit);
    socket.on(SocketEvent.RoomEvent, onRoomEvent);
    socket.on(SocketEvent.RoomJoin, onRoomJoin);
    socket.on(SocketEvent.RoomRejoin, onRoomRejoin);
    socket.on(SocketEvent.RoomLeave, onRoomLeave);
    socket.on(SocketEvent.RoomNewName, onRoomNewName);
});

httpServer.listen(PORT, HOST, () => {
    console.info(`Server is running on http://${HOST}:${PORT}`);
});
