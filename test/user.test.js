const request = require('supertest');

const app = require('../app');

test('valid signature', async function (done) {
  const { body } = await request(app)
    .post('/user/register')
    .send({
      'address': '0x6E227565f2eF1Fc7B7eC333f42A33462C7838337',
      'signature': '0xe067655557ecea476a1265724709c0d654d619d4933eb1087e0990244f19f09061302784bb7dfd4a44b396aebc9a906cad36a8a7af901631f92f7f4b5814ab7e1c',// eslint-disable-line
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
