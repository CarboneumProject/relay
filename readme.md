# Carboneum Relay
Trade execution relay for Carboneum social trading on traditional exchange.
## Features
 - Register/update user Ethereum wallet for receive reward. 
 - Relay trade execution from user to followers trade.

## Get Started
 
 - `npm install`
 - Create mysql database from `schema.sql`
 - Set your system environment variables like this
```
NETWORK=rinkeby
DB_HOST=localhost
DB_USER=MYUSER
DB_PASSWORD=PASSWORD123
DB_PORT=3306
PORT=3080
RPC_URL=https://rinkeby.infura.io/v3/96bfc78effaa4a32bf99ce0dd4453132
MNEMONIC='your seed word for relay account to recieve fee and interact contract'
```
- Run user register service using `node ./bin/www`
- Run copy trade engine using `node processor.js`
