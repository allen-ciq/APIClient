let APIClient;

if(typeof window !== 'undefined'){
    APIClient = require('./APIClient');
}else{
    APIClient = require('./APIClient_node');
}

module.exports = APIClient;
