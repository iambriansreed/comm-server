import rooms, { newEvent } from './room-manager';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketEvent, Room, PayloadLogin, PayloadEvent, RoomEvent, PayloadServerUpdate } from '@bsr-comm/types';
import data from './new-room-data';

const HOST = process.env.HOST!;
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
    const onRoomJoin = (payload: PayloadLogin, callback: (room: Room) => void) => {
        socket.join(payload.room);

        if (!rooms[payload.room]) {
            rooms[payload.room] = {
                name: payload.room,
                usernames: [payload.username],
                events: [
                    newEvent({
                        type: 'initialize',
                        data: { ...payload },
                        username: 'SYSTEM',
                    }),
                ],
            };

            socket.emit(SocketEvent.ServerUpdate, {
                rooms: Object.keys(rooms),
            } as PayloadServerUpdate);
        } else {
            rooms[payload.room].usernames.push(payload.username);

            const joinEvent = {
                type: 'join',
                data: { ...payload },
                time: Date.now(),
                username: 'SYSTEM',
            } as RoomEvent;

            rooms[payload.room].events.push(joinEvent);

            socket.to(payload.room).emit(SocketEvent.EventFromServer, joinEvent);
        }

        callback(rooms[payload.room]);
    };

    const onRoomLeave = (payload: PayloadLogin, callback: (success: boolean) => void) => {
        if (!rooms[payload.room]) {
            callback(false);
            return;
        }

        const leaveEvent = newEvent({
            type: 'leave',
            data: { ...payload },
            username: 'SYSTEM',
        });

        rooms[payload.room].usernames = rooms[payload.room].usernames.filter((u) => u !== payload.username);

        rooms[payload.room].events.push(leaveEvent);

        socket.to(payload.room).emit(SocketEvent.EventFromServer, leaveEvent);
        socket.leave(payload.room);

        callback(true);
    };

    const onEventFromClient = (
        { data, room, type, username }: PayloadEvent<any>,
        callback: (newEvent: RoomEvent) => void
    ) => {
        const event = newEvent({ data, type, username });

        rooms[room].events.push(event);
        socket.to(room).emit(SocketEvent.EventFromServer, event);

        callback(event);
    };

    const onNewRoom = (callback: (roomName: string) => void) => {
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

    const onClientInit = (callback: (serverUpdate: PayloadServerUpdate) => {}) => {
        callback({ rooms: Object.keys(rooms) });
    };

    socket.on(SocketEvent.ClientInit, onClientInit);
    socket.on(SocketEvent.NewRoom, onNewRoom);
    socket.on(SocketEvent.RoomJoin, onRoomJoin);
    socket.on(SocketEvent.RoomLeave, onRoomLeave);
    socket.on(SocketEvent.EventFromClient, onEventFromClient);
});

httpServer.listen(PORT, HOST, () => {
    console.info(`Server is running on http://${HOST}:${PORT}`);
});
