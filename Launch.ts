import { app } from './App';

app.init().then(() => {
    app.start();
})
.catch((error: Error) => {
    console.log(error.message);
    console.log(error.stack);
    console.log('An error occured when initializing the server.');
});
