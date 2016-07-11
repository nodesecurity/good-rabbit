'use strict';

const Squeeze = require('good-squeeze').Squeeze;
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

class GoodRabbit {
    constructor(events, config) {

        config = config || {};

        this.config = Hoek.applyToDefaults(internals.defaults, {
            connection: config.connection,
            exchange: config.exchange
        });

        this.squeeze = new Squeeze(events);
    };

    init(stream, emitter, callback) {

        const self = this;

        if (!stream._readableState.objectMode) {
            return callback(new Error('stream must be in object mode'));
        }

        stream.pipe(this.squeeze);

        this.squeeze.on('data', (data) => {

            self._connect().then(() => {

                self.rabbit.publish(self.config.exchange.name, {
                    type: data.event,
                    body: data
                });
            });
        });

        callback();
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
