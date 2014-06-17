var assert = require('assert');
var resp = require('..');

it('should toString() non-string args', function () {
  assert.equal(resp.createRequestString('TEST', 3),
               resp.createRequestString('TEST', '3'));
  assert.equal(resp.createRequestString('TEST', {}),
               resp.createRequestString('TEST', '[object Object]'));
  assert.equal(resp.createRequestString('TEST', []),
               resp.createRequestString('TEST', ''));
});

