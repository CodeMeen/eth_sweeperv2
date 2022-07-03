const Web3 = require("web3");
const ethNetwork = 'https://mainnet.infura.io/v3/b64a1f176b30451da06a45377bca23a2';
const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));


var subscription = web3.eth.subscribe('pendingTransactions', function(error, result){
    if (!error) {
        console.log(result);
        return;
    }

    console.error(error);
})
.on("connected", function(subscriptionId){
    console.log(subscriptionId);
})
.on("data", function(blockHeader){
    console.log(blockHeader);
})
.on("error", console.error);
