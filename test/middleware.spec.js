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

  describe('Overridable success and error handlers', function () {
    it('possible to specify custom errorHandler', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.reject(
              new Error('test')
            );
          }
        }, {
          errorHandler: function (err) {
            assert.instanceOf(err, Error);
            assert.equal(err.message, 'test');

            done(null);
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        });
    });

    it('possible to specify custom successHandler', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve('a:1:{s:2:"id";s:4:"test";}');
          }
        }, {
          successHandler: function (sessionId, session) {
            assert.typeOf(sessionId, 'string');
            assert.typeOf(session, 'object');
            assert.equal(sessionId, session.id);

            done(null);
          },
          errorHandler: function (err) {
            console.log(err.stack);
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        });
    });
  });

  describe('Intermediate result validation', function () {
    it('does not throw if cookie parsing middleware doesn\'t exist', function () {
      assert.doesNotThrow(
        function () {
          redisSession
            .middleware(
              {}, {
                errorHandler: function () {}
              }
            )({});
        }
      );
    });

    it('fail if `PHPSESSID` cookie doesn\'t exists', function (done) {
      redisSession
        .middleware(
          {}, {
            errorHandler: function (err) {
              assert.instanceOf(err, ReferenceError);
              assert.equal(
                err.message,
                'Variable `sessionId` is expected to be of type `String` and non-empty.'
              );

              done(null);
            }
          }
        )({
          cookies: {}
        });
    });

    it('does not throw if query parsing middleware doesn\'t exist', function () {
      assert.doesNotThrow(
        function () {
          redisSession
            .middleware(
              {}, {
                errorHandler: function () {}
              }
            )({});
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
        }, {
          errorHandler: function (err) {
            assert.instanceOf(err, Error);
            assert.equal(err.message, 'test');

            done(null);
          }
        })({
          query: {
            sessid: 'test'
          }
        });
    });

    it('fail if `serializedSession` has invalid type', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve(1);
          }
        }, {
          errorHandler: function (err) {
            assert.instanceOf(err, TypeError);
            assert.equal(
              err.message,
              'Variable `serializedSession` is expected to be of type `String` and non-empty.'
            );

            done(null);
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        });
    });

    it('fail if `serializedSession` is invalid PHP session', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve('test');
          }
        }, {
          errorHandler: function (err) {
            assert.instanceOf(err, Error);

            done(null);
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        });
    });

    it('fail if `session.is` is invalid', function (done) {
      redisSession
        .middleware({
          getAsync: function () {
            return Promise.resolve('a:1:{s:2:"id";i:42;}');
          }
        }, {
          errorHandler: function (err) {
            assert.instanceOf(err, TypeError);
            assert.equal(
              err.message,
              'Variable `session.id` is expected to be of type `String` and non-empty.'
            );

            done(null);
          }
        })({
          cookies: {
            PHPSESSID: 'test'
          }
        });
    });
  });
});
