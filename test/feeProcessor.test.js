const BigNumber = require('bignumber.js');
const feeProcessor = require('../models/feeProcessor');
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const c8LastPrice = new BigNumber(0.1); // 0.1 USD

describe('feeProcessor', function () {
  it('should able to calculate fee for 1 order with same amount and price and no fee will paid', async function () {
    let openTrades = [
      {
        'id': 1,
        'orderTime': '2019-04-17 17:51:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.04700000',
        'amountTaker': '0.00149629',
        'amountLeft': '0.04700000',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        'cost': '7.77004000',
      },
    ];

    let closeTrade = {
      'id': 2,
      'orderTime': '2019-04-17 17:55:50',
      'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      'makerToken': 'ETH',
      'takerToken': 'BTC',
      'amountMaker': '0.04700000',
      'amountTaker': '0.00149629',
      'amountLeft': '0.04700000',
      'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
      'cost': '7.77004000',
    };

    let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
    rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber(0));
  });

  it('should able to calculate fee for 1 order with same amount and lower price and no fee will paid',
    async function () {
      let openTrades = [
        {
          'id': 1,
          'orderTime': '2019-04-17 17:51:50',
          'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
          'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
          'makerToken': 'ETH',
          'takerToken': 'BTC',
          'amountMaker': '0.04700000',
          'amountTaker': '0.00149629',
          'amountLeft': '0.04700000',
          'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          'cost': '7.77004000',
        },
      ];

      let closeTrade = {
        'id': 2,
        'orderTime': '2019-04-17 17:55:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.04700000',
        'amountTaker': '0.00149629',
        'amountLeft': '0.04700000',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        'cost': '7.6',
      };

      let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
      rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber(0));
    });

  it('should able to calculate fee for 1 order and sell for better price and will pay fee', async function () {
    let openTrades = [
      {
        'id': 1,
        'orderTime': '2019-04-17 17:51:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.04700000',
        'amountTaker': '0.00149629',
        'amountLeft': '0.04700000',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        'cost': '4.7',
      },
    ];

    let closeTrade = {
      'id': 2,
      'orderTime': '2019-04-17 17:55:50',
      'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      'makerToken': 'ETH',
      'takerToken': 'BTC',
      'amountMaker': '0.04700000',
      'amountTaker': '0.00149629',
      'amountLeft': '0.04700000',
      'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
      'cost': '9.4',
    };

    let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
    rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
    rewardAndFees.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
    rewardAndFees.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('4230000000000000000'));
    rewardAndFees.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('470000000000000000'));
    rewardAndFees.processedFees[0].orderHashes.should.be.same.members(
      [
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
    rewardAndFees.processedFees[0].orderID.should.be.equal(1);

    rewardAndFees.updateAmounts[0].amountLeft.should.be.bignumber.equal('0');
    rewardAndFees.updateAmounts[0].orderId.should.be.bignumber.equal(1);
  });

  it('should able to calculate fee for 1 order and sell 2 orders for better price and will pay fee', async function () {
    let openTrades = [
      {
        'id': 1,
        'orderTime': '2019-04-17 17:51:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.094',
        'amountTaker': '0.00149629',
        'amountLeft': '0.094',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        'cost': '9.4',
      },
    ];

    let closeTrade1 = {
      'id': 2,
      'orderTime': '2019-04-17 17:55:50',
      'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      'makerToken': 'ETH',
      'takerToken': 'BTC',
      'amountMaker': '0.04700000',
      'amountTaker': '0.00149629',
      'amountLeft': '0.04700000',
      'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
      'cost': '9.4',
    };

    let closeTrade2 = {
      'id': 3,
      'orderTime': '2019-04-17 17:55:50',
      'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      'makerToken': 'ETH',
      'takerToken': 'BTC',
      'amountMaker': '0.04700000',
      'amountTaker': '0.00149629',
      'amountLeft': '0.04700000',
      'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
      'cost': '9.4',
    };

    let rewardAndFees1 = await feeProcessor.percentageFee(openTrades, closeTrade1, c8LastPrice);
    rewardAndFees1.sumFee.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
    rewardAndFees1.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
    rewardAndFees1.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees1.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees1.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('4230000000000000000'));
    rewardAndFees1.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('470000000000000000'));
    rewardAndFees1.processedFees[0].orderHashes.should.be.same.members(
      [
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
    rewardAndFees1.processedFees[0].orderID.should.be.equal(1);

    rewardAndFees1.updateAmounts[0].amountLeft.should.be.equal('0.047000000000000000');
    rewardAndFees1.updateAmounts[0].orderId.should.be.bignumber.equal(1);

    openTrades[0].amountLeft = rewardAndFees1.updateAmounts[0].amountLeft;

    let rewardAndFees2 = await feeProcessor.percentageFee(openTrades, closeTrade2, c8LastPrice);
    rewardAndFees2.sumFee.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
    rewardAndFees2.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
    rewardAndFees2.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees2.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees2.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('4230000000000000000'));
    rewardAndFees2.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('470000000000000000'));
    rewardAndFees2.processedFees[0].orderHashes.should.be.same.members(
      [
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
    rewardAndFees2.processedFees[0].orderID.should.be.equal(1);

    rewardAndFees2.updateAmounts[0].amountLeft.should.be.bignumber.equal('0');
    rewardAndFees2.updateAmounts[0].orderId.should.be.bignumber.equal(1);
  });

  it('should able to calculate fee for 1 order then sell 1st order at cost and sell 2nd order for better price.',
    async function () {
      let openTrades = [
        {
          'id': 1,
          'orderTime': '2019-04-17 17:51:50',
          'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
          'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
          'makerToken': 'ETH',
          'takerToken': 'BTC',
          'amountMaker': '0.094',
          'amountTaker': '0.00149629',
          'amountLeft': '0.094',
          'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          'cost': '9.4',
        },
      ];

      let closeTrade1 = {
        'id': 2,
        'orderTime': '2019-04-17 17:55:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.04700000',
        'amountTaker': '0.00149629',
        'amountLeft': '0.04700000',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        'cost': '4.7',
      };

      let closeTrade2 = {
        'id': 3,
        'orderTime': '2019-04-17 17:55:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.04700000',
        'amountTaker': '0.00149629',
        'amountLeft': '0.04700000',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        'cost': '9.4',
      };

      let rewardAndFees1 = await feeProcessor.percentageFee(openTrades, closeTrade1, c8LastPrice);
      rewardAndFees1.sumFee.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees1.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees1.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
      rewardAndFees1.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
      rewardAndFees1.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees1.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees1.processedFees[0].orderHashes.should.be.same.members(
        [
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        ]);
      rewardAndFees1.processedFees[0].orderID.should.be.equal(1);

      rewardAndFees1.updateAmounts[0].amountLeft.should.be.equal('0.047000000000000000');
      rewardAndFees1.updateAmounts[0].orderId.should.be.bignumber.equal(1);

      openTrades[0].amountLeft = rewardAndFees1.updateAmounts[0].amountLeft;

      let rewardAndFees2 = await feeProcessor.percentageFee(openTrades, closeTrade2, c8LastPrice);
      rewardAndFees2.sumFee.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
      rewardAndFees2.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
      rewardAndFees2.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
      rewardAndFees2.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
      rewardAndFees2.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('4230000000000000000'));
      rewardAndFees2.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('470000000000000000'));
      rewardAndFees2.processedFees[0].orderHashes.should.be.same.members(
        [
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        ]);
      rewardAndFees2.processedFees[0].orderID.should.be.equal(1);

      rewardAndFees2.updateAmounts[0].amountLeft.should.be.bignumber.equal('0');
      rewardAndFees2.updateAmounts[0].orderId.should.be.bignumber.equal(1);
    });

  it('should able to calculate fee for 2 orders then sell 1 order for better price.', async function () {
    let openTrades = [
      {
        'id': 1,
        'orderTime': '2019-04-17 17:51:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.0235',
        'amountTaker': '0.00149629',
        'amountLeft': '0.0235',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        'cost': '2.35',
      },
      {
        'id': 2,
        'orderTime': '2019-04-17 17:51:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.0235',
        'amountTaker': '0.00149629',
        'amountLeft': '0.0235',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
        'cost': '2.35',
      },
    ];

    let closeTrade = {
      'id': 12,
      'orderTime': '2019-04-17 17:55:50',
      'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      'makerToken': 'ETH',
      'takerToken': 'BTC',
      'amountMaker': '0.04700000',
      'amountTaker': '0.00149629',
      'amountLeft': '0.04700000',
      'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
      'cost': '9.4',
    };

    let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
    rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber('4700000000000000000'));
    rewardAndFees.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('2350000000000000000'));
    rewardAndFees.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('2115000000000000000'));
    rewardAndFees.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('235000000000000000'));
    rewardAndFees.processedFees[0].orderHashes.should.be.same.members(
      [
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
    rewardAndFees.processedFees[0].orderID.should.be.equal(1);

    rewardAndFees.updateAmounts[0].amountLeft.should.be.bignumber.equal('0');
    rewardAndFees.updateAmounts[0].orderId.should.be.bignumber.equal(1);

    rewardAndFees.processedFees[1].C8FEE.should.be.bignumber.equal(new BigNumber('2350000000000000000'));
    rewardAndFees.processedFees[1].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees.processedFees[1].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees.processedFees[1].reward.should.be.bignumber.equal(new BigNumber('2115000000000000000'));
    rewardAndFees.processedFees[1].relayFee.should.be.bignumber.equal(new BigNumber('235000000000000000'));
    rewardAndFees.processedFees[1].orderHashes.should.be.same.members(
      [
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
    rewardAndFees.processedFees[1].orderID.should.be.equal(2);

    rewardAndFees.updateAmounts[1].amountLeft.should.be.bignumber.equal('0');
    rewardAndFees.updateAmounts[1].orderId.should.be.bignumber.equal(2);
  });

  it('should able to calculate fee for 2 orders then sell 2 order same price and no fee', async function () {
    let openTrades = [
      {
        'id': 1,
        'orderTime': '2019-04-17 17:51:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.0235',
        'amountTaker': '0.00149629',
        'amountLeft': '0.0235',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        'cost': '2.35',
      },
      {
        'id': 2,
        'orderTime': '2019-04-17 17:51:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.0235',
        'amountTaker': '0.00149629',
        'amountLeft': '0.0235',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
        'cost': '2.35',
      },
    ];

    let closeTrade = {
      'id': 12,
      'orderTime': '2019-04-17 17:55:50',
      'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      'makerToken': 'ETH',
      'takerToken': 'BTC',
      'amountMaker': '0.04700000',
      'amountTaker': '0.00149629',
      'amountLeft': '0.04700000',
      'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
      'cost': '4.7',
    };

    let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
    rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber('0'));
    rewardAndFees.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('0'));
    rewardAndFees.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('0'));
    rewardAndFees.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('0'));
    rewardAndFees.processedFees[0].orderHashes.should.be.same.members(
      [
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
    rewardAndFees.processedFees[0].orderID.should.be.equal(1);

    rewardAndFees.updateAmounts[0].amountLeft.should.be.bignumber.equal('0');
    rewardAndFees.updateAmounts[0].orderId.should.be.bignumber.equal(1);

    rewardAndFees.processedFees[1].C8FEE.should.be.bignumber.equal(new BigNumber('0'));
    rewardAndFees.processedFees[1].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees.processedFees[1].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees.processedFees[1].reward.should.be.bignumber.equal(new BigNumber('0'));
    rewardAndFees.processedFees[1].relayFee.should.be.bignumber.equal(new BigNumber('0'));
    rewardAndFees.processedFees[1].orderHashes.should.be.same.members(
      [
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
    rewardAndFees.processedFees[1].orderID.should.be.equal(2);

    rewardAndFees.updateAmounts[1].amountLeft.should.be.bignumber.equal('0');
    rewardAndFees.updateAmounts[1].orderId.should.be.bignumber.equal(2);
  });

  it('should able to calculate fee for 2 orders different price then sell 1 order for better price.',
    async function () {
      let openTrades = [
        {
          'id': 1,
          'orderTime': '2019-04-17 17:51:50',
          'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
          'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
          'makerToken': 'ETH',
          'takerToken': 'BTC',
          'amountMaker': '0.0235',
          'amountTaker': '0.00149629',
          'amountLeft': '0.0235',
          'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          'cost': '4.7',
        },
        {
          'id': 2,
          'orderTime': '2019-04-17 17:51:50',
          'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
          'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
          'makerToken': 'ETH',
          'takerToken': 'BTC',
          'amountMaker': '0.0235',
          'amountTaker': '0.00149629',
          'amountLeft': '0.0235',
          'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
          'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
          'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
          'cost': '1.175',
        },
      ];

      let closeTrade = {
        'id': 12,
        'orderTime': '2019-04-17 17:55:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.04700000',
        'amountTaker': '0.00149629',
        'amountLeft': '0.04700000',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        'cost': '4.7',
      };

      let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
      rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber('1175000000000000000'));
      rewardAndFees.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
      rewardAndFees.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
      rewardAndFees.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees.processedFees[0].orderHashes.should.be.same.members(
        [
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        ]);
      rewardAndFees.processedFees[0].orderID.should.be.equal(1);

      rewardAndFees.updateAmounts[0].amountLeft.should.be.bignumber.equal('0');
      rewardAndFees.updateAmounts[0].orderId.should.be.bignumber.equal(1);

      rewardAndFees.processedFees[1].C8FEE.should.be.bignumber.equal(new BigNumber('1175000000000000000'));
      rewardAndFees.processedFees[1].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
      rewardAndFees.processedFees[1].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
      rewardAndFees.processedFees[1].reward.should.be.bignumber.equal(new BigNumber('1057500000000000000'));
      rewardAndFees.processedFees[1].relayFee.should.be.bignumber.equal(new BigNumber('117500000000000000'));
      rewardAndFees.processedFees[1].orderHashes.should.be.same.members(
        [
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        ]);
      rewardAndFees.processedFees[1].orderID.should.be.equal(2);

      rewardAndFees.updateAmounts[1].amountLeft.should.be.bignumber.equal('0');
      rewardAndFees.updateAmounts[1].orderId.should.be.bignumber.equal(2);
    });

  it('should able to calculate fee for 2 orders different price and amount then sell 1 order for better price.',
    async function () {
      let openTrades = [
        {
          'id': 1,
          'orderTime': '2019-04-17 17:51:50',
          'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
          'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
          'makerToken': 'ETH',
          'takerToken': 'BTC',
          'amountMaker': '0.0235',
          'amountTaker': '0.00149629',
          'amountLeft': '0.0235',
          'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          'cost': '4.7',
        },
        {
          'id': 2,
          'orderTime': '2019-04-17 17:51:50',
          'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
          'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
          'makerToken': 'ETH',
          'takerToken': 'BTC',
          'amountMaker': '0.047',
          'amountTaker': '0.00149629',
          'amountLeft': '0.047',
          'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
          'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
          'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
          'cost': '2.35',
        },
      ];

      let closeTrade = {
        'id': 12,
        'orderTime': '2019-04-17 17:55:50',
        'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
        'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
        'makerToken': 'ETH',
        'takerToken': 'BTC',
        'amountMaker': '0.04700000',
        'amountTaker': '0.00149629',
        'amountLeft': '0.04700000',
        'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        'cost': '4.7',
      };

      let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
      rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber('1175000000000000000'));
      rewardAndFees.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
      rewardAndFees.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
      rewardAndFees.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('0'));
      rewardAndFees.processedFees[0].orderHashes.should.be.same.members(
        [
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279739',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279750',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        ]);
      rewardAndFees.processedFees[0].orderID.should.be.equal(1);

      rewardAndFees.updateAmounts[0].amountLeft.should.be.bignumber.equal('0');
      rewardAndFees.updateAmounts[0].orderId.should.be.bignumber.equal(1);

      rewardAndFees.processedFees[1].C8FEE.should.be.bignumber.equal(new BigNumber('1175000000000000000'));
      rewardAndFees.processedFees[1].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
      rewardAndFees.processedFees[1].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
      rewardAndFees.processedFees[1].reward.should.be.bignumber.equal(new BigNumber('1057500000000000000'));
      rewardAndFees.processedFees[1].relayFee.should.be.bignumber.equal(new BigNumber('117500000000000000'));
      rewardAndFees.processedFees[1].orderHashes.should.be.same.members(
        [
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279749',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279760',
          '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
        ]);
      rewardAndFees.processedFees[1].orderID.should.be.equal(2);

      rewardAndFees.updateAmounts[1].amountLeft.should.be.bignumber.equal('0.0235');
      rewardAndFees.updateAmounts[1].orderId.should.be.bignumber.equal(2);
    });

  it('should able to calculate fee with no open order at fixed fee.', async function () {
    let openTrades = [];

    let closeTrade = {
      'id': 12,
      'orderTime': '2019-04-17 17:55:50',
      'leader': '0x919cbf1468b535e517e2dc75adc224cbca9e6e2f',
      'follower': '0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a',
      'makerToken': 'ETH',
      'takerToken': 'BTC',
      'amountMaker': '0.04700000',
      'amountTaker': '0.00149629',
      'amountLeft': '0.04700000',
      'orderHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'txHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      'leaderTxHash': '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
      'cost': '4.7',
    };

    let rewardAndFees = await feeProcessor.percentageFee(openTrades, closeTrade, c8LastPrice);
    rewardAndFees.sumFee.should.be.bignumber.equal(new BigNumber('8000000000000000000'));
    rewardAndFees.processedFees[0].C8FEE.should.be.bignumber.equal(new BigNumber('8000000000000000000'));
    rewardAndFees.processedFees[0].leader.should.be.equal('0x919cbf1468b535e517e2dc75adc224cbca9e6e2f');
    rewardAndFees.processedFees[0].follower.should.be.equal('0xfb38e6973c2d6b33ca0d8d2d10107fa13def920a');
    rewardAndFees.processedFees[0].reward.should.be.bignumber.equal(new BigNumber('4000000000000000000'));
    rewardAndFees.processedFees[0].relayFee.should.be.bignumber.equal(new BigNumber('4000000000000000000'));
    rewardAndFees.processedFees[0].orderHashes.should.be.same.members(
      [
        '0x',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279752',
        '0x',
        '0x0000000000000000000000000000000000b17a7ce00000000000000329279751',
      ]);
  });
});
