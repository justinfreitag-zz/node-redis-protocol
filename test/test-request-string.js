'use strict';

var assert = require('assert');
var redisProtocol = require('..');

it('should toString() non-string args', function () {
  assert.equal(redisProtocol.createRequestString('FOO', 42),
               redisProtocol.createRequestString('FOO', '42'));
  assert.equal(redisProtocol.createRequestString('FOO', {}),
               redisProtocol.createRequestString('FOO', '[object Object]'));
  assert.equal(redisProtocol.createRequestString('FOO', []),
               redisProtocol.createRequestString('FOO', ''));
});

