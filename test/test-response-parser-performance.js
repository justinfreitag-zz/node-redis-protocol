var assert = require('assert');
var resp = require('..');

var parser = new resp.ResponseParser();

it('should complete parsing within 10k ticks', function (done) {
  var COUNT = 1000000;
  var CHUNK_SIZE = 10000;
  var TICK_SIZE = 10000;

  var tickTime = 0;
  var responses = 0;

  parser.on('response', function (response) {
    if (response instanceof Error) {
      throw response;
    }
    ++responses;
    if (responses === COUNT) {
      assert(((Date.now() - start) / tickTime) < TICK_SIZE);
      done();
    }
  });

  var requests = '';
  for (var i = 0; i < CHUNK_SIZE; i++) {
    requests += '*3\r\n+OK\r\n*-1\r\n$3\r\nFOO\r\n';
  }
  var requestsBuffer = new Buffer(requests);
  var start = process.hrtime();
  process.nextTick(function () {
    var finish = process.hrtime();
    assert.equal(start[0], finish[0]);
    tickTime = (finish[1] - start[1]) / 1000000;
    start = Date.now();
    var chunks = COUNT / CHUNK_SIZE;
    for (i = 0; i < chunks; i++) {
      parser.parse(requestsBuffer);
    }
  });
});

