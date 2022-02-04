require('dotenv').config();
const db = require('./db-conn');
const logger = require('simple-node-logger').createSimpleLogger('purple.log');
const CronJob = require('cron').CronJob;
const snoowrap = require('snoowrap');
const { Telegraf } = require('telegraf')
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
        //Check the postId in db to check if it's already sent
        //TODO: Title, media download flow
        let title = `${post.title} (${post.score} karma)`;
        logger.info(title);
        downloadMedia(post.url);

      }
      tgBot.telegram.sendMessage(tgChannel, text).then(() => {
        console.log("Not sent....Sending to telegram");
      });
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

function checkDb(postId) {
  return new Promise(function (resolve, reject) {
    db.query("SELECT post_id FROM reddit_post_history WHERE post_id='" + postId + "';",
      function (err, rows) {
        if (err) {
          log.error(err);
        }
        if (rows === undefined) {
          reject(new Error("Error rows is undefined"));
        } else {
          resolve(rows);
        }
      });
  });
}
//old method; eloy HIJOPUTA;
function downloadMedia(postUrl) {
  if (post.is_video) {
    log.info("[video]" + postInfo);
    if ("reddit_video" in post.media) {
      log.info("[reddit_video] " + postInfo);
    }
    try {
      if (post.crosspost_parent_list.length > 0) {
        var parentPost = post.crosspost_parent_list[0];
        if (parentPost.is_video && "reddit_video" in parentPost.media) {
          log.info("[parent_reddit_video] " + postInfo);
          return reddit.emit("video", post.title, `https://redd.it/${post.id}`, parentPost.media.reddit_video.fallback_url, sub, uniqueId, post.created);
        }
      }
    } catch (e) {
      log.error("[video] is not a crosspost: " + postInfo + " " + e)
    }
  }

  request.get(url).on('response', (res) => {
    let urlContent = res.headers['content-type'];
    let fileSize = res.headers['content-length'];

    if ("image/jpeg" === urlContent || "image/png" === urlContent) {
      log.info("[reddit " + urlContent + "]" + postInfo);
      return reddit.emit("image", post.title, `https://redd.it/${post.id}`, url, sub, uniqueId, post.created);
    }
  }).catch((e) => { log.error("error getting post.link headers" + e) });

  if (url.endsWith(".gifv")) {
    log.info("[.gifv] " + postInfo);
    let mp4Url = url.slice(0, -5) + ".mp4";
    request.get(mp4Url).on('response', (res) => {
      let mp4UrlContentType = res.headers['content-type'];
      let mp4Size = res.headers['content-length'];
      if ("video/mp4" === mp4UrlContentType && mp4Size < MAX_FILE_SIZE) {
        log.info("[.gifv converted to mp4][" + readableBytes(mp4Size) + "]: " + postInfo);
        return reddit.emit("video", post.title, `https://redd.it/${post.id}`, mp4Url, sub, uniqueId, post.created);
      }
    }).catch((e) => { log.info("[.gifv not converted to mp4]" + postInfo + e) });
    let gifUrl = url.slice(0, -1);
    request.get(gifUrl).on('response', (res) => {
      let gifUrlContentType = res.headers['content-type'];
      let gifSize = res.headers['content-length'];
      if ("image/gif" === gifUrlContentType && gifSize < MAX_FILE_SIZE) {
        log.info("[.gifv converted to gif][" + readableBytes(gifSize) + "]: " + postInfo);
        return reddit.emit("gif", post.title, `https://redd.it/${post.id}`, gifUrl, sub, uniqueId, post.created);
      }
    }).catch((e) => { log.info("[.gifv not converted to .gif]" + postInfo + e) });
  }
  if (urlParser.parse(url).host === 'imgur.com') {
    log.info("[imgur media] " + postInfo);
    let pathParts = urlParser.parse(url).path.split('/');
    if (pathParts.length === 2) {
      let imgurId = pathParts[1].split('.')[0];
      imgur.getInfo(imgurId).then((media) => {
        if (media.data.animated) {
          log.info("[imgur animated] " + postInfo);
          if (media.data.size.mp4_size < MAX_FILE_SIZE) {
            return reddit.emit("video", post.title, `https://redd.it/${post.id}`, media.data.mp4, sub, uniqueId, post.created);
          }
        } else {
          log.info("[imgur img] " + postInfo);
          return reddit.emit("image", post.title, `https://redd.it/${post.id}`, media.data.link, sub, uniqueId, post.created);
        }
      }).catch((e) => { log.error("imgur error: " + e) });
    } else { log.info("[imgur unwanted shit] " + postInfo); }
  } else if (urlParser.parse(url).host === 'gfycat.com') {
    log.info("[gfycat gif] " + postInfo);
    let rname = url.match(/gfycat.com\/(?:detail\/)?(\w*)/)[1];
    request.get("https://api.gfycat.com/v1/gfycats/" + rname).on('response', (res) => {
      var body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        body = JSON.parse(body);
        return reddit.emit("gif", post.title, `https://redd.it/${post.id}`, body.gfyItem.max5mbGif, sub, uniqueId, post.created);
      });
    }).catch((e) => { log.error("gfycat api error " + e.statusCode) });
  }
}

