# good-rabbit

RabbitMQ broadcasting for Good process monitor

## Usage

`good-rabbit` is a [good](https://github.com/hapijs/good) reporter implementation to write [hapi](http://hapijs.com/) server events to [RabbitMQ](http://www.rabbitmq.com).

The connection to RabbitMQ is made via the [wascally](https://github.com/leankit-labs/wascally) module.

## `GoodRabbit([config])`
Creates a new GoodRabbit object with the following arguments:

- `config` - Configuration object
  - `[connection]` - Settings for connecting to RabbitMQ. See the `connection` example in wascally's [Configuration via JSON](https://github.com/leankit-labs/wascally#configuration-via-json) for more info and defaults
  - `[exchange]` - Settings for the exchange to publish to. See the `exchanges` example in wascally docs [Configuration via JSON](https://github.com/leankit-labs/wascally#configuration-via-json) for more info.

## Output Format

All good messages are published to the given exchange w/ `type` set to `event` from good (i.e. `ops`, `error`, `request`) and `body` containing the entire payload from good. No parsing or transforming is done, that's left up to whatever processes the data coming out of RabbitMQ.
