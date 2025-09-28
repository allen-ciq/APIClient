let APIClient;

if(typeof window === 'undefined'){
    APIClient = require('./APIClient_node.js');
}else{
    APIClient = require('./APIClient.js');
}

module.exports = APIClient;
