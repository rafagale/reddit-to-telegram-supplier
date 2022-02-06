require('dotenv').config();
const db = require('./db-conn');
const logger = require('simple-node-logger').createSimpleLogger('purple.log');
const CronJob = require('cron').CronJob;
const snoowrap = require('snoowrap');
const { Telegraf } = require('telegraf');
const urlParser = require('url');
//TODO: no rula todavia
//const { Client } = require('@rmp135/imgur');
//let imgur = new Client('43652b743b5a7a0')
//imgur.setClientId(process.env.IMGUR_CLIENT_ID);
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
        //TODO: Comprobar el id en bbdd y refactorizar esta lógica
        request.get(url).on('response', (res) => {
          let urlContent = res.headers['content-type'];
          if ("image/jpeg" === urlContent || "image/png" === urlContent) {
            tgBot.telegram.sendPhoto(tgChannel, url);
          }
          if ("image/gif" === urlContent) {
            tgBot.telegram.sendAnimation(tgChannel, url);
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
              tgBot.telegram.sendAnimation(tgChannel, url);
            }
          }).catch((e) => {
            logger.error("gifv not converted to .gif", e);
          });
        }

        if ('imgur.com' === urlParser.parse(url).host) {
          //TODO: Arreglar esto
          /*let pathParts = urlParser.parse(url).path.split('/');
          if (pathParts.length === 2) {
            let imgurId = pathParts[1].split('.')[0];
            imgur.getInfo(imgurId).then((media) => {
              if (!media.data.animated) {
                tgBot.telegram.sendPhoto(tgChannel, url);
              }
            }).catch((e) => {
              logger.error("imgur error", e);
            });
          }*/
        } else if (urlParser.parse(url).host === 'gfycat.com') {
          let rname = url.match(/gfycat.com\/(?:detail\/)?(\w*)/)[1];
          request.get("https://api.gfycat.com/v1/gfycats/" + rname).on('response', (res) => {
            var body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              body = JSON.parse(body);
              tgBot.telegram.sendAnimation(tgChannel, url);
            });
          }).catch((e) => {
            logger.error("gfycat api error ", e);
          });
        }

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
