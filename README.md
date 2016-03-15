# good-rabbit

RabbitMQ broadcasting for Good process monitor

## Usage

`good-rabbit` is a [good](https://github.com/hapijs/good) reporter implementation to write [hapi](http://hapijs.com/) server events to [RabbitMQ](http://www.rabbitmq.com).

The connection to RabbitMQ is made via the [wascally](https://github.com/leankit-labs/wascally) module.

## `GoodRabbit(events, [config])`
Creates a new GoodRabbit object with the following arguments:

- `events` - an object of key value pairs.
	- `key` - one of the supported [good events](https://github.com/hapijs/good) indicating the hapi event to subscribe to
	- `value` - a single string or an array of strings to filter incoming events. "\*" indicates no filtering. `null` and `undefined` are assumed to be "\*"
- `config` - Configuration object
  - `[connection]` - Settings for connecting to RabbitMQ. See the `connection` example in wascally's [Configuration via JSON](https://github.com/leankit-labs/wascally#configuration-via-json) for more info and defaults
  - `[exchange]` - Settings for the exchange to publish to. See the `exchanges` example in wascally docs [Configuration via JSON](https://github.com/leankit-labs/wascally#configuration-via-json) for more info.

## Good Rabbit Methods
### `goodrabbit.init(stream, emitter, callback)`
Initializes the reporter with the following arguments:

- `stream` - a Node readable stream that will be the source of data for this reporter. It is assumed that `stream` is in `objectMode`.
- `emitter` - an event emitter object.
- `callback` - a callback to execute when the start function has complete all the necessary set up steps and is ready to receive data.

## Output Format

All good messages are published to the given exchange w/ `type` set to `event` from good (i.e. `ops`, `error`, `request`) and `body` containing the entire payload from good. No parsing or transforming is done, that's left up to whatever processes the data coming out of RabbitMQ.
