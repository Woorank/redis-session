/* global describe, it */

'use strict';

var Promise = require('bluebird');
var assert = require('chai').assert;

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
          assert.instanceOf(err, Error);
          assert.equal(err.message, 'test');

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
          assert.instanceOf(err, Error);

          done(null);
        });
    });

    it('fail if `session.id` is invalid', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve('a:1:{s:2:"id";i:42;}');
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        }, null, function (err) {
          assert.instanceOf(err, TypeError);
          assert.equal(
            err.message,
            'Variable `session.id` is expected to be of type `String` and non-empty.'
          );

          done(null);
        });
    });
  });
});
