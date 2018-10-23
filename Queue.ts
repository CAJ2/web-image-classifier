import { Channel, Message } from 'amqplib';

import { app } from './App';

export interface ResultData {
    id: string;
    labels: Array<{
        name: string;
        value: number;
    }>;
}

export class Queue {

    channel: Channel;
    private readonly SEND_QUEUE: string = 'artist-classifier';
    private readonly RECEIVE_QUEUE: string = 'classifier-results';

    async init(): Promise<void> {

        // Create an AMQP channel
        this.channel = await app.mq.createChannel();

        // Make sure there is a queue for uploading images
        await this.channel.assertQueue(this.SEND_QUEUE);
        // Assert results queue
        await this.channel.assertQueue(this.RECEIVE_QUEUE);

        this.channel.consume(this.RECEIVE_QUEUE, this.sendResults);

    }

    queueImage(image: string): void {

        // Send image to queue
        this.channel.sendToQueue('artist-classifier', new Buffer(image));

    }

    sendResults(msg: Message): void {

        // Update the sender with classifier information
        app.events.sendResults(msg);

    }
}
