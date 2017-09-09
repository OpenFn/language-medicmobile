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
    "db": "db",
    "username": "something",
    "password": "secret"
  }
}
```

#### sample changesApi expression
```js
changesApi({
  "doc_ids": [123, 456],
  "filter": "",
  "include_docs": true,
  "last-event-id": 789, // potential cursor
  "since": "2017-09-09" // maybe not as good a cursor as `last-event-id`
});
```

[Docs](docs/index)

Development
-----------

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
