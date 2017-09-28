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

/**
 * Access form submissions and post them as JSON.
 * @public
 * @example
 * fetchSubmissions(
     'pregnancy',
     '2017-05-06',
     'https://www.openfn.org/inbox/abc-123-xyz'
 * )
 * @function
 * @param {string} formId - Query parameters
 * @param {string} lastSeqId - Starting sequence id
 * @param {string} postUrl - Inbox to post form data
 * @returns {Operation}
 */
 export function fetchSubmissions(formId, params, postUrl) {
   return state => {

     params.include_docs = true;
     return changesApi(params)(state)
     .then((state) => {
       return pickFormData(formId)(state)
     })
     .then((state) => {
       const submissions = state.data.submissions;
       for (var i = 0, len = submissions.length; i < len; i++) {
         request.post({
           url: postUrl,
           json: submissions[i]
         })
         console.log(`Posted submission ${submissions[i].meta.instanceID} ✓`);
       }
       return state
     })
     .then((state) => {
       // clean state for next run
       state.data = {}
       state.references = []
       console.log("Fetching submissions succeeded ✓")
       return state;
     })

   }
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

/**
 * Select submissions for a specific form
 * @public
 * @example
 * pickFormData(formId)
 * @function
 * @param {string} formId - The form ID.
 * @returns {Operation}
 */
export function pickFormData(formId) {

  return state => {
    const myFormData = state.data.response.results.filter(item => {
      if (item.doc.form) return item.doc.form == formId;
    })
    .map(item => {
      return item.doc.fields
    });

    return {
      ...state,
      data: { submissions: myFormData },
      references: [ ...state.references, state.data ]
    }
  }

};

export {
  alterState,
  dataPath,
  dataValue,
  each,
  field,
  fields,
  lastReferenceValue,
  merge,
  sourceValue
} from 'language-common';
