/* global describe, it */

'use strict';

var assert = require('assert');

var redisSession = require('../lib/index');

describe('HTTP Request serializer', function () {
  describe('API argument validation', function () {
    it('`redis` argument is validated', function () {
      assert.throws(
        function () {
          redisSession.middleware({}, 'test');
        },
        TypeError
      );
    });

    it('`redis` argument is required', function () {
      assert.throws(
        function () {
          redisSession.middleware(null);
        },
        TypeError
      );
    });

    it('`options` argument is validated', function () {
      assert.throws(
        function () {
          redisSession.middleware({}, 'test');
        },
        TypeError
      );
    });

    it('`options` argument is optional', function () {
      assert.doesNotThrow(
        function () {
          redisSession.middleware({}, null);
        },
        TypeError
      );
    });
  });

  describe('Intermediate result validation', function () {
    it('does not throw if cookie parsing or query middlewares don\'t exist', function (done) {
      assert.doesNotThrow(
        function () {
          redisSession.middleware({})({}, null, done);
        }
      );
    });

    it('fallback to `req.query.sessid` if `PHPSESSID` cookie doesn\'t exist', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.reject(
              new Error('test')
            );
          }
        })({
          query: {
            sessid: 'hello'
          }
        }, null, function (err) {
          assert.strictEqual(err instanceof Error, true);
          assert.strictEqual(err.message, 'test');

          done(null);
        });
    });

    it('don\'t fail if `serializedSession` has invalid type', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve(1);
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        }, null, done);
    });

    it('fail if `serializedSession` is invalid PHP session', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve('test');
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        }, null, function (err) {
          assert.strictEqual(err instanceof Error, true);

          done(null);
        });
    });

    it('set `session.id` to null if is missing or invalid', function (done) {
      var username = 'test@woorank.com';

      var req = {
        cookies: {
          PHPSESSID: 'test'
        }
      };

      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve([
              'username|s:',
              username.length,
              ':"',
              username,
              '";'
            ].join(''));
          }
        })(req, null, function (err) {
          assert.strictEqual(err, null);
          assert.strictEqual(req.sessionId, null);
          assert.strictEqual(req.session.id, null);
          assert.strictEqual(req.session.username, username);

          done(null);
        });
    });

    it('success if `session.id` is present', function (done) {
      var username = 'test@woorank.com';
      var id = 42;

      var req = {
        cookies: {
          PHPSESSID: 'test'
        }
      };

      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve([
              'id|i:',
              id,
              ';',
              'username|s:',
              username.length,
              ':"',
              username,
              '";'
            ].join(''));
          }
        })(req, null, function (err) {
          assert.strictEqual(err, null);
          assert.strictEqual(req.sessionId, id);
          assert.strictEqual(req.session.id, id);
          assert.strictEqual(req.session.username, username);

          done(null);
        });
    });
  });
});
