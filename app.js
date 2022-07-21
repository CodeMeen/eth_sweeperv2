const Web3 = require("web3");
const EthereumTx = require('ethereumjs-tx').Transaction;
const axios = require('axios');
const networks = [
    'https://mainnet.infura.io/v3/b64a1f176b30451da06a45377bca23a2',
    'https://mainnet.infura.io/v3/d9adf57b44cd468fadd9ee7f9877b803',
    'https://mainnet.infura.io/v3/af31f4d9b9cc4dbeb6606a15315a8679'
]
const ethNetwork = 'https://mainnet.infura.io/v3/b64a1f176b30451da06a45377bca23a2';

const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));


const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/b64a1f176b30451da06a45377bca23a2");

// Gas prices Options
// auto : adjusts gas price according to acct balance
//ultimate
//high
//medium
//low
const data = [{ privatekey: 'f876700df898d0fd9833cc768e8a46fcdbe36036bcc541bfa32d1ecf647e2361', address: '0xa5975a07f862e965392b1b2ac1e04bf2764813f4', name: 'Wallet 1', rcvaddr: '0x8045acca205c53e8d5acfa7ef452ad7318864eb9', gaspricetype: 'auto' }]


const bot = async() => {
    provider.on("block", async(blocknumber) => {
        console.log('\n');
        console.log("Listening new block, waiting.." + blocknumber);

        for (let i = 0; i < data.length; i++) {
            try {
                await ClearAllEth({ address: data[i].address, privateKey: data[i].privatekey, name: data[i].name }, { address: data[i].rcvaddr }, blocknumber, data[i].gaspricetype);
            } catch (error) {
                console.log('Couldnt finish transaction!\n}');
            }
        }

    });
}




async function ClearAllEth(sendersData, recieverData, blocknumber, gastype) {
    return new Promise(async(resolve, reject) => {
        var nonce = await web3.eth.getTransactionCount(sendersData.address);


        web3.eth.getBalance(sendersData.address, async(err, result) => {
            if (err) {
                return reject('error: ' + err);
            }

            let balanceinwei = result;
            let balance = web3.utils.fromWei(balanceinwei, "ether");


            let gasPrices = await getCurrentGasPrices();


            let cpr = await getprices(balance, gasPrices, gastype);


            var respobj = 'Block: ' + blocknumber + '... { \n' +

                '\n' +
                'Total Balance:' + balance + ' ETH\n' +
                'Amount to Send:' + cpr.amountToSend + ' ETH\n' +
                'Transaction fee (gas price*gas used):' + cpr.txfee + ' ETH\n' +
                'Speed: ' + cpr.speed + '\n';

            if (cpr.cv < 0) {

                console.log('\n\n');
                console.log(respobj + '\nError: Insufficient Balance \n');


                return reject('error');
            }


            let amountToSendinwei = await web3.utils.toWei(cpr.cv.toString(), 'ether');


            let details = {
                "to": recieverData.address,
                "value": web3.utils.toHex(amountToSendinwei),
                "gas": 21000,
                "gasPrice": cpr.gaspriceinwei,
                "nonce": nonce,
                "chainId": 1 // EIP 155 chainId - mainnet: 1, rinkeby: 4
            }

            const transaction = new EthereumTx(details, { chain: 'mainnet' });
            let privateKey = sendersData.privateKey;
            let privKey = Buffer.from(privateKey, 'hex');
            transaction.sign(privKey);

            const serializedTransaction = transaction.serialize();

            web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
                if (err) {
                    console.log(err);
                    return reject('error');
                }
                const url = `https://etherscan.io/tx/${id}`;
                console.log('\n\n');
                console.log(respobj + '\nSent..Transaction pending\nUrl:' + url + '\n}');


                resolve({ id: id, link: url });
            });
        });
    });
}


async function getBalance(address) {
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(address, async(err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(web3.utils.fromWei(result, "ether"));
        });
    });
}


async function getCurrentGasPrices() {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    let prices = {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10,
        ultimate: response.data.fastest / 10
    };
    return prices;
}

