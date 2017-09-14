'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.changesApi = changesApi;

var _languageCommon = require('language-common');

Object.defineProperty(exports, 'field', {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, 'fields', {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, 'sourceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, 'alterState', {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, 'each', {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, 'dataPath', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, 'dataValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, 'lastReferenceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for http.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @constructor
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */
function execute() {
  for (var _len = arguments.length, operations = Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations)(_extends({}, initialState, state));
  };
}

function changesApi(params) {

  function assembleError(_ref) {
    var response = _ref.response,
        error = _ref.error;

    if (response && [200, 201, 202, 204].indexOf(response.statusCode) > -1) return false;
    if (error) return error;
    console.log(response);
    return new Error('Server responded with ' + response.statusCode + ':\n ' + response.body);
  }

  return function (state) {
    var _state$configuration = state.configuration,
        server = _state$configuration.server,
        db = _state$configuration.db,
        username = _state$configuration.username,
        password = _state$configuration.password;

    var query = (0, _languageCommon.expandReferences)(params)(state);
    var doc_ids = query.doc_ids;
    var qs = _queryString2.default.stringify(_lodash2.default.omit(query, "doc_ids"));

    var baseUrl = server + '/' + db + '/_changes';
    var url = doc_ids ? baseUrl + '?filter=_doc_ids&' + qs : baseUrl + '?' + qs;

    console.log("\x1b[33m%s\x1b[0m", "Performing GET on:" + url);
    console.log("Fetching docments: [\n  " + doc_ids + "\n]");

    var headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    };

    return new Promise(function (resolve, reject) {
      _request2.default.post({
        url: url,
        headers: headers,
        json: { doc_ids: doc_ids }
      }, function (error, response, body) {
        error = assembleError({ response: response, error: error });
        if (error) {
          reject(error);
        } else {
          console.log("\x1b[32m%s\x1b[0m", 'Success \u2713');
          console.log(JSON.stringify(body, null, 2));
          resolve(body);
        }
      }).auth(username, password);
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      if (data.length) {
        // TODO: figure out the appropriate cursor id...
        nextState.cursor = data[data.length - 1].id;
      }
      return nextState;
    });
  };
};
