# node-resp

**node-resp** is a [REdis](http://redis.io) Serialization Protocol
implementation for [Node.js](http://nodejs.org).

## Usage

    // Import library
    var resp = require('node-resp');

    // Create request buffer (supports binary/buffered arguments)
    var request = resp.createRequest(arguments);

    // Create request string (non-binary argument optimisation)
    var requestString = resp.createRequestString(arguments);

    // Create response parser
    var responseParser = new resp.ResponseParser();

    // Feed chunked data (as buffer or string)
    responseParser.parse(data);

    // Parsed response/s (emitted as part of parse tick)
    responseParser.on('response', function (response) { ... });

    // Fatal error
    responseParser.on('error', function (error) { ... });

## License

Copyright (c) 2014 Justin Freitag. See the LICENSE file for license rights and
limitations (MIT).

