# RestClient
A client object that is bound to a set of endpoints.

## Example
```
var registry = require('./registry');
var RestClient = require('./RestClient');
var client = new RestClient('host.name', registry);

// edit the registry so your client will have better names
client.getEndpoint({token: someToken}, function(response){
	handler(reponse);
});
```
