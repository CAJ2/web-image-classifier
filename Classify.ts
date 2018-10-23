import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node';
import * as path from 'path';

export class Classify {

    model: tf.Model;

    async init(): Promise<void> {

        // Load model
        this.model = await tf.loadModel('file://' + path.resolve('./model.json'));

    }

    async predict(input: ImageData): Promise<tf.Tensor[]> {

        console.log(input);
        const data = tf.fromPixels(input);
        console.log(data);

        return await this.model.predict(data) as tf.Tensor[];

    }
}
