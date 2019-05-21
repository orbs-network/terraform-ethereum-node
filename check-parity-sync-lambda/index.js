'use strict';

const rp = require('request-promise-native');

const port = ':8080';
const targetUrl = process.env.HEALTHCHECK_URL;

exports.handler = function (event, context, callback) {
    if (typeof targetUrl !== 'string') {
        callback(new Error(`No healthcheck URL supplied to the Lambda (got: ${targetUrl})`));
    }

    console.log(`[INFO] - Checking  ${targetUrl}${port}`);

    rp(`http://${targetUrl}${port}`)
        .then(function (_) {
            console.log('[SUCCESS] PARITY IS SYNCED');
            console.log(_);
            callback();
        })
        .catch(function (err) {
            console.log('[ERROR] - ' + err.message);
            callback(err);
        });
};