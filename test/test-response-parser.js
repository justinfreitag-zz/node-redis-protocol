var assert = require('assert');
var resp = require('..');

var parser;

beforeEach(function () {
  parser = new resp.ResponseParser();
});

// TODO add maximum length buffer and response tests

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
  parser.once('response', function (response) {
    done();
  });
  parser.parse(new Buffer('+FOO\r\n'));
  assert.equal(parser.buffer, null);
});

it('should handle chunked data', function (done) {
  parser.once('response', function (response) {
    assert.equal(response[0], 'OK');
    assert.equal(response[1], 'FOO');
    assert.equal(response[2], 'BAR');
    done();
  });
  parser.parse(new Buffer('*3\r\n+OK\r\n$'));
  parser.parse(new Buffer('3\r\nFOO\r\n$3\r\nBAR\r\n'));
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

it('should throw unexpected type error', function () {
  parser.once('response', function (response) {
    assert.fail();
  });
  assert.throws(function () {
    parser.parse(new Buffer('FOO\r\n'));
  });
});

it('should emit unexpected type error', function (done) {
  parser.once('response', function (response) {
    assert.fail();
  });
  parser.once('error', function (error) {
    assert(error instanceof Error);
    done();
  });
  parser.parse(new Buffer('*2\r\nFOO\r\n$3\r\nBAR\r\n'));
});

