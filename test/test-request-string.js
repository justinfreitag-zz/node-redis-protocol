'use strict';

var assert = require('assert');
var resp = require('..');

it('should toString() non-string args', function () {
  assert.equal(resp.createRequestString('FOO', 42),
               resp.createRequestString('FOO', '42'));
  assert.equal(resp.createRequestString('FOO', {}),
               resp.createRequestString('FOO', '[object Object]'));
  assert.equal(resp.createRequestString('FOO', []),
               resp.createRequestString('FOO', ''));
});

