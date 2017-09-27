/** @module Adaptor */
import { execute as commonExecute, expandReferences, composeNextState } from 'language-common';
import request from 'request';
import queryString from 'query-string';
import _ from 'lodash';

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
export function execute(...operations) {
  const initialState = {
    data: null,
    references: [],
    cursor: null
  }

  return state => {
    return commonExecute(...operations)({ ...initialState, ...state })
  };

}


export function changesApi(params, callback) {

  function assembleError({ response, error }) {
    if (response && ([200,201,202,204].indexOf(response.statusCode) > -1)) return false;
    if (error) return error;
    console.log(response);
    return new Error(`Server responded with ${response.statusCode}:\n ${response.body}`)
  }

  return state => {

    const { server, db, username, password } = state.configuration;
    const query = expandReferences(params)(state);
    const doc_ids = query.doc_ids;
    const scrubbedQuery = _.omit(query, [
        // Ignore last-event-id if state has a cursor...
        "doc_ids", (state.cursor ? "last-event-id" : null)
    ])

    if (state.cursor) {
       // add the cursor...
      scrubbedQuery["last-event-id"] = state.cursor
    }

    const qs = queryString.stringify(scrubbedQuery)
    const baseUrl = `${server}/${db}/_changes`
    const url = (doc_ids ? `${baseUrl}?filter=_doc_ids&${qs}` : `${baseUrl}?${qs}`)

    console.log("\x1b[33m%s\x1b[0m", "Performing GET on:" + url);
    console.log("Fetching docments: [\n  " + doc_ids + "\n]");

    const headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };

    return new Promise((resolve, reject) => {
      request.post ({
        url,
        headers,
        json: { doc_ids }
      }, function(error, response, body){
        error = assembleError({response, error})
        if(error) {
          reject(error);
        } else {
          console.log("\x1b[32m%s\x1b[0m", `Success ✓`)
          resolve(body);
        }
      }).auth(username, password)
    })
    .then((response) => {
      state.cursor = response.last_seq
      const nextState = composeNextState(state, response)
      if (callback) return callback(nextState);
      return nextState;
    })

  };

};

export function pickFormData(formId) {

  return state => {
    const myFormData = state.data.response.results.filter(item => {
      if (item.doc.form) return item.doc.form == formId;
    })
    .map(item => {
      return item.doc.fields
    });

    const nextState = composeNextState(state, myFormData)
    return nextState;
  }

};

export { field, fields, sourceValue, alterState, each, merge, dataPath,
  dataValue, lastReferenceValue } from 'language-common';
