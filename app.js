require('dotenv').config();
const db = require('./db-conn');
const opts = {
  errorEventName: 'info',
  logDirectory: './log',
  fileNamePattern: '<DATE>.log',
  dateFormat: 'YYYY.MM.DD',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss'
};
const logger = require('simple-node-logger').createRollingFileLogger(opts);
const CronJob = require('cron').CronJob;
const snoowrap = require('snoowrap');
const { Telegraf } = require('telegraf');
const urlParser = require('url');
const { Client } = require('@rmp135/imgur');
const request = require("request-promise");
const imgur = new Client(process.env.IMGUR_CLIENT_ID);
const tgBot = new Telegraf(process.env.TG_BOT_TOKEN);
const tgChannel = process.env.TG_CHANNEL;
const totalChannels = process.env.TOTAL_CHANNELS;
const dbTable = process.env.DB_TABLE;
const maxGifSize = 10000000;

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
    await sleep(2750).then(() => {
      if (post.score > minScore) {

        let postId = post.subreddit_id + post.id;
        let postData = {};
        postData.title = post.title;
        postData.karma = post.score;
        postData.subReddit = post.subreddit_name_prefixed;
        postData.tag = subreddit;
        postData.url = post.url;
        postData.link = `https://redd.it/${post.id}`;

        let url = postData.url;
        checkIfAlreadySent(postId).then((result) => {
          if (result.length === 0) {
            logger.info(`[PROCESSING] ${JSON.stringify(postData)}`);
            insertPostId(postId);

            request.get(url).on('response', (res) => {
              let urlContent = res.headers['content-type'];
              if ("image/jpeg" === urlContent || "image/png" === urlContent) {
                sendToTelegram(tgChannel, postData, false);
              } else if ("image/gif" === urlContent && res.headers['content-length'] < maxGifSize) {
                sendToTelegram(tgChannel, postData, true);
              }
            });

            if (url.endsWith(".gifv")) {
              let gifUrl = url.slice(0, -1);
              request.get(gifUrl).on('response', (res) => {
                let gifUrlContentType = res.headers['content-type'];
                let gifSize = res.headers['content-length'];
                if ("image/gif" === gifUrlContentType && gifSize && gifSize < maxGifSize) {
                  sendToTelegram(tgChannel, postData, true);
                }
              });
            }

          }
        });
      }
    }).catch((e) => {
      logger.error("Error processing post", e);
    });
  }
  return Promise.resolve();
}


function main() {
  logger.info('Started');
  for (let i = 0; i < totalChannels; i++) {
    let subreddit = process.env[`CHANNEL${i}_SUB`];
    let time = process.env[`CHANNEL${i}_TIME`];
    let type = process.env[`CHANNEL${i}_TYPE`];
    let minScore = process.env[`CHANNEL${i}_MIN_SCORE`];
    let cron = process.env[`CHANNEL${i}_CRON`];

    let options = { subreddit, time, type, minScore };

    let job = new CronJob(cron, function () {
      logger.info(process.env[`CHANNEL${i}_SUB`] + " job started");
      fetchPosts(options);
    }, null, true, 'Europe/Madrid').start();
  }
}


function sendToTelegram(tgChannel, postData, isGif) {
  let caption = { caption: `<b>${postData.title}</b>\nvia ${postData.subReddit} #${postData.tag}\n${postData.link}\n\nby ${tgChannel}`, parse_mode: "HTML" };
  if (isGif) {
    tgBot.telegram.sendAnimation(tgChannel, postData.url, caption)
  } else {
    tgBot.telegram.sendPhoto(tgChannel, postData.url, caption);
  }
}

function checkIfAlreadySent(postId) {
  return new Promise(function (resolve, reject) {
    let sql = "SELECT post_id FROM " + dbTable + " WHERE post_id='" + postId + "';"
    db.query(sql, function (err, rows) {
      if (err) {
        logger.error(err);
      }
      if (rows === undefined) {
        reject(new Error("Error rows is undefined"));
      } else {
        resolve(rows);
      }
    });
  });
}

function insertPostId(postId) {
  return new Promise(function (resolve, reject) {
    let sql = "INSERT INTO " + dbTable + " (post_id) VALUES ('" + postId + "')";
    db.query(sql, function (err, rows) {
      if (rows === undefined) {
        logger.error(err);
        reject(new Error(err));
      } else {
        resolve(rows);
      }
    });
  });
}

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
