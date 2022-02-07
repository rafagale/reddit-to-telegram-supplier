require('dotenv').config();
const db = require('./db-conn');
const logger = require('simple-node-logger').createSimpleLogger('purple.log');
const CronJob = require('cron').CronJob;
const snoowrap = require('snoowrap');
const { Telegraf } = require('telegraf');
const urlParser = require('url');
const { Client } = require('@rmp135/imgur');
const imgur = new Client(process.env.IMGUR_CLIENT_ID);
const request = require("request-promise");
const tgBot = new Telegraf(process.env.TG_BOT_TOKEN);
const tgChannel = process.env.TG_CHANNEL;
const totalChannels = process.env.TOTAL_CHANNELS;
const dbTable = process.env.DB_TABLE;


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
    await sleep(5000).then(() => {
      if (post.score > minScore) {
        let postId = post.subreddit_id + post.id;
        let title = `${post.title} (${post.score} karma)`;
        logger.info(title);
        let url = post.url;
        checkIfAlreadySent(postId).then((result) => {
          if (result.length === 0) {
            insertPostId(postId);
            //TODO: Comprobar el id en bbdd y refactorizar esta lógica
            request.get(url).on('response', (res) => {
              let urlContent = res.headers['content-type'];
              if ("image/jpeg" === urlContent || "image/png" === urlContent) {
                sendToTelegram(tgChannel, url, false);
              }
              //Avoid shit made gifs
              if ("image/gif" === urlContent && res.headers['content-length'] < 10000000) { //TODO: Check size in all request
                sendToTelegram(tgChannel, url, true);
              }
            }).catch((e) => {
              logger.error("error getting post.link headers", e);
            });

            if (url.endsWith(".gifv")) {
              let gifUrl = url.slice(0, -1);
              request.get(gifUrl).on('response', (res) => {
                let gifUrlContentType = res.headers['content-type'];
                let gifSize = res.headers['content-length'];
                if ("image/gif" === gifUrlContentType && gifSize) {
                  logger.info("test")
                  sendToTelegram(tgChannel, url, true);
                }
              }).catch((e) => {
                logger.error("gifv not converted to .gif", e);
              });
            }

            if ('imgur.com' === urlParser.parse(url).host) {
              let pathParts = urlParser.parse(url).path.split('/');
              if (pathParts.length === 2) {
                let imgurId = pathParts[1].split('.')[0];
                imgur.getInfo(imgurId).then((media) => {
                  if (!media.data.animated) {
                    sendToTelegram(tgChannel, url, false);
                  }
                }).catch((e) => {
                  logger.error("imgur error", e);
                });
              }
            } else if (urlParser.parse(url).host === 'gfycat.com') {
              let rname = url.match(/gfycat.com\/(?:detail\/)?(\w*)/)[1];
              request.get("https://api.gfycat.com/v1/gfycats/" + rname).on('response', (res) => {
                var body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => {
                  logger.info("gfycat");
                  body = JSON.parse(body);
                  sendToTelegram(tgChannel, url, true);
                });
              }).catch((e) => {
                logger.error("gfycat api error ", e);
              });
            }
          }

        });
      }
    });
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
      fetchPosts(options);
    }, null, true, 'Europe/Madrid').start();
  }
}

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 
 * @param {string} tgChannel 
 * @param {string} url 
 * @param {boolean} isGif 
 */
function sendToTelegram(tgChannel, url, isGif) {
  if (isGif) {
    tgBot.telegram.sendAnimation(tgChannel, url);
  } else {
    tgBot.telegram.sendPhoto(tgChannel, url);
  }
}
function checkIfAlreadySent(postId) {
  return new Promise(function (resolve, reject) {
    db.query("SELECT post_id FROM " + dbTable + " WHERE post_id='" + postId + "';",
      function (err, rows) {
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
    let sql = "INSERT INTO " + dbTable + " (post_id) values ('" + postId + "')";
    db.query(sql,
      function (err, rows) {
        if (rows === undefined) {
          logger.error(err);
          reject(new Error(err));
        } else {
          resolve(rows);
        }
      });
  });
}
