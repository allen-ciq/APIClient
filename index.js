let APIClient;

if(typeof window === 'undefined'){
    APIClient = require('./APIClient_node');
}else{
    APIClient = require('./APIClient');
}

module.exports = APIClient;
