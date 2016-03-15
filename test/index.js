'use strict';

const Stream = require('stream');
const Code = require('code');
const Lab = require('lab');
const Hoek = require('hoek');
const StandIn = require('stand-in');
const Rabbit = require('wascally');
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

internals.readStream = function (done) {

    var result = new Stream.Readable({ objectMode: true });
    result._read = Hoek.ignore;

    if (typeof done === 'function') {
        result.once('end', done);
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

        const reporter = new GoodRabbit({ log: '*' });
        expect(reporter.config).to.exist();
        expect(reporter.config.exchange.name).to.equal('good-rabbit');

        done();
    });

    it('throws an error if the incomming stream is not in objectMode', (done) => {

        const reporter = new GoodRabbit({ log: '*' });
        expect(reporter.config).to.exist();

        const stream = new Stream.Readable();

        reporter.init(stream, null, function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('stream must be in object mode');
            done();
        });
    });

    it('accepts config', (done) => {

        const reporter = new GoodRabbit({ log: '*' }, { exchange: { name: 'test-exchange' } });
        expect(reporter.config).to.exist();
        expect(reporter.config.exchange.name).to.equal('test-exchange');

        done();
    });

    describe('_report()', () => {

        describe('printResponse()', () => {

            it('publishes "response" events', (done) => {

                const reporter = new GoodRabbit({ response: '*' });
                const now = Date.now();

                StandIn.replace(Rabbit, 'publish', (stand, exchangeName, data) => {

                    expect(exchangeName).to.equal('good-rabbit');
                    expect(data.type).to.equal('response');
                    expect(data.body).to.deep.include(internals.response);
                    stand.restore();
                });

                internals.response.timestamp = now;

                const s = internals.readStream(done);

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();

                    s.push(internals.response);
                    s.push(null);
                });
            });

            it('publishes ops events', (done) => {

                const reporter = new GoodRabbit({ ops: '*' });
                const now = Date.now();
                const event = Hoek.clone(internals.ops);
                const Rabbit = require('wascally');

                StandIn.replace(Rabbit, 'publish', (stand, exchangeName, data) => {

                    expect(exchangeName).to.equal('good-rabbit');
                    expect(data.type).to.equal('ops');
                    expect(data.body).to.deep.include(internals.ops);
                    stand.restore();
                });

                event.timestamp = now;

                const s = internals.readStream(done);

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });

            it('publishes error events', (done) => {

                const reporter = new GoodRabbit({ error: '*' });
                const now = Date.now();
                const event = {
                    event: 'error',
                    error: {
                        message: 'test message',
                        stack: 'fake stack for testing'
                    }
                };

                StandIn.replace(Rabbit, 'publish', (stand, exchangeName, data) => {

                    expect(exchangeName).to.equal('good-rabbit');
                    expect(data.type).to.equal('error');
                    expect(data.body).to.deep.include(event);
                    stand.restore();
                });

                event.timestamp = now;

                const s = internals.readStream(done);

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });

            it('publishes multiple log events', (done) => {

                const reporter = new GoodRabbit({ log: '*' });
                const counter = 0;
                const now = Date.now();
                const event = {
                    event: 'log',
                    timestamp: now,
                    tags: ['info'],
                    data: 'this is a log'
                };

                StandIn.replace(Rabbit, 'publish', (stand, exchangeName, data) => {

                    expect(exchangeName).to.equal('good-rabbit');
                    expect(data.type).to.equal('error');
                    expect(data.body).to.deep.include(event);
                    counter = counter + 1;
                    if (counter === 2) {
                        stand.restore();
                    }
                });

                event.timestamp = now;

                const s = internals.readStream(done);

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(event);
                    s.push(null);
                });
            });
        });
    });
});
