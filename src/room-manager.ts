import {
    RoomEvent,
    EventMessage,
    EventSystem,
    PayloadRoomJoin,
    PayloadRoomLeave,
    PayloadRoomMessage,
    Room,
} from '@bsr-comm/types';
import crypto from 'crypto';

import nameData from './new-room-data';

const newEventData = (): Pick<RoomEvent, 'time' | 'uid'> => ({
    time: Date.now(),
    uid: crypto.randomBytes(16).toString('hex'),
});

const generateRoom = (username: string, room: string): Room => {
    return {
        events: [
            {
                room,
                data: { system: 'join' },
                username,
                ...newEventData(),
            },
        ],
        name: room,
        usernames: [username],
        created: Date.now(),
    } as Room;
};

const roomManager = new (class {
    private rooms: Record<string, Room> = {
        main: {
            events: [],
            name: 'main',
            usernames: [],
            created: Date.now(),
        } as Room,
    };

    roomCreate = ({ username, room }: PayloadRoomJoin): Room => {
        this.rooms[room] = generateRoom(username, room);
        return this.rooms[room];
    };

    roomJoin = ({ username, room }: PayloadRoomJoin, rejoin = false): Room => {
        const existingRoom = this.rooms[room];

        if (!existingRoom) {
            return this.roomCreate({ username, room });
        }

        if (rejoin) {
            return this.rooms[room];
        }

        const joinEvent: EventSystem = {
            data: { system: 'join' },
            username,
            room,
            ...newEventData(),
        };

        this.rooms[room] = {
            ...existingRoom,
            events: [...existingRoom.events, joinEvent],
            usernames: [...existingRoom.usernames, username].filter(
                (u, index, arr) => index === arr.findIndex((u1) => u1 === u)
            ),
        };

        return this.rooms[room];
    };

    roomLeave = ({ username, room }: PayloadRoomLeave): EventSystem | null => {
        const existingRoom = this.rooms[room];

        const leaveEvent: EventSystem = {
            data: { system: 'leave' },
            username,
            room,
            ...newEventData(),
        };

        if (!existingRoom) return leaveEvent;

        this.rooms[room] = {
            ...existingRoom,
            events: [...existingRoom.events, leaveEvent],
            usernames: existingRoom.usernames.filter((u) => username !== u),
        };

        if (this.rooms[room].usernames.length === 0) {
            delete this.rooms[room];
            return null;
        }

        return leaveEvent;
    };

    addEvent = ({ data, room, username }: PayloadRoomMessage): EventMessage => {
        const newEvent: EventMessage = { data, room, username, ...newEventData() };

        this.rooms[room].events.push(newEvent);

        return newEvent;
    };

    getNames = () => Object.entries(this.rooms).map(([_name, room]) => room.name);
})();

export function getNewName() {
    function random(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    return [
        nameData.adjectives[random(0, nameData.adjectives.length - 1)],
        nameData.colors[random(0, nameData.colors.length - 1)],
        nameData.animals[random(0, nameData.animals.length - 1)],
    ].join('-');
}

export default roomManager;