async function getprices(balance, gas, type) {
    let ultimate = gas.ultimate;
    let high = gas.high;
    let medium = gas.medium;
    let low = gas.low;

    if (type == 'auto') {

        var gaspriceinwei = ultimate * 1000000000;
        var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

        var txfee = await (21000 * gasprice) + 0.000019;
        var cv = await (balance - txfee).toFixed(10);

        var amountToSend = cv;

        var data = {
            gaspriceinwei: gaspriceinwei,
            gasprice: gasprice,
            txfee: txfee,
            cv: cv,
            amountToSend: amountToSend,
            speed: "ultimate"
        };

        if (amountToSend < 0) {
            var gaspriceinwei = high * 1000000000;
            var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

            var txfee = await (21000 * gasprice) + 0.000019;
            var cv = await (balance - txfee).toFixed(10);

            var amountToSend = cv;

            var data = {
                gaspriceinwei: gaspriceinwei,
                gasprice: gasprice,
                txfee: txfee,
                cv: cv,
                amountToSend: amountToSend,
                speed: "high"
            };

            if (amountToSend < 0) {

                var gaspriceinwei = medium * 1000000000;
                var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

                var txfee = await (21000 * gasprice) + 0.000019;
                var cv = await (balance - txfee).toFixed(10);

                var amountToSend = cv;

                var data = {
                    gaspriceinwei: gaspriceinwei,
                    gasprice: gasprice,
                    txfee: txfee,
                    cv: cv,
                    amountToSend: amountToSend,
                    speed: "medium"
                };

                if (amountToSend < 0) {
                    var gaspriceinwei = low * 1000000000;
                    var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

                    var txfee = await (21000 * gasprice) + 0.000019;
                    var cv = await (balance - txfee).toFixed(10);

                    var amountToSend = cv;

                    var data = {
                        gaspriceinwei: gaspriceinwei,
                        gasprice: gasprice,
                        txfee: txfee,
                        cv: cv,
                        amountToSend: amountToSend,
                        speed: "low"
                    };
                    return data;
                } else {
                    return data;
                }

            } else {
                return data;
            }

        } else {
            return data;
        }

    } else if (type != 'auto') {

        if (type == 'ultimate') {

            var gaspriceinwei = ultimate * 1000000000;
            var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

            var txfee = await (21000 * gasprice) + 0.000019;
            var cv = await (balance - txfee).toFixed(10);

            var amountToSend = cv;

            var data = {
                gaspriceinwei: gaspriceinwei,
                gasprice: gasprice,
                txfee: txfee,
                cv: cv,
                amountToSend: amountToSend,
                speed: "ultimate"
            };

            return data;


        } else if (type == 'high') {

            var gaspriceinwei = high * 1000000000;
            var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

            var txfee = await (21000 * gasprice) + 0.000019;
            var cv = await (balance - txfee).toFixed(10);

            var amountToSend = cv;

            var data = {
                gaspriceinwei: gaspriceinwei,
                gasprice: gasprice,
                txfee: txfee,
                cv: cv,
                amountToSend: amountToSend,
                speed: "high"
            };

            return data;

        } else if (type == 'medium') {

            var gaspriceinwei = medium * 1000000000;
            var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

            var txfee = await (21000 * gasprice) + 0.000019;
            var cv = await (balance - txfee).toFixed(10);

            var amountToSend = cv;

            var data = {
                gaspriceinwei: gaspriceinwei,
                gasprice: gasprice,
                txfee: txfee,
                cv: cv,
                amountToSend: amountToSend,
                speed: "medium"
            };

            return data;


        } else if (type == 'low') {
            var gaspriceinwei = low * 1000000000;
            var gasprice = await web3.utils.fromWei(gaspriceinwei.toString(), "ether");

            var txfee = await (21000 * gasprice) + 0.000019;
            var cv = await (balance - txfee).toFixed(10);

            var amountToSend = cv;

            var data = {
                gaspriceinwei: gaspriceinwei,
                gasprice: gasprice,
                txfee: txfee,
                cv: cv,
                amountToSend: amountToSend,
                speed: "low"
            };

            return data;
        }


    }





}

bot();