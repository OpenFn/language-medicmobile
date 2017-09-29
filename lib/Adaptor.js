'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sourceValue = exports.merge = exports.lastReferenceValue = exports.fields = exports.field = exports.each = exports.dataValue = exports.dataPath = exports.alterState = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.fetchSubmissions = fetchSubmissions;
exports.changesApi = changesApi;
exports.pickFormData = pickFormData;

var _languageCommon = require('language-common');

Object.defineProperty(exports, 'alterState', {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
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
Object.defineProperty(exports, 'each', {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
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
Object.defineProperty(exports, 'lastReferenceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});
Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, 'sourceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
    data: null,
    references: [],
    cursor: null
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations)(_extends({}, initialState, state));
  };
}

/**
 * Access form submissions and post them as JSON.
 * @public
 * @example
 * fetchSubmissions(
 *   "pregnancy", // formId
 *   { "last-event-id": 334 }, // params
 *   "http://localhost:4000/inbox/abc-123-xyz" // postUrl
 * );
 * @function
 * @param {string} formId - Query parameters
 * @param {object} params - Starting sequence id
 * @param {string} postUrl - Inbox to post form data
 * @returns {Operation}
 */
function fetchSubmissions(formId, params, postUrl) {
  return function (state) {

    params.include_docs = true;
    return changesApi(params)(state).then(function (state) {
      return pickFormData(formId)(state);
    }).then(function (state) {
      var submissions = state.data.submissions;
      for (var i = 0, len = submissions.length; i < len; i++) {
        _request2.default.post({
          url: postUrl,
          json: submissions[i]
        });
        console.log('Posted submission ' + submissions[i].fields.meta.instanceID + ' \u2713');
      }
      return state;
    }).then(function (state) {
      // clean state for next run
      state.data = {};
      state.references = [];
      console.log("Fetching submissions succeeded ✓");
      return state;
    });
  };
}

/**
 * Access the CouchDB Changes API
 * @public
 * @example
 * changesApi(params, callback)
 * @function
 * @param {object} params - Query parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
function changesApi(params, callback) {

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
    var scrubbedQuery = _lodash2.default.omit(query, [
    // Ignore last-event-id if state has a cursor...
    "doc_ids", state.cursor ? "last-event-id" : null]);

    if (state.cursor) {
      // add the cursor...
      scrubbedQuery["last-event-id"] = state.cursor;
    }

    var qs = _queryString2.default.stringify(scrubbedQuery);
    var baseUrl = server + '/' + db + '/_changes';
    var url = doc_ids ? baseUrl + '?filter=_doc_ids&' + qs : baseUrl + '?' + qs;

    console.log("Performing request on: " + url);
    console.log("Applying document filter: [\n  " + doc_ids + "\n]");

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
          console.log('Request Success ✓');
          resolve(body);
        }
      }).auth(username, password);
    }).then(function (response) {
      if (!_lodash2.default.isEmpty(response.results)) {
        state.cursor = response.last_seq;
        console.log('Set cursor for next run to: ' + response.last_seq + '.');
      } else {
        console.log('No new results. Cursor will remain at ' + state.cursor + '.');
      }
      var nextState = (0, _languageCommon.composeNextState)(state, response);
      if (callback) return callback(nextState);
      return nextState;
    });
  };
};

/**
 * Select submissions for a specific form
 * @public
 * @example
 * pickFormData(formId)
 * @function
 * @param {string} formId - The form ID.
 * @returns {Operation}
 */
function pickFormData(formId) {

  return function (state) {
    var myFormData = [];
    if (state.data.response.results) {
      myFormData = state.data.response.results.filter(function (item) {
        if (item.doc.form) return item.doc.form == formId;
      }).map(function (item) {
        var _item$doc = item.doc,
            _id = _item$doc._id,
            fields = _item$doc.fields,
            form = _item$doc.form,
            type = _item$doc.type,
            reported_date = _item$doc.reported_date,
            contact = _item$doc.contact;

        return {
          _id: _id,
          form: form,
          type: type,
          reported_date: reported_date,
          contact: contact,
          fields: fields
        };
      });
    };

    return _extends({}, state, {
      data: { submissions: myFormData },
      references: [].concat(_toConsumableArray(state.references), [state.data])
    });
  };
};
