import { Room, RoomEvent } from '@bsr-comm/types';

export const newEvent = (event: Omit<RoomEvent, 'time' | 'uid'>): RoomEvent => ({
    ...event,
    time: Date.now(),
    uid: '',
});

const rooms: Record<string, Room> = {
    main: {
        events: [
            newEvent({ data: { username: 'system' }, type: 'initialize', username: 'SYSTEM' }),
            {
                data: 'B Hey whats up?',
                type: 'message',
                username: 'brian',
                time: Date.now(),
                uid: '',
            },
            {
                data: 'R Not much. What going on with you?',
                type: 'message',
                username: 'ryleigh',
                time: Date.now() + 50000,
                uid: '',
            },
            {
                data: 'B Not much. What going on with you? Not much. What going on with you?',
                type: 'message',
                username: 'brian',
                time: Date.now() + 100000,
                uid: '',
            },
            {
                data: 'R Not much. What going on with you? Not much.',
                type: 'message',
                username: 'ryleigh',
                time: Date.now() + 150000,
                uid: '',
            },
            {
                data: 'R Not much. What going on with you? Not much. What going on with you? Not much. What going on with you?',
                type: 'message',
                username: 'ryleigh',
                time: Date.now() + 150000,
                uid: '',
            },
            {
                data: 'R Not much. What going on with you? Not much. What going on with you? Not much. What going on with you?',
                type: 'message',
                username: 'ryleigh',
                time: Date.now() + 150000,
                uid: '',
            },
            {
                data: 'b Not much. What going on with you? Not much. What going on with you? Not much. What going on with you? Not much. What going on with you? Not much. What going on with you?',
                type: 'message',
                username: 'brian',
                time: Date.now() + 200000,
                uid: '',
            },
        ],
        name: 'main',
        usernames: [],
    },
};

export default rooms;
