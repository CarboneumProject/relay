# Carboneum Relay
Trade execution relay for Carboneum social trading on traditional exchange.
## Features
 - Register/update user Ethereum wallet for receive reward. 
 - Relay trade execution from user to followers trade.

## Get Started
 
 - `npm install`
 - Create Firebase project and get Firebase Cloud Messaging credential file, name it `firebase.json`
 - Create mysql database from `schema.sql`
 - Set your system environment variables like this
```
NETWORK=rinkeby
DB_HOST=localhost
DB_USER=MYUSER
DB_PASSWORD=PASSWORD123
DB_PORT=3306
PORT=3003
RPC_URL=https://rinkeby.infura.io/v3/96bfc78effaa4a32bf99ce0dd4453132
MNEMONIC='your seed word for relay account to recieve fee and interact contract'
```
- Make sure your wallet address from mnenonic is registered to smart contract.
Please contact support@carboneum.io to become a relay.
- Run `node relayRunOnce.js` to scan following on social trading smart contract for only first time.
- Run `node relay.js` to listen follow/unfollow event from  social trading smart contract.
- Run copy trade engine using `node processor.js`
- Run user register service using `node ./bin/www` and test it using curl like this:
```bash
curl --request POST \
  --url https://localhost:3003/user/register \
  --header 'content-type: application/json' \
  --data '{
	"address": "0xfB38E6973C2D6b33CA0d8D2D10107fa13Def920A",
	"signature": "0x999b4988efad3ba12474cbc61245b2ba16faa76181773a4e8ea30549c8c89a2b2ed5b2d5bfd6d4a2fc9e90eccd05bbcb615268239b7a0feb4a62cd97b8b813651",
	"exchange": "binance",
	"apiKey": "qBSKuq5gXRdsY6LTdR1YwUuyHg4V2EpFDsJDK9jMU3c4dLYFFMieW0uA7r3WpXg4",
	"apiSecret": "kVfVwQyCpWE79vRmfnCGeDwfFINNKRO2epMMywhsMZVSlJIksc83IVw4rGIuUQsp"
}'
```
To verify address the `signature` is personal sign using code like this.
```javascript
web3.personal.sign(web3.fromUtf8("Sign into carboneum"), web3.currentProvider.selectedAddress, console.log);
```
