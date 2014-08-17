'use strict';

var assert = require('assert');
var redisProtocol = require('..');

var parser;

beforeEach(function () {
  parser = new redisProtocol.ResponseParser();
});

it('should respond with error', function (done) {
  parser.once('response', function (response) {
    assert(response instanceof Error);
    done();
  });
  parser.parse(new Buffer('-Error message\r\n'));
});

it('should respond with number', function (done) {
  parser.once('response', function (response) {
    assert.equal(response, 42);
    done();
  });
  parser.parse(new Buffer(':42\r\n'));
});

it('should dereference parser buffer', function (done) {
  parser.once('response', function () {
    done();
  });
  parser.parse(new Buffer('+FOO\r\n'));
  assert.equal(parser.buffer, null);
});

it('should handle chunked data', function (done) {
  parser.once('response', function (response) {
    assert.equal(response[0], 'OK');
    assert.equal(response[1], 'FOO');
    assert.equal(response[2], '42');
    assert.equal(response[3], 'BAR');
    assert.equal(response[4].message, 'OH');
    done();
  });
  parser.parse(new Buffer('*5\r\n+O'));
  parser.parse(new Buffer('K\r\n$3\r\n'));
  parser.parse(new Buffer('FOO\r\n:4'));
  parser.parse(new Buffer('2\r\n$'));
  parser.parse(new Buffer('3\r\nBAR\r\n-'));
  parser.parse(new Buffer('OH\r\n'));
});

it('should handle chunked array elements', function (done) {
  parser.once('response', function (response) {
    assert.equal(response[0], 'OK');
    assert.equal(response[1], 'FOO');
    assert.equal(response[2], '42');
    done();
  });
  parser.parse(new Buffer('*3\r\n+OK\r\n'));
  parser.parse(new Buffer('$3\r\nFOO\r\n:42\r\n'));
});

it('should handle termination characters', function (done) {
  parser.once('response', function (response) {
    assert.equal(response[0], '\rFOO');
    assert.equal(response[1], '\r');
    done();
  });
  parser.parse(new Buffer('*2\r\n+\rFOO\r\n$1\r\n\r\r\n'));
});

it('should respond with array', function (done) {
  parser.once('response', function (response) {
    assert.equal(response[0], 'OK');
    assert.equal(response[1], 'FOO');
    done();
  });
  parser.parse(new Buffer('*2\r\n+OK\r\n$3\r\nFOO\r\n'));
});

it('should handle null array', function (done) {
  parser.once('response', function (response) {
    assert.equal(response, null);
    done();
  });
  parser.parse(new Buffer('*-1\r\n'));
});

it('should handle null bulk string', function (done) {
  parser.once('response', function (response) {
    assert.equal(response, null);
    done();
  });
  parser.parse(new Buffer('$-1\r\n'));
});

it('should handle large bulk string', function (done) {
  var string = new Array(2048).join('FOO');
  parser.once('response', function (response) {
    assert.equal(response, string);
    done();
  });
  parser.parse(new Buffer('$' + string.length + '\r\n' + string + '\r\n'));
});

it('should throw unexpected type error', function () {
  parser.once('response', function () {
    assert.fail();
  });
  assert.throws(function () {
    parser.parse(new Buffer('FOO\r\n'));
  });
});

it('should emit unexpected type error', function (done) {
  parser.once('response', function () {
    assert.fail();
  });
  parser.once('error', function (error) {
    assert(error instanceof Error);
    done();
  });
  parser.parse(new Buffer('*2\r\nFOO\r\n$3\r\nBAR\r\n'));
});

it('should throw buffer length error', function () {
  parser = new redisProtocol.ResponseParser({maxBufferLength: 5});
  parser.once('response', function () {
    assert.fail();
  });
  assert.throws(function () {
    parser.parse(new Buffer('+FOO'));
    parser.parse(new Buffer('BAR\r\n'));
  });
});

it('should emit buffer length error', function (done) {
  parser = new redisProtocol.ResponseParser({maxBufferLength: 5});
  parser.once('response', function () {
    assert.fail();
  });
  parser.once('error', function (error) {
    assert(error instanceof Error);
    done();
  });
  parser.parse(new Buffer('+FOO'));
  parser.parse(new Buffer('BAR\r\n'));
});

