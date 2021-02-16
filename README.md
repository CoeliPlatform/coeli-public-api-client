# Coeli public api client
Typescript/JavaScript client to access Coeli public api easily.

## Install:
`npm install -S coeli-public-api-client`
or
`yarn add coeli-public-api-client`

## Import

```javascript
import { CoeliApi } from 'coeli-public-api-client';
 
const api = new CoeliApi(
    'TENANT',
    'auth_token'
);
 ```
or
```javascript
var coeliPublicApiClient = require('coeli-public-api-client')

var api = new coeliPublicApiClient.CoeliApi('TENANT', 'auth_token')
```


## GET entity

```javascript
api.getEntityById('en', 'HeritageObject', '877708', x => x);
```
```javascript
api.getEntityBySlug('en', 'HeritageObject', 'friendly-url', x => x);
```

## GET entities

```javascript
api.getEntities('es', 'HeritageObject', x => x)
```

## SEARCH
```javascript
const search = {
  "conditions": [{
    "property": "creation.date",
    "operator": "between_dates",
    "value": {
      "$type": 'DatingInterval',
      "since": { "value": '1832' },
      "until": { "value": '2020' },
    },
    "$type": "SimpleEntitySearchCondition"
  }, {
    "property": "repository.collection",
    "operator": "=",
    "value": "/coeli/TENANT/Collection/collection_id",
    "$type": "SimpleEntitySearchCondition"
  }], "sortCondition": {"sort": [{"name": "$metadata.updatedAt", "order": "DESC"}], "group": []}
}
api.createAndGetControlledSearch('es', 'HeritageObject', search, x => x)
```

