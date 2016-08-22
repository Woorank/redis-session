'use strict';

var phpUnserialize = require('php-unserialize');

module.exports = {
  sessionNamespace: 'SESS',
  sessionSeparator: '_',

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

    return function (req, res, next) {
      var sessionId = (req.cookies || {}).PHPSESSID || (req.query || {}).sessid;

      req.sessionId = null;
      req.session = null;

      if (typeof sessionId !== 'string' || !sessionId.length) {
        return next(null);
      }

      redis
        .getAsync(sessionNamespace + sessionSeparator + sessionId)
        .then(function (serializedSession) {
          if (typeof serializedSession !== 'string' || !serializedSession.length) {
            return next(null);
          }

          try {
            var session = phpUnserialize.unserializeSession(serializedSession);
          } catch (error) {
            return next(error);
          }

          req.session = session;
          req.sessionId = session.id || null;
          req.session.id = req.sessionId;

          next(null);
        })
        .catch(next);
    };
  }
};
