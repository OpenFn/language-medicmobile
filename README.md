Language Medic Mobile [![Build Status](https://travis-ci.org/OpenFn/language-medicmobile.svg?branch=master)](https://travis-ci.org/OpenFn/language-medicmobile)
=============

Language Pack for building expressions and operations to make calls to the Medic Mobile API.  
**For an overview of Medic's database, check out [Medic's DB Schema v2](https://github.com/medic/medic-docs/blob/master/development/db-schema.md)**  
The exported functions in this language package can be executed by [OpenFn/core](https://github.com/OpenFn/core):  
```sh
../core/lib/cli.js execute -l ./lib/Adaptor -s ./tmp/state.json -e ./tmp/expression.js
```
For quick-start help, clone [OpenFn/openfn-devtools](https://github.com/OpenFn/openfn-devtools) and follow the README.md

Documentation
-------------

#### sample configuration
We connect to Medic's CouchDB api.

```json
{
  "server": "https://standard.app.medicmobile.org",
  "db": "medic",
  "username": "something",
  "password": "secret"
}
```

#### sample fetchSubmissions expression
```js
fetchSubmissions(
  "pregnancy", // formId
  { "last-event-id": 334 }, // params, last-event-id will be replaced by cursor
  "http://localhost:4000/inbox/abc-123-xyz" // postUrl
);
```

#### sample changesApi and pickFormData usage
```js
// get all the changes...
changesApi({
  "include_docs": true,
  // This only gets used the first time the job is run.
  // Subsequent runs take the lastSeq value as their cursor.
  // "last-event-id": 789,
});

// Picks out the field data for a given formId.
pickFormData("pregnancy");
```

[Docs](docs/index)

Development
-----------

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
