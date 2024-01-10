# APIClient
An API client object that is bound to a set of endpoints.

## Example
```
const client = require('./APIClient')(require('./registry'));

// the client methods come from the registry keys
try{
	const response = await client.someEndpoint({token: someToken});
}catch(e){
	throw new Error(e);
}
```
