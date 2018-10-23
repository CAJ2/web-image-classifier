import * as express from 'express';
import { createServer } from 'http';
import * as io from 'socket.io';
import * as amqp from 'amqplib';
import * as multer from 'multer';
import * as compression from 'compression';
import * as path from 'path';
import * as fs from 'fs';

import { Classify } from './Classify';
import { Queue } from './Queue';
import { Events } from './Events';

class App {

    app: express.Application;
    io: io.Server;
    mq: amqp.Connection;
    classify: Classify;
    queue: Queue;
    events: Events;

    constructor() {
        this.app = express();
        this.io = io(createServer(this.app));
        this.classify = new Classify();
        this.queue = new Queue();
        this.events = new Events();
    }

    async init(): Promise<void> {

        // Set port, hostname, etc.
        this.app.set('port', (process.env.PORT || 1337));

        if (process.env.HOST) {
            this.app.set('host', process.env.HOST);
        }

        // Connect to local RabbitMQ
        this.mq = await amqp.connect('amqp://localhost');

        // Initialize helpers
        await this.classify.init();
        await this.queue.init();
        this.events.init();

        // Define upload route
        this.app.post('/upload',
            multer({ dest: './uploads/' }).single('image'),
            (req: express.Request, res: express.Response) => {

                console.log(req.file.buffer);
                const fileData = req.file.buffer;

                const image = new ImageData(new Uint8ClampedArray(fileData), 28, 28);
                console.log(image);
                console.log(this.classify.predict(image));

                // Send response
                res.json({
                    status: 'SUCCESS',
                    message: 'Image uploaded',
                });

        });

        this.app.use(compression());

        this.app.use(express.static(path.resolve('./dist'), {
            etag: true,
            immutable: true,
            maxAge: '15d',
        }));

        this.app.use((req, res) => {
            if (req.url.indexOf('404') < 0) {
                res.redirect('/404');
            } else {
                res.sendStatus(404);
            }
        });
    }

    async start(): Promise<void> {

        await this.app.listen(this.app.get('port'), this.app.get('host'));

        console.log('Node app is running on port', this.app.get('port'));
    }
}

export const app = new App();
