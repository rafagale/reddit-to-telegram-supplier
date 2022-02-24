CREATE TABLE `reddit_post_history` (
  `post_id` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  `subreddit_id` varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
  `subrreddit_name` varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
