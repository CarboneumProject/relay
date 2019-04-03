const admin = require('firebase-admin');
const serviceAccount = require('../firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const push = {};

push.sendAdjustC8Allowance = function sendAdjustC8Allowance (target, msg) {
  let follower = target.toLowerCase();
  let message = {
    data: {
      destination: 'menuportfolio',
      id: follower,
      _msg: msg,
    },
    notification: {
      title: 'Increase Allowance of C8',
      body: msg,
    },
    android: {
      ttl: 3600 * 1000, // 1 hour in milliseconds
      priority: 'high',
      notification: {
        title: 'Increase Allowance of C8',
        body: msg,
      },
    },
    apns: {
      headers: {
        'apns-priority': '5',
      },
      payload: {
        aps: {
          alert: {
            title: 'Increase Allowance of C8',
            body: msg,
          },
        },
      },
    },
    topic: 'copytrade_' + follower,
  };

  // Transfer out
  admin.messaging().send(message).then((response) => {
    // Response is a message ID string.
  }).catch((error) => {
    console.log('Error sending message:', error);
  });
};

push.sendInsufficientFund = function sendInsufficientFund (tokenBuy, tokenSell, leader, target, txHash, msg) {
  let follower = target.toLowerCase();
  let message = {
    data: {
      destination: 'menuportfolio',
      id: leader,
      _tokenBuy: tokenBuy,
      _tokenSell: tokenSell,
      _leader: leader,
      _txHash: txHash,
      _msg: msg,
    },
    notification: {
      title: 'Copytrading failed : Insufficient Fund',
      body: msg,
    },
    android: {
      ttl: 3600 * 1000, // 1 hour in milliseconds
      priority: 'high',
      notification: {
        title: 'Copytrading failed : Insufficient Fund',
        body: msg,
      },
    },
    apns: {
      headers: {
        'apns-priority': '5',
      },
      payload: {
        aps: {
          alert: {
            title: 'Copytrading failed : Insufficient Fund',
            body: msg,
          },
        },
      },
    },
    topic: 'copytrade_' + follower,
  };

  // Transfer out
  admin.messaging().send(message).then((response) => {
    // Response is a message ID string.
  }).catch((error) => {
    console.log('Error sending message:', error);
  });
};

push.sendTradeNotification = function sendTradeNotification (
  tokenBuy, tokenSell, amountBuy, amountSell, leader, target, msg,
) {
  let follower = target.toLowerCase();
  let message = {
    data: {
      destination: 'menuportfolio',
      id: leader,
      _tokenBuy: tokenBuy,
      _tokenSell: tokenSell,
      _amountBuy: amountBuy,
      _amountSell: amountSell,
      _leader: leader,
      _follower: follower,
      _msg: msg,
    },
    notification: {
      title: 'Copy Trading Complete!',
      body: msg,
    },
    android: {
      ttl: 3600 * 1000, // 1 hour in milliseconds
      priority: 'high',
      notification: {
        title: 'Copy Trading Complete!',
        body: msg,
      },
    },
    apns: {
      headers: {
        'apns-priority': '5',
      },
      payload: {
        aps: {
          alert: {
            title: 'Copy Trading Complete!',
            body: msg,
          },
        },
      },
    },
    topic: 'copytrade_' + follower,
  };

  // Transfer out
  admin.messaging().send(message).then((response) => {
    // Response is a message ID string.
  }).catch((error) => {
    console.log('Error sending message:', error);
  });
};

push.sendMsgToUser = function sendRawMsg (target, title, msg) {
  let walletAddress = target.toLowerCase();
  let message = {
    data: {
      destination: 'menuportfolio',
      id: walletAddress,
      _msg: msg,
    },
    notification: {
      title: title,
      body: msg,
    },
    android: {
      ttl: 3600 * 1000, // 1 hour in milliseconds
      priority: 'high',
      notification: {
        title: title,
        body: msg,
      },
    },
    apns: {
      headers: {
        'apns-priority': '5',
      },
      payload: {
        aps: {
          alert: {
            title: title,
            body: msg,
          },
        },
      },
    },
    topic: 'copytrade_' + walletAddress,
  };

  // Transfer out
  admin.messaging().send(message).then((response) => {
    // Response is a message ID string.
  }).catch((error) => {
    console.log('Error sending message:', error);
  });
};

push.turnOff = () => {
  admin.app().delete();
};

module.exports = push;
