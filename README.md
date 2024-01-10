# APIClient
An API client object that is bound to a set of endpoints.

## Example
```
const client = require('./RestClient')(require('./registry'));

// the client methods come from the registry keys
client.someEndpoint({token: someToken}, function(response){
	handler(reponse);
});
```
