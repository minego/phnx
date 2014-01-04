function ProfileAssistant(user) {
	this.user = user;
	this.renderLimit = 200;
	this.panels = ['info','history','mentions','favorites'];
	this.toasters = new ToasterChain();
}

ProfileAssistant.prototype = {
	setup: function() {
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: global.menuItems});
		this.menuItems = [];
	
		this.account = this.controller.stageController.user;
		if (this.user.id_str === this.account.id) {
			// Testing code for profile image upload - not ready - DC
			//this.menuItems.push({
			//	label: 'Update Profile Image',
			//	command: 'cmdUpdateProfileImage'
			//});
		} else {
			var prefs = new LocalStorage();
			var mutedUsers = prefs.read('mutedUsers');

			if (this.user.following) {
				this.menuItems.push({
					label: 'Unfollow',
					command: 'cmdUnfollow'
				});
			} else {
				this.menuItems.push({
					label: 'Follow',
					command: 'cmdFollow'
				});
			}	
			//if (!mutedUsers || (-1 == mutedUsers.indexOf(this.user.screen_name))) {
			this.menuItems.push({
				label: 'Mute User',
				command: 'cmdMuteUser'
			});
			if(mutedUsers){
				for (var m = 0, mutedUser; mutedUser = mutedUsers[m]; m++) {
					//if (this.user.screen_name.indexOf(mutedUser.user) > -1) {
					if (this.user.id === mutedUser.id) {
						this.menuItems[1] = {label: 'Unmute User', command: 'cmdUnmuteUser'};
						break;
					}
				}
			}
			this.menuItems.push({
				label: 'Public Mention',
				command: 'cmdMention'
			});
			this.menuItems.push({
				label: 'Send Direct Message',
				command: 'cmdMessage'
			});
			this.menuItems.push({
				label: 'Block',
				command: 'cmdBlock'
			});
			this.menuItems.push({
				label: 'Report Spam',
				command: 'cmdSpam'
			});
		}
		if (!this.user.newCard) {
			this.menuItems.push({
				label: 'Open In New Card',
				command: 'cmdNewCard'
			});
		}

		this.historyModel = {items:[]};
		this.mentionsModel = {items:[]};
		this.favoritesModel = {items:[]};

		if (this.user.newCard) {
			// set css classes based on device
			console.log(Mojo.Environment.DeviceInfo.modelNameAscii);

			//createEmojiHash();

			if (Mojo.Environment.DeviceInfo.modelNameAscii == "Pixi" ||
				Mojo.Environment.DeviceInfo.modelNameAscii == "Veer") {
				this.controller.document.body.addClassName("small-device");

				this.smalldevice = true;
			} else if (Mojo.Environment.DeviceInfo.modelNameAscii == "TouchPad" ||
				Mojo.Environment.DeviceInfo.screenWidth > 500) {
				this.controller.document.body.addClassName("large-device");	

				this.largedevice = true;
			} else {
				this.controller.document.body.addClassName("medium-device");

				this.mediumdevice = true;
			}

			if (!Mojo.Environment.DeviceInfo.coreNaviButton) {
				this.controller.document.body.addClassName("no-gesture");
			}

			this.historyModel.items = this.user.history;
			this.mentionsModel.items = this.user.mentions;
			this.favoritesModel.items = this.user.favorites;

			// Apply theme / font and all that junk
			var prefs = new LocalStorage();
			var theme = prefs.read('theme');
			this.controller.stageController.loadStylesheet('stylesheets/' + theme +'.css');

			var body = this.controller.stageController.document.getElementsByTagName("body")[0];
			var font = prefs.read('fontSize');
			global.setFontSize(body, font);

			global.setShowThumbs(body,	prefs.read('showThumbs'));
			global.setFullWidthThumbs(body, prefs.read('fullWidthThumbs'));
			global.setShowEmoji(body,	prefs.read('showEmoji'));
			global.setMuteSelectedUsers(body, prefs.read('muteSelectedUsers'));
			global.setAbsTimeStamp(body, prefs.read('absoluteTimeStamps'));
			global.setFadeShim(body, prefs.read('fadeShim'));
						
			global.setHide(body,
				prefs.read('hideNewMutedTweets'),
				prefs.read('hideAvatar'),
				prefs.read('hideUsername'),
				prefs.read('hideScreenname'),
				prefs.read('hideTime'),
				prefs.read('hideVia'),
				prefs.read('hideTweetBorder'),
				prefs.read('hideSearchTimelineThumbs')
			);


			// var img = this.user.profile_image_url.replace('_normal', '_bigger');
			var img = 'images/low/user-card.png';
			var cardHtml = Mojo.View.render({
				object: {image: img},
				template: 'templates/account-card'
			});
			this.controller.get('account-shim').update(cardHtml);
		}

		if (Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3"){ 
			var img = this.user.profile_image_url.replace('_normal', '_bigger');
			this.user.profile_image_url = img;
		}
		if(this.user.url){
			if(this.user.entities.url.urls[0].expanded_url){
				//this.user.url = this.user.entities.url.urls[0].expanded_url;
				this.user.expanded_url = this.user.entities.url.urls[0].expanded_url;
			}
		}
		//this.account = this.controller.stageController.user;

		var created = new Date(this.user.created_at);
		this.user.created_at = created.toDateString();

		var sceneHtml = Mojo.View.render({
			object: this.user,
			template: 'profile/content'
		});

		this.controller.get('profile-scene').update(sceneHtml);

		// Fix any missing data
		if (this.user.description === '') {
			// Rather than hide the description, we replace it with this text.
			// Since the list looks best with a "first" and "last" element
			this.controller.get('description').update('This user has not filled out their bio.');
		}
		if (this.user.location === '') {
			this.controller.get('location').hide();
		}
		if (!this.user.url) {
			this.controller.get('url').hide();
		} else {
			if(this.user.entities.url.urls[0].expanded_url){
				this.user.url = this.user.entities.url.urls[0].expanded_url;
				this.user.expanded_url = this.user.entities.url.urls[0].expanded_url;
				//Mojo.Log.error('user.url, user.expanded_url: ' + this.user.url + ' : ' + this.user.expanded_url);
			}
		}

		this.controller.setupWidget('list-history',{itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: this.renderLimit}, this.historyModel);
		this.controller.setupWidget('list-favorites',{itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: this.renderLimit}, this.favoritesModel);
		this.controller.setupWidget('list-mentions',{itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: this.renderLimit}, this.mentionsModel);

		for (var i=0; i < this.panels.length; i++) {
			this.controller.setupWidget(this.panels[i] + "-scroller",{mode: 'vertical'},{});
			this.controller.listen(this.controller.get('btn-' + this.panels[i]), Mojo.Event.tap, this.navTapped.bind(this));
		}

		var screenWidth = this.controller.window.innerWidth;
		var panelWidth = 320;
		var scrollmode;

		/*
			Do not snap on the TouchPad because the snap behavior doesn't behave
			well there.
		*/
		if (screenWidth <= panelWidth) {
			scrollmode = 'horizontal-snap';
		} else {
			scrollmode = 'horizontal';
		}

		var panelElements = this.controller.select('.panel');
		this.controller.setupWidget(
			"sideScroller",
			this.attributes = {
				mode: scrollmode
			},
			this.sideScrollModel = {
				snapElements: { x:	panelElements},
				snapIndex: 0
			}
		);

		this.controller.instantiateChildWidgets(this.controller.get('profile-scene'));

		this.setScrollerSizes();

		this.controller.listen(this.controller.get('sideScroller'), Mojo.Event.propertyChange, this.scrollerChanged.bind(this));
		this.controller.listen(this.controller.get('sideScroller'), 'scroll', this.sideScrollChanged.bind(this));
		this.controller.listen(this.controller.get('list-history'), Mojo.Event.listTap, this.tweetTapped.bind(this));
		this.controller.listen(this.controller.get('list-favorites'), Mojo.Event.listTap, this.tweetTapped.bind(this));
		this.controller.listen(this.controller.get('list-mentions'), Mojo.Event.listTap, this.mentionTapped.bind(this));
		this.controller.listen(this.controller.get('shim'), Mojo.Event.tap, this.shimTapped.bind(this));
		this.controller.listen(this.controller.get('options'), Mojo.Event.tap, this.optionsTapped.bind(this));
		this.controller.listen(this.controller.get('tweets'), Mojo.Event.tap, this.tweetsTapped.bind(this));
		this.controller.listen(this.controller.get('following'), Mojo.Event.tap, this.followingTapped.bind(this));
		this.controller.listen(this.controller.get('followers'), Mojo.Event.tap, this.followersTapped.bind(this));
		this.controller.listen(this.controller.get('location'), Mojo.Event.tap, this.locationTapped.bind(this));
		this.controller.listen(this.controller.get('url'), Mojo.Event.tap, this.urlTapped.bind(this));
		this.controller.listen(this.controller.get('profile-avatar'), Mojo.Event.tap, this.avatarTapped.bind(this));

		this.closeTapped = this.closeTapped.bind(this);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);

		//if (this.user.id_str === this.account.id) {
		if (this.menuItems.length === 0){
			this.controller.get('options').setStyle({'display':'none'});
		}

		// Holy eager loading, Batman!
		// Timeout so the scene can be fully set up before requests are made
		// (helps with the Request triggering the loading bar)
		setTimeout(function(){

			if (this.user.id_str !== this.account.id) {
				this.checkFollowing();
			}
			else {
				// lol, lazy
				this.controller.get('follows-verb').update('is');
			}

			if (!this.user.newCard) {
				this.getHistory();
				this.getMentions();
				this.getFavorites();
			}
		}.bind(this), 200);

		this.controller.get('btn-info').addClassName('active');
		this.currentPanel = 0;
	},
	closeTapped: function() {
		this.controller.stageController.popScene();
		if (this.user.newCard) {
			this.controller.window.close();
		}
	},
	checkFollowing: function() {
		var Twitter = new TwitterAPI(this.account);
		Twitter.checkFollow(this.user.id_str, this.account.id, function(response) {
			var following	= false;

			try {
				following = response.responseJSON.relationship.source.following;
			} catch (e) {
			}

			if (following) {
				this.controller.get('follows-verb').update('follows');
			} else {
				this.controller.get('follows-verb').update('does not follow');
				this.menuItems[3].disabled = true;
			}
		}.bind(this));
	},
	handleCommand: function(event) {
		if (event.type === Mojo.Event.back) {
			if (this.toasters.items.length > 0) {
				this.toasters.back();
				event.stop();
			}
		}
		else if (event.type === Mojo.Event.forward) {
			this.refresh();
		}
	},
	refreshAll: function() {
		if (this.historyModel.items.length === 0) {
			this.getHistory();
		} else {
			this.getHistory({'since_id':this.historyModel.items[0].id_str});
		}
		if (this.mentionsModel.items.length === 0) {
			this.getMentions();
		} else {
			this.getMentions({'since_id':this.mentionsModel.items[0].id_str});
		}
		if (this.favoritesModel.items.length === 0) {
			this.getFavorites();
		} else {
			this.getFavorites({'since_id':this.favoritesModel.items[0].id_str});
		}
	},
	refresh: function() {
		// Refresh the current panel
		var panel = this.panels[this.currentPanel];
		switch(panel) {
			case 'history':
				if (this.historyModel.items.length === 0) {
					this.getHistory();
				} else {
					this.getHistory({'since_id':this.historyModel.items[0].id_str});
				}
				break;
			case 'mentions':
				if (this.mentionsModel.items.length === 0) {
					this.getMentions();
				} else {
					this.getMentions({'since_id':this.mentionsModel.items[0].id_str});
				}
				break;
			case 'favorites':
				if (this.favoritesModel.items.length === 0) {
					this.getFavorites();
				} else {
					this.getFavorites({'since_id':this.favoritesModel.items[0].id_str});
				}
				break;
		}
	},
	getHistory: function(opts) {
		var Twitter = new TwitterAPI(this.account);
		var prefs = new LocalStorage();
		var profileMaxResults = prefs.read('profileMaxResults');
		
		var args = {
			"user_id": this.user.id_str,
			//"count": 100,
			"count": profileMaxResults,
			"include_entities": true
		};

		for (var key in opts) {
			args[key] = opts[key];
		}

		Twitter.getUserTweets(args, function(response){
			var th = new TweetHelper();
			var prefs = new LocalStorage();
			var processVine = prefs.read('showVine');
			var mutedUsers = prefs.read('mutedUsers');

			if (this.historyModel.items.length === 0) {
				var tweet;
				for (var i=0; i < response.responseJSON.length; i++) {
					tweet = th.process(response.responseJSON[i],this.historyModel,this.controller,processVine,mutedUsers);
					if(tweet.favorited) {
						if (!tweet.favSet){
							tweet.favSet = true;
						}
						tweet.fav_class = 'show';
					} else {
						tweet.favSet = false;
						tweet.fav_class = 'hide';
					}
					this.historyModel.items[i] = tweet;
				}
			}	else {
				var tweet;
				for (var i = response.responseJSON.length - 1; i >= 0; i--){
					tweet = th.process(response.responseJSON[i],this.historyModel,this.controller,processVine,mutedUsers);
					if(tweet.favorited) {
						if (!tweet.favSet){
							tweet.favSet = true;
						}
						tweet.fav_class = 'show';
					} else {
						tweet.favSet = false;
						tweet.fav_class = 'hide';
					}
					this.historyModel.items.splice(0, 0, tweet);
				}
			}
			this.user.history = this.historyModel.items;
			this.controller.modelChanged(this.historyModel);
		}.bind(this));
	},
	getMentions: function(opts) {
		var Twitter = new TwitterAPI(this.account);
		var prefs = new LocalStorage();
		var profileMaxResults = prefs.read('profileMaxResults');

		var args = {
			//"count": 100,
			"count": profileMaxResults,
			"include_entities": true, 
			"q": '@' + this.user.screen_name
		};

		for (var key in opts) {
			args[key] = opts[key];
		}
		Twitter.search(args, function(response){
			var items = response.responseJSON.statuses;
			var th = new TweetHelper();
			var prefs = new LocalStorage();
			var processVine = prefs.read('showVine');
			var mutedUsers = prefs.read('mutedUsers');

			for (var i=0; i < items.length; i++) {
				items[i] = th.process(items[i],this.mentionsModel,this.controller,processVine,mutedUsers);
				if(items[i].is_rt === true){
					items.splice(i,1);
					i--;
				}
				if(items[i].favorited) {
					if (!items[i].favSet){
						items[i].favSet = true;
					}
					items[i].fav_class = 'show';
				} else {
					items[i].favSet = false;
					items[i].fav_class = 'hide';
				}
			}
			if (this.mentionsModel.items.length === 0) {
				this.mentionsModel.items = items;
			}
			else {
				for (var i = items.length - 1; i >= 0; i--){
					this.mentionsModel.items.splice(0, 0, items[i]);
				}
			}
			this.user.mentions = this.mentionsModel.items;
			this.controller.modelChanged(this.mentionsModel);
		}.bind(this));
	},
	getFavorites: function(opts) {
		var Twitter = new TwitterAPI(this.account);
		var prefs = new LocalStorage();
		var profileMaxResults = prefs.read('profileMaxResults');

		var args = {
			//count:				100,
			count: profileMaxResults,
			include_entities:	true,
			user_id:			this.user.id_str
		};

		for (var key in opts) {
			args[key] = opts[key];
		}

		Twitter.getFavorites(args, function(response) {
			var th = new TweetHelper();
			var prefs = new LocalStorage();
			var processVine = prefs.read('showVine');
			var mutedUsers = prefs.read('mutedUsers');

			if (this.favoritesModel.items.length === 0) {
				var tweet;
				for (var i=0; i < response.responseJSON.length; i++) {
					tweet = th.process(response.responseJSON[i],this.favoritesModel,this.controller,processVine,mutedUsers);
					if(tweet.favorited) {
						if (!tweet.favSet){
							tweet.favSet = true;
						}
						tweet.fav_class = 'show';
					} else {
						tweet.favSet = false;
						tweet.fav_class = 'hide';
					}					
					this.favoritesModel.items[i] = tweet;
				}
			} else {
				var tweet;
				for (var i = response.responseJSON.length - 1; i >= 0; i--){
					tweet = th.process(response.responseJSON[i],this.favoritesModel,this.controller,processVine,mutedUsers);
					if(tweet.favorited) {
						if (!tweet.favSet){
							tweet.favSet = true;
						}
						tweet.fav_class = 'show';
					} else {
						tweet.favSet = false;
						tweet.fav_class = 'hide';
					}					
					this.favoritesModel.items.splice(0, 0, tweet);
				}
			}
			this.user.favorites = this.favoritesModel.items;
			this.controller.modelChanged(this.favoritesModel);
		}.bind(this));
	},
	setScrollerSizes: function() {
		if (this.controller.window && this.controller) {
			var screenHeight = this.controller.window.innerHeight;
			var screenWidth = this.controller.window.innerWidth;
			var height = screenHeight - 200; //204;//194;//217//135; //subtract the top stuff
			var panelWidth = 320;
			// var height = screenHeight; //subtract the header
			var i;
			//grab each panel element. There should be as many of these as there are in this.panels

			var panelElements = this.controller.select('.panel');
			var totalWidth = 0; //the width of the main container
			for (i=0; i < panelElements.length; i++) {
				var panel = panelElements[i];
				panel.setStyle({
					"width": panelWidth + "px"
				});
				totalWidth += panelWidth;

				// TODO: add some height to the mentions scroller...

				//each scroller needs a max height. otherwise they don't scroll
				this.controller.get(this.panels[i] + "-scroller").setStyle({"max-height": height + "px"});
			}
		}
	},
	navTapped: function(event) {
		var id = event.srcElement.id.substr(event.srcElement.id.indexOf('-') + 1);
		for (var i=0; i < this.panels.length; i++) {
			if (this.panels[i] === id) {
				this.scrollTo(i);
			}
		}
	},
	scrollerChanged: function(event) {
		var i = event.value;
		this.currentPanel = i;
		this.controller.select('.active')[0].removeClassName('active');
		this.controller.get('btn-' + this.panels[i]).addClassName('active');
	},
	sideScrollChanged: function(event) {
		// Update the position of the icon bar
		var screenWidth = this.controller.window.innerWidth;
		var panelWidth = 320;

		if (screenWidth > panelWidth) {
			this.controller.get('profile-icons').style.marginLeft =
				(-this.controller.get('sideScroller').scrollLeft) + 'px';
		}
	},
	scrollTo: function(i) {
		this.controller.get("sideScroller").mojo.setSnapIndex(i, true);
	},
	locationTapped: function(event) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method:"launch",
			parameters: {
				id: "com.palm.app.maps",
				params: {
					query: this.user.location
				}
			}
		});
	},
	urlTapped: function(event) {
		//global.openBrowser(this.user.url);
		//var user.url = src
		//this.controller.stageController.pushScene('webview', this.user.url);
		var prefs = new LocalStorage();
		if (prefs.read('browserSelection') === 'inAppBrowser') {
			this.controller.stageController.pushScene('webview', this.user.url);
			Mojo.Log.info("Launching In App Browser");
		} else {
			global.openBrowser(this.user.url);
			Mojo.Log.info("Launching Stock Browser");
		}
	},
	tweetsTapped: function(event) {
		this.scrollTo(1);
	},
	tweetTapped: function(event) {
		//var tweet = event.item;
	
		var Twitter = new TwitterAPI(this.account);
		//Update retweet/favourite counter
		Twitter.getStatus(event.item.id_str, function(response, meta) {
			var tweet = response.responseJSON;
			var th = new TweetHelper();
			tweet = th.process(tweet);
			event.item.retweet_count = tweet.retweet_count;
			event.item.favorite_count = tweet.favorite_count;
			if (event.item.retweet_count > 0) {
				event.item.rt_class = 'show';
			} else {
				delete event.item.rt_class
			}
			if (event.item.favorite_count > 0){
				event.item.tweet_fav_class = 'show';
			} else {
				delete event.item.tweet_fav_class;
			}
			var tweetHtml = Mojo.View.render({
				object: event.item,
				template: 'templates/tweets/details'
			});
			var controller = getController();
			var currentToasterIndex = toasterIndex - 1;
			controller.get('details-' + currentToasterIndex).update(tweetHtml);
		}.bind(this));
		this.toasters.add(new TweetToaster(event.item, this, this.savedSearchesModel));
	},
	mentionTapped: function(event) {
		var Twitter = new TwitterAPI(this.account);
		var prefs = new LocalStorage();
		var processVine = prefs.read('showVine');
		Twitter.getStatus(event.item.id_str, function(response){
			var th = new TweetHelper();
			var tweet = th.process(response.responseJSON,null,null,processVine);
			this.toasters.add(new TweetToaster(tweet, this));
		}.bind(this));
	},
	shimTapped: function(event) {
		this.toasters.nuke();
	},
	optionsTapped: function(event) {
		this.controller.popupSubmenu({
			onChoose: this.popupHandler,
			placeNear: this.controller.get('options'),
			items: this.menuItems
		});
	},
	popupHandler: function(command) {
		switch (command) {
			case 'cmdFollow':
				this.follow();
				break;
			case 'cmdUnfollow':
				this.unfollow();
				break;
			case 'cmdMuteUser':
				this.muteUser();
				break;
			case 'cmdUnmuteUser':
				this.unmuteUser();
				break;
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
			case 'cmdNewCard':
				this.newCard();
				break;
			// Testing code for profile image upload - not ready - DC
			case 'cmdUpdateProfileImage':
				this.updateProfImage();
				break;
		}
	},
	// Testing code for profile image upload - not ready - DC
	updateProfImage: function() {
		var Twitter = new TwitterAPI(this.account);
		var args = {
			image: '../images/emoji-E04A.png'
			
		};
		Twitter.updateProfileImage(args, function(response){
			
		}.bind(this));
	},
	follow: function() {
		var Twitter = new TwitterAPI(this.account);
		Twitter.followUser(this.user.id_str, function(response){
			banner('Now following @' + this.user.screen_name);
			this.menuItems[0] = {label: 'Unfollow', command: 'cmdUnfollow'};
		}.bind(this));
	},
	unfollow: function() {
		var opts = {
			title: 'Are you sure you want to unfollow @' + this.user.screen_name + '?',
			callback: function(){
				var Twitter = new TwitterAPI(this.account);
				Twitter.unfollowUser(this.user.id_str, function(response){
					banner('Unfollowed @' + this.user.screen_name);
					this.menuItems[0] = {label: 'Follow', command: 'cmdFollow'};
					this.toasters.back();
				}.bind(this));
			}.bind(this)
		};

		this.toasters.add(new ConfirmToaster(opts, this));
	},
	muteUser: function() {
		var prefs	= new LocalStorage();
		var mutedUsers = prefs.read('mutedUsers');
		var items	= [];
		
		if(mutedUsers){
			for (var i = 0, m; m = mutedUsers[i]; i++) {
				//if(m.id && m.user) {
				if(m.id) {
					items.push(m);
				}
			}
		}
		//items.push({text: this.user.screen_name});
		items.push({id: this.user.id});
		prefs.write('mutedUsers',items);
		banner('Muting @' + this.user.screen_name);
		this.menuItems[1] = {label: 'Unmute User', command: 'cmdUnmuteUser'};
	},
	unmuteUser: function() {
		var prefs	= new LocalStorage();
		var mutedUsers = prefs.read('mutedUsers');
		var items	= [];
		
		if(mutedUsers){
			for (var i = 0, m; m = mutedUsers[i]; i++) {
				//if(-1 == m.user.indexOf(this.user.screen_name)){
				if(m.id !== this.user.id){
					//items.push({ text: m });
					//if(m.id && m.user) {
					if(m.id) {
						items.push({id: m.id});
					}
				}
			}
		}
		prefs.write('mutedUsers',items);
		banner('Un-muting @' + this.user.screen_name);
		this.menuItems[1] = {label: 'Mute User', command: 'cmdMuteUser'};
	},
	mention: function() {
		var args = {
			text: '@' + this.user.screen_name + ' '
		};

		OpenComposeToaster(this.toasters, args, this);
	},
	message: function() {
		var args = {
			user: this.user,
			dm: true
		};
		OpenComposeToaster(this.toasters, args, this);
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
	block: function() {
		var opts = {
			title: 'Are you sure you want to block @' + this.user.screen_name + '?',
			callback: function(){
				var Twitter = new TwitterAPI(this.account);
				Twitter.block(this.user.id_str, function(response){
					banner('Blocked @' + this.user.screen_name);
					this.toasters.back();

					this.hideTweet();
				}.bind(this));
			}.bind(this)
		};

		this.toasters.add(new ConfirmToaster(opts, this));
	},
	spam: function() {
		var opts = {
			title: 'Are you sure you want to report @' + this.user.screen_name + '?',
			callback: function(){
				var Twitter = new TwitterAPI(this.account);
				Twitter.report(this.user.id_str, function(response) {
					banner('Reported @' + this.user.screen_name);
					this.toasters.back();

					this.hideTweet();
				}.bind(this));
			}.bind(this)
		};

		this.toasters.add(new ConfirmToaster(opts, this));
	},
	newCard: function(event) {
		var stageName = global.userStage + global.stageId++;

		var appController = Mojo.Controller.getAppController();

		var pushCard = function(stageController){
			stageController.user = this.account;
			global.stageActions(stageController);
			this.user.newCard = true;
			stageController.pushScene('profile', this.user);
		}.bind(this);

		appController.createStageWithCallback({name: stageName, lightweight: true}, pushCard);

		this.controller.stageController.popScene();
	},
	activate: function(event) {
	},
	avatarTapped: function(event) {
		var img;
		var img_uid;
		var tmp;
		
		if (Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3"){
			img = this.user.profile_image_url.replace('_bigger', '');
		} else {
			img = this.user.profile_image_url.replace('_normal', '');
		}
		tmp = img.substring(img.lastIndexOf('/')+1);
		img_uid = tmp.split('.');
		this.controller.stageController.pushScene('pictureView', img, this.user.screen_name,img_uid[0]);
	},
	followingTapped: function(event) {
		var Twitter = new TwitterAPI(this.account);
		Twitter.getFriends(this.user.id_str, function(r){
			global.following = r;

			this.toasters.add(new UserListToaster('@' + this.user.screen_name + '\'s friends', r, this));
		}.bind(this));
	},
	followersTapped: function(event) {
		var Twitter = new TwitterAPI(this.account);
		Twitter.getFollowers(this.user.id_str, function(r){
			this.toasters.add(new UserListToaster('@' + this.user.screen_name + '\'s followers', r, this));
		}.bind(this));
	},
	deactivate: function(event) {
		// this.controller.get(this.controller.document).stopObserving('keyup');
	},
	cleanup: function() {
		for (var i=0; i < this.panels.length; i++) {
			this.controller.stopListening(this.controller.get('btn-' + this.panels[i]), Mojo.Event.tap, this.navTapped);
		}
		this.controller.get(this.controller.document).stopObserving('keyup');
		this.controller.stopListening(this.controller.get('sideScroller'), Mojo.Event.propertyChange, this.scrollerChanged);
		this.controller.stopListening(this.controller.get('sideScroller'), 'scroll', this.sideScrollChanged);
		this.controller.stopListening(this.controller.get('list-history'), Mojo.Event.listTap, this.tweetTapped);
		this.controller.stopListening(this.controller.get('list-favorites'), Mojo.Event.listTap, this.tweetTapped);
		this.controller.stopListening(this.controller.get('list-mentions'), Mojo.Event.listTap, this.mentionTapped);
		this.controller.stopListening(this.controller.get('shim'), Mojo.Event.tap, this.shimTapped);
		this.controller.stopListening(this.controller.get('options'), Mojo.Event.tap, this.optionsTapped);
		this.controller.stopListening(this.controller.get('tweets'), Mojo.Event.tap, this.tweetsTapped);
		this.controller.stopListening(this.controller.get('following'), Mojo.Event.tap, this.followingTapped);
		this.controller.stopListening(this.controller.get('followers'), Mojo.Event.tap, this.followersTapped);
		this.controller.stopListening(this.controller.get('url'), Mojo.Event.tap, this.urlTapped);
		this.controller.stopListening(this.controller.get('profile-avatar'), Mojo.Event.tap, this.avatarTapped);
		this.controller.stopListening(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
	}
};
