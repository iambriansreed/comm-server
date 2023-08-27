import rooms, { newEvent, roomCreate, roomJoin, roomLeave } from './room-manager';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
    SocketEvent,
    Room,
    RoomEvent,
    PayloadRoomJoin,
    PayloadRoomLeave,
    PayloadClientInit,
    PayloadRoomEvent,
} from '@bsr-comm/types';
import data from './new-room-data';

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
    //
    const onRoomJoin = (payload: PayloadRoomJoin, callback: (room: Room | false) => void) => {
        socket.join(payload.room);

        if (!rooms[payload.room]) {
            roomCreate(payload, callback);
        } else {
            roomJoin(payload, callback);
        }

        callback(rooms[payload.room]);
    };

    const onRoomLeave = (payload: PayloadRoomLeave, callback: (room: Room | false) => void) => {
        if (!rooms[payload.room]) {
            callback(false);
            return;
        }

        roomLeave(payload, callback);
    };

    const onRoomEvent = ({ data, room, type, username }: PayloadRoomEvent, callback: (newEvent: RoomEvent) => void) => {
        const event = newEvent({ data, type, username });

        rooms[room].events.push(event);
        socket.to(room).emit(SocketEvent.RoomEvent, event);

        callback(event);
    };

    const onRoomNewName = (callback: (roomName: string) => void) => {
        function random(min: number, max: number) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        callback(
            [
                data.adjectives[random(0, data.adjectives.length - 1)],
                data.colors[random(0, data.colors.length - 1)],
                data.animals[random(0, data.animals.length - 1)],
            ].join('-')
        );
    };

    const onClientInit = (callback: (serverUpdate: PayloadClientInit) => {}) => {
        callback({ rooms: Object.keys(rooms) });
    };

    socket.on(SocketEvent.ClientInit, onClientInit);
    socket.on(SocketEvent.RoomEvent, onRoomEvent);
    socket.on(SocketEvent.RoomJoin, onRoomJoin);
    socket.on(SocketEvent.RoomLeave, onRoomLeave);
    socket.on(SocketEvent.RoomNewName, onRoomNewName);
});

httpServer.listen(PORT, HOST, () => {
    console.info(`Server is running on http://${HOST}:${PORT}`);
});
