const networks = {
  rinkeby: {
    name: 'rinkeby',
    wsUrl: 'wss://rinkeby.infura.io/ws',
    socialtrading: '0x7f47ab9202d059b8c906118b2c1824fcc7af4326',
    REWARD: '4000000000000000000',
    FEE: '4000000000000000000',
    LEADER_REWARD_PERCENT: 0.9,
    SYSTEM_FEE_PERCENT: 0.1,
    PROFIT_PERCENTAGE: 0.1,
    carboneum: '0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d',
    chainId: 4,
    redisDB: 3,
  },

  kovan: {
    name: 'kovan',
    wsUrl: 'wss://kovan.infura.io/ws',
    socialtrading: '0xd598AC2393Ea26a9b1AA391ba8c4b55F77C278D0',
    REWARD: '4000000000000000000',
    FEE: '4000000000000000000',
    LEADER_REWARD_PERCENT: 0.9,
    SYSTEM_FEE_PERCENT: 0.1,
    PROFIT_PERCENTAGE: 0.1,
    carboneum: '0x1347d3e87f3335c1e5146cff3020cb86a3c93292',
    chainId: 42,
    redisDB: 2,
  },

  mainnet: {
    name: 'mainnet',
    wsUrl: 'ws://event-eth.stockradars.co:8546',
    socialtrading: '0x8e21b2c846ec9d3ccbb170f2c4053b419a680ea1',
    zxExchange: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
    REWARD: '4000000000000000000',
    FEE: '4000000000000000000',
    LEADER_REWARD_PERCENT: 0.9,
    SYSTEM_FEE_PERCENT: 0.1,
    PROFIT_PERCENTAGE: 0.1,
    carboneum: '0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d',
    chainId: 1,
    redisDB: 1,
  },
};

function getNetwork (network) {
  return networks[process.env.NETWORK || network || 'mainnet'];
}

module.exports = {
  getNetwork: getNetwork,
  mnemonic: process.env.MNEMONIC || '', // Your relay mnemonic
};
