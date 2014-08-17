# node-redis-protocol [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**node-redis-protocol** is a [REdis][redis] Serialization Protocol
implementation for [Node.js][nodejs].

## Usage

    // Import
    var redisProtocol = require('node-redis-protocol');

    // Create request string (supports string arguments only)
    var requestString = redisProtocol.createRequestString(arguments);

    // Create response parser
    var responseParser = new redisProtocol.ResponseParser(options);

    // Feed chunked data (as buffer or string)
    responseParser.parse(data);

    // Parsed response/s are emitted during parse tick
    responseParser.on('response', function (response) { ... });

    // Fatal error
    responseParser.on('error', function (error) { ... });

### ResponseParser options

#### maxBufferLength

- Type: `number // bytes`
- Default: `16777216 // 16MB`

## Testing

Linting, coverage and complexity checks are handled by [gulp-test][gulp-test].
Enter `gulp` from your command line for options.

## License

Copyright (c) 2014 Justin Freitag. See the LICENSE file for license rights and
limitations (MIT).

[npm-url]: https://npmjs.org/package/node-redis-protocol
[npm-image]: https://badge.fury.io/js/node-redis-protocol.png

[travis-url]: http://travis-ci.org/justinfreitag/node-redis-protocol
[travis-image]: https://travis-ci.org/justinfreitag/node-redis-protocol.png?branch=master

[depstat-url]: https://david-dm.org/justinfreitag/node-redis-protocol
[depstat-image]: https://david-dm.org/justinfreitag/node-redis-protocol.png

[redis]: http://redis.io
[nodejs]: http://nodejs.org
[gulp-test]: https://github.com/justinfreitag/gulp-test

