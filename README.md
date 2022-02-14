# reddit-to-telegram-supplier
 Reddit to Telegram content supplier

 <p align="center">
  <img src="https://raw.githubusercontent.com/rafagale/reddit-to-telegram-supplier/develop/logo.png?token=GHSAT0AAAAAABRQ7GLDUKE7PFXZPUMPWVJWYQKRUIA" width="300px" alt="Reddit to Telegram content supplier" />


## Usage
1. Install [Node.js](https://nodejs.org/), Run `npm install`
2. Create a "Script" at https://www.reddit.com/prefs/apps/
3. Get your Bot token at Telegram master bot aka @BotFather
4. Enter your reddit username, password and tokens in `.env`
5. Add channel configs in `.env` with parameters listed in [Config](#config)
6. Run `npm start` to start the bot

## Config
Example sub config file 
```
TOTAL_CHANNELS=2

CHANNEL0_SUB=dankmemes
CHANNEL0_TIME=day #hour/day/week/month/year
CHANNEL0_TYPE=Top #New/Hot/Rising/Controversial/Top
CHANNEL0_MIN_SCORE=35000
CHANNEL0_CRON=00 00 8-23 * * * #At minute 0 past every hour from 8 through 23.

CHANNEL1_SUB=memes
CHANNEL1_TIME=day
CHANNEL1_TYPE=Top
CHANNEL1_MIN_SCORE=50000
CHANNEL1_CRON=00 00 08 * * * #At 08:00


## License

[MIT](https://github.com/pnpm/pnpm/blob/master/LICENSE)
