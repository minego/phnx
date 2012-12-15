var TweetHelper = function() {};

TweetHelper.prototype = {
	process: function(tweet) {
		// takes a tweet and does all sorts of stuff to it

		// Save the created_at property for all tweets
		tweet.timestamp = tweet.created_at;

		if (!tweet.dm) {
			if (typeof(tweet.retweeted_status) !== "undefined") {
				var orig = tweet;
				var retweeter = tweet.user;
				tweet = tweet.retweeted_status;
				tweet.retweeter = retweeter;
				tweet.original_id = orig.id_str;
				tweet.is_rt = true;
				tweet.rt_class = 'show';
				tweet.footer = "<br />Retweeted by " + retweeter.screen_name;
			}
			else{
				tweet.is_rt = false;
			}
			//disable clickable source links
			tweet.source = tweet.source.replace('href="', 'href="#');
			tweet.via = 'via';
			// Save the link to the tweet on Twitter.com for fun times
			tweet.link = 'https://twitter.com/#!' + tweet.user.screen_name + '/status/' + tweet.id_str;
		}



		// Expand some shortened links automatically via the entities payload
		// thumbnail passing added by DC
		if (tweet.entities && tweet.entities.urls) {
			var links = tweet.entities.urls;
			for (var i = links.length - 1; i >= 0; i--){
				if (links[i].expanded_url !== null) {
					tweet.text = tweet.text.replace(new RegExp(links[i].url, 'g'), links[i].expanded_url);	
					//tweet.dividerMessage = links[i].expanded_url;
					//tweet.cssClass = 'new-tweet';
					if (links[i].expanded_url.indexOf('http://instagr.am/p/') > -1 || links[i].expanded_url.indexOf('http://instagram.com/p/') > -1){
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = links[i].expanded_url+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
						} else {
							tweet.thumbnail2 = links[i].expanded_url+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.mediaUrl;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
					} else if (links[i].expanded_url.indexOf('http://twitpic.com') > -1){
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf('/', 8) + 1);
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = "http://twitpic.com/show/thumb/" + img;
						} else {
							tweet.thumbnail2 = "http://twitpic.com/show/thumb/" + img;
							tweet.thumb2_class = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						tweet.thumb_class = 'show';
						tweet.thumb_type = 'small';
					} else if (links[i].expanded_url.indexOf('http://youtu.be') > -1){
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf("/", 8)+1);
						if(img.indexOf('&',0) > -1) {
							img = img.slice(0,img.indexOf('&',0));
						}
						if(img.indexOf('?',0) > -1) {
							img = img.slice(0,img.indexOf('?',0));
						}
						if(img.indexOf('#',0) > -1) {
							img = img.slice(0,img.indexOf('#',0));
						}
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = "http://img.youtube.com/vi/" + img + "/hqdefault.jpg";//1.jpg
						} else{
							tweet.thumbnail2 = "http://img.youtube.com/vi/" + img + "/hqdefault.jpg";//1.jpg
							tweet.thumb2_class = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
					} else if (links[i].expanded_url.indexOf('youtube.com/watch') > -1){
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf("v=", 8)+2);
						if(img.indexOf('&',0) > -1) {
							img = img.slice(0,img.indexOf('&',0));
						}
						if(img.indexOf('?',0) > -1) {
							img = img.slice(0,img.indexOf('?',0));
						}
						if(img.indexOf('#',0) > -1) {
							img = img.slice(0,img.indexOf('#',0));
						}
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = "http://img.youtube.com/vi/" + img + "/hqdefault.jpg"; //1.jpg;
						} else{
							tweet.thumbnail2 = "http://img.youtube.com/vi/" + img + "/hqdefault.jpg"; //1.jpg;
							tweet.thumb2_class = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = links[i].expanded_url + " : " + tweet.thumbnail;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
					} else if (links[i].expanded_url.indexOf('http://yfrog.com') > -1) {
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail =  links[i].expanded_url + ":iphone"; //changed from :small so Touchpad details looks better
						} else {
							tweet.thumbnail2 =  links[i].expanded_url + ":iphone"; //changed from :small so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
					} else if (links[i].expanded_url.indexOf('img.ly') > -1) {
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf('/', 8) + 1);
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = "http://img.ly/show/medium/" + img; // changed from thumb so Touchpad details looks better
						} else {
							tweet.thumbnail2 = "http://img.ly/show/medium/" + img; // changed from thumb so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
					} else if (links[i].expanded_url.indexOf('http://phnx.ws/') > -1) {
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail =  links[i].expanded_url + "/thumb";
						} else {
							tweet.thumbnail2 =  links[i].expanded_url + "/thumb";
							tweet.thumb2_class = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_type = 'small';
					}
				}
			}
		}
		//media_url parsing added by DC
		if (tweet.entities && tweet.entities.media) {
			var media_links = tweet.entities.media;
			for (var i = media_links.length - 1; i >= 0; i--){
				if (media_links[i].media_url !== null) {
					tweet.text = tweet.text.replace(new RegExp(media_links[i].url, 'g'), media_links[i].media_url);	
					tweet.mediaUrl = media_links[i].media_url;
					if(i === 0){
						tweet.thumbnail = media_links[i].media_url+":small";  // using small instead of thumb to keep aspect ratio
					} else {
						tweet.thumbnail2 = media_links[i].media_url+":small";  // using small instead of thumb to keep aspect ratio
						tweet.thumb2_class = 'show';
						tweet.mediaUrl2 = media_links[i].media_url;
					}
					tweet.thumb_class = 'show';
				}
			}
		} //end block

		var d = new Date(tweet.created_at);
		tweet.time_tweeted = (d.toTimeString(d)).slice(0,8);
		tweet.time_str = d.toRelativeTime(1500);
		//If over a day, display date instead of time
		if((new Date() - d) > 86400000){
			tweet.time_tweeted = d.toDateString(d);
		}

		//keep the plaintext version for quote-style RTs (so HTML doesn't get tossed in there)
		tweet.stripped = tweet.text;
		tweet.text = tweet.text.parseLinks();

		// Emojify - added by DC
		tweet.text = emojify(tweet.text,16);
		if(tweet.text.indexOf('<img class="emoji" src=') > -1){
			tweet.emoji_class = 'show';
		}
		
		//Mojo.Log.info(tweet.emojify);

		return tweet;
	},
	filter: function(tweet, filters) {
		if (!filters || !filters.length) {
			return(null);
		}

		var words = tweet.text.toLowerCase().match(/[^"'\s]+/g);

		for (var f = 0, filter; filter = filters[f]; f++) {
			if (-1 != words.indexOf(filter)) {
				return(filter);
			}
		}

		return(null);
	},
	processSearch: function(tweet) {
		// search tweets are stupid and in a different format from the rest.
		tweet.source = tweet.source.unescapeHTML(); // search returns escaped HTML for some reason
		//disable clickable source links
		tweet.source = "via " + tweet.source.replace('href="', 'hhref="#');
		var d = new Date(tweet.created_at);
		tweet.time_str = d.toRelativeTime(1500);
		if (tweet.metadata.result_type === 'popular') {
			tweet.toptweet = 'Top Tweet';
		}
		//keep the plaintext version for quote-style RTs (so HTML doesn't get tossed in there)
		tweet.stripped = tweet.text;
		tweet.text = tweet.text.parseLinks();

		// Emojify - added by DC
		tweet.text = emojify(tweet.text,16);
		if(tweet.text.indexOf('<img class="emoji" src=') > -1){
			tweet.emoji_class = 'show';
		}

		return tweet;
	},
	isRetweeted: function(tweet, user) {
		// Finds out if you retweeted this tweet
		var r = false;

		for (var i=0; i < user.retweeted.length; i++) {
			if (user.retweeted[i] === tweet.id_str) {
				r = true;
			}
		}

		return r;
	},
	autoExpand: function(tweet, callback) {
		// Auto expands links via ajax
		if (tweet.entities && tweet.entities.urls) {
			var urls = tweet.entities.urls;

			for (var i=0; i < urls.length; i++) {
				var link = urls[i].url;
	
				if (link.indexOf('is.gd') > -1) {
					this.expandIsgd(link, callback);
				}
				else {
					// try to expand through bit.ly API last
					// since there are so many custom bit.ly URLs
					this.expandBitly(link, callback);
				}
			}
		}
	},
	expandIsgd: function(shortUrl, callback) {
		var url = 'http://is.gd/forward.php?format=simple&shorturl=' + encodeURIComponent(shortUrl);
		var req = new Ajax.Request(url, {
			method: 'GET',
			onSuccess: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				callback(shortUrl, response.responseText);
			},
			onFailure: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				Mojo.Log.error(response.responseText);
			}
		});

	},
	expandBitly: function(shortUrl, callback) {
		var x_user = Config.bitlyUser;
		var x_key = Config.bitlyKey;
		var url = 'http://api.bitly.com/v3/expand?format=json&shortUrl=' + encodeURIComponent(shortUrl) + '&login=' + x_user + '&apiKey=' + x_key;
		var req = new Ajax.Request(url, {
			method: 'GET',
			onSuccess: function(response) {
				// banner(response.responseText);
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				var r = response.responseJSON.data.expand[0];

				if (!r.error) {
					callback(shortUrl, r.long_url);
				}
			},
			onFailure: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				Mojo.Log.error(response.responseText);
			}
		});
	}
};
