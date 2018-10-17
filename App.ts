import * as express from 'express';
import { createServer } from 'http';
import * as io from 'socket.io';
import * as amqp from 'amqplib';
import * as multer from 'multer';
import * as compression from 'compression';
import * as path from 'path';
import * as fs from 'fs';

import { Queue } from './Queue';
import { Events } from './Events';

class App {

    app: express.Application;
    socket: io.Server;
    mq: amqp.Connection;
    queue: Queue;
    events: Events;

    constructor() {
        this.app = express();
        this.socket = io(createServer(this.app));
        this.queue = new Queue();
        this.events = new Events();
    }

    async init(): Promise<void> {
        this.app.set('port', (process.env.PORT || 1337));

        if (process.env.HOST) {
            this.app.set('host', process.env.HOST);
        }

        this.mq = await amqp.connect('amqp://localhost');

        await this.queue.init();
        this.events.init();

        this.app.post('/upload',
            multer({ dest: './uploads/' }).single('image'),
            (req: express.Request, res: express.Response) => {

                this.queue.queueImage(new Buffer(fs.readFileSync(req.file.path)).toString('base64'));

                res.json({
                    status: 'SUCCESS',
                    message: 'Image queued for classification',
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
