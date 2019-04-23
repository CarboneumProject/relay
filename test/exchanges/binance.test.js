require('chai').use(require('chai-as-promised')).should();
const binance = require('../../exchanges/binance');
const info = require('./binanceInfo');
const BigNumber = require('bignumber.js');
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

describe('binance', function () {
  it('should get price of all asset in USD', async function () {
    this.timeout(120000); // 2 minutes test
    let done = {};
    for (let sym of info.symbols) {
      if (!(sym.baseAsset in done)) { // Ignore tested pair
        let price = await binance.getPriceInUSD(sym.baseAsset);
        console.log(sym.baseAsset, price);
        price.should.not.equal(null);
        done[sym.baseAsset] = true;
      }
    }
  });

  it('should get price of C8 token', async function () {
    let c8Price = await binance.getC8LastPrice();
    const lowestPrice = new BigNumber(0.01);
    c8Price.should.be.bignumber.gte(lowestPrice);
  });
});
