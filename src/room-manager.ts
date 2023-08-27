import {
    //
    PayloadRoomJoin,
    PayloadRoomLeave,
    Room,
    RoomEvent,
} from '@bsr-comm/types';

export const roomJoin = ({ username, room }: PayloadRoomJoin, callback: (room: Room | false) => void) => {
    const joinEvent = newEvent({
        type: 'join',
        data: { username, room },
        username: 'SYSTEM',
    });

    const { events, name, usernames } = rooms[room];

    rooms[room] = {
        name,
        events: [...events, joinEvent],
        usernames: [...usernames, username].filter((u, index, arr) => index === arr.findIndex((u1) => u1 === u)),
    };

    callback(rooms[room]);
};

export const roomLeave = ({ username, room }: PayloadRoomLeave, callback: (room: Room | false) => void) => {
    const leaveEvent = newEvent({
        type: 'leave',
        data: { username, room },
        username: 'SYSTEM',
    });

    const { events, name, usernames } = rooms[room];

    rooms[room] = {
        name,
        events: [...events, leaveEvent],
        usernames: usernames.filter((u) => username !== u),
    };

    callback(rooms[room]);
};

export const roomCreate = ({ username, room }: PayloadRoomJoin, callback: (room: Room | false) => void) => {
    rooms[room] = {
        name: room,
        usernames: [username],
        events: [
            newEvent({
                type: 'initialize',
                data: { room, username },
                username: 'SYSTEM',
            }),
        ],
    };

    callback(rooms[room]);
};

export const newEvent = (event: Omit<RoomEvent, 'time' | 'uid'>): RoomEvent => ({
    ...event,
    time: Date.now(),
    uid: '',
});

const rooms: Record<string, Room> = {
    main: {
        events: [newEvent({ data: { username: 'system' }, type: 'initialize', username: 'SYSTEM' })],
        name: 'main',
        usernames: [],
    },
};

export default rooms;
