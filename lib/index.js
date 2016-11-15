'use strict';

const Stream = require('stream');
const Hoek = require('hoek');
const internals = {
    defaults: {
        connection: {
            replyQueue: false
        },
        exchange: {
            name: 'good-rabbit',
            type: 'direct'
        }
    }
};

class GoodRabbit extends Stream.Writable {

    constructor(config) {

        super({ objectMode: true });

        config = config || {};

        this.config = Hoek.applyToDefaults(internals.defaults, {
            connection: config.connection,
            exchange: config.exchange
        });

    };

    _write(data, encoding, next) {

        this._connect().then(() => {

            return this.rabbit.publish(this.config.exchange.name, {
                type: data.event,
                body: data
            });
        }).then(() => {

            next();
        });
    };

    _connect() {

        if (this.rabbit) {

            return Promise.resolve();
        }

        // late require because simply requiring wascally seems to hold the process open
        // we switched to rabbot but are keeping the late require
        this.rabbit = require('rabbot');

        return this.rabbit.configure({
            connection: this.config.connection,
            exchanges: [this.config.exchange]
        });
    }
};

module.exports = internals.GoodRabbit = GoodRabbit;


internals.GoodRabbit.attributes = {
    pkg: require('../package.json')
};
