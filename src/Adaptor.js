/** @module Adaptor */
import { execute as commonExecute, expandReferences } from 'language-common';
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
    data: []
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
    const qs = queryString.stringify(_.omit(query, "doc_ids"));

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
          // console.log(JSON.stringify(body, null, 2));
          resolve(body);
        }
      }).auth(username, password)
    })
    .then((data) => {
      const nextState = { ...state, data: [ ...state.data, data ] }
      // if (data.length) {
      //   // TODO: figure out the appropriate cursor id...
      //   nextState.cursor = data[data.length-1].id
      // }
      if (callback) return callback(nextState);
      return nextState;
    })

  };

};

export function pickFormData(formId) {

  return state => {
    const myFormData = state.data[0].results.filter(item => {
      if (item.doc.form) return item.doc.form == formId;
    })
    .map(item => {
      return item.doc.fields
    });

    const nextState = { ...state, data: myFormData }
    return nextState;
  }

};

export { field, fields, sourceValue, alterState, each, merge, dataPath,
  dataValue, lastReferenceValue } from 'language-common';
