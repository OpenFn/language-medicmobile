Language Medic Mobile [![Build Status](https://travis-ci.org/OpenFn/language-medicmobile.svg?branch=master)](https://travis-ci.org/OpenFn/language-medicmobile)
=============

Language Pack for building expressions and operations to make calls to the Medic Mobile API.

Documentation
-------------

#### sample configuration
We connect to Medic's CouchDB api.
```json
{
  "configuration": {
    "server": "https://openfn.crm2.MedicMobile.com",
    "username": "blah",
    "password": "blah"
  }
}
```

#### sample changes expression
```js
changes({
  entityName: "accounts",
  filter: {
        "name": "Open Function",
        "creditonhold": false,
        "after": "2016-01-01"
  }
});
```

[Docs](docs/index)


Development
-----------

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
