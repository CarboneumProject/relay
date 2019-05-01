require('chai').use(require('chai-as-promised')).should();
const BinanceDEX = require('../../exchanges/binanceDEX');
const BigNumber = require('bignumber.js');
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

describe('BinanceDEX', function () {
  it('should get price of C8 token', async function () {
    let c8Price = await BinanceDEX.getC8LastPrice();
    const lowestPrice = new BigNumber(0.01);
    c8Price.should.be.bignumber.gte(lowestPrice);
  });

  it('should get price of C8 token', async function () {
    let c8Price = await BinanceDEX.getC8LastPrice();
    const lowestPrice = new BigNumber(0.01);
    c8Price.should.be.bignumber.gte(lowestPrice);
  });

  it('should get asset pair from symbol', async function () {
    let { asset, base, precision } = await BinanceDEX.getAssetsBySymbol('TCAN-014_BNB');
    asset.should.be.eq('TCAN-014');
    base.should.be.eq('BNB');
    precision.should.be.eq(8);
  });

  it('should get user balance', async function () {
    let apiKey = 'bnb1jxfh2g85q3v0tdq56fnevx6xcxtcnhtsmcu64m';
    let apiSecret = 'NO_NEED';
    let balance = await BinanceDEX.balance(apiKey, apiSecret);
    balance.BNB.available.should.be.bignumber.gte(1.0);
    balance.BNB.onOrder.should.be.bignumber.gte(0.0);
    balance.BNB.frozen.should.be.bignumber.gte(0.0);
    balance.BNB.valueUSD.should.be.bignumber.gte(1.0);

    balance['MITH-C76'].available.should.be.bignumber.gte(1.0);
    balance['MITH-C76'].onOrder.should.be.bignumber.gte(0.0);
    balance['MITH-C76'].frozen.should.be.bignumber.gte(0.0);
    balance['MITH-C76'].valueUSD.should.be.bignumber.gte(1.0);
  }, 5000);

  it('should get user getPriceInUSD', async function () {
    let price = await BinanceDEX.getPriceInUSD('MITH-C76');
    price.should.be.gte(0.001);
  });
});
