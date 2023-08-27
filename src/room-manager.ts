import { Room, RoomEvent } from '@bsr-comm/types';

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
