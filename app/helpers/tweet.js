var TweetHelper = function() {};

TweetHelper.prototype = {
	process: function(tweet,model,controller,processVine,mutedUsers,hideGifs, dm_info) {
		// takes a tweet and does all sorts of stuff to it
		// Save the created_at property for all tweets
		if (tweet.dm) {
			tweet.id_str = tweet.id;
			//Mojo.Log.info('process: tweet.dm is true; dm_info type is: ' + typeof dm_info);
			//Mojo.Log.info('process - dm tweet is: ' + JSON.stringify(tweet));
			// DMs now have a very different format/structure than 'normal' tweets.
			tweet.entities = tweet.message_create.message_data.entities;

			var ts_integer = parseInt(tweet.created_timestamp, 10);
			//Mojo.Log.info('process - DM created_timestamp: ' + tweet.created_timestamp);
			//Mojo.Log.info('process - DM ts_integer: ' + ts_integer);
			tweet.created_at = (new Date(ts_integer)).toUTCString();
			//Mojo.Log.info('process: DM tweet.created_at: ' + tweet.created_at);
			tweet.text = tweet.message_create.message_data.text;
			// We still need the profile_image_url and screen_name
			// tweet.user.screen_name = ?tweet.message_create.sender_id?;
			// tweet.user.profile_image_url = ?
			//Mojo.Log.info('process - sender_id: ' + tweet.message_create.sender_id);
			var user_id = tweet.message_create.sender_id;
			var dm_info_property_name;
			var dm_info_sub_property_name;

			//Mojo.Log.info('process - user_id: ' + user_id);
			//Mojo.Log.info('process - dm_info: ' + typeof dm_info);
			/*
			if (typeof dm_info == 'object') {
				for (dm_info_property_name in dm_info) {
					if (typeof dm_info[dm_info_property_name] !== 'function') {
						Mojo.Log.info('dm_info[' + dm_info_property_name + ']: ' + typeof dm_info[dm_info_property_name]);	
						for (dm_info_sub_property_name in dm_info[dm_info_property_name]) {
							if (typeof dm_info_sub_property_name !== 'function') {
								Mojo.Log.info('dm_info_sub_property_name: ' + dm_info_sub_property_name);	
								}	
							}
						}
					}
				//Mojo.Log.info('process - dm_info: ' + JSON.stringify(dm_info));
				}
			*/
			// screen_name and profile_image_url go in the tweet.user for regular tweet, 
			// but for a dm the tweet.user object doesn't yet exist, so we have to create it.
			tweet.user = {};
			tweet.user.id_str = user_id;
			tweet.user.screen_name = dm_info[user_id].screen_name;
			//Mojo.Log.info('process - typeof dm_info.screen_name: ' + typeof dm_info[user_id].screen_name);
			//Mojo.Log.info('process - dm_info.screen_name: ' + dm_info[user_id].screen_name);
			//Mojo.Log.info('process - tweet screen_name: ' + tweet.user.screen_name);
			tweet.user.profile_image_url = dm_info[user_id].profile_image_url;
			//Mojo.Log.info('process - typeof dm_info.profile_image_url: ' + typeof dm_info[user_id].profile_image_url);
			//Mojo.Log.info('process - dm_info.profile_image_url: ' + dm_info[user_id].profile_image_url);
			//Mojo.Log.info('process - tweet profile_image_url: ' + tweet.user.profile_image_url);
			/*
			Mojo.Log.info('process - calling Twitter.getUsersById with user_id: ' + user_id);

			var tempTwitter = new TwitterAPI(controller.stageController.user.id);
			Mojo.Log.info('process - tempTwitter type is: ' + typeof(tempTwitter));
			Mojo.Log.info('process - tempTwitter instance: ' + tempTwitter instanceof TwitterAPI);
			tempTwitter.getUsersById(user_id, function(r){
						Mojo.Log.info('process dm getUsersById responseText: ' + r.responseText);
						Mojo.Log.info('process dm getUsersById responseJSON: ' + JSON.stringify(r.responseJSON));
						tweet.user.screen_name = r.responseJSON.screen_name;
						Mojo.Log.info('process DM screen name: ' + r.responseJSON[0].screen_name);
						tweet.user.profile_image_url = r.responseJSON.profile_image_url;
						Mojo.Log.info('process DM profile image url: ' + r.responseJSON[0].profile_image_url);
				}.bind(this));	
			*/
			if (tweet.message_create.message_data.entities) {
				tweet.entities = tweet.message_create.message_data.entities;
			}

			if (tweet.message_create.message_data.attachment) {
				if (tweet.message_create.message_data.attachment.type == "media") {
					tweet.extended_entities = {};
					tweet.extended_entities.media = tweet.message_create.message_data.attachment.media;
				}
			}
			//Mojo.Log.info('process: end of tweet.dm = true block');
		}

		tweet.timestamp = tweet.created_at;

		if (!tweet.dm) {
			//Mojo.Log.info('process: not tweet.dm...');
			if (typeof(tweet.retweeted_status) !== "undefined") {
				var orig = tweet;
				var retweeter = tweet.user;
				tweet = tweet.retweeted_status;
				tweet.retweeter = retweeter;
				tweet.original_id = orig.id_str;
				tweet.is_rt = true;
				tweet.rt_class = 'show';
				tweet.footer = "<br />Retweeted by " + retweeter.screen_name;
				if(mutedUsers){
					for (var m = 0, mutedUser; mutedUser = mutedUsers[m]; m++) {
						//if (retweeter.screen_name.indexOf(mutedUser.user) > -1) 
						if (retweeter.id_str === mutedUser.id_str) {
							tweet.hideTweet_class = 'hide';
							break;
						} else {
							delete tweet.hideTweet_class;
						}
					}
				}
			}
			else{
				tweet.is_rt = false;
				if(mutedUsers){
					for (var m = 0, mutedUser; mutedUser = mutedUsers[m]; m++) {
						//if (tweet.user.screen_name.indexOf(mutedUser.user) > -1) 
						if (tweet.user.id_str === mutedUser.id_str) {
							tweet.hideTweet_class = 'hide';
							break;
						} else {
							delete tweet.hideTweet_class;
						}
					}
				}
			}
			if (tweet.favorite_count > 0){
				tweet.tweet_fav_class = 'show';
			}
			//disable clickable source links
			tweet.source = tweet.source.replace('href="', 'href="#');
			tweet.source = tweet.source.replace('a href=', 'a id="via-link" href=');
			tweet.via = 'via';
			// Save the link to the tweet on Twitter.com for fun times
			tweet.link = 'https://twitter.com/#!' + tweet.user.screen_name + '/status/' + tweet.id_str;  //Might need to remove the #! here too but we'll see
			if (Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3"){ 
				tweet.user.profile_image_url	= tweet.user.profile_image_url.replace('_normal', '_bigger'); // Use higher res avatar for Pre3
			}
		}

		// Expand some shortened links automatically via the entities payload
		// thumbnail passing added by DC
		if (tweet.entities && tweet.entities.urls) {
			var links = tweet.entities.urls;
			for (var i = links.length - 1; i >= 0; i--){
				if (links[i].expanded_url !== null) {
					if(typeof(tweet.text) !== "undefined"){
						tweet.text = tweet.text.replace(new RegExp(links[i].url, 'g'), links[i].expanded_url);
					} else {
						tweet.full_text = tweet.full_text.replace(new RegExp(links[i].url, 'g'), links[i].expanded_url);
					}
					//tweet.dividerMessage = links[i].expanded_url;
					//tweet.cssClass = 'new-tweet';
					if (links[i].expanded_url.indexOf('://instagr.am/p/') > -1 || links[i].expanded_url.indexOf('://instagram.com/p/') > -1 || links[i].expanded_url.indexOf('://www.instagram.com/p/') > -1){
						tweet.mediaUrl = links[i].expanded_url;
						Mojo.Log.info("Instagram expanded url: ", links[i].expanded_url);
						var IGBaseUrlEnd1 = links[i].expanded_url.indexOf('/p/') + 3;
						var IGBaseUrlEnd2 = links[i].expanded_url.indexOf('?', IGBaseUrlEnd1);
						var IGBaseUrl = links[i].expanded_url.slice(0, IGBaseUrlEnd2);
						tweet.mediaUrl = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=l";
						// Instagram posts don't seem to populate Twitter extended entities.
						// But our pictureView assistant is expecting media_url be populated in extended entities...
						links[i].media_url = tweet.mediaUrl;
						//tweet.mediaUrl = IGBaseUrl+"media/?size=l";
						//Mojo.Log.info("IG base url end: ", IGBaseUrlEnd2, "IG base url: ", IGBaseUrl);
						Mojo.Log.info("IG mediaUrl: ", tweet.mediaUrl);
						if(i === 0){
							//tweet.thumbnail = links[i].expanded_url+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
							tweet.thumbnail = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
						} else {
							//tweet.thumbnail2 = links[i].expanded_url+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
							tweet.thumbnail2 = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							//tweet.mediaUrl2 = links[i].expanded_url;
							tweet.mediaUrl2 = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=l";
							// Instagram posts don't seem to populate Twitter extended entities.
							// But our pictureView assistant is expecting media_url be populated in extended entities...
							links[i].media_url = tweet.mediaUrl2;
							//tweet.thumb_type = 'small';
						}
						Mojo.Log.info("Instagram thumbnail url: ", tweet.thumbnail, " : ", tweet.thumbnail2);
						//tweet.dividerMessage = tweet.mediaUrl;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('://twitpic.com') > -1){
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf('/', 8) + 1);
						tweet.mediaUrl = links[i].expanded_url;
						//tweet.mediaUrl = "http://twitpic.com/show/large/" + img;
						if(i === 0){
							tweet.thumbnail = "http://twitpic.com/show/thumb/" + img;
						} else {
							tweet.thumbnail2 = "http://twitpic.com/show/thumb/" + img;
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
						tweet.thumb_type = 'small';
					} else if (links[i].expanded_url.indexOf('://youtu.be') > -1){
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
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if ((links[i].expanded_url.indexOf('youtube.com/watch') > -1) || (links[i].expanded_url.indexOf('youtube.com/#/watch') > -1)){
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
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = links[i].expanded_url + " : " + tweet.thumbnail;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('://yfrog.com') > -1) {
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail =  links[i].expanded_url + ":iphone"; //changed from :small so Touchpad details looks better
						} else {
							tweet.thumbnail2 =  links[i].expanded_url + ":iphone"; //changed from :small so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('img.ly') > -1) {
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf('/', 8) + 1);
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = "http://img.ly/show/medium/" + img; // changed from thumb so Touchpad details looks better
						} else {
							tweet.thumbnail2 = "http://img.ly/show/medium/" + img; // changed from thumb so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('://phnx.ws/') > -1) {
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail =  links[i].expanded_url + "/thumb";
						} else {
							tweet.thumbnail2 =  links[i].expanded_url + "/thumb";
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
						tweet.thumb_type = 'small';
					} else if (links[i].expanded_url.indexOf('.jpg') > -1 || links[i].expanded_url.indexOf('.png') > -1 || links[i].expanded_url.indexOf('.jpeg') > -1){
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = links[i].expanded_url;
						} else {
							tweet.thumbnail2 = links[i].expanded_url;
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.mediaUrl;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('.gif') > -1){
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = links[i].expanded_url;
						} else {
							tweet.thumbnail2 = links[i].expanded_url;
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							if(hideGifs === true) {
								tweet.thumb2_class_timeline = 'hide';
							} else {
								//tweet.thumb_type = 'small';
							}
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.mediaUrl;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
						if(hideGifs === true) {
							tweet.thumb_class_timeline = 'hide';
						}
					} else if (links[i].expanded_url.indexOf('://vine.co/v/') > -1) {
						if(processVine === true){
							this.getVineHTML(links[i].expanded_url,tweet,i,model,controller,processVine);
							if(i > 0){
								tweet.thumb2_class = 'show';
								tweet.thumb2_class_timeline = 'show';
								//tweet.thumb_type = 'small';
							}
							tweet.thumb_class = 'show';
							tweet.thumb_class_timeline = 'show';
						}
					} else if (links[i].expanded_url.indexOf('https://twitter.com') > -1 && links[i].expanded_url.indexOf('/status/') > -1){
						tweet.referencedTweet = links[i].expanded_url.substr((links[i].expanded_url.indexOf('/status/') + 8));
						if(this.isNumeric(tweet.referencedTweet)){
							//Mojo.Log.error('referenced tweet: ' + tweet.referencedTweet + ' user: ' + controller.stageController.user.id);
							//this.getQuotedTweet(tweet,model,controller);
							//tweet.quote_class = 'show';
							//global.quotedTweets.push({tweet: tweet, orig_id: tweet.id_str, quote_id: tweet.referencedTweet});						
						} else {
							tweet.referencedTweet = '';
						}
					} else if (links[i].expanded_url.indexOf('https://twitter.com/') > -1){
						tweet.referencedUser = links[i].expanded_url.substr((links[i].expanded_url.indexOf('/twitter.com/') + 13));
					}
				}
			}
		}
		
		//media_url parsing added by DC
		if (tweet.entities && tweet.entities.media) {
			var media_links = tweet.entities.media;
			for (var i = media_links.length - 1; i >= 0; i--){
				if (media_links[i].media_url !== null) {
					if(typeof(tweet.text) !== "undefined"){
						tweet.text = tweet.text.replace(new RegExp(media_links[i].url, 'g'), media_links[i].media_url);
					} else {
						tweet.full_text = tweet.full_text.replace(new RegExp(media_links[i].url, 'g'), media_links[i].media_url);	
					}
					if(i === 0 && !tweet.thumbnail){
						tweet.mediaUrl = media_links[i].media_url;
						tweet.thumbnail = media_links[i].media_url+":small";  // using small instead of thumb to keep aspect ratio
					} else {
						tweet.thumbnail2 = media_links[i].media_url+":small";  // using small instead of thumb to keep aspect ratio
						tweet.thumb2_class = 'show';
						tweet.thumb2_class_timeline = 'show';
						tweet.mediaUrl2 = media_links[i].media_url;
						//tweet.thumb_type = 'small';
					}
					tweet.thumb_class = 'show';
					tweet.thumb_class_timeline = 'show';
				}
			}
		} //end block
		
		//extended_entitities parsing added by DC
		if (tweet.extended_entities && tweet.extended_entities.media) {
			var media_links = tweet.extended_entities.media;
			var mp4Array = [];
			var mp4Index = 0;
			//var bitrateFlag = 1; //0: min, 1: med, 2: max
			
			for (var i = media_links.length - 1; i >= 0; i--){
				if (media_links[i].video_info){ // && tweet.entities.media[i].media_url !== null) 
					if(media_links[i].video_info.variants){
						for(var j = 0; j < media_links[i].video_info.variants.length; j++)
						{
							if(media_links[i].video_info.variants[j].content_type === "video/mp4"){
								mp4Array.push({index: j,bitrate: media_links[i].video_info.variants[j].bitrate });
								//mp4Index = j;
								//break;
							}	
						}
						if(mp4Array.length > 1){
							mp4Array.sort(dynamicSort("bitrate"));
							//for(var k = 0; k < mp4Array.length; k++)
								//Mojo.Log.error('id: ' + tweet.id_str);
								//Mojo.Log.error('index: ' + mp4Array[k].index);
								//Mojo.Log.error('bitrate: ' + mp4Array[k].bitrate);
							//}
							//Mojo.Log.error('bitrateFlag: ' + bitrateFlag);
							//Mojo.Log.error('bitrate(flag):_' + bitrate + "_");
							//switch(bitrateFlag)
							switch(bitrate){
								case "0":
									//min
									//Mojo.Log.error('minBitrate');
									//Mojo.Log.error('bitrate: ' + mp4Array[0].bitrate);
									mp4Index = mp4Array[0].index;
									break;
								case "1":
									//med - will always round DOWN to lower bitrate if even number of bitrate choices
									//Mojo.Log.error('medBitrate');
									//Mojo.Log.error('bitrate: ' + mp4Array[Math.floor((mp4Array.length-1)/2)].bitrate);
									mp4Index = mp4Array[Math.floor((mp4Array.length-1)/2)].index;
									break;
								case "2":
									//max
									//Mojo.Log.error('maxBitrate');
									//Mojo.Log.error('bitrate: ' + mp4Array[mp4Array.length-1].bitrate);
									mp4Index = mp4Array[mp4Array.length-1].index;
									break;
								default:
									//Mojo.Log.error('minBitrate (default)');
									mp4Index = mp4Array[0].index;
									break;
							}
						}
						//Mojo.Log.error('final mp4Index: ' + mp4Index);
						//Mojo.Log.error('final bitrate: ' + media_links[i].video_info.variants[mp4Index].bitrate);
						//Mojo.Log.error('------');
						if(i === 0){ // && (tweet.entities.media[i].media_url == tweet.extended_entities.media[i].media_url))
							tweet.mediaVidUrl = media_links[i].video_info.variants[mp4Index].url; 
							//Mojo.Log.error('vid link: ' + tweet.mediaVidUrl);
						} else {
							tweet.mediaVidUrl2 = media_links[i].video_info.variants[mp4Index].url;
						}
					}	
				}else if (media_links[i].type.indexOf('photo') > -1){
					tweet.mediaUrl = media_links[i].media_url;
					if(i === 0){
						tweet.thumbnail = media_links[i].media_url;
					} else if(i === 1){
						tweet.thumbnail2 = media_links[i].media_url;
						tweet.thumb2_class = 'show';
						tweet.thumb2_class_timeline = 'show';
						//tweet.thumb_type = 'small';
						tweet.mediaUrl2 = media_links[i].media_url;
					} else if(i === 2){
						tweet.thumbnail3 = media_links[i].media_url;
						tweet.thumb3_class = 'show';
						tweet.thumb3_class_timeline = 'show';
						//tweet.thumb_type = 'small';
						tweet.mediaUrl3 = media_links[i].media_url;
					} else if(i === 3){
						tweet.thumbnail4 = media_links[i].media_url;
						tweet.thumb4_class = 'show';
						tweet.thumb4_class_timeline = 'show';
						//tweet.thumb_type = 'small';
						tweet.mediaUrl4 = media_links[i].media_url;
					}
					//tweet.dividerMessage = tweet.mediaUrl;
					//tweet.cssClass = 'new-tweet';
					tweet.thumb_class = 'show';
					tweet.thumb_class_timeline = 'show';
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
		if (tweet.in_reply_to_status_id_str !== null && tweet.in_reply_to_status_id_str) {
			tweet.convo_class = 'show';
		}

		//Mojo.Log.info('process: here we are...');
		tweet.displayed_time_str = (d.toTimeString(d)).slice(0,8) + ' ' + d.toDateString(d);

		//keep the plaintext version for quote-style RTs (so HTML doesn't get tossed in there)
		if(typeof(tweet.text) !== "undefined"){
			tweet.stripped = tweet.text;
			tweet.text = tweet.text.parseLinks();
			// Emojify - added by DC
			tweet.text = emojify(tweet.text,16);
			if(tweet.text.indexOf('<img class="emoji" src=') > -1){
				tweet.emoji_class = 'show';
					//Mojo.Log.error('emoji: ' + tweet.full_text);
			}
		} else {
			tweet.stripped = tweet.full_text;
			tweet.full_text = tweet.full_text.parseLinks();
			// Emojify - added by DC
			tweet.full_text = emojify(tweet.full_text,16);
			if(tweet.full_text.indexOf('<img class="emoji" src=') > -1){
				tweet.emoji_class = 'show';
					//Mojo.Log.error('emoji: ' + tweet.full_text);
			}
		}
		//Mojo.Log.info(tweet.emojify);
		return tweet;
	},

	joinObj: function(a, attr) {
  	var out = []; 
  	for (var i=0; i<a.length; i++) {  
   		out.push(a[i][attr]); 
  	} 
 		return out.join(",");
	},
	
	isNumeric: function isNumeric(n) {
  	return !isNaN(parseFloat(n)) && isFinite(n);
	},

	getQuotedTweet: function(tweet,model,controller,callback){

		//Mojo.Log.error('referenced tweet2: ' + tweet.referencedTweet);
		//global.quotedTweets.push({tweet: tweet, orig_id: tweet.id_str, quote_id: tweet.referencedTweet});
		//tweet.quote_class = 'show';
		/*var tmpTwitter = new TwitterAPI(controller.stageController.user.id);
		tmpTwitter.getStatus(tweet.referencedTweet, function(tmpResponse, meta){
			var tmpTweet = this.process(tmpResponse.responseJSON,model,controller,false);
			tweet.quote = tmpTweet;
			controller.modelChanged(model);
		}	.bind(this));*/
	},
	
	getQuotedTweets: function(model,controller){
  //So just after I get all of this working, Twitter changes how it refers to quote. Ugghhh.
  //It is cleaner now though with less calls to the server.

/*
		var quotedTweetsLength = global.quotedTweets.length;
		var Twitter = new TwitterAPI(controller.stageController.user.id);
		var quoteIds = this.joinObj(global.quotedTweets,'quote_id');

		Twitter.statusesLookup(quoteIds, function(tmpResponse, meta){
			var tmpTweets = tmpResponse.responseJSON;
			for(var j =0, tmpTweet; tmpTweet = tmpTweets[j]; j++){
				tmpTweets[j] = this.process(tmpTweet,model,controller,false);
				if(tmpTweets[j].id_str === global.quotedTweets[j].quote_id){			
					global.quotedTweets[j].tweet.quote = tmpTweets[j];
					global.quotedTweets[j].removeFlag = 1;
					global.quotedTweets[j].tweet.quote_class = 'show';
				} else {
					var quotedTweetsLength = global.quotedTweets.length;
					for(var k =0; k < quotedTweetsLength; k++){
						if(tmpTweets[j].id_str === global.quotedTweets[k].quote_id){			
							global.quotedTweets[k].tweet.quote = tmpTweets[j];
							global.quotedTweets[k].removeFlag = 1;
							global.quotedTweets[k].tweet.quote_class = 'show';
							//break; //commented out as there might be more than one tweet referring to the same quote
						}
					}
				}
			}
				
			var i = global.quotedTweets.length;

			while (i--){
				if(global.quotedTweets[i].removeFlag === 1){
					global.quotedTweets.splice(i,1);
				}
			}
			
			controller.modelChanged(model);
		}	.bind(this));		
*/
	},
	getVineHTML: function(url, tweet, index, model, controller, processVine, callback) {

		var req = new Ajax.Request(url, {
			method: 'GET',
			onSuccess: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				//Mojo.Log.error('activeRequest: ' + Ajax.activeRequestCount);

				var myNode = document.createElement('div');
				var doc = document.implementation.createHTMLDocument('');
				doc.open();
				myHtml = response.responseText;
				doc.write(myHtml);
				doc.close();
				var myVideoLink;
				var myStillLink;
				var metaValues = doc.getElementsByTagName("meta");
				for(var i=0; i<metaValues.length; i++){
					//if(metaValues[i].property.indexOf('twitter:player:stream') > -1)
					if((metaValues[i].content.indexOf('/videos/') > -1) || (metaValues[i].content.indexOf('/videos_h264high/') > -1)){
						if(metaValues[i].content.indexOf('.mp4') > -1){
							myVideoLink = metaValues[i].content.slice(0,metaValues[i].content.indexOf('.mp4')+4);
							//Mojo.Log.error('myVideo: ' + myVideoLink);						
						}
						//New style vines
						if(metaValues[i].content.indexOf('.jpg') > -1){
							myStillLink = metaValues[i].content.slice(0,metaValues[i].content.indexOf('.jpg')+4);
							//Mojo.Log.error('myStill: ' + myStillLink);						
						}
					}
					//Mojo.Log.error('property' + metaValues[i].property);
					//if(metaValues[i].property.indexOf('twitter:image') > -1)
					//Old style vines
					if(metaValues[i].content.indexOf('/thumbs/') > -1){
						if(metaValues[i].content.indexOf('.jpg') > -1){
							myStillLink = metaValues[i].content;
							//Mojo.Log.error('myStill: ' + myStillLink);
						}
					}
				}				

				if(index === 0) {
					tweet.myStillLink = myStillLink;
					tweet.myVideoLink = myVideoLink;
					if(tweet.myVideoLink.indexOf('http') == -1) {
						tweet.myVideoLink = 'https:' + tweet.myVideoLink;
					}
					tweet.thumbnail = tweet.myStillLink;
					tweet.mediaUrl = tweet.myVideoLink;
					Mojo.Log.info('vine thumb: ' + tweet.myStillLink);
					Mojo.Log.info('vine video: ' + tweet.myVideoLink);
				} else {
					tweet.myStillLink2 = myStillLink;
					tweet.myVideoLink2 = myVideoLink;
					if(tweet.myVideoLink2.indexOf('http') == -1) {
						tweet.myVideoLink2 = 'https:' + tweet.myVideoLink2;
					}
					tweet.thumbnail2 = tweet.myStillLink2;
					tweet.mediaUrl2 = tweet.myVideoLink2;
					Mojo.Log.info('vine thumb2: ' + tweet.myStillLink2);
					Mojo.Log.info('vine video2: ' + tweet.myVideoLink2);
				}
				if(processVine === true){
					controller.modelChanged(model);
				} else {
						//re-render the tweet HTML
					var tweetHtml = Mojo.View.render({
						object: tweet,
						template: 'templates/tweets/details'
					});
					controller.update(tweetHtml);
				}
				myNode = NULL;
				doc = NULL;
			}.bind(this),
			onFailure: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				Mojo.Log.info('vine failure: ' + response.responseText);
			}
		});
	},
	filter: function(tweet, filters) {
		var words;
		
		if (!filters || !filters.length) {
			return(null);
		}

		if(typeof(tweet.text) !== "undefined"){
			words = tweet.text.toLowerCase().match(/[^"'\s]+/g);
		} else {
			words = tweet.full_text.toLowerCase().match(/[^"'\s]+/g);
		}

		for (var f = 0, filter; filter = filters[f]; f++) {
			if (-1 != words.indexOf(filter)) {
				return(filter);
			}
		}

		return(null);
	},
	processSearch: function(tweet,model,controller,processVine,mutedUsers,hideGifs) {
		// search tweets are stupid and in a different format from the rest.
		if(tweet.source.indexOf('&lt') > -1) {
			tweet.source = tweet.source.unescapeHTML(); // search returns escaped HTML for some reason
		}
		//disable clickable source links
		tweet.source = tweet.source.replace(/&quot;/g, '"');
		tweet.source = tweet.source.replace('href="', 'href="#');
		tweet.source = tweet.source.replace('a href=', 'a id="via-link" href=');
		tweet.via = "via";

		if(mutedUsers){
			for (var m = 0, mutedUser; mutedUser = mutedUsers[m]; m++) {
				//if (tweet.user.screen_name.indexOf(mutedUser.user) > -1) 
				if (tweet.user.id_str === mutedUser.id_str) {
					tweet.hideTweet_class = 'hide';
					break;
				} else {
					delete tweet.hideTweet_class;
				}
			}
		}

		// Expand some shortened links automatically via the entities payload
		// thumbnail passing added by DC
		if (tweet.entities && tweet.entities.urls) {
			var links = tweet.entities.urls;
			for (var i = links.length - 1; i >= 0; i--){
				if (links[i].expanded_url !== null) {
					if(typeof(tweet.text) !== "undefined"){
						tweet.text = tweet.text.replace(new RegExp(links[i].url, 'g'), links[i].expanded_url);
					} else {
						tweet.full_text = tweet.full_text.replace(new RegExp(links[i].url, 'g'), links[i].expanded_url);	
					}
					//tweet.dividerMessage = links[i].expanded_url;
					//tweet.cssClass = 'new-tweet';
					if (links[i].expanded_url.indexOf('://instagr.am/p/') > -1 || links[i].expanded_url.indexOf('://instagram.com/p/') > -1 || links[i].expanded_url.indexOf('://www.instagram.com/p/') > -1){
						//tweet.mediaUrl = links[i].expanded_url;
						Mojo.Log.info("Instagram expanded url: ", links[i].expanded_url);
						var IGBaseUrlEnd1 = links[i].expanded_url.indexOf('/p/') + 3;
						var IGBaseUrlEnd2 = links[i].expanded_url.indexOf('?', IGBaseUrlEnd1);
						var IGBaseUrl = links[i].expanded_url.slice(0, IGBaseUrlEnd2);
						tweet.mediaUrl = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=l";
						// Instagram posts don't seem to populate Twitter extended entities.
						// But our pictureView assistant is expecting media_url be populated in extended entities...
						links[i].media_url = tweet.mediaUrl;
						//tweet.mediaUrl = IGBaseUrl+"media/?size=l";
						//Mojo.Log.info("IG base url end: ", IGBaseUrlEnd2, "IG base url: ", IGBaseUrl);
						if(i === 0){
							//tweet.thumbnail = links[i].expanded_url+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
							tweet.thumbnail = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
						} else {
							//tweet.thumbnail2 = links[i].expanded_url+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
							tweet.thumbnail2 = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=m"; //Changed from ?size=t so Touchpad details looks better
							tweet.thumb2_class = 'show';
							//tweet.mediaUrl2 = links[i].expanded_url;
							tweet.mediaUrl2 = links[i].expanded_url.slice(0, IGBaseUrlEnd2)+"media/?size=l";
							// Instagram posts don't seem to populate Twitter extended entities.
							// But our pictureView assistant is expecting media_url be populated in extended entities...
							links[i].media_url = tweet.mediaUrl2;
							//tweet.thumb_type = 'small';
						}
						Mojo.Log.info("Instagram thumbnail url: ", tweet.thumbnail, " : ", tweet.thumbnail2);
						//tweet.dividerMessage = tweet.mediaUrl;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('://twitpic.com') > -1){
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf('/', 8) + 1);
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = "http://twitpic.com/show/thumb/" + img;
						} else {
							tweet.thumbnail2 = "http://twitpic.com/show/thumb/" + img;
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
						tweet.thumb_type = 'small';
					} else if (links[i].expanded_url.indexOf('://youtu.be') > -1){
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
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if ((links[i].expanded_url.indexOf('youtube.com/watch') > -1) || (links[i].expanded_url.indexOf('youtube.com/#/watch') > -1)){
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
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = links[i].expanded_url + " : " + tweet.thumbnail;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('://yfrog.com') > -1) {
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail =  links[i].expanded_url + ":iphone"; //changed from :small so Touchpad details looks better
						} else {
							tweet.thumbnail2 =  links[i].expanded_url + ":iphone"; //changed from :small so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('img.ly') > -1) {
						var img = links[i].expanded_url.substr(links[i].expanded_url.indexOf('/', 8) + 1);
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = "http://img.ly/show/medium/" + img; // changed from thumb so Touchpad details looks better
						} else {
							tweet.thumbnail2 = "http://img.ly/show/medium/" + img; // changed from thumb so Touchpad details looks better
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('://phnx.ws/') > -1) {
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail =  links[i].expanded_url + "/thumb";
						} else {
							tweet.thumbnail2 =  links[i].expanded_url + "/thumb";
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
						}
						//tweet.dividerMessage = tweet.thumbnail;
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
						tweet.thumb_type = 'small';
					} else if (links[i].expanded_url.indexOf('.jpg') > -1 || links[i].expanded_url.indexOf('.png') > -1 || links[i].expanded_url.indexOf('.gif') > -1 || links[i].expanded_url.indexOf('.jpeg') > -1){
						tweet.mediaUrl = links[i].expanded_url;
						if(i === 0){
							tweet.thumbnail = links[i].expanded_url;
						} else {
							tweet.thumbnail2 = links[i].expanded_url;
							tweet.thumb2_class = 'show';
							tweet.thumb2_class_timeline = 'show';
							tweet.mediaUrl2 = links[i].expanded_url;
							//tweet.thumb_type = 'small';
						}
						//tweet.dividerMessage = tweet.mediaUrl;
						//tweet.cssClass = 'new-tweet';
						tweet.thumb_class = 'show';
						tweet.thumb_class_timeline = 'show';
					} else if (links[i].expanded_url.indexOf('://vine.co/v/') > -1) {
						if(processVine === true){
							this.getVineHTML(links[i].expanded_url,tweet,i,model,controller,processVine);
							if(i > 0){
								tweet.thumb2_class = 'show';
								tweet.thumb2_class_timeline = 'show';
								//tweet.thumb_type = 'small';
							}
							tweet.thumb_class = 'show';
							tweet.thumb_class_timeline = 'show';
						}
					}
				}
			}
		}
		//media_url parsing added by DC
		if (tweet.entities && tweet.entities.media) {
			var media_links = tweet.entities.media;
			for (var i = media_links.length - 1; i >= 0; i--){
				if (media_links[i].media_url !== null) {
					if(typeof(tweet.text) !== "undefined"){
						tweet.text = tweet.text.replace(new RegExp(media_links[i].url, 'g'), media_links[i].media_url);
					} else{
						tweet.full_text = tweet.full_text.replace(new RegExp(media_links[i].url, 'g'), media_links[i].media_url);	
					}
					tweet.mediaUrl = media_links[i].media_url;
					if(i === 0){
						tweet.thumbnail = media_links[i].media_url+":small";  // using small instead of thumb to keep aspect ratio
					} else {
						tweet.thumbnail2 = media_links[i].media_url+":small";  // using small instead of thumb to keep aspect ratio
						tweet.thumb2_class = 'show';
						tweet.thumb2_class_timeline = 'show';
						tweet.mediaUrl2 = media_links[i].media_url;
						//tweet.thumb_type = 'small';
					}
					tweet.thumb_class = 'show';
					tweet.thumb_class_timeline = 'show';
				}
			}
		} //end block



		var d = new Date(tweet.created_at);
		tweet.time_str = d.toRelativeTime(1500);
		tweet.displayed_time_str = (d.toTimeString(d)).slice(0,8) + ' ' + d.toDateString(d);
		if (tweet.metadata.result_type === 'popular') {
			tweet.toptweet = 'Top Tweet';
		}
		if (tweet.in_reply_to_status_id_str !== null && tweet.in_reply_to_status_id_str) {
			tweet.convo_class = 'show';
		}
		//keep the plaintext version for quote-style RTs (so HTML doesn't get tossed in there)
		if(typeof(tweet.text) !== "undefined"){
			tweet.stripped = tweet.text;
			tweet.text = tweet.text.parseLinks();

			// Emojify - added by DC
			tweet.text = emojify(tweet.text,16);
			if(tweet.text.indexOf('<img class="emoji" src=') > -1){
				tweet.emoji_class = 'show';
			}
		} else {
			tweet.stripped = tweet.full_text;
			tweet.full_text = tweet.full_text.parseLinks();

			// Emojify - added by DC
			tweet.full_text = emojify(tweet.full_text,16);
			if(tweet.full_text.indexOf('<img class="emoji" src=') > -1){
				tweet.emoji_class = 'show';
			}
		}
		return tweet;
	},
	isRetweeted: function(tweet, user) {
		// Finds out if you retweeted this tweet
		var r = false;

		if (user.retweeted === undefined) {
			user.retweeted = [];
		} else {
			for (var i=0; i < user.retweeted.length; i++) {
				if (user.retweeted[i] === tweet.id_str) {
					r = true;
				}
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
