'use strict';

/* global it */

var assert = require('assert');
var resp = require('..');

var parser = new resp.ResponseParser();

it('should complete parsing within N (adjusted) ticks', function (done) {
  var COUNT = 1000000;
  var CHUNK_SIZE = 10000;
  var MAX_ADJUSTED_TICKS = 20;

  var responses = 0;
  var requests = '';
  for (var i = 0; i < CHUNK_SIZE; i++) {
    requests += '*3\r\n+OK\r\n$3\r\nFOO\r\n:42\r\n';
  }
  var requestsBuffer = new Buffer(requests);

  var ticksPerSecond;
  var start = process.hrtime();
  process.nextTick(function () {
    var finish = process.hrtime();
    assert.equal(start[0], finish[0]);
    ticksPerSecond = 1000 / ((finish[1] - start[1]) / 1000000);
    start = Date.now();
    var chunks = COUNT / CHUNK_SIZE;
    for (i = 0; i < chunks; i++) {
      parser.parse(requestsBuffer);
    }
  });

  parser.on('response', function (response) {
    if (response instanceof Error) {
      throw response;
    }

    ++responses;
    if (responses === COUNT) {
      assert((ticksPerSecond / (Date.now() - start)) < MAX_ADJUSTED_TICKS);
      done();
    }
  });
});

