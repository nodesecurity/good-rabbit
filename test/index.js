'use strict';

const Stream = require('stream');
const Code = require('code');
const Lab = require('lab');
const Hoek = require('hoek');
const StandIn = require('stand-in');
const Rabbit = require('rabbot');
const GoodRabbit = require('..');

const internals = {
};

internals.response = {
    event: 'response',
    method: 'post',
    statusCode: 200,
    timestamp: Date.now(),
    instance: 'localhost',
    path: '/data',
    responseTime: 150,
    query: {
        name: 'adam'
    },
    responsePayload: {
        foo: 'bar',
        value: 1
    }
};
internals.ops = {
    event: 'ops',
    timestamp: 1411583264547,
    os: {
        load: [1.650390625, 1.6162109375, 1.65234375],
        mem: { total: 17179869184, free: 8190681088 },
        uptime: 704891
    },
    proc: {
        uptime: 6,
        mem: {
            rss: 30019584,
            heapTotal: 18635008,
            heapUsed: 9989304
        },
        delay: 0.03084501624107361
    },
    load: { requests: {}, concurrents: {}, responseTimes: {} },
    pid: 64291
};

internals.readStream = function (done, stand) {

    const result = new Stream.Readable({ objectMode: true });
    result._read = Hoek.ignore;

    const wait = () => {

        if (!stand.complete) {
            setImmediate(() => {

                wait();
            });
            return;
        }

        stand.restore();
        done();
    };

    if (typeof done === 'function') {
        result.once('end', wait);
    }

    return result;
};

//We don't really want to connect
StandIn.replace(Rabbit, 'configure', (stand) => {

    return Promise.resolve();
});

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('GoodRabbit', () => {

    it('returns a new object with "new"', (done) => {

        const reporter = new GoodRabbit();
        expect(reporter.config).to.exist();
        expect(reporter.config.exchange.name).to.equal('good-rabbit');

        done();
    });

    it('accepts config', (done) => {

        const reporter = new GoodRabbit({ exchange: { name: 'test-exchange' } });
        expect(reporter.config).to.exist();
        expect(reporter.config.exchange.name).to.equal('test-exchange');

        done();
    });

    describe('_report()', () => {

        describe('printResponse()', () => {

            it('publishes events', (done) => {

                const reporter = new GoodRabbit();
                const now = Date.now();

                const stand = StandIn.replace(Rabbit, 'publish', (_unused, exchangeName, data) => {

                    expect(exchangeName).to.equal('good-rabbit');
                    expect(data.type).to.equal('response');
                    expect(data.body).to.include(internals.response);
                    stand.complete = true;
                });

                internals.response.timestamp = now;

                const s = internals.readStream(done, stand);

                s.push(internals.response);
                s.push(null);
                s.pipe(reporter);
            });

            it('publishes error events', (done) => {

                const reporter = new GoodRabbit();
                const now = Date.now();
                const event = {
                    event: 'error',
                    error: {
                        message: 'test message',
                        stack: 'fake stack for testing'
                    }
                };

                const stand = StandIn.replace(Rabbit, 'publish', (_unused, exchangeName, data) => {

                    expect(exchangeName).to.equal('good-rabbit');
                    expect(data.type).to.equal('error');
                    expect(data.body).to.include(event);
                    stand.complete = true;
                });

                event.timestamp = now;

                const s = internals.readStream(done, stand);

                s.push(event);
                s.push(null);
                s.pipe(reporter);
            });

            it('publishes multiple log events', (done) => {

                const reporter = new GoodRabbit();
                let counter = 0;
                const now = Date.now();
                const event = {
                    event: 'log',
                    timestamp: now,
                    tags: ['info'],
                    data: 'this is a log'
                };

                const stand = StandIn.replace(Rabbit, 'publish', (_unused, exchangeName, data) => {

                    expect(exchangeName).to.equal('good-rabbit');
                    expect(data.body).to.include(event);
                    counter = counter + 1;
                    if (counter === 2) {
                        stand.complete = true;
                    }
                });

                event.timestamp = now;

                const s = internals.readStream(done, stand);

                s.push(event);
                s.push(event);
                s.push(null);
                s.pipe(reporter);
            });
        });
    });
});
