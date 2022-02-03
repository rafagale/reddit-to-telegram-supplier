require('dotenv').config();
const db = require('./db-conn');
const logger = require('simple-node-logger').createSimpleLogger('purple.log');
const CronJob = require('cron').CronJob;
const snoowrap = require('snoowrap');
const { Telegraf } = require('telegraf')
const tgBot = new Telegraf(process.env.TG_BOT_TOKEN);
const tgChannel = process.env.TG_CHANNEL;
const totalChannels = process.env.TOTAL_CHANNELS;

const r = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USER_USERNAME,
  password: process.env.REDDIT_USER_PASSWORD
});

main();

async function fetchPosts(options) {
  let { subreddit, after = null, type, time, minScore } = options;
  let posts = await (r.getSubreddit(subreddit)[`get${type}`]({ time, after }));
  posts = posts.sort((a, b) => b.score - a.score);

  for (let post of posts) {
    if (post.score > minScore) {
      let postId = post.subreddit_id + post.id;
      //Check the postId in db to check if it's already sent
      //TODO: Title, media download flow
      let text = `${post.title} (${post.score} karma) https://redd.it/${post.id} ${post.url}`;
      await sleep(5000).then(() => {
        tgBot.telegram.sendMessage(tgChannel, text).then(console.log(text)).then(() => {
          console.log("Sent to telegram");
        });
      });
    }
  }
  return Promise.resolve();
}

function main() {
  logger.info('Started.');
  for (let i = 0; i < totalChannels; i++) {
    let subreddit = process.env[`CHANNEL${i}_SUB`];
    let time = process.env[`CHANNEL${i}_TIME`];
    let type = process.env[`CHANNEL${i}_TYPE`];
    let minScore = process.env[`CHANNEL${i}_MIN_SCORE`];
    let cron = process.env[`CHANNEL${i}_CRON`];

    let options = { subreddit, time, type, minScore };

    let job = new CronJob(cron, function () {
      logger.info(process.env[`CHANNEL${i}_SUB`] + " job started");
      fetchPosts(Object.assign({}, options));
    }, null, true, 'Europe/Madrid').start();
  }
}

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}