import { execute as commonExecute, expandReferences } from 'language-common';
import request from 'request';
import { resolve as resolveUrl } from 'url';

/** @module Adaptor */

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


export function changesApi(query) {

  return state => {

    function assembleError({ response, error }) {
      if (response && ([200,201,202,204].indexOf(response.statusCode) > -1)) return false;
      if (error) return error;
      return new Error(`Server responded with ${response.statusCode}`)
    }

    const { server, username, password } = state.configuration;
    const cursor = state.cursor || filter.afterDate;

    const ternaryQuery = query || {};

    // const selectors = ( ternaryQuery.fields ? `$select=${query.fields.join(',')}` : null );
    // const orderBy = ( ternaryQuery.orderBy ? `$orderby=${query.orderBy.field} ${query.orderBy.direction}` : null );
    const filter = ( ternaryQuery.filter ? `$filter=${query.filter}` : null );
    // const limit = ( ternaryQuery.limit ?  query.limit : 0 );

    const queryUrl = [selectors, orderBy, filter]
                      .filter( i => {
                        return i != null
                      })
                      .join('&');

    const url = `${server}/changes`
    const fullUrl = ( queryUrl ? `${url}?${filter}` : url );

    console.log("Full URL: " + fullUrl);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': accessToken
    };

    return new Promise((resolve, reject) => {
      request.get ({
        url: fullUrl,
        json: body,
        headers
      }, function(error, response, body){
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
        // TODO: figure out the appropriate cursor id.
        nextState.cursor = data[data.length-1].id
      }
      return nextState;
    })

  };

};

export {
  field, fields, sourceValue, alterState, each, merge, dataPath, dataValue,
  lastReferenceValue
} from 'language-common';
