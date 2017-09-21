Language Medic Mobile [![Build Status](https://travis-ci.org/OpenFn/language-medicmobile.svg?branch=master)](https://travis-ci.org/OpenFn/language-medicmobile)
=============

Language Pack for building expressions and operations to make calls to the Medic Mobile API.  
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
  "configuration": {
    "server": "https://standard.app.medicmobile.org",
    "db": "medic",
    "username": "something",
    "password": "secret"
  }
}
```

#### sample MedicMobile expression expression
```js
// get all the changes...
changesApi({
  "include_docs": true,
  // IRL, we'll use a cursor so this doesn't take FOREVER!
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
