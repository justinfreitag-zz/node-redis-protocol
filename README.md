# node-resp [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**node-resp** is a [REdis][redis] Serialization Protocol implementation for
[Node.js][nodejs].

## Usage

    // Import
    var resp = require('node-resp');

    // Create request string (supports string arguments only)
    var requestString = resp.createRequestString(arguments);

    // Create response parser
    var responseParser = new resp.ResponseParser(options);

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

[npm-url]: https://npmjs.org/package/node-resp
[npm-image]: https://badge.fury.io/js/node-resp.png

[travis-url]: http://travis-ci.org/justinfreitag/node-resp
[travis-image]: https://travis-ci.org/justinfreitag/node-resp.png?branch=master

[depstat-url]: https://david-dm.org/justinfreitag/node-resp
[depstat-image]: https://david-dm.org/justinfreitag/node-resp.png

[redis]: http://redis.io
[nodejs]: http://nodejs.org
[gulp-test]: https://github.com/justinfreitag/gulp-test

