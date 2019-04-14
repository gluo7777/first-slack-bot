// List of available middleware endpoints:
// https://botkit.ai/docs/middleware.html

var env = require('node-env-file');
env(__dirname + '/../.env');

module.exports = function (controller) {

    // log every message received
    if (process.env.LOG_RECEIVED === 'true') {
        controller.middleware.receive.use(function (bot, message, next) {
            // log it
            console.log('RECEIVED: ', message);

            // modify the message
            message.logged = true;

            // continue processing the message
            next();

        });
    }

    if (process.env.LOG_SENT === 'true') {
        controller.middleware.send.use(function (bot, message, next) {
            // log it
            console.log('SENT: ', message);

            // modify the message
            message.logged = true;

            // continue processing the message
            next();
        });
    }
}
