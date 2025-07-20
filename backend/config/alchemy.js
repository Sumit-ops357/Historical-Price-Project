const { Alchemy, Network } = require('alchemy-sdk');

const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET, // or Network.ETH_GOERLI for testnet
};

const alchemy = new Alchemy(settings);

module.exports = alchemy; 