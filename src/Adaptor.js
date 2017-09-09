/** @module Adaptor */
import { execute as commonExecute, expandReferences } from 'language-common';
import request from 'request';
import queryString from 'query-string';

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
    references: [],
    data: null
  }

  return state => {
    return commonExecute(...operations)({ ...initialState, ...state })
  };

}


export function changesApi(params) {

  function assembleError({ response, error }) {
    if (response && ([200,201,202,204].indexOf(response.statusCode) > -1)) return false;
    if (error) return error;
    return new Error(`Server responded with ${response.statusCode}:\n ${response.body}`)
  }

  return state => {

    const { server, db, username, password } = state.configuration;
    const query = queryString.stringify(expandReferences(params)(state));

    const baseUrl = `${server}/${db}/_changes`
    const url = (query ? `${baseUrl}?${query}` : baseUrl)

    console.log("Performing GET on:" + url);

    const headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    };

    return new Promise((resolve, reject) => {
      request.get ({ url, headers }, function(error, response, body){
        error = assembleError({response, error})
        if(error) {
          reject(error);
        } else {
          console.log(body)
          resolve(body);
        }
      })
    })
    .then((data) => {
      const nextState = { ...state, response: { body: data } };
      if (data.length) {
        // TODO: figure out the appropriate cursor id...
        nextState.cursor = data[data.length-1].id
      }
      return nextState;
    })

  };

};

export { field, fields, sourceValue, alterState, each, merge, dataPath,
  dataValue, lastReferenceValue } from 'language-common';
