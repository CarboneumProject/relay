const request = require('supertest');

const app = require('../app');

test('valid signature', async function (done) {
  const { body } = await request(app)
    .post('/user/register')
    .send({
      'address': '0x919CBF1468B535e517e2dc75ADc224Cbca9e6e2f',
      'signature': '0x1669f466991ec08133c91a8b472a5674b78cec0a316d69a085362eea4f34da956d7168b9430d91050fb4ed4035c45805806d4932d222a3debe07bf08ce7acab31c',// eslint-disable-line
      'exchange': 'binance',
      'apiKey': 'qBSKuq5gXRdsY6LTdR1YwUuyHg4V2EpFDsJDK9jMU3c4dLYFFMieW0uA7r3Wp2231',
      'apiSecret': 'kVfVwQyCpWE79vRmfnCGeDwfFINNKRO2epMMywhsMZVSlJIksc83IVw4rGIu231',
      'type': 'leader',
    })
    .set('Accept', 'application/json')
    .expect(200);

  expect(body).toHaveProperty('status');
  expect(body).toEqual({
    'status': 'ok',
  });
  return await done();// eslint-disable-line
});

test('error invalid signature', async function (done) {
  const { body } = await request(app)
    .post('/user/register')
    .send({
      'address': '0x919CBF1468B535e517e2dc75ADc224Cbca9e6e2f',
      'signature': '0x629b4988efad3ba12474cbc61245b2ba16faa76181773a4e8ea30549c8c89a2b2ed5b2d5bfd6d4a2fc9e90eccd05bbcb615268239b7a0feb4a62cd97b8b813651b',// eslint-disable-line
      'exchange': 'binance',
      'apiKey': 'qBSKuq5gXRdsY6LTdR1YwUuyHg4V2EpFDsJDK9jMU3c4dLYFFMieW0uA7r3Wp2231',
      'apiSecret': 'kVfVwQyCpWE79vRmfnCGeDwfFINNKRO2epMMywhsMZVSlJIksc83IVw4rGIu231',
      'type': 'leader',
    })
    .set('Accept', 'application/json')
    .expect(400);

  expect(body).toEqual({
    'status': 'no',
    'message': 'Invalid signature.',
  });

  return await done();// eslint-disable-line
});
