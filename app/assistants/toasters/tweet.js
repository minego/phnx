var TweetToaster = Class.create(Toaster, {
	initialize: function(tweet, assistant, savedSearchesModel) {
		this.toasterId			= toasterIndex++;
		this.id				= this.toasterId;
		this.nodeId				= 'toaster-' + this.toasterId;
		this.visible			= false;
		this.shim				= true;
		this.assistant			= assistant;
		this.controller			= getController();
		this.tweet				= tweet;
		this.tweet.toasterId	= this.toasterId;
		this.user				= this.controller.stageController.user;
		this.users				= this.controller.stageController.users || [ this.user ];
		this.savedSearchesModel = savedSearchesModel;

		/* The tweet may be from a panel for another account */
		if (typeof(tweet.owner) !== 'undefined') {
			for (var i = 0, u; u = this.users[i]; i++) {
				if (u.id == tweet.owner) {
					this.user = u;
				}
			}
		}

		if (this.tweet.favorited > 0) {
			this.tweet.fav_class = 'show';
		} else {
			this.tweet.fav_class = 'hide';
		}

		if (this.tweet.retweet_count > 0) {
			this.tweet.rt_class = 'show';
		} else {
			this.tweet.rt_class = 'hide';
		}

		var th					= new TweetHelper();
		var Twitter				= new TwitterAPI(this.user);

		this.twitterId			= this.tweet.id_str;
		this.twitterUsername	= this.tweet.user.screen_name;
		this.twitterLink		= "https://twitter.com/#!" +
									this.twitterUsername + "/" +
									"status/" + this.twitterId;
		this.twitterLinkIp		= "https://twitter.com/" +
									this.twitterUsername + "/" +
									"status/" + this.twitterId;
		this.twitterIpStatusName= this.twitterUsername + "'s status";
		this.content			= {toasterId: this.toasterId};

		var tweetHtml = Mojo.View.render({
			object: this.tweet,
			template: 'templates/tweets/details'
		});

		this.content.tweetHtml = tweetHtml;
		this.render(this.content, 'templates/toasters/tweet');

		// Stuff to do after the element is added to the DOM
		var me = this.user.id;

		if (this.tweet.user.id_str === me) {
			if (!this.tweet.dm) {
				this.controller.get(this.nodeId).addClassName('mine');
			} else {
				// A sent DM
				this.controller.get(this.nodeId).addClassName('is-sent');
				this.controller.get(this.nodeId).addClassName('is-dm');
			}
		}
		else if (this.tweet.dm) {
			var prefs = new LocalStorage();
			this.controller.get(this.nodeId).addClassName('is-dm');
			if (prefs.read('delReceivedDM')) {
				this.controller.get(this.nodeId).addClassName('is-sent'); // added by dc so that you can delete DM's not created by yourself
			}
		}
		else {
			this.controller.get(this.nodeId).addClassName('normal');
		}

		if (this.tweet.favorited) {
			this.controller.get('favorite-' + this.toasterId).addClassName('favorited');
		}

		if (this.tweet.in_reply_to_status_id_str !== null && this.tweet.in_reply_to_status_id_str) {
			this.controller.get(this.nodeId).addClassName('has-convo');
		}

		// Expand links if possible
		th.autoExpand(this.tweet, function(shortUrl, expandedUrl){
			this.tweet.text = this.tweet.text.replace(new RegExp(shortUrl, 'g'), expandedUrl);
			// re-render the tweet HTML
			var tweetHtml = Mojo.View.render({
				object: this.tweet,
				template: 'templates/tweets/details'
			});
			this.controller.get('details-' + this.toasterId).update(tweetHtml);

			Mojo.Event.listen(this.controller.get('rt-' + this.toasterId), Mojo.Event.tap, this.rtTapped.bind(this));
			Mojo.Event.listen(this.controller.get('fav-' + this.toasterId), Mojo.Event.tap, this.favTapped.bind(this));
		}.bind(this));

		//Update retweet/favourite counter
		if (!this.tweet.dm) {
			Twitter.getStatus(this.tweet.id_str, function(response, meta) {
				var tweet = response.responseJSON;
				//var th = new TweetHelper();
				tweet = th.process(tweet);
				this.tweet.retweet_count = tweet.retweet_count;
				//Mojo.Log.error('1) this.tweet.retweet_count:tweet.retweet_count: ' + this.tweet.retweet_count + ' : ' + tweet.retweet_count);
				this.tweet.favorite_count = tweet.favorite_count;
				if (this.tweet.favorite_count > 0) {
					this.tweet.tweet_fav_class = 'show';
				} else {
					this.tweet.tweet_fav_class = 'hide';
				}
				if (this.tweet.retweet_count > 0) {
					this.tweet.rt_class = 'show';
				} else {
					this.tweet.rt_class = 'hide';
				}
				//re-render the tweet HTML
				var tweetHtml = Mojo.View.render({
					object: this.tweet,
					template: 'templates/tweets/details'
				});
				this.controller.get('details-' + this.toasterId).update(tweetHtml);

				Mojo.Event.listen(this.controller.get('rt-' + this.toasterId), Mojo.Event.tap, this.rtTapped.bind(this));
				Mojo.Event.listen(this.controller.get('fav-' + this.toasterId), Mojo.Event.tap, this.favTapped.bind(this));
			}.bind(this));
		}

		//Retrieve justsayin and audioboo mp3 links and instagram mp4 links
		var links = tweet.entities.urls;
		var prefs = new LocalStorage();
		var processVine = prefs.read('showVine');
		for (var i = links.length - 1; i >= 0; i--){
			if (links[i].expanded_url !== null) {
				if (links[i].expanded_url.indexOf('http://www.justsayinapp.com/post/') > -1 ){
					this.getJustSayinHTML(links[i].expanded_url,this.tweet);
				}
				if ((links[i].expanded_url.indexOf('http://boo.fm/') > -1) || (links[i].expanded_url.indexOf('http://audioboo.fm/') > -1)){
					this.getAudioBooHTML(links[i].expanded_url,this.tweet);
				}
				if ((links[i].expanded_url.indexOf('http://instagram.com/p/') > -1) || (links[i].expanded_url.indexOf('http://instagr.am/p/') > -1)){
					this.getInstagramVideoHTML(links[i].expanded_url,this.tweet);
				}
				if(processVine === false){
					if (links[i].expanded_url.indexOf('http://vine.co/v/') > -1 || links[i].expanded_url.indexOf('https://vine.co/v/') > -1){
						th.getVineHTML(links[i].expanded_url,this.tweet,i,null,this.controller.get('details-' + this.toasterId),false);
						if(i > 0){
							tweet.thumb2_class = 'show';
						}
						tweet.thumb_class = 'show';
					}
				}
			}
		}

		// Emojify - added by DC
		//this.tweet.text = emojify(this.tweet.text,22);
		//Mojo.Log.info(this.tweet.text);
		// re-render the tweet HTML
		//var tweetHtml = Mojo.View.render({
		//	object: this.tweet,
		//	template: 'templates/tweets/details'
		//});
		//this.controller.get('details-' + this.toasterId).update(tweetHtml);


		var cookie = new Mojo.Model.Cookie("RilUser");
	try {
		this.rilUser = cookie.get();
	} catch (e) {Mojo.Log.error("this.rilUser");}
	var cookie = new Mojo.Model.Cookie("RilPass");
	try {
		this.rilPass = cookie.get();
	} catch (e) {Mojo.Log.error("this.rilPass");}
	var cookie = new Mojo.Model.Cookie("IppUser");
	try {
		this.ippUser = cookie.get();
	} catch (e) {Mojo.Log.error("this.ippUser");}
	var cookie = new Mojo.Model.Cookie("IppPass");
	try {
		this.ippPass = cookie.get();
	} catch (e) {Mojo.Log.error("this.ippPass");}

	},
	actionTapped: function(event) {
		var action = event.srcElement.id.substr(0, event.srcElement.id.indexOf('-'));
		switch(action) {
			case 'reply':
				this.createReply();
				break;
			case 'retweet':
				this.createRetweet();
				break;
			case 'favorite':
				this.createFavorite();
				break;
			case 'dm':
				this.createMessage();
				break;
			case 'delete':
				this.deleteTweet();
				break;
			case 'convo':
				this.showConvo();
				break;
			case 'opts':
				this.showOpts();
				break;
			case 'optsUrl':
				this.showOptsUrl();
				break;
			case 'back':
				this.refreshBack(); // added by DC
				//this.assistant.toasters.back();
				break;
		}
	},
	createReply: function() {
		var statusText;

		var args = {
			from: this.user,
			'reply_id': this.tweet.id_str
		};

		if (this.tweet.entities && this.tweet.entities.user_mentions.length > 0) {
			// Reply all
			var me = this.user.id;

			if (this.tweet.user.id_str !== me) {
				statusTxt = '@' + this.tweet.user.screen_name + ' ';
			} else {
				statusTxt = '';
			}
			var selectionStart = statusTxt.length;
			var selectionLength = 0;
			for (var i=0; i < this.tweet.entities.user_mentions.length; i++) {
				if (this.tweet.entities.user_mentions[i].screen_name !== this.user.username) {
					statusTxt += '@' + this.tweet.entities.user_mentions[i].screen_name + ' ';
					selectionLength += this.tweet.entities.user_mentions[i].screen_name.length + 2;
				}
			}

			args.selectStart = selectionStart;
			args.selectEnd = selectionStart + selectionLength;
		} else {
			statusTxt = '@' + this.tweet.user.screen_name + ' ';
		}
		args.text = statusTxt;

		OpenComposeToaster(this.assistant.toasters, args, this.assistant);
	},
	createMessage: function() {
		var args = {
			from: this.user,
			user: this.tweet.user,
			dm: true
		};
		OpenComposeToaster(this.assistant.toasters, args, this.assistant);
	},
	createRetweet: function() {
		var th = new TweetHelper();
		var rt = th.isRetweeted(this.tweet, this.user);
		if (rt === false) {
			this.assistant.toasters.add(new RetweetToaster(this.tweet, this.assistant));
		}
		else if (rt === true) {
			var opts = {
				title: 'Are you sure you want to undo this retweet?',
				callback: function() {
					var Twitter = new TwitterAPI(this.user);
					var id = this.tweet.original_id;
					Twitter.action('destroy', id, function(r){
						var rts = this.user.retweeted;
						for (var i=0; i < rts.length; i++) {
							if (rts[i] === this.tweet.id_str) {
								rts.splice(i, 1);
							}
						}
						this.assistant.toasters.back();
						banner('Retweet was removed successfully');
					}.bind(this));
				}.bind(this)
			};
			this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));
		}
	},
	createFavorite: function() {
		var Twitter = new TwitterAPI(this.user);
		if (this.tweet.favorited === false) {
			Twitter.favorite('favorite', this.tweet.id_str, function(response, meta){
				this.tweet.favorited = true;
				this.controller.get('favorite-' + this.toasterId).addClassName('favorited');
				this.tweet.favSet = false;
				this.tweet.fav_class = 'show';
				var tweet = response.responseJSON;
				var th = new TweetHelper();
				tweet = th.process(tweet);
				this.tweet.retweet_count = tweet.retweet_count;
				// Looks like .favorite_count isn't returned by Twitter when faving so at least add our favourite even though the count may not be entirely accurate
				// Could do a completely new call to get the status of a tweet, but that will mean 2 calls for every fav/unfav.  Hopefully Twitter will update to return favorite_count.
				this.tweet.favorite_count++;// = tweet.favorite_count;
				if (this.tweet.retweet_count > 0) {
					this.tweet.rt_class = 'show';
				} else {
					delete this.tweet.rt_class;
				}
				if (this.tweet.favorite_count > 0){
					this.tweet.tweet_fav_class = 'show';
				} else {
					delete this.tweet.tweet_fav_class;
				}
				var tweetHtml = Mojo.View.render({
					object: this.tweet,
					template: 'templates/tweets/details'
				});
				this.controller.get('details-' + this.toasterId).update(tweetHtml);
				for (var i=0; i < this.assistant.panels.length; i++) {
					var panel = this.assistant.panels[i];

					if (panel.type === 'timeline') {
						for (var j=0; j < panel.model.items.length; j++) {
							var item = panel.model.items[j];
							if (item.id_str === this.tweet.id_str) {
								item.favorited = this.tweet.favorited;
								item.fav_class = this.tweet.fav_class;
								item.favSet = this.tweet.favSet;
								this.controller.modelChanged(panel.model);
								break;
							}
						}
					}
				}
			}.bind(this));
		}
		else {
			Twitter.favorite('unfavorite', this.tweet.id_str, function(response, meta){
				this.tweet.favorited = false;
				this.controller.get('favorite-' + this.toasterId).removeClassName('favorited');
				//this.tweet.favSet = true;
				this.tweet.fav_class = 'hide';
				var tweet = response.responseJSON;
				var th = new TweetHelper();
				tweet = th.process(tweet);
				this.tweet.retweet_count = tweet.retweet_count;
				//Mojo.Log.error('2) this.tweet.retweet_count:tweet.retweet_count: ' + this.tweet.retweet_count + ' : ' + tweet.retweet_count);
				// Looks like .favorite_count isn't returned by Twitter when faving so at least remove our favourite even though the count may not be entirely accurate
				// Could do a completely new call to get the status of a tweet, but that will mean 2 calls for every fav/unfav.  Hopefully Twitter will update to return favorite_count.
				this.tweet.favorite_count--;// = tweet.favorite_count;
				if (this.tweet.retweet_count > 0) {
					this.tweet.rt_class = 'show';
				} else {
					delete this.tweet.rt_class;
				}
				if (this.tweet.favorite_count > 0){
					this.tweet.tweet_fav_class = 'show';
				} else {
					delete this.tweet.tweet_fav_class;
				}
				var tweetHtml = Mojo.View.render({
					object: this.tweet,
					template: 'templates/tweets/details'
				});
				this.controller.get('details-' + this.toasterId).update(tweetHtml);								
				for (var i=0; i < this.assistant.panels.length; i++) {
					var panel = this.assistant.panels[i];

					if (panel.type === 'timeline') {
						for (var j=0; j < panel.model.items.length; j++) {
							var item = panel.model.items[j];
							if (item.id_str === this.tweet.id_str) {
								item.favorited = this.tweet.favorited;
								item.fav_class = this.tweet.fav_class;
								item.favSet = this.tweet.favSet;
								this.controller.modelChanged(panel.model);
								break;
							}
						}
					}
				}
			}.bind(this));
		}
	},
	hideTweet: function() {
		for (var i=0; i < this.assistant.panels.length; i++) {
			var panel = this.assistant.panels[i];

			if (panel.type === 'timeline') {
				for (var j=0; j < panel.model.items.length; j++) {
					var item = panel.model.items[j];
					if (item.id_str === this.tweet.id_str) {
						panel.model.items.splice(j, 1);

						this.controller.modelChanged(panel.model);
						break;
					}
				}
			}
		}
	},
	deleteTweet: function() {
		var action;
		var Twitter = new TwitterAPI(this.user);

		if (!this.tweet.dm) {
			action = 'destroy';
		} else {
			action = 'destroyDM';
		}

		var opts = {
			title: 'Are you sure you want to delete this tweet?',
			callback: function(){
				this.assistant.toasters.back();

				if(action === 'destroyDM'){
					args = {'id': this.tweet.id_str};
					//Mojo.Log.info("id: " + this.tweet.id_str);
					Twitter.destroyDM(args, function(response) {
						banner('No one will ever know...'); //except the people who already saw it!
						this.assistant.toasters.back();

						this.hideTweet();
					}.bind(this), this.assistant);
				} else {
					Twitter.action(action, this.tweet.id_str, function(response) {
						banner('No one will ever know...'); //except the people who already saw it!
						this.assistant.toasters.back();

						this.hideTweet();
					}.bind(this), this.assistant);
				}
			}.bind(this)

		};
		this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));
	},
	showConvo: function() {
		this.assistant.toasters.add(new ConvoToaster(this.tweet, this.assistant));
	},
	showOpts: function() {
		this.controller.popupSubmenu({
			onChoose: this.popupHandler.bind(this),
			placeNear: this.controller.get('opts-' + this.toasterId),
			items: this.menuItems
		});
	},
	showOptsUrl: function(url) {
		if (this.canShowPreview(url)) {
			this.linkShowPreviewItem.disabled = false;
		} else {
			this.linkShowPreviewItem.disabled = true;
		}

		this.url = url;
		this.controller.popupSubmenu({
			onChoose:	this.popupHandler.bind(this),
			placeNear:	this.controller.get('opts-' + this.toasterId),
			items:		this.linkMenuItems
		});
	},
	//refreshBack fun added by DC
	refreshBack: function() {
		var refresh = (new LocalStorage()).read('refreshOnSubmit');

		this.assistant.toasters.back();
	},
	popupHandler: function(command) {
		var parsedLink = '';
		switch (command) {
			case 'cmdMention':
				this.mention();
				break;
			case 'cmdMessage':
				this.message();
				break;
			case 'cmdBlock':
				this.block();
				break;
			case 'cmdSpam':
				this.spam();
				break;
			case 'cmdHide':
				this.hideTweet();
				break;
			case 'cmdCopy':
				this.copy();
				break;
			case 'cmdCopyUrl':
				this.copyUrl();
				break;
			case 'cmdDataJog':
				this.dataJog();
				break;
			case 'cmdNeato':
				this.neato();
				break;
			case 'cmdSendToFacebook':
				this.sendToFacebook();
				break;
			case 'cmdInstapaper':
				this.addToInstapaper();
				break;
			case 'cmdReadItLater':
				this.addToReaditLater();
				break;
			case 'cmdEmail':
				this.email();
				break;
			case 'cmdSms':
				this.sms();
				break;
			case 'cmdCopyLinkUrl':
				this.copyLinkUrl(this.url);
				break;
			case 'cmdAddLinkInstapaper':
				this.addLinkToInstapaper(this.url);
				break;
			case 'cmdAddLinkReadOnTouchPro':
				this.addLinkReadOnTouchPro(this.url);
				break;
			case 'cmdSendLinkDataJog':
				this.sendLinkDataJog(this.url);
				break;
			case 'cmdSendLinkNeato':
				this.sendLinkNeato(this.url);
				break;				
			case 'cmdSendLinkFacebook':
				this.sendLinkFacebook(this.url);
				break;
			case 'cmdEmailLink':
				this.emailLink(this.url);
				break;
			case 'cmdSmsLink':
				this.smsLink(this.url);
				break;
			case 'cmdShowPreview':
				this.handleLink(this.url);
				break;
			case 'cmdOpenStockBrowser':
				global.openBrowser(this.url);
				break;
			case 'cmdOpenInAppBrowser':
				this.controller.stageController.pushScene('webview', this.url);
				break;
			case 'cmdMobilizeStockBrowser':
				parsedLink = 'http://www.instapaper.com/m?u=' + encodeURIComponent(this.url);
				global.openBrowser(parsedLink);
				break;
			// Mobilized InAppBrowser doesn't really work nicely
			//case 'cmdMobilizeInAppBrowser':
			//	parsedLink = 'http://www.instapaper.com/m?u=' + encodeURIComponent(this.url);
			//	this.controller.stageController.pushScene('webview', parsedLink);
			//	break;
			// DC temp test code
			//case 'cmdGetVineHTML':
				//this.getVineHTML();
				//break;
		}
	},
	getJustSayinHTML: function(url, tweet, callback) {
		var req = new Ajax.Request(url, {
			method: 'GET',
				onSuccess: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}

				var myNode = document.createElement('div');
				var doc = document.implementation.createHTMLDocument('');
				doc.open();
				myHtml = response.responseText;
				doc.write(myHtml);
				doc.close();
				var metaValues = doc.getElementsByTagName("meta");
				var myAudio;
				for(var i=0; i<metaValues.length; i++){
					if(metaValues[i].content.indexOf('audio.mp3') > -1){
						myAudio = metaValues[i].content;
						//Mojo.Log.info('myAudio: ' + myAudio);						
					}
				}
				//if(index === 0) {
					if(myAudio) {
						tweet.myAudioLink = myAudio;
						tweet.mediaUrl = tweet.myAudioLink;
						Mojo.Log.info('justsayin mp3: ' + tweet.myAudioLink);
					}

				//} else {
				//	tweet.myAudioLink2 = String((myAudio[0].getAttribute("poster")).match(/.*.mp3/));
				//	tweet.mediaUrl2 = tweet.myAudioLink2;
				//	Mojo.Log.info('justsayinmp3: ' + tweet.myAudioLink2);
				//}
				//controller.modelChanged(model);

				myNode = NULL; 
				doc = NULL;
			}.bind(this),
			onFailure: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				//Mojo.Log.info('justsayin failure: ' + response.responseText);
			}
		});
	},
	getAudioBooHTML: function(url, tweet, callback) {
		var req = new Ajax.Request(url, {
			method: 'GET',
				onSuccess: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}

				var myNode = document.createElement('div');
				var doc = document.implementation.createHTMLDocument('');
				doc.open();
				myHtml = response.responseText;
				doc.write(myHtml);
				doc.close();
				var metaValues = doc.getElementsByTagName("link");
				var myAudio;
				for(var i=0; i<metaValues.length; i++){
					if(metaValues[i].href.indexOf('.mp3') > -1){
						myAudio = metaValues[i].href;
						//Mojo.Log.error('myAudio: ' + myAudio);						
					}
				}
				//if(index === 0) {
					if(myAudio) {
						tweet.myAudioLink = myAudio;
						tweet.mediaUrl = tweet.myAudioLink;
						//Mojo.Log.error('audioboo mp3: ' + tweet.myAudioLink);
					}

				//} else {
				//	tweet.myAudioLink2 = String((myAudio[0].getAttribute("poster")).match(/.*.mp3/));
				//	tweet.mediaUrl2 = tweet.myAudioLink2;
				//	Mojo.Log.info('justsayinmp3: ' + tweet.myAudioLink2);
				//}
				//controller.modelChanged(model);

				myNode = NULL; 
				doc = NULL;
			}.bind(this),
			onFailure: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				Mojo.Log.error('audioboo failure: ' + response.responseText);
			}
		});
	},
	getInstagramVideoHTML: function(url, tweet, callback) {
		var req = new Ajax.Request(url, {
			method: 'GET',
				onSuccess: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}

				var myNode = document.createElement('div');
				var doc = document.implementation.createHTMLDocument('');
				doc.open();
				myHtml = response.responseText;
				doc.write(myHtml);
				doc.close();
				var metaValues = doc.getElementsByTagName("meta");
				var myVideo;
				for(var i=0; i<metaValues.length; i++){
					if(metaValues[i].content.indexOf('.mp4') > -1){
						myVideo = metaValues[i].content;
						//Mojo.Log.error('myVideo: ' + myVideo);						
					}
				}
				//if(index === 0) {
					if(myVideo) {
						tweet.myVideoLink = myVideo;
						tweet.mediaUrl = tweet.myVideoLink;
						//Mojo.Log.error('instagram mp4: ' + tweet.myVideoLink);
					}

				//} else {
				//	tweet.myAudioLink2 = String((myAudio[0].getAttribute("poster")).match(/.*.mp3/));
				//	tweet.mediaUrl2 = tweet.myAudioLink2;
				//	Mojo.Log.info('justsayinmp3: ' + tweet.myAudioLink2);
				//}
				//controller.modelChanged(model);

				myNode = NULL; 
				doc = NULL;
			}.bind(this),
			onFailure: function(response) {
				if (Ajax.activeRequestCount === 1) {
					Element.removeClassName('loading', 'show');
				}
				Mojo.Log.error('instagram video failure: ' + response.responseText);
			}
		});
	},
	mention: function() {
		var args = {
			from: this.user,
			text: '@' + this.tweet.user.screen_name + ' '
		};
		OpenComposeToaster(this.assistant.toasters, args, this.assistant);
	},
	message: function() {
		var args = {
			from: this.user,
			user: this.tweet.user,
			dm: true
		};
		OpenComposeToaster(this.assistant.toasters, args, this.assistant);
	},
	block: function() {
		var opts = {
			title: 'Are you sure you want to block @' + this.tweet.user.screen_name + '?',
			callback: function(){
				var Twitter = new TwitterAPI(this.user);
				Twitter.block(this.tweet.user.id_str, function(response){
					banner('Blocked @' + this.tweet.user.screen_name);
					this.assistant.toasters.back();

					this.hideTweet();
				}.bind(this));
			}.bind(this)
		};

		this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));
	},
	spam: function() {
		var opts = {
			title: 'Are you sure you want to report @' + this.tweet.user.screen_name + '?',
			callback: function(){
				var Twitter = new TwitterAPI(this.user);
				Twitter.report(this.tweet.user.id_str, function(response) {
					banner('Reported @' + this.tweet.user.screen_name);
					this.assistant.toasters.back();

					this.hideTweet();
				}.bind(this));
			}.bind(this)
		};

		this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));
	},
	//Copies the current tweet to the clipboard and shows a banner saying that it successfully copied the tweet
	copy: function() {
		this.controller.stageController.setClipboard(this.tweet.stripped,true);
				banner('Copied tweet to clipboard.');
	},
	dataJog: function() {
		var Twitter = new TwitterAPI(this.user);
		var id = this.tweet.id_str;
		var request = new
		Mojo.Service.Request("palm://com.palm.applicationManager", {
//		    method:      'send',
				method: 'open',
		    parameters:  {
		    	id: 'com.datajog.webos',
					//params: { data: this.twitterLink}
		    	params: { action: 'send', data: this.twitterLink }
    		},
		});
		banner('Sent URL to DataJog');
	},
	neato: function() {
		var Twitter = new TwitterAPI(this.user);
		var id = this.tweet.id_str;
		var request = new
		Mojo.Service.Request("palm://com.palm.applicationManager", {
//		    method:      'send',
				method: 'open',
		    parameters:  {
		    	id: 'com.zhephree.neato',
					//params: { data: this.twitterLink}
					params: { send: '{"a":"url","c":"'+this.twitterLink+'"}'} 
    		},
		});
		banner('Sent URL to Neato');
	},

	sendToFacebook: function() {
		var appids = ['com.palm.app.enyo-facebook','com.palm.app.facebook'], index = 0;
		var textToSend = "Tweet From" + " @" + this.tweet.user.screen_name + ": " + this.tweet.stripped + "\n" + " -- Sent via Project Macaw for webOS";
		function makeCall() {
			if (index < appids.length) {
				Mojo.Log.info('Trying to launch with appid %s', appids[index]);
				var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
					method: 'launch',
					parameters: {
						id: appids[index],
						params: {"type":"status","statusText":textToSend , status:textToSend}
					},
					onFailure: function() {
						Mojo.Log.info('Failed to launch with appid %s', appids[index]);
						index++; // go to next appid
						makeCall(); // retry
					}.bind(this)
				});
			} else {
				Mojo.Log.error('Failed to launch');                   
			};
		} 
		banner('Tweet sent to Facebook');
		makeCall();
	},
	addToInstapaper: function() {
		var url = "https://www.instapaper.com/api/add";
		var params = 'url=' + encodeURIComponent(this.twitterLinkIp);
			params += "&username=" +
encodeURIComponent(this.ippUser) + "&password=" +
encodeURIComponent(this.ippPass);
			new Ajax.Request(url, {
				method: 'post',
				parameters: params,
				onComplete: function() {
					banner('Added Tweet URL to Instapaper');
				}.bind(this),
				onFailure: function(transport) {
				  if (transport.responseText == 403) {
			banner('Incorrect Instapaper Username/Password');
				  }
				  else{
     banner('The service encountered an error. Please try again later.');
				}
				}
			});
	},
	addToReaditLater: function() {
		var url = "https://readitlaterlist.com/v2/send";
		var params = "new={";
		params += '"0":{"url":"' + encodeURIComponent(this.twitterLink)
+ '", "ref_id":"' + encodeURIComponent(this.tweet.id_str) + '"}';
		params += "}";
		params += "&username=" + encodeURIComponent(this.rilUser) +
"&password=" + encodeURIComponent(this.rilPass) +
"&apikey=fI1g8vdip517aY2d4eT21ejk9aA8X432";
new Ajax.Request(url, {
			method: 'post',
			parameters: params,
			onComplete: function(transport) {
				banner('Added URL to ReadItLater');
			}.bind(this),
			onFailure: function(transport) {
			  banner('Failed to add. Reason: ' +
transport.responseText);
			}
		});
	},
	copyUrl: function() {
		this.controller.stageController.setClipboard(this.twitterLink,true);
				banner('Copied tweet URL to clipboard.');
	},
	//Sends the current tweet via email and adds the tag "Sent via Project Macaw for webOS"
	email: function() {
		var Twitter = new TwitterAPI(this.user);
		this.controller.serviceRequest(
    "palm://com.palm.applicationManager", {
        method: 'open',
        parameters: {
            id: "com.palm.app.email",
            params: {
                summary: "I would like to share this tweet with you",
                text: "From" + " @" + this.tweet.user.screen_name + ": " + this.tweet.stripped + "<br>" + " -- Sent via Project Macaw for webOS"
            }
        }
    }
);
	},
	//Sends the current tweet via SMS/Instant Message
	sms: function() {
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
    method: 'launch',
    parameters: {
        id: 'com.palm.app.messaging',
        params: {
            messageText: this.tweet.stripped
        }
    },
    onSuccess: this.handleOKResponse,
    onFailure: this.handleErrResponse
});
	},

	//Copies the link in a tweet to the clipboard
	copyLinkUrl: function(url) {
		this.controller.stageController.setClipboard(url, true);
		banner('Copied link URL to clipboard.');
	},

	addLinkToInstapaper: function(url) {
		var apiurl = "https://www.instapaper.com/api/add";
		var params = 'url=' + encodeURIComponent(url);

		params += "&username=" +
			encodeURIComponent(this.ippUser) + "&password=" +
			encodeURIComponent(this.ippPass);

		new Ajax.Request(apiurl, {
			method:		'post',
			parameters:	params,
			onComplete:	function() {
				banner('Added URL to Instapaper');
			}.bind(this),

			onFailure: function(transport) {
				if (transport.responseText == 403) {
					banner('Incorrect Instapaper Username/Password');
				} else {
					banner('The service encountered an error. Please try again later.');
				}
			}
		});
	},

	addLinkReadOnTouchPro: function(url) {
		var appids = ['com.sven-ziegler.readontouch','com.sven-ziegler.readontouch-free'], index = 0;
		function makeCall() {
			if (index < appids.length) {
				Mojo.Log.info('Trying to launch with appid %s', appids[index]);
				var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
					method: 'open',
					parameters: {
						id: appids[index],
						params: {action: 'addLink', url: url}
					},
					onFailure: function() {
						Mojo.Log.info('Failed to launch with appid %s', appids[index]);
						index++; // go to next appid
						makeCall(); // retry
					}.bind(this)
				});
			} else {
				Mojo.Log.error('Failed to launch');                   
			};
		} 
		banner('Added URL to ReadOnTouch PRO');
		makeCall();
	},

	sendLinkDataJog: function(url) {
		var request = new
		Mojo.Service.Request("palm://com.palm.applicationManager", {
				method: 'open',
		    parameters:  {
		    	id: 'com.datajog.webos',
		    	params: { action: 'send', data: url }
    		}
		});
		banner('Sent link URL to DataJog');
	},

	sendLinkNeato: function(url) {
		var request = new
		Mojo.Service.Request("palm://com.palm.applicationManager", {
				method: 'open',
		    parameters:  {
		    	id: 'com.zhephree.neato',
		    	params: { send: '{"a":"url","c":"'+url+'"}'}
    		}
		});
		banner('Sent link URL to Neato!');
	},


	sendLinkFacebook: function(url) {
		var appids = ['com.palm.app.enyo-facebook','com.palm.app.facebook'], index = 0;
		var textToSend = url + "\n -- Sent via Project Macaw for webOS";
		function makeCall() {
			if (index < appids.length) {
				Mojo.Log.info('Trying to launch with appid %s', appids[index]);
				var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
					method: 'launch',
					parameters: {
						id: appids[index],
						params: {"type":"status","statusText":textToSend , status:textToSend}
					},
					onFailure: function() {
						Mojo.Log.info('Failed to launch with appid %s', appids[index]);
						index++; // go to next appid
						makeCall(); // retry
					}.bind(this)
				});
			} else {
				Mojo.Log.error('Failed to launch');                   
			};
		} 
		banner('Sent link URL to Facebook');
		makeCall();
	},
	
	emailLink: function(url) {
		this.controller.serviceRequest(
			"palm://com.palm.applicationManager",
			{
				method: 'open',
				parameters: {
					id: "com.palm.app.email",
					params: {
						summary: "I would like to share this link with you",
						text: url + "<br>" + " -- Sent via Project Macaw for webOS"
					}
				}
			}
		);
	},

	smsLink: function(url) {
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {
				id: 'com.palm.app.messaging',
				params: {
					messageText: url
				}
			},
			onSuccess: this.handleOKResponse,
			onFailure: this.handleErrResponse
		});
	},
	detailsTapped: function(event) {
		Mojo.Log.info("detailsTapped");
		this.detailsAction(event, false);
	},
	detailsHeld: function(event) {
		Mojo.Log.info("detailsHeld");
		this.detailsAction(event, true);

		/* Prevent the tap event */
		event.preventDefault();
	},
	detailsAction: function(event, held) {
		var Twitter = new TwitterAPI(this.user);
		var e = event.target;
		var username;

		Mojo.Log.info("e.id: " + e.id );
		Mojo.Log.info("e.innerText: " + e.innerText );
		Mojo.Log.info("mediaUrl: " + this.tweet.mediaUrl );

		if (e.id === 'link') {
			var url = e.innerText;
			var mediaUrl = this.tweet.mediaUrl;
			var prefs = new LocalStorage();

			if (held || prefs.read('browserSelection') === 'ask') {
				this.showOptsUrl(url);
			} else {
				this.handleLink(url,mediaUrl);
			}
		}	else if (e.id === 'thumb') {
			var url = this.tweet.mediaUrl;
			var prefs = new LocalStorage();

			if (held || prefs.read('browserSelection') === 'ask') {
				this.showOptsUrl(url);
			} else {
				this.handleLink(url);
			}
		}	else if (e.id === 'thumb2') {
			var url = this.tweet.mediaUrl2;
			var prefs = new LocalStorage();

			if (held || prefs.read('browserSelection') === 'ask') {
				this.showOptsUrl(url);
			} else {
				this.handleLink(url);
			}
		} else if (e.id === 'hashtag') {
			var hashtag = e.innerText;
			var prefs = new LocalStorage();
			var searchMaxResults = prefs.read('searchMaxResults');
			var args = {
				q: hashtag,
				count: searchMaxResults
			};

			this.controller.popupSubmenu({
				items: [
					{
						label:		$L('Filter tweets with') + ' ' + hashtag,
						command:	'cmdFilter'
					},
					{
						label:		$L('Search for') + ' ' + hashtag,
						command:	'cmdSearch'
					},
					{
						label:		$L('Cancel'),
						command:	'cmdCancel'
					}
				],

				onChoose: function(command) {
					switch (command) {
						case 'cmdSearch':
							Twitter.search(args, function(response) {
								var opts = {
									type: 'search',
									query: hashtag,
									items: response.responseJSON.statuses,
									savedSearchesModel: this.savedSearchesModel, // Added by DC
									assistant: this,
									controller: this.controller, 
									user: this.user
								};
								this.controller.stageController.pushScene('status', opts);
							}.bind(this));
							break;

						case 'cmdFilter':
							var prefs	= new LocalStorage();
							var value	= hashtag.toLowerCase();

							if (value && value.length > 0) {
								var filters = prefs.read('filters');

								if (-1 == filters.indexOf(value)) {
									filters.push(value);
								}
								prefs.write('filters', filters);
							}
							break;
					}
				}.bind(this)
			});
		} else if (e.id === 'user-avatar') {
			// Have to load the user to get following details, etc, that aren't always returned with the tweet
			username = this.tweet.user.screen_name;
			Twitter.getUser(username, function(response) {
			var url = this.tweet.mediaUrl;
				this.controller.stageController.pushScene({name:'profile', disableSceneScroller: true}, response.responseJSON);
			}.bind(this));
		} else if (e.id === 'user') {
			username = e.innerText.substr(1);
			Twitter.getUser(username, function(response) {
				this.controller.stageController.pushScene({name:'profile', disableSceneScroller: true}, response.responseJSON);
			}.bind(this));
		} 
	},
	handleLink: function(url,mediaUrl) {
		//looks for images and other neat things in urls
		var img;
		var prefs = new LocalStorage();
		var useFoursquareApp = prefs.read('useFoursquareApp');


		if (url.indexOf('http://yfrog.com') > -1) {
			this.showPreview(url + ':iphone', url);
		} 
		else if (url.indexOf('http://twitpic.com') > -1) {
			img = url.substr(url.indexOf('/', 8) + 1);
			this.showPreview('http://twitpic.com/show/large/' + img, url);
		} else if (url.indexOf('plixi') > -1 || url.indexOf('http://lockerz.com/s/') > -1) {
			this.showPreview('http://api.plixi.com/api/tpapi.svc/imagefromurl?size=large&url=' + url, url);
		} else if (url.indexOf('img.ly') > -1) {
			img = 'http://img.ly/show/full/' + url.substr(url.indexOf('.ly/') + 4);
			this.showPreview(img, url);
		} else if (url.indexOf('http://instagr.am/p/') > -1 || url.indexOf('http://instagram.com/p/') > -1) {
			this.showPreview(url + 'media/?size=l', url);
		} else if (url.indexOf('http://mlkshk.com/p/') > -1) {
			img = url.replace('/p/', '/r/');
			this.showPreview(img, url);
		} else if (url.indexOf('campl.us') > -1) {
			this.showPreview('http://phnxapp.com/services/preview.php?u=' + url);
		} else if (url.indexOf('.jpg') > -1 || url.indexOf('.png') > -1 || url.indexOf('.gif') > -1 || url.indexOf('.jpeg') > -1) {
			this.showPreview(url);
		} else if (url.indexOf('http://phnx.ws/') > -1) {
			this.showPreview(url + '/normal');
		} else if (url.indexOf('youtube.com/watch') > -1) {
			this.openYouTube(url);
		} else if (url.indexOf('youtu.be') > 1) {
			// YouTube app doesn't like the short URLs so let's convert it to a full URL
			//this.openYouTube('http://youtube.com/watch?v=' + url.substr(url.indexOf('.be/') + 4));
			var tail = url.substr(url.indexOf('.be/') + 4);
			this.openYouTube('http://youtube.com/watch?v=' + tail.substr(0,tail.indexOf("?")));
		} else if (url.indexOf('http://twitter.com/#!/' + this.twitterUsername + '/status/' + this.twitterId) > -1) {
			this.assistant.toasters.add(new TweetToaster(url, this.assistant));
			Mojo.Log.error("TweetToaster for http:// called");
		} else if (url.indexOf('https://twitter.com/#!/' + this.twitterUsername + '/status/' + this.twitterId) > -1) {
			this.assistant.toasters.add(new TweetToaster(url, this.assistant));
			Mojo.Log.error("TweetToaster for https:// called");
		}	//else if(url.indexOf('https://vines.s3.amazonaws.com/v/') > -1) {
			else if(url.indexOf('vine.co/') > -1) {
			this.controller.serviceRequest("palm://com.palm.applicationManager", {
				method: "launch",
				parameters: {
					id: "com.palm.app.videoplayer",
					params: {
						target: url
					}
				}
			});
		} else if((url.indexOf('http://www.justsayinapp.com/post/') > -1) && mediaUrl) {
			if(mediaUrl.indexOf('audio.mp3') > -1 ) {
				Mojo.Log.info('Streaming ' + mediaUrl);
				this.controller.serviceRequest("palm://com.palm.applicationManager", {
					method: "launch",
					parameters: {
						id: "com.palm.app.streamingmusicplayer",
						params: {
							target: mediaUrl
						}
					}
				});
			}
		} else if(((url.indexOf('http://audioboo.fm/boos/') > -1) || (url.indexOf('http://boo.fm/') > -1)) && mediaUrl) {
			if(mediaUrl.indexOf('.mp3') > -1 ) {
				Mojo.Log.info('Streaming ' + mediaUrl);
				this.controller.serviceRequest("palm://com.palm.applicationManager", {
					method: "launch",
					parameters: {
						id: "com.palm.app.streamingmusicplayer",
						params: {
							target: mediaUrl
						}
					}
				});
			}
		} 
		 
 //Potential support for @zhephree's foursquare app
		else if((url.indexOf('http://4sq.com/') > -1) && useFoursquareApp) {
			this.controller.serviceRequest("palm://com.palm.applicationManager", {
				method: 'launch',
					parameters: {
						id: 'com.foursquare.foursquare',
						params: {action: 'url', url: url}
					},
					onFailure:function(){
						this.showWebview(url);
				}.bind(this)
      })
		}
		
		else{
			this.showWebview(url);
		}
	},
	canShowPreview: function(url) {
		// Return true if we can show a preview for this url
		if (url.indexOf('http://yfrog.com') > -1) {
			return(true);
		} else if (url.indexOf('http://twitpic.com') > -1) {
			return(true);
		} else if (url.indexOf('plixi') > -1 || url.indexOf('http://lockerz.com/s/') > -1) {
			return(true);
		} else if (url.indexOf('img.ly') > -1) {
			return(true);
		} else if (url.indexOf('http://instagr.am/p/') > -1 || url.indexOf('http://instagram.com/p/') > -1) {
			return(true);
		} else if (url.indexOf('http://mlkshk.com/p/') > -1) {
			return(true);
		} else if (url.indexOf('campl.us') > -1) {
			return(true);
		} else if (url.indexOf('.jpg') > -1 || url.indexOf('.png') > -1 || url.indexOf('.gif') > -1 || url.indexOf('.jpeg') > -1) {
			return(true);
		} else if (url.indexOf('http://phnx.ws/') > -1) {
			return(true);
		} else{
			return(false);
		}
	},
	showWebview: function(src, url) {
		var prefs = new LocalStorage();
		var parsedLink = src;

		if (prefs.read('browserSelection') === 'inAppBrowser') {
			//parsedLink = 'http://www.instapaper.com/m?u=' + encodeURIComponent(src);
			this.controller.stageController.pushScene('webview', src);
			Mojo.Log.info("Launching In App Browser");
		} else {
			if (prefs.read('mobilizeWebLinks')) {
				parsedLink = 'http://www.instapaper.com/m?u=' + encodeURIComponent(src);
			}
			global.openBrowser(parsedLink);
			Mojo.Log.info("Launching Stock Browser");
		}
		//this.controller.stageController.pushScene('webview', src);
	},
	showPreview: function(src, url) {
		// this.assistant.imagePreview = true;
		// var img = new Image();
		// img.src = src;
		// this.controller.get('image-preview').show();
		// //try to preload the image
		// img.onLoad = this.showImage(src, url);
		var index = 0;
		var matchId = -1;
		var links;
		var img_uid;

		if (this.tweet.entities && this.tweet.entities.urls) {
			links = this.tweet.entities.urls;
			for (var i = 0, link; link = links[i]; i++) {
				if(src.indexOf(link.expanded_url) !== -1) {
					matchId = index;
					break;
				}
				index++;
			};
		}
		if (this.tweet.entities && this.tweet.entities.media) {
			links = this.tweet.entities.media;
			for (var i = 0, link; link = links[i]; i++) {
				if(src.indexOf(link.media_url) !== -1) {
					matchId = index;
					break;
				}
				index++;
			};
		}
		img_uid = this.tweet.id + '_' + matchId;
		this.controller.stageController.pushScene('pictureView', src, this.tweet.user.screen_name,img_uid);
	},
	showImage: function(src, url) {
		this.controller.get('preview').src = src;
		this.controller.get('preview').name = url;
		this.controller.get('image-preview').addClassName('rotate');
	},
	closePreview: function() {
		this.assistant.imagePreview = false;
		this.controller.get('image-preview').removeClassName('rotate');
		setTimeout(function() {
			this.controller.get('image-preview').hide();
		}, 1000);
	},
	previewTapped: function(event) {
		var e = event.target;
		global.openBrowser(e.name);
		this.closePreview();
	},
	openYouTube: function(url) {
		var appIds = ["com.palm.app.youtube"];
		var index = 0;
		var tmpId;
		
		//Mojo.Log.error("osVers: " + Mojo.Environment.DeviceInfo.platformVersion);
		if (Mojo.Environment.DeviceInfo.platformVersion == "2.2.4") {
			var prefs = new LocalStorage();
			tmpId = prefs.read('youTubeApp');
			if(tmpId) {
				appIds.unshift(tmpId);
			}
		}
		function makeCall() {
			if(index < appIds.length) {
				if (Mojo.Environment.DeviceInfo.platformVersionMajor < 3) {
					//this.controller.serviceRequest("palm://com.palm.applicationManager", {
					var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
						method: "launch",
						parameters: {
							id: appIds[index],
							params: {
								target: url
							}
						},
						onFailure: function() {
							index++;
							makeCall();
						}.bind(this)
					});
				} else {
					global.openBrowser(url);
				}
			} else {
				global.openBrowser(url);
			}
		}
		makeCall();
	},
	rtTapped: function(event) {
		var Twitter = new TwitterAPI(this.user);
		Twitter.showRetweets(this.tweet.id_str, function(response) {
			if (response.responseJSON.length > 0) {
				var users = [];
				var r = response.responseJSON;
				var maxResponseLen = (r.length > 500 ? 500 : r.length);
				for (var i=0; i < maxResponseLen; i++) {
					users.push(r[i].user);
				}
				this.assistant.toasters.add(new UserListToaster('Status Retweets', users, this.assistant));
			}
			else {
				ex('Twitter did not return anything');
			}
		}.bind(this));
	},
	favTapped: function(event) {
		//Currently no way with the REST API to return a list of users that favourited a tweet
	},
	setup: function() {
		this.menuItems = [
			{
				label:				$L('Public Mention'),
				command:			'cmdMention'
			},
			{
				label:				$L('Send Direct Message'),
				command:			'cmdMessage'
			},
			{
				label:				$L('Share'),
				items: [
					{
						label:		$L('Copy Text'),
						command:	'cmdCopy'
					},
					{
						label:		$L('Copy URL'),
						command:	'cmdCopyUrl'
					},
					{
						label:		$L('Send URL via DataJog'),
						command:	'cmdDataJog'
					},					
/* neato! V2.0 doesn't seem to support cross-app launching yet
					{
						label:		$L('Send URL via Neato!'),
						command:	'cmdNeato'
					},					
*/
					{
						label:		$L('Send to Facebook'),
						command:	'cmdSendToFacebook'
					},	
					{
						label:		$L('Add to Instapaper'),
						command:	'cmdInstapaper'
					},
					{
						label:		$L('Add to ReaditLater'),
						command:	'cmdReadItLater'
					},
					{
						label:		$L('Email'),
						command:	 'cmdEmail'
					},
					{
						label:		$L('SMS'),
						command:	 'cmdSms'
					}
				]
			},
			{
				label:				$L('Block'),
				command:			'cmdBlock'
			},
			{
				label:				$L('Report Spam'),
				command:			'cmdSpam'
			},
			{
				label:				$L('Hide'),
				command:			'cmdHide'
			},
		];

		this.linkMenuItems = [
			this.linkShowPreviewItem = {
				label:				$L('Show Preview'),
				command:			'cmdShowPreview',
				disabled:			true
			},
			{
				label:				$L('Open in System Browser'),
				command:			'cmdOpenStockBrowser'
			},
			{
				label:				$L('Open in In-App Browser'),
				command:			'cmdOpenInAppBrowser'
			},
			{
				label:				$L('Mobilize in System Browser'),
				command:			'cmdMobilizeStockBrowser'
			},
			//Mobilize inAppBrowswer doesn't really work nicely
			//{
			//	label:				$L('Mobilize in In-App Browser'),
			//	command:			'cmdMobilizeInAppBrowser'
			//},
			{
				label:				$L('Share'),
				items: [
					{
						label:		$L('Copy Link URL'),
						command:	'cmdCopyLinkUrl'
					},
					{
						label:		$L('Add to Instapaper'),
						command:	'cmdAddLinkInstapaper'
					},
					{
						label:		$L('Add to ReadOnTouch PRO'),
						command:	'cmdAddLinkReadOnTouchPro'
					},
					{
						label:		$L('Send link via DataJog'),
						command:	'cmdSendLinkDataJog'
					},
/* neato! V2.0 doesn't seem to support cross-app launching yet					
					{
						label:		$L('Send link via Neato!'),
						command:	'cmdSendLinkNeato'
					},
*/
					{
						label:		$L('Send link to Facebook'),
						command:	'cmdSendLinkFacebook'
					},
					{
						label:		$L('Email Link'),
						command:	'cmdEmailLink'
					},
					{
						label:		$L('SMS Link'),
						command:	'cmdSmsLink'
					}
				]
			}
		];

		Mojo.Event.listen(this.controller.get('details-' + this.toasterId), Mojo.Event.tap, this.detailsTapped.bind(this));
		Mojo.Event.listen(this.controller.get('details-' + this.toasterId), Mojo.Event.hold, this.detailsHeld.bind(this));
		Mojo.Event.listen(this.controller.get('rt-' + this.toasterId), Mojo.Event.tap, this.rtTapped.bind(this));
		Mojo.Event.listen(this.controller.get('fav-' + this.toasterId), Mojo.Event.tap, this.favTapped.bind(this));
		// Mojo.Event.listen(this.controller.get('preview'), Mojo.Event.tap, this.previewTapped.bind(this));
		Mojo.Event.listen(this.controller.get('reply-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
		Mojo.Event.listen(this.controller.get('retweet-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
		Mojo.Event.listen(this.controller.get('favorite-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
		Mojo.Event.listen(this.controller.get('convo-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
		Mojo.Event.listen(this.controller.get('dm-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
		Mojo.Event.listen(this.controller.get('delete-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
		Mojo.Event.listen(this.controller.get('back-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
		Mojo.Event.listen(this.controller.get('opts-' + this.toasterId), Mojo.Event.tap, this.actionTapped.bind(this));
	},
	cleanup: function() {
		Mojo.Event.stopListening(this.controller.get('details-' + this.toasterId), Mojo.Event.tap, this.detailsTapped);
		Mojo.Event.stopListening(this.controller.get('details-' + this.toasterId), Mojo.Event.hold, this.detailsHeld);
		Mojo.Event.stopListening(this.controller.get('rt-' + this.toasterId), Mojo.Event.tap, this.rtTapped);
		Mojo.Event.stopListening(this.controller.get('fav-' + this.toasterId), Mojo.Event.tap, this.favTapped);
		// Mojo.Event.stopListening(this.controller.get('preview'), Mojo.Event.tap, this.previewTapped.bind(this));
		Mojo.Event.stopListening(this.controller.get('reply-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
		Mojo.Event.stopListening(this.controller.get('retweet-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
		Mojo.Event.stopListening(this.controller.get('favorite-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
		Mojo.Event.stopListening(this.controller.get('convo-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
		Mojo.Event.stopListening(this.controller.get('dm-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
		Mojo.Event.stopListening(this.controller.get('delete-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
		Mojo.Event.stopListening(this.controller.get('back-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
		Mojo.Event.stopListening(this.controller.get('opts-' + this.toasterId), Mojo.Event.tap, this.actionTapped);
	}
});

