'use strict';

var events = require('eventemitter3');
var util = require('util');

// TODO add binary support
exports.createRequest = function () {
  throw new Error('Not implemented');
  return buffer;
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

function decodeString(buffer, begin, end) {
  var tmp = '';
  for (var i = begin; i < end; i++) {
    tmp += String.fromCharCode(buffer[i]);
  }
  return tmp;
}

function copyBuffer(buffer, begin, end) {
  // TODO add binary support
  if ((end - begin) < 256) {
    return decodeString(buffer, begin, end);
  }
  return buffer.toString('utf-8', begin, end);
}

// TODO add check for max response length
function seekTerminator(parser) {
  var offset = parser.offset + 1;
  var length = parser.buffer.length;
  while (parser.buffer[offset] !== 13 && parser.buffer[offset + 1] !== 10) {
    ++offset;
    if (offset >= length) {
      return null;
    }
  }
  parser.offset = offset + 2;
  return offset;
}

function parseLength(parser) {
  var begin = parser.offset;
  var end = seekTerminator(parser);
  if (end === null) {
    return null;
  }
  return parseInt(decodeString(parser.buffer, begin, end), 10);
}

function parseSimpleString(parser) {
  var begin = parser.offset;
  var end = seekTerminator(parser);
  if (end === null) {
    return null;
  }
  return copyBuffer(parser.buffer, begin, end);
}

function parseError(parser) {
  var response = parseSimpleString(parser);
  if (response !== null) {
    response = new Error(response);
  }
  return response;
}

function parseBulkString(parser) {
  var length = parseLength(parser);
  if (length === null) {
    return null;
  }
  if (length === -1) {
    return -1;
  }

  var begin = parser.offset;
  var end = parser.offset + length;
  if ((end + 2) > parser.buffer.length) {
    return null;
  }
  parser.offset = end + 2;
  return copyBuffer(parser.buffer, begin, end);
}

function parseInteger(parser) {
  var begin = parser.offset;
  var end = seekTerminator(parser);
  if (end === null) {
    return null;
  }
  return parseInt(decodeString(parser.buffer, begin, end), 10);
}

function parseArray(parser) {
  var length = parseLength(parser);
  if (length === null) {
    return null;
  }
  if (length === -1) {
    return -1;
  }

  var responses = new Array(length);

  for (var i = 0; i < length; i++) {
    if ((parser.offset + 4) > parser.buffer.length) {
      return null;
    }
    var type = parser.buffer[parser.offset++];
    var response = parseType(parser, type);
    if (response === null) {
      return null;
    }
    if (response === -1) {
      response = null;
    }
    responses[i] = response;
  }

  return responses;
}

function handleError(parser, error) {
  if (!parser.emit('error', error)) {
    throw error;
  }

  return null;
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
  if (parser.buffer === null || parser.offset >= parser.buffer.length) {
    parser.buffer = buffer;
  } else {
    var length = (parser.buffer.length - parser.offset) + buffer.length;
    if (length > parser.options.maxBufferLength) {
        handleError(this, new Error('Maximum buffer length exceeded'));
        return;
    }
    var newBuffer = new Buffer(length);
    parser.buffer.copy(newBuffer, 0, parser.offset, parser.buffer.length);
    buffer.copy(newBuffer, parser.buffer.length, 0, buffer.length);
    parser.buffer = newBuffer;
  }
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

  while ((this.offset + 4) <= this.buffer.length) {
    var offset = this.offset;
    var type = this.buffer[this.offset++];
    var response = parseType(this, type);
    if (response === null) {
      this.offset = offset;
      break;
    }
    if (response === -1) {
      response = null;
    }
    this.emit('response', response);
  }

  if (this.offset >= this.buffer.length) {
    this.buffer = null;
  }
};

exports.ResponseParser = ResponseParser;

