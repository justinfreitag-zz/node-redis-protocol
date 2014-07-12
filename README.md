# node-resp

[![Build Status](https://travis-ci.org/justinfreitag/node-resp.svg?branch=master)](https://travis-ci.org/justinfreitag/node-resp)

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

