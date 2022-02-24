# reddit-to-telegram-supplier
## Reddit to Telegram content supplier

> Send reddit content from multiple subreddits to telegram channels

<p align="center">
  <img src="https://raw.githubusercontent.com/rafagale/reddit-to-telegram-supplier/develop/logo.png?token=GHSAT0AAAAAABRQ7GLDUKE7PFXZPUMPWVJWYQKRUIA" width="300px" alt="Reddit to Telegram content supplier" />

## Installation
1. Install [Node.js](https://nodejs.org/) 
2. Install [MariaDB](https://mariadb.org/download/), create a database named `reddit_db ` and run the script to create reddit table 
3. Clone this repository `git clone https://github.com/rafagale/reddit-to-telegram-supplier`
4. Navigate to the new `reddit-to-telegram-supplier` folder and and run `npm install` to install all dependencies
5. Create a "script" at https://www.reddit.com/prefs/apps/
6. Get your bot token at Telegram master bot aka @BotFather
7. Enter your reddit username, password and tokens in `.env`
8. Add channel configs in `.env` with parameters listed in [Config](#config)

    
## Usage
Run `npm start` to start the bot. Ideally you may use `pm2`, `forever` or any other process manager to keep the bot alive

## Config
Example `.env` config file:
```
#Reddit data
REDDIT_USER_AGENT=unique user agent for reddit (by /u/redditUser)
REDDIT_CLIENT_ID=reddit client id
REDDIT_CLIENT_SECRET=reddit client secret
REDDIT_USER_USERNAME=redditUser
REDDIT_USER_PASSWORD=strongPassword

#Telegram data
TG_BOT_TOKEN=Your telegram bot token
TG_CHANNEL=@your_channel

#Db data
DB_HOST=localhost
DB_USER=scott
DB_PASSWORD=tiger
DB_DATABASE=reddit_db
DB_TABLE=reddit_post_history

#Subreddit data
TOTAL_CHANNELS=2

CHANNEL0_SUB=dankmemes
CHANNEL0_TIME=day #hour/day/week/month/year
CHANNEL0_TYPE=Top #New/Hot/Rising/Controversial/Top
CHANNEL0_MIN_SCORE=35000
CHANNEL0_CRON=00 00 8-23 * * * #At minute 0 past every hour from 8 through 23

CHANNEL1_SUB=memes
CHANNEL1_TIME=day
CHANNEL1_TYPE=Top
CHANNEL1_MIN_SCORE=50000
CHANNEL1_CRON=00 00 08 * * * #At 08:00

```

## TODO List

- [ ] Insert some more data in the db as currently only prevents sending duplicate posts
- [ ] Add short videos
- [x] Travel to Mars


## License

[MIT](https://github.com/pnpm/pnpm/blob/master/LICENSE)