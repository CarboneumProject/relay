require('chai').use(require('chai-as-promised')).should();
const socialTradingContract = require('../models/socialTradingContract');
const BigNumber = require('bignumber.js');

describe('Distribute reward', function () {
  it('it should able to distribute reward once', async function () {
    let processedFees = [{
      C8FEE: new BigNumber('8000000000000000000'),
      leader: '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      follower: '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      reward: '4000000000000000000',
      relayFee: '4000000000000000000',
      orderHashes: [
        '0x',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ],
    }];
    await socialTradingContract.distributeRewardAll(processedFees);
  }, 120000);
});
