import { Socket } from 'socket.io';

import { app } from './App';

export class Events {

    users: number;

    constructor() {
        this.users = 0;
    }

    init(): void {

        app.socket.on('connect', (socket: Socket) => {

            this.users++;

            app.socket.emit('users', this.users);

            socket.on('disconnect', this.handleDisconnect);

        });
    }

    handleDisconnect(): void {

        this.users--;

        app.socket.emit('users', this.users);

    }
}
