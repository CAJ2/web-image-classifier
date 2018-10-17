import { Channel } from 'amqplib';

import { app } from './App';

export class Queue {

    channel: Channel;

    async init(): Promise<void> {

        this.channel = await app.mq.createChannel();

        await this.channel.assertQueue('artist-classifier');

    }

    queueImage(image: string): void {

        this.channel.sendToQueue('artist-classifier', new Buffer(image));

    }
}
