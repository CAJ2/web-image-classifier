import { Socket } from 'socket.io';
import { Message } from 'amqplib';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { app } from './App';
import { ResultData } from './Queue';

export interface Client {
    id: string;
    socket: Socket;
    status: string;
}

export class Events {

    clients: Client[];

    constructor() {
        this.clients = [];
    }

    init(): void {

        app.io.on('connect', (socket: Socket) => {

            // Add to clients list
            this.clients.push({
                id: socket.id,
                socket,
                status: 'CONNECTED',
            });

            // Send number of clients
            app.io.emit('users', this.clients.length);

            // Listen to image classify requests
            socket.on('classify', this.handleClassify);

            socket.on('disconnect', this.handleDisconnect);

        });
    }

    getClient(id: string): Client {
        return this.clients.find((client: Client) => client.id === id);
    }

    removeClient(id: string): void {
        _.remove(this.clients, (client: Client) => client.id === id);
    }

    handleDisconnect(socket: Socket): void {

        this.removeClient(socket.id);

        app.io.emit('users', this.clients.length);

    }

    handleClassify(data: string): void {

        let file: Buffer;
        console.log(data);

        // Try to find the image
        try {
            file = fs.readFileSync(path.resolve('./uploads/' + data));
        }
        catch (e) {
            console.log(e);
        }

        // Convert to base64 and construct message object
        const queueData = JSON.stringify({
            id: '',
            data: file.toString('base64'),
        });

        // Queue image
        app.queue.queueImage(queueData);
    }

    sendResults(msg: Message): void {

        // Parse data from RabbitMQ response
        const data: ResultData = msg.content.toJSON().data[0];

        this.getClient(data.id).socket.emit('results', data.labels);

    }
}
