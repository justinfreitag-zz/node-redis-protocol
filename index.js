'use strict';

var events = require('eventemitter3');
var util = require('util');

function decodeString(buffer, begin, length) {
  var tmp = '';
  while (length--) {
    tmp = String.fromCharCode(buffer[begin + length]) + tmp;
  }
  return tmp;
}

function copyBuffer(buffer, begin, length) {
  // TODO add binary support
  if (length < 2048) {
    return decodeString(buffer, begin, length);
  }
  return buffer.toString('utf8', begin, begin + length);
}

function seekTerminator(parser) {
  var offset = parser.offset;
  var length = parser.buffer.length;
  while (++offset !== length) {
    if (parser.buffer[offset] === 13 && parser.buffer[offset + 1] === 10) {
      length = offset - parser.offset;
      parser.offset = offset + 2;
      return length;
    }
  }
}

function parseLength(parser) {
  var begin = parser.offset;
  var length = seekTerminator(parser);
  if (length === undefined) {
    return;
  }
  return parseInt(decodeString(parser.buffer, begin, length), 10);
}

function parseSimpleString(parser) {
  var begin = parser.offset;
  var length = seekTerminator(parser);
  if (length === undefined) {
    return;
  }
  return copyBuffer(parser.buffer, begin, length);
}

function parseError(parser) {
  var response = parseSimpleString(parser);
  if (response !== undefined) {
    response = new Error(response);
  }
  return response;
}

function parseBulkString(parser) {
  var length = parseLength(parser);
  if (length === undefined) {
    return;
  }
  if (length === null) {
    return null;
  }
  var begin = parser.offset;
  parser.offset = begin + length + 2;
  if (parser.offset > parser.buffer.length) {
    return;
  }
  return copyBuffer(parser.buffer, begin, length);
}

function parseInteger(parser) {
  var begin = parser.offset;
  var length = seekTerminator(parser);
  if (length === undefined) {
    return;
  }
  return parseInt(decodeString(parser.buffer, begin, length), 10);
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
  for (var i = 0; i < length; i++) {
    if ((parser.offset + 4) > parser.buffer.length) {
      return;
    }
    var type = parser.buffer[parser.offset++];
    var response = parseType(parser, type);
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
  do {
    var begin = this.offset;
    var response = parseType(this, this.buffer[this.offset++]);
    if (response === undefined) {
      this.offset = begin;
      return;
    }
    this.emit('response', response);
  } while (this.offset !== length);

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

