'use strict';

var phpUnserialize = require('php-unserialize');

module.exports = {
  sessionNamespace: 'SESS',
  sessionSeparator: '_',

  successHandler: function (sessionId, session, req, res, next) {
    req.sessionId = sessionId;
    req.session = session;

    next();
  },

  errorHandler: function (error, req, res, next) { // eslint-disable-line handle-callback-err
    res
      .status(401)
      .end();
  },

  middleware: function (redis, options) {
    if (Object.prototype.toString.call(redis) !== '[object Object]') {
      throw new TypeError('Argument `redis` is expected to be of type `Object`.');
    }

    if (
      options !== null &&
      options !== undefined &&
      Object.prototype.toString.call(options) !== '[object Object]'
    ) {
      throw new TypeError('Argument `options` is expected to be of type `Object`, `Null` or `Undefined`.');
    }

    options = options || {};

    var sessionNamespace = options.sessionNamespace || this.sessionNamespace;
    var sessionSeparator = options.sessionSeparator || this.sessionSeparator;
    var successHandler = options.successHandler || this.successHandler;
    var errorHandler = options.errorHandler || this.errorHandler;

    return function (req, res, next) {
      var sessionId = (req.cookies || {}).PHPSESSID || (req.query || {}).sessid;

      if (typeof sessionId !== 'string' || !sessionId.length) {
        return errorHandler(
          new ReferenceError('Variable `sessionId` is expected to be of type `String` and non-empty.'),
          req,
          res,
          next
        );
      }

      redis
        .getAsync(sessionNamespace + sessionSeparator + sessionId)
        .then(function (serializedSession) {
          if (typeof serializedSession !== 'string' || !serializedSession.length) {
            return errorHandler(
              new TypeError('Variable `serializedSession` is expected to be of type `String` and non-empty.'),
              req,
              res,
              next
            );
          }

          try {
            // var session = phpUnserialize.unserializeSession(serializedSession);
            var session = phpUnserialize.unserialize(serializedSession);
          } catch (error) {
            return errorHandler(
              errorHandler,
              req,
              res,
              next
            );
          }

          if (typeof session.id !== 'string' || !session.id.length) {
            return errorHandler(
              new TypeError('Variable `session.id` is expected to be of type `String` and non-empty.'),
              req,
              res,
              next
            );
          }

          successHandler(
            sessionId,
            session,
            req,
            res,
            next
          );
        })
        .catch(errorHandler);
    };
  }
};
