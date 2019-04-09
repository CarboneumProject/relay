require('chai').use(require('chai-as-promised')).should();
const crypt = require('../models/crypt');

describe('crpyto', function () {
  it('should encrypt and decrypt a text', async function () {
    const myText = 'zKHzmWFJYoLDrZAYZmzZA055mJrMzISqrEKe01VAPA1H1blIUNlbArlmln0DZ1HK';
    let encHex = crypt.encrypt(myText);
    let decrypted = crypt.decrypt(encHex);
    decrypted.should.be.equal(myText);
  });
});
