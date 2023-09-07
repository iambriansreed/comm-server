import {
    ChannelAction,
    ClientChannel,
    ChannelEvent,
    ChannelStatus,
    ChannelStore,
    EventAction,
    LoginResponse,
    LogoutResponse,
    SystemEvent,
    User,
    ErrorResponse,
} from '@bsr-comm/types';
import crypto from 'crypto';

import nameData from './new-channel-data';

const getUid = () => crypto.randomBytes(16).toString('hex');
const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
function removeFromList<T>(list: T[], predicate: (item: T) => boolean) {
    const index = list.findIndex(predicate);
    if (index > -1) list.splice(index, 1);
}

const _LOBBY_ = 'lobby';

class ChannelManager {
    private channel: ChannelStore;

    constructor(props: ChannelAction) {
        this.channel = {
            name: props.channel,
            users: props.user.sessionId ? [props.user] : [],
            events: [],
            created: Date.now(),
        };
    }

    get status(): ChannelStatus {
        return {
            eventsCount: this.channel.events.length,
            usersCount: this.channel.users.length,
            name: this.channel.name,
            created: this.channel.created,
        };
    }

    get client(): ClientChannel {
        return {
            ...this.channel,
            users: this.channel.users.map(({ name }) => name),
        };
    }

    hasUser = (user: User): boolean => !!this.channel.users.find((u) => u.sessionId === user.sessionId);

    addEvent = (user: User, data: ChannelEvent['data']): ChannelEvent => {
        const nextEvent: ChannelEvent = {
            data,
            channel: this.channel.name,
            time: Date.now(),
            user: user.name,
            id: getUid(),
        };

        this.channel.events.push(nextEvent);

        return nextEvent;
    };

    addSystemEvent = (user: User, system: SystemEvent['system']): SystemEvent => {
        const nextEvent: SystemEvent = {
            system,
            channel: this.channel.name,
            time: Date.now(),
            user: user.name,
            id: getUid(),
        };

        this.channel.events.push(nextEvent);

        return nextEvent;
    };

    addUser = (user: User): SystemEvent | null => {
        if (this.hasUser(user)) {
            return null;
        }

        this.channel.users.push(user);
        return this.addSystemEvent(user, 'login');
    };

    removeUser = (user: User): SystemEvent | null => {
        if (!this.hasUser(user)) {
            return null;
        }

        this.channel.users = this.channel.users.filter(({ sessionId }) => sessionId !== user.sessionId);

        return this.addSystemEvent(user, 'logout');
    };
}

class ChannelsManager {
    private channels: ChannelManager[] = [
        new ChannelManager({
            channel: _LOBBY_,
            user: {
                name: '',
                sessionId: '',
            },
        }),
    ];

    private users: User[] = [];

    channel(name: string): ChannelManager | null {
        return this.channels.find((c) => c.client.name === name) || null;
    }

    channelLogin = ({ user, channel: channelName }: ChannelAction): LoginResponse | ErrorResponse => {
        let channel = this.channel(channelName)!;

        const existingUserName = this.users.find((u) => u.name === user.name);

        if (existingUserName && existingUserName?.sessionId !== user.sessionId)
            return {
                error: 'This username is taken.',
            } as ErrorResponse;

        this.users.push(user);

        if (!channel) {
            this.channels.push(new ChannelManager({ channel: channelName, user }));
            channel = this.channel(channelName)!;
        }

        channel.addUser(user);

        return {
            channel: channel.client,
            channels: this.getChannels(),
        } as LoginResponse;
    };

    channelLogout = ({ user, channel: channelName }: ChannelAction): LogoutResponse => {
        const channel = this.channel(channelName)!;
        let event: SystemEvent | null = null;

        event = channel.removeUser(user);

        // remove user name from list so someone else can use it
        removeFromList(this.users, (u) => user.sessionId === u.sessionId);

        // last user left, kill the channel unless it's the lobby
        if (channel.status.usersCount == 0 && channel.status.name !== _LOBBY_) {
            removeFromList(this.channels, (c) => c.client.name === channelName);
        }

        return {
            channel: this.channel(channelName)?.client || null,
            channels: this.getChannels(),
        };
    };

    addEvent = ({ data, channel, user }: EventAction): ChannelEvent => {
        return this.channel(channel)!.addEvent(user, data);
    };

    getChannels = () => this.channels.map((c) => c.status);

    getNewName() {
        return [
            nameData.adjectives[getRandomNumber(0, nameData.adjectives.length - 1)],
            nameData.colors[getRandomNumber(0, nameData.colors.length - 1)],
            nameData.animals[getRandomNumber(0, nameData.animals.length - 1)],
        ].join('-');
    }
}

export default new ChannelsManager();
