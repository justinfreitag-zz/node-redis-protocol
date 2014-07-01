'use strict';

var events = require('event-emitter');
var util = require('util');

function decodeString(buffer, offset, length) {
  var tmp = '';
  while (length--) {
    tmp = String.fromCharCode(buffer[offset + length]) + tmp;
  }
  return tmp;
}

function copyBuffer(buffer, offset, length) {
  // TODO add binary support
  if (length < 2048) {
    return decodeString(buffer, offset, length);
  }
  return buffer.toString('utf8', offset, offset + length);
}

function seekTerminator(parser) {
  var offset = parser.offset + 1;
  var length = parser.buffer.length;
  while (parser.buffer[offset] !== 13 && parser.buffer[offset + 1] !== 10) {
    if (++offset >= length) {
      return;
    }
  }
  length = offset - parser.offset;
  parser.offset = offset + 2;
  return length;
}

function parseLength(parser) {
  var offset = parser.offset;
  var length = seekTerminator(parser);
  if (length !== undefined) {
    return parseInt(decodeString(parser.buffer, offset, length), 10);
  }
}

function parseSimpleString(parser) {
  var offset = parser.offset;
  var length = seekTerminator(parser);
  if (length !== undefined) {
    return copyBuffer(parser.buffer, offset, length);
  }
}

function parseError(parser) {
  var response = parseSimpleString(parser);
  if (response !== undefined) {
    return new Error(response);
  }
}

function parseBulkString(parser) {
  var length = parseLength(parser);
  if (length === undefined) {
    return;
  }
  if (length === -1) {
    return null;
  }

  var offset = parser.offset;
  var end = offset + length + 2;
  if (end <= parser.buffer.length) {
    parser.offset = end;
    return copyBuffer(parser.buffer, offset, length);
  }
}

function parseInteger(parser) {
  var offset = parser.offset;
  var length = seekTerminator(parser);
  if (length !== undefined) {
    return parseInt(decodeString(parser.buffer, offset, length), 10);
  }
}

function parseArray(parser) {
  var length = parseLength(parser);
  if (length === undefined) {
    return;
  }
  if (length === -1) {
    return null;
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
  if (type === 58) { // :
    return parseInteger(parser);
  }
  if (type === 42) { // *
    return parseArray(parser);
  }
  if (type === 45) { // -
    return parseError(parser);
  }

  return handleError(parser, new Error('Unexpected type: ' + type));
}

function appendBuffer(parser, buffer) {
  if (!parser.buffer) {
    parser.buffer = buffer;
    parser.offset = 0;
    return;
  }
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
  appendBuffer(this, buffer);

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
  var request = '*' + arguments.length + '\r\n';
  for (var i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === 'string') {
      request += '$' + arguments[i].length + '\r\n' + arguments[i] + '\r\n';
    } else {
      var s = '' + arguments[i];
      request += '$' + s.length + '\r\n' + s + '\r\n';
    }
  }
  return request;
};

