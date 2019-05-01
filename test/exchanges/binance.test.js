require('chai').use(require('chai-as-promised')).should();
const rp = require('request-promise');
const binance = require('../../exchanges/binance');
const BigNumber = require('bignumber.js');
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

describe('binance', function () {
  it('should get price of all asset in USD', async function () {
    let symbols = ['BNB', 'ETH', 'BCHABC', 'XRP', 'MATIC', 'LTC'];
    let done = {};
    for (let sym of symbols) {
      if (!(sym in done)) { // Ignore tested pair
        let price = await binance.getPriceInUSD(sym);
        console.log(sym, price);
        price.should.not.equal(null);
        done[sym] = true;
      }
    }
  }, 120000);

  it('should get price of C8 token', async function () {
    let c8Price = await binance.getC8LastPrice();
    const lowestPrice = new BigNumber(0.01);
    c8Price.should.be.bignumber.gte(lowestPrice);
  });

  it('should get asset pair from symbol', async function () {
    let { asset, base, precision } = await binance.getAssetsBySymbol('ARDRBTC');
    asset.should.be.eq('ARDR');
    base.should.be.eq('BTC');
    precision.should.be.eq(8);
  });
});
