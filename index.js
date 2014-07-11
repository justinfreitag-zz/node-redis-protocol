'use strict';

var events = require('event-emitter');
var util = require('util');

function parseSimpleString(parser) {
  var offset = parser.offset;
  var length = parser.buffer.length;
  var string = '';

  while (offset < length) {
    var c1 = parser.buffer[offset++];
    if (c1 === 13) {
      var c2 = parser.buffer[offset++];
      if (c2 === 10) {
        parser.offset = offset;
        return string;
      }
      string += String.fromCharCode(c1) + String.fromCharCode(c2);
      continue;
    }
    string += String.fromCharCode(c1);
  }
  return undefined;
}

function parseLength(parser) {
  var string = parseSimpleString(parser);
  if (string !== undefined) {
    var length = parseInt(string, 10);
    if (length === -1) {
      return null;
    }
    return length;
  }
}

function parseBulkString(parser) {
  var length = parseLength(parser);
  if (length == null) {
    return length;
  }
  var offsetEnd = parser.offset + length;
  if ((offsetEnd + 2) > parser.buffer.length) {
    return;
  }

  var offsetBegin = parser.offset;
  parser.offset = offsetEnd + 2;

  if (length > 2048) {
    return parser.buffer.toString('utf-8', offsetBegin, offsetEnd);
  }

  var string = '';
  while(offsetBegin < offsetEnd) {
    string += String.fromCharCode(parser.buffer[offsetBegin++]);
  }
  return string;
}

function parseArray(parser) {
  var length = parseLength(parser);
  if (length == null) {
    return length;
  }

  var responses = new Array(length);
  var bufferLength = parser.buffer.length;
  for (var i = 0; i < length; i++) {
    if (parser.offset >= bufferLength) {
      return;
    }
    var response = parseType(parser, parser.buffer[parser.offset++]);
    if (response === undefined) {
      return;
    }
    responses[i] = response;
  }

  return responses;
}

function handleError(parser, error) {
  if (!parser.emit('error', error)) {
    throw error;
  }
}

function parseType(parser, type) {
  if (type === 43) { // +
    return parseSimpleString(parser);
  }
  if (type === 36) { // $
    return parseBulkString(parser);
  }
  if (type === 42) { // *
    return parseArray(parser);
  }
  if (type === 58) { // :
    var string = parseSimpleString(parser);
    if (string !== undefined) {
      return parseInt(string, 10);
    }
    return;
  }
  if (type === 45) { // -
    var string = parseSimpleString(parser);
    if (string !== undefined) {
      return new Error(string);
    }
    return;
  }

  return handleError(parser, new Error('Unexpected type: ' + type));
}

function appendBuffer(parser, buffer) {
  var oldLength = parser.buffer.length;
  var remainingLength = oldLength - parser.offset;
  var newLength = remainingLength + buffer.length;
  if (newLength > parser.options.maxBufferLength) {
    handleError(this, new Error('Maximum buffer length exceeded'));
    return;
  }
  var newBuffer = new Buffer(newLength);
  parser.buffer.copy(newBuffer, 0, parser.offset, oldLength);
  buffer.copy(newBuffer, remainingLength, 0, buffer.length);
  parser.buffer = newBuffer;
  parser.offset = 0;
}

var DEFAULT_OPTIONS = {
  maxBufferLength: 16777216,
  maxResponseLength: 1048576
};

function ResponseParser(options) {
  this.options = util._extend(DEFAULT_OPTIONS, options);

  this.buffer = null;
  this.offset = 0;

  events.EventEmitter.call(this);
}
util.inherits(ResponseParser, events.EventEmitter);

ResponseParser.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

ResponseParser.prototype.parse = function (buffer) {
  if (this.buffer === null) {
    this.buffer = buffer;
    this.offset = 0;
  } else {
    appendBuffer(this, buffer);
  }

  var length = this.buffer.length;
  while (this.offset < length) {
    var offset = this.offset;
    var response = parseType(this, this.buffer[this.offset++]);
    if (response === undefined) {
      this.offset = offset;
      return;
    }

    this.emit('response', response);
  }

  this.buffer = null;
};

exports.ResponseParser = ResponseParser;

// TODO add binary support
exports.createRequest = function () {
  throw new Error('Not yet implemented');
};

exports.createRequestString = function () {
  var length = arguments.length;
  var request = '*' + length + '\r\n';
  for (var i = 0; i < length; i++) {
    if (typeof arguments[i] === 'string') {
      request += '$' + arguments[i].length + '\r\n' + arguments[i] + '\r\n';
    } else {
      var string = '' + arguments[i];
      request += '$' + string.length + '\r\n' + string + '\r\n';
    }
  }
  return request;
};

