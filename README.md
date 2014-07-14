# node-resp [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**node-resp** is a [REdis](http://redis.io) Serialization Protocol
implementation for [Node.js](http://nodejs.org).

## Usage

    // Import
    var resp = require('node-resp');

    // Create request string (supports string arguments only)
    var requestString = resp.createRequestString(arguments);

    // Create response parser
    var responseParser = new resp.ResponseParser();

    // Feed chunked data (as buffer or string)
    responseParser.parse(data);

    // Parsed response/s emitted during parse tick
    responseParser.on('response', function (response) { ... });

    // Fatal error
    responseParser.on('error', function (error) { ... });

## License

Copyright (c) 2014 Justin Freitag. See the LICENSE file for license rights and
limitations (MIT).

[npm-url]: https://npmjs.org/package/node-resp
[npm-image]: https://badge.fury.io/js/node-resp.png

[travis-url]: http://travis-ci.org/justinfreitag/node-resp
[travis-image]: https://travis-ci.org/justinfreitag/node-resp.png?branch=master

[depstat-url]: https://david-dm.org/justinfreitag/node-resp
[depstat-image]: https://david-dm.org/justinfreitag/node-resp.png

