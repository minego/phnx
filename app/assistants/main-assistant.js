function MainAssistant(opts) {
	if (typeof(opts) === 'undefined') {
		opts = {};
	}
	this.opts = opts;
	this.offset = 0;
	this.currentPage = 0; //index position of the item in the below array

	this.loadingMore = false; //flag to determine if items should go to the bottom of a list
	this.imagePreview = false;
	this.favStatusChanged = false; // added by DC
	this.loading = false;
				
	this.panelLabels = ["home","mentions","messages","lists","search"]; // added by DC

	this.savedSearchesLoaded = false;
	this.searchLoaded = false;
	this.switcher = false;

	this.myLastId = undefined;
	this.count = 300; //how many tweets to load each request
	this.renderLimit = 1000; //umm...this scares me. used in list widgets to prevent flickering...
	this.toasters = new ToasterChain();
}

MainAssistant.prototype = {
	setup: function() {
		// set css classes based on device
		console.log(Mojo.Environment.DeviceInfo.modelNameAscii);

		if (Mojo.Environment.DeviceInfo.modelNameAscii == "Pixi" ||
			Mojo.Environment.DeviceInfo.modelNameAscii == "Veer") {
			this.controller.document.body.addClassName("small-device");
		} else if (Mojo.Environment.DeviceInfo.modelNameAscii == "TouchPad" ||
			Mojo.Environment.DeviceInfo.screenWidth > 500) {
			this.controller.document.body.addClassName("large-device");
		} else {
			this.controller.document.body.addClassName("medium-device");
		}

		if (!Mojo.Environment.DeviceInfo.coreNaviButton) {
			this.controller.document.body.addClassName("no-gesture");
		}

		// Start the background notifications timer
		global.setTimer();

		this.user = this.controller.stageController.user;
		this.users = this.controller.stageController.users;

		var homeItems, mentionsItems, messagesItems, i;

		if (this.user.home && this.user.mentions && this.user.messages) {
			homeItems = this.user.home;
			mentionsItems = this.user.mentions;
			messagesItems = this.user.messages;

			// A very sloppy and inelegant way to update the times of these tweets.
			// TODO: Fix this abomination
			var th = new TweetHelper();
			var tweet, d;
			for (i=0; i < homeItems.length; i++) {
				tweet = homeItems[i];
				d = new Date(tweet.created_at);
				tweet.time_str = d.toRelativeTime(1500);
			}

			for (i=0; i < mentionsItems.length; i++) {
				tweet = mentionsItems[i];
				d = new Date(tweet.created_at);
				tweet.time_str = d.toRelativeTime(1500);
			}

			for (i=0; i < messagesItems.length; i++) {
				tweet = messagesItems[i];
				d = new Date(tweet.created_at);
				tweet.time_str = d.toRelativeTime(1500);
			}
		}
		else {
			homeItems = [];
			mentionsItems = [];
			messagesItems = [];
		}

		/**
			this.panels:
				@id is used for html elements (and some misc stuff)
				@index is used rarely
				@position is used in panel templates
				@resource is used by the resource helper to figure out endpoint urls
				@refresh tells if this panel should be refreshed globally
				@update tells if this panel should be updated globally

			TODO: make panels truly dynamic
		**/

	//	this.panels = [
/*			{index: 0, position: 1, id: "home", title: "home", type: "timeline", resource: "home", height: 0, refresh: true, update: true, state: {left: 0, top: 0}, model: {items:homeItems}},
			{index: 1, position: 2, id: "mentions", title: "mentions", type: "timeline", resource: "mentions", height: 0, refresh: true, update: true,	state: {left: -133, top: 0}, model: {items:mentionsItems}},
			{index: 2, position: 3, id: "messages", title: "messages", type: "timeline", resource: "messages", height: 0, refresh: true, update: true,	state: {left: -339, top: 0}, model: {items:messagesItems}},
			{index: 3, position: 4, id: "lists", title: "lists", type: "lists", height: 0, refresh: false, update: false},
			{index: 4, position: 5, id: "search", title: "search", type: "search", height: 0, refresh: false, update: false}
*/

		// block added by DC to allow for easier panel order adjustment
		var prefs = new LocalStorage();
		var tabOrder = prefs.read('taborder');

		if(tabOrder){
			switch (tabOrder) {
				case "hmdls":
					this.panelLabels = ["home","mentions","messages","lists","search"]; // added by DC
					break;
				case "hmdsl":
					this.panelLabels = ["home","mentions","messages","search","lists"]; // added by DC			
					break;
				case "hmsdl":
					this.panelLabels = ["home","mentions","search","messages","lists"]; // added by DC			
					break;
				case "hmsld":
					this.panelLabels = ["home","mentions","search","lists","messages"]; // added by DC			
					break;
				case "hmlds":
					this.panelLabels = ["home","mentions","lists","messages","search"]; // added by DC			
					break;
				case "hmlsd":
					this.panelLabels = ["home","mentions","lists","search","messages"]; // added by DC
					break;
			}
		}

		this.panels = new Array();

		for (i=0; i<5; i++){
			switch (this.panelLabels[i]) {
				case "home":
					this.panels[i] = {index: i, position: i+1, id: "home", title: "home", type: "timeline", resource: "home", height: 0, refresh: true, update: true, state: {left: 0, top: 0}, model: {items:homeItems}};
					break;
				case "mentions":
					this.panels[i] = {index: i, position: i+1, id: "mentions", title: "mentions", type: "timeline", resource: "mentions", height: 0, refresh: true, update: true,	state: {left: -133, top: 0}, model: {items:mentionsItems}};
					break;
				case "lists":
					this.panels[i] = {index: i, position: i+1, id: "lists", title: "lists", type: "lists", height: 0, refresh: false, update: false};
					break;
				case "search":
					this.panels[i] = {index: i, position: i+1, id: "search", title: "search", type: "search", height: 0, refresh: false, update: false};
					break;
				case "messages":
					this.panels[i] = {index: i, position: i+1, id: "messages", title: "messages", type: "timeline", resource: "messages", height: 0, refresh: true, update: true,	state: {left: -339, top: 0}, model: {items:messagesItems}};
					break;
			}
		} //end block DC

		/*	this.panels[0] = {index: 0, position: 1, id: "home", title: "home", type: "timeline", resource: "home", height: 0, refresh: true, update: true, state: {left: 0, top: 0}, model: {items:homeItems}};
			this.panels[1] = {index: 1, position: 2, id: "mentions", title: "mentions", type: "timeline", resource: "mentions", height: 0, refresh: true, update: true,	state: {left: -133, top: 0}, model: {items:mentionsItems}};
			this.panels[2] = {index: 2, position: 3, id: "lists", title: "lists", type: "lists", height: 0, refresh: false, update: false};
			this.panels[3] = {index: 3, position: 4, id: "search", title: "search", type: "search", height: 0, refresh: false, update: false};
			this.panels[4] = {index: 4, position: 5, id: "messages", title: "messages", type: "timeline", resource: "messages", height: 0, refresh: true, update: true,	state: {left: -339, top: 0}, model: {items:messagesItems}};
			*/
	//	];

		this.timeline = 0; //index position of the timeline, default to first one

		this.controller.get('header-title').update(this.user.username);

		// Build the account menu items

		var am = new Account();
		am.all(function(r){
			this.users = r;
		}.bind(this));

		var accountMenuItems = [];
		if (this.users) {
			for (i=0; i < this.users.length; i++) {
				accountMenuItems.push({
					label: '@' + this.users[i].username,
					command: 'account-' + this.users[i].id
				});
			}
		}
		else {
			var me = {
				label: '@' + this.user.username,
				command: 'account-' + this.user.id
			};
			this.users = [me];
			accountMenuItems.push(me);
		}

		accountMenuItems.push({
			label: 'New Account',
			command: 'cmdNewAccount'
		});

		accountMenuItems.push({
			label: 'Logout @' + this.user.username,
			command: 'cmdRemoveAccount'
		});
		accountMenuItems.push({
			label: 'Login ReadItLater and Instapaper',
			command: 'cmdLoginRil'
		});

		var menuItems = [
			Mojo.Menu.editItem,
			{
				label: 'Accounts',
				items: accountMenuItems
			},
			{
				label: 'View',
				items: [
					{
						label: 'Compose',
						command: 'cmdNewTweet'
					},
					{
						label: 'Refresh',
						command: 'cmdRefresh'
					},
					{
						label: 'Refresh Flush',
						command: 'cmdRefreshFlush'
					}
				]
			},
			{
				label: 'Lookup User',
				command: 'cmdFindUser'
			},
/*
			{
				label: 'Add Filter',
				command: 'cmdAddFilter'
			},
*/
			{
				label: 'Preferences',
				command: 'cmdPreferences'
			},
			{
				label: 'Manage Filters',
				command: 'cmdManageFilters'
			},
			{
				label: 'About',
				items: [
					{
						label: 'About Project Macaw',
						command: 'cmdAbout'
					},
					{
						label: 'Support',
						command: 'cmdSupport'
					},
					{
						label: 'View Changelog',
						command: 'cmdChangelog'
					}
					/*,{
						label: 'Contact Support',
						command: 'cmdSupport'
					}*/
				]
			}
		];

		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: menuItems});

		// create the panels
		var panelHtml = '';
		for (var j=0; j < this.panels.length; j++) {
			var panel = this.panels[j];
			var content = Mojo.View.render({
				object: panel,
				template: 'templates/panels/' + panel.type
			});
			panelHtml += content;

			this.controller.get('scrollItems').update(panelHtml);

			this.controller.setupWidget(panel.id + "-scroller",{mode: 'vertical'},{});
			if (panel.type === "timeline") {
				var prefs = new LocalStorage();
				if (prefs.read('hideAvatar')) {
					//this.controller.get(this.nodeId).addClassName('hide-avatar'); // added by dc so that you can delete DM's not created by yourself
					this.controller.setupWidget('list-' + panel.id,{itemTemplate: "templates/tweets/item-no-avatar",listTemplate: "templates/list", renderLimit: this.renderLimit}, panel.model);
				}
				else{
					this.controller.setupWidget('list-' + panel.id,{itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: this.renderLimit}, panel.model);
				}  // added by DC
				showThumbs = prefs.read('showThumbs'); // added by DC
				showEmoji = prefs.read('showEmoji'); // added by DC

				//this.controller.setupWidget('list-' + panel.id,{itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: this.renderLimit}, panel.model);

				//ask tweetmarker where we left off
/*
				var req = {
					"method": "POST",
					"uri": [
						"https://api.tweetmarker.net/v1/lastread?collection=",
						(panel.id === "home") ? "timeline" : panel.id,
						"&username=", this.user.userName,
						"&api_key=WL-33C6DF48244C"
					].join("")
				};

				var currentUser = getUser();
				var args = [
					{"key":"token","data": currentUser.token},
					{"key":"secret","data": currentUser.secret}
				];

				OAuth.completeRequest({
					"method": req.method,
					"action": req.uri,
					"parameters": []
				}, {
					"consumerKey": Twitter.key,
					"consumerSecret": Twitter.secret,
					"token": currentUser.token,
					"tokenSecret": currentUser.secret
				});

				var authHeader = OAuth.getAuthorizationHeader(Twitter.apibase,
															  []);
//				this.controller.get('response').update('creating request');
				var req = new Ajax.Request(url, {
					"method": req.method,
					"requestHeaders": {
						"X-Auth-Service-Provider": [
							"https://api.twitter.com/1/account",
							"/verify_credentials.json"
						].join(""),
						"X-Verify-Credentials-Authorization": authHeader
					},
					"onSuccess": function(response) {
						Mojo.Controller.errorDialog("yayy " + response);
					},
					"onFailure": function(transport) {
						Mojo.Controller.errorDialog("boo " + transport.responseText);
					}
				});

				new Ajax.Request(req.uri, {
					"method": req.method,
					"encoding": "UTF-8",
					"requestHeaders": {
						"X-Auth-Service-Provider": [
							"https://api.twitter.com/1/account",
							"/verify_credentials.json"
						].join(""),
						"X-Verify-Credentials-Authorization": [
							"OAuth realm=\"http://api.twitter.com\"",
							", oauth_consumer_key=", "WL-33C6DF48244C",
							", oauth_token=", currentUser.token,
							", oauth_signature_method=", "HMAC-SHA1",
							", oauth_signature=", "???",
							", oauth_timestamp=", "???",
							", oauth_nonce=", "???",
							", oauth_version=", "1.0"
						].join("")
					},
					onComplete:function(response){
						//ex(response.responseText);
						var response_text=response.responseText;
						var responseVars=response_text.split("&");
						var auth_url=this.authorizeUrl+"?"+responseVars[0]+"&oauth_consumer="+this.consumer_key;
						var oauth_token=responseVars[0].replace("oauth_token=","");
						var oauth_token_secret=responseVars[1].replace("oauth_token_secret=","");
						this.requested_token=oauth_token;
						this.token=this.requested_token;
						this.tokenSecret=oauth_token_secret;
						var oauthBrowserParams={
							authUrl:auth_url,
							callbackUrl:this.callback
						};
						this.instanceBrowser(oauthBrowserParams);
					}.bind(this)
				});
				*/
			}
		}

		// Set up Lists and Search widgets
		this.savedSearchesModel = {items: []};
		this.trendingTopicsModel = {items: []};

		this.controller.setupWidget('trending-topics-list',{itemTemplate: "templates/search-list-item",listTemplate: "templates/list", renderLimit: 10}, this.trendingTopicsModel);
		this.controller.setupWidget('saved-searches-list',{itemTemplate: "templates/search-list-item",listTemplate: "templates/list", renderLimit: 30}, this.savedSearchesModel);

		this.listsModel = {items: []};
		this.listsYouFollowModel = {items: []};

		this.controller.setupWidget('your-lists-list',{itemTemplate: "templates/list-item",listTemplate: "templates/list", renderLimit: 30}, this.listsModel);
		this.controller.setupWidget('lists-you-follow-list',{itemTemplate: "templates/list-follows",listTemplate: "templates/list", renderLimit: 30}, this.listsYouFollowModel);

		this.setScrollerSizes();

		var panelElements = this.controller.select('.panel');
		var loadMoreBtns = this.controller.select('.load-more');
		var timelineLists = this.controller.select('.timeline-list');

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

		//listen to the lists
		for (i=0; i < timelineLists.length; i++) {
			var el = timelineLists[i];
			this.controller.listen(el, Mojo.Event.listTap, this.tweetTapped.bind(this));
		}

		//listen to the load more buttons
		for (i=0; i < loadMoreBtns.length; i++) {
			var btn = loadMoreBtns[i];
			this.controller.listen(btn, Mojo.Event.tap, this.moreButtonTapped.bind(this));
		}

		this.addListeners();
		setTimeout(function(){
			var prefs = new LocalStorage();

			if(prefs.read('refreshFlushAtLaunch') == false) {
				this.refreshAll();
			}
			else{
				for (var j=0; j < this.panels.length; j++) {
					if(this.panels[j].type === "timeline")
						this.refreshPanelFlush(this.panels[j]);
				}
			}
					
			this.loadLists();
			this.getRetweeted();
			// get the avatar for the minimized card
			this.getUserAvatar();

			if (this.opts.autoScroll) {
				var panel = this.getPanel(this.opts.panel);
				this.scrollTo(panel.index);
			}
			
			if (prefs.read('version') !== Mojo.appInfo.version) {
				prefs.write('version', Mojo.appInfo.version);

				this.toasters.add(new ChangelogToaster(this));
			}
		}.bind(this),10);
	},
	handleCommand: function(event) {
		if (event.type === Mojo.Event.back) {
			var prefs = new LocalStorage(); //added by DC
			var refresh = prefs.read('refreshOnSubmit'); //added by DC
			if (this.toasters.items.length > 0) {
				if (this.imagePreview) {
					this.toasters.items[this.toasters.items.length - 1].closePreview();
				}
				//block added by DC
				else if (this.favStatusChanged) {
					if (refresh) {
						this.refresh();
					}
					this.favStatusChanged = false;
					
					this.toasters.back();
				}//end block
				else {
					this.toasters.back();
				}
				event.stop();
			}
		}
		else if (event.type === Mojo.Event.forward) {
			var prefs = new LocalStorage();
			var onSwipe = prefs.read('forwardSwipe');
			if (Ajax.activeRequestCount === 0) {
				if (onSwipe === 'current') {
					this.refresh();
				}
				else if (onSwipe === 'all') {
					this.refreshAll();
				}
			}
		}
		else if (typeof(event.command) !== 'undefined') {
			if (event.command.indexOf('theme-') > -1) {
				this.switchTheme(event.command);
			}
			else if (event.command.indexOf('font-') > -1) {
				this.changeFont(event.command);
			}
			else if (event.command.indexOf('account-') > -1) {
				var userId = event.command.substr(event.command.indexOf('-') + 1);
				this.openAccount(userId);
			}
			else if (event.command === 'cmdNewAccount') {
				this.newAccountTapped();
			}
			else if (event.command === 'cmdMyProfile') {
				// this.showProfile(this.user.username, true);
				var Twitter = new TwitterAPI(this.user);
				Twitter.getUser(this.user.username, function(response){
					this.controller.stageController.pushScene({
						name: 'profile',
						disableSceneScroller: true
					}, response.responseJSON);
				}.bind(this));
			}
			else if (event.command === 'cmdNewTweet') {
				this.newTweet();
			}
			else if (event.command === 'cmdRefresh') {
				if (Ajax.activeRequestCount === 0) {
					this.refreshAll();
				}
			}
			//Block added by DC
			else if (event.command === 'cmdRefreshFlush') {
				var screenWidth = this.controller.window.innerWidth;
				var panelWidth = 320;
				if (Ajax.activeRequestCount === 0) {
					//Need to refresh all on Touchpad - DC
					if (screenWidth <= panelWidth) {
						this.refreshPanelFlush(this.panels[this.timeline]);
					}
					else{
						for (var j=0; j < this.panels.length; j++) {
							if(this.panels[j].type === "timeline")
								this.refreshPanelFlush(this.panels[j]);
						}
					}
				}
			} //end block DC

			else if (event.command === 'cmdFindUser') {
				this.toasters.add(new LookupToaster(this));
			}
			else if (event.command === 'cmdAddFilter') {
				this.toasters.add(new AddFilterToaster(this));
			}
			else if (event.command === 'cmdManageFilters') {
				this.toasters.add(new ManageFiltersToaster(this));
			}
			else if (event.command === 'cmdChangelog') {
				this.toasters.add(new ChangelogToaster(this));
			}
			// else if (event.command === 'cmdPreferences') {
			//	// this.controller.stageController.pushScene('preferences');
			// }
			else if (event.command === 'cmdRemoveAccount') {
				this.logout();
			}
			else if (event.command === 'cmdLoginRil') {
				this.controller.stageController.pushScene("ril-login");
			}
		}
	},
	switchTheme: function(command) {
		// var theme = command.substr(command.indexOf('-') + 1);
		// var classes = this.controller.select('body')[0].classNames();
		// var i;
		// for (i=0; i < classes.length; i++) {
		//	this.controller.select('body')[0].removeClassName(classes[i]);
		// }
		//
		// this.controller.select('body')[0].addClassName(theme);
		//
		// //add cookie to save theme
		// var themeCookie = new Mojo.Model.Cookie('phnxTheme');
		// themeCookie.put({
		//	className: theme
		// });
	},
	changeFont: function(cmdFont) {
		var font = cmdFont.substr(cmdFont.indexOf('-') + 1);
		var fonts = ['small', 'medium', 'large'];
		// var body = this.controller.select('body')[0];
		var body = this.controller.document.getElementsByTagName("body")[0];
		for (var i=0; i < fonts.length; i++) {
			Element.removeClassName(body, 'font-' + fonts[i]);
		}
		Element.addClassName(body, 'font-' + font);
		var prefs = new LocalStorage();
		prefs.write('fontSize', font);
	},
	setScrollerSizes: function() {
		if (this.controller.window && this.controller) {
			var screenHeight = this.controller.window.innerHeight;
			var screenWidth = this.controller.window.innerWidth;
			var panelWidth = 320;
			var height = screenHeight - 0; //subtract the header
			// var height = screenHeight; //subtract the header
			var i;
			//grab each panel element. There should be as many of these as there are in this.panels

			if (screenWidth > panelWidth) {
				// On large devices there are 21px of padding and 1px border
				panelWidth += 22;
			} else {
				// Account for the border, 1px
				panelWidth += 1;
			}

			var panelElements = this.controller.select('.panel');
			var totalWidth = 0; //the width of the main container
			for (i=0; i < panelElements.length; i++) {
				var panel = panelElements[i];
				panel.setStyle({
					"width": panelWidth + "px"
				});
				totalWidth += panelWidth;

				//each scroller needs a max height. otherwise they don't scroll
				this.controller.get(this.panels[i].id + "-scroller").setStyle({"max-height": height + "px"});
			}

			//set the container width
			this.controller.get('scrollItems').setStyle({'width' : totalWidth + 'px'});
			//set the height of the dark 'shim' that we use sometimes
			this.controller.get('shim').setStyle({'height': screenHeight + 'px'});
			this.controller.get('image-preview').hide();
		}
	},
	scrollTo: function(idx) {
		//this moves the horizontal scroller
		this.controller.get("sideScroller").mojo.setSnapIndex(idx, true);
	},
	scrollerChanged: function(event) {
		var panel = this.panels[event.value];
		var screenWidth = this.controller.window.innerWidth;
		var panelWidth = 320;

		//hide the beacon and new content indicator on the old panel
		var oldPanel = this.panels[this.timeline];
		if (oldPanel && oldPanel.refresh) {
			// newTweets = this.controller.select('#panel-' + oldPanel.id + ' .new-tweet');
			// for (var i=0; i < newTweets.length; i++) {
			//	this.controller.get(newTweets[i]).removeClassName('new-tweet');
			// }
			this.controller.get(oldPanel.id + '-beacon').removeClassName('show');
		}

		// Need to change index for timeline below if changing order of panels - DC
		if (panel.id === "search" || screenWidth > panelWidth) {
		//if (event.value === 4 || screenWidth > panelWidth) {
			// enable the search box
			this.controller.get('txtSearch').disabled = false;
			if (this.searchLoaded === false) {
				this.searchLoaded = true;
				this.loadSearch();
			}
		}
		else {
			this.controller.get('txtSearch').value = '';
			this.controller.get('txtSearch').blur();
			this.controller.get('txtSearch').disabled = true;
		}

		//update the index
		this.timeline = event.value;
		// Move the indicator arrow

		if (panel) {
			this.moveIndicator(panel.id);
		}
	},

	sideScrollChanged: function(event) {
		// Update the position of the bottom bar
		var screenWidth = this.controller.window.innerWidth;
		var panelWidth = 320;

		if (screenWidth > panelWidth) {
			this.controller.get('nav-bar').style.marginLeft =
				(-this.controller.get('sideScroller').scrollLeft) + 'px';

			// enable the search box
			this.controller.get('txtSearch').disabled = false;
			if (this.searchLoaded === false) {
				this.searchLoaded = true;
				this.loadSearch();
			}
		}
	},

	loadSearch: function() {
		// Loads saved searches and trending topics
		var Twitter = new TwitterAPI(this.user);
		Twitter.trends(function(response){
			var resp = response.responseJSON;
			var trends = resp[0].trends;
			this.trendingTopicsModel.items = trends;
			this.controller.modelChanged(this.trendingTopicsModel);
		}.bind(this));

		Twitter.getSavedSearches(function(response){
			var savedSearches = response.responseJSON;
			if (savedSearches.length > 0) {
				if (savedSearches.length === 1) {
					this.controller.get('saved-searches').addClassName('single');
				}
				this.savedSearchesModel.items = savedSearches;
				this.controller.modelChanged(this.savedSearchesModel);
				this.controller.get('saved-searches').show();
				this.savedSearchesLoaded = true;
			}
		}.bind(this));
	},
	refreshAll: function() {
		for (var j=0; j < this.panels.length; j++) {
			if(this.panels[j].type === "timeline")
				this.refreshPanel(this.panels[j]); //modified by DC to allow for possible re-ordering of panels at a later date
		}

		// Load the list of people being followed for auto complete
		if (!global.following || !global.following.length) {
			this.refreshFollowing();
		}
	},
	refreshFollowing: function() {
		var Twitter = new TwitterAPI(this.user);
		Twitter.getFriends(this.user.id, function(r) {
			global.following = r;
		}.bind(this));
	},
	refresh: function() {
		this.refreshPanel(this.panels[this.timeline]);
	},
	refreshPanelId: function(id) {
		this.refreshPanel(this.getPanel(id));
	},
	refreshPanel: function(panel) {
		this.loadingMore = false;
		var lastId = undefined;
		
		if (panel.refresh) {
			if (panel.model.items.length > 0) {
				// grab the second tweet for gap detection
				var tweet = panel.model.items[1];

				if (tweet) {
					if (tweet.is_rt) {
						lastId = tweet.original_id;
					}
					else{
						lastId = tweet.id_str;
					}
				}
			}

			if (panel.id === 'messages') {
				this.getDMs(panel, lastId);
			} else {
				this.getTweets(panel, lastId);
			}
		}
		else if (panel.id === 'search') {
			this.loadSearch();
		}
	},
	refreshPanelFlush: function(panel) {
		this.loadingMore = false;
		var lastId = undefined;
		//var myLastId = undefined;

			if (panel.model.items.length > 0) {
				var tweet = panel.model.items[0];

				if (tweet) {
					if (tweet.is_rt) {
						panel.model.myLastId = tweet.original_id;
					}
					else{
						panel.model.myLastId = tweet.id_str;
					}
				}
			}


		panel.model.items = {};
		panel.model.items.length = 0;
		
		if (panel.refresh) {
			if (panel.model.items.length > 0) {
				// grab the second tweet for gap detection
				var tweet = panel.model.items[1];

				if (tweet) {
					if (tweet.is_rt) {
						lastId = tweet.original_id;
					}
					else{
						lastId = tweet.id_str;
					}
				}
			}

//			panel.model.items = {};
//			panel.model.items.length = 0;


			if (panel.id === 'messages') {
				this.getDMs(panel, lastId);
			} else {
				this.getTweets(panel, lastId);
			}
		}
		else if (panel.id === 'search') {
			this.loadSearch();
		}			
	},

	refreshAndScrollTo: function(id) {
		var panel = this.getPanel(id);
		this.refreshAll();
		this.scrollTo(panel.index);
	},
	getUserAvatar: function() {
		var Twitter = new TwitterAPI(this.user, this.controller.stageController);
		Twitter.getUser(this.user.username, function(r) {
			var img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			var cardHtml = Mojo.View.render({
				object: {image: img},
				template: 'templates/account-card'
			});
			this.controller.get('preload').src = img;
			this.controller.get('account-shim').update(cardHtml);
		}.bind(this));
	},
	getPanel: function(id) {
		var panel;
		for (var i=0; i < this.panels.length; i++) {
			panel = this.panels[i];
			if (panel.id === id) {
				return panel;
			}
		}
		return null;
	},
	loadMore: function(timeline) {
		this.loadingMore = true;
		var model = this.panels[this.timeline].model;
		var maxId = model.items[model.items.length - 1].id_str;
		var panel = this.panels[this.timeline];

		if (panel.id === 'messages') {
			this.getDMs(panel, undefined, maxId);
		} else {
			this.getTweets(panel, undefined, maxId);
		}
	},
	getTweets: function(panel, lastId, maxId) {
		var args = {
			'count':			this.count,
			'include_entities':	'true',
			'include_rts':		'1'
		};

		if (lastId) {
			args.since_id = lastId;
		}
		if (maxId) {
			args.max_id = maxId;
		}
		var Twitter = new TwitterAPI(this.user);
		Twitter.timeline(panel, this.gotItems.bind(this), args, this);
	},
	gotItems: function(response, meta) {
		// one-size-fits-all function to handle timeline updates
		// Does lots of looping to update relative times. Needs optimization

		var panel = meta.panel;
		var model = panel.model;
		var scroller = panel.id + "-scroller";
		var more = "more-" + panel.id;
		var tweets = response.responseJSON;
		var xCount = tweets.length;
		var th = new TweetHelper();
		var favSym = "★"; //added by DC
		
		var i;

		var filters = (new LocalStorage()).read('filters');
		// filters = [ 'foo', 'bar' ];

		for (i = 0; i < tweets.length; i++) {
			if (tweets[i].dm || !th.filter(tweets[i], filters)) {
				tweets[i] = th.process(tweets[i]);
			} else {
				tweets.splice(i, 1);
			}
		}

		if (tweets.length > 1) {
			if (!this.loadingMore) {
				this.controller.get(panel.id + '-beacon').addClassName('show');
			}
		} else {
			this.controller.get(panel.id + '-beacon').removeClassName('show');
		}

		var scrollId = 0; // this is the INDEX (not ID, sorry) of the new tweet to scroll to
		var fullLoad = 0; // added by DC. Used to flag when full 1:1 tweet pull is used

		if (model.items.length > 0 && this.loadingMore) {
			//loading "more" items (not refreshing), so append to bottom

			for (i = 1; i < tweets.length; i++) {
				//start the loop at i = 1 so tweets aren't duplicated
				model.items.splice((model.items.length - 1) + i, 0, tweets[i]);
			}

		}
		else if (model.items.length > 0 && !this.loadingMore) {
			// a typical refresh is being performed here (append to top)
			var k;

			// loop through old tweets
			for (k=0; k < model.items.length; k++) {
				// remove the tweet divider
				if (model.items[k].cssClass === 'new-tweet'){
					model.items[k].cssClass = "old-tweet";
				}
			}

			var hasGap, loopCount;
			var tweetCount = tweets.length;
			if (tweets[tweets.length - 1].id_str === model.items[0].id_str) {
				// There is no gap if the first tweet is included here
				// Adjust loopCount to exclude this duplicate tweet from being included
				hasGap = false;
				loopCount = tweets.length - 2;
				tweetCount--;
			}
			else {
				hasGap = true;
				loopCount = tweets.length - 1;
				panel.gapStart = tweets[tweets.length - 1].id_str;
				panel.gapEnd = model.items[0].id_str;
			}

			hasGap = false; // ignore gap detection in this release

			var j;
			for (j = loopCount; j >= 0; j--) {
				//doing a backwards (upwards?) loop to get the items in the right order

				if (j === loopCount) {
					tweets[j].cssClass = 'new-tweet';

					// These nouns are used in the "X New {Noun}" message
					var nouns = {
						'home': 'Tweet',
						'mentions': 'Mention',
						'messages': 'Direct Message'
					};

					// TODO: Make this message tappable to load gaps
					var msg = tweetCount + ' New ' + nouns[panel.id];
					if (tweetCount > 1) {
						msg += 's'; //pluralize
					}

					if (hasGap) {
						msg += '<br /><span>Tap to load missing tweets</span>';
					}

					tweets[j].dividerMessage = msg;
				}
				model.items.splice(0,0,tweets[j]);
			}

			scrollId = tweetCount; // set the index of the new tweet to auto-scroll to
		}
		else{
			// the timeline was empty so do a 1:1 mirror of the tweets response
			model.items = tweets;
			fullLoad = 1;
		}
		// Write a few (10) of the latest tweets to the user's cache (async)
		this.user[panel.id] = model.items.slice(0,10);
		var account = new Account();
		account.load(this.user);
		account.save();

		// Save the recent ids for notification checks
		if (tweets.length > 0 && !this.loadingMore) {
			var store = new LocalStorage();
			store.write(this.user.id + '_' + panel.id, tweets[0].id_str);
		}

		//Block added by DC - allows new tweet marker to work after refresh and flush
		if (panel.update) {
			if(model.myLastId) {
				for(k=0; k < model.items.length; k++){
					//if(model.items[k].id_str === model.myLastId){
					if(model.items[k].id_str === model.myLastId){
						if(k > 0) {
							// These nouns are used in the "X New {Noun}" message
							var nouns = {
								'home': 'Tweet',
								'mentions': 'Mention',
								'messages': 'Direct Message'
							};
							// TODO: Make this message tappable to load gaps
							var msg = k + ' New ' + nouns[panel.id];
							if (k > 1) {
								msg += 's'; //pluralize
							}
							model.items[k-1].dividerMessage = msg;
							model.items[k-1].cssClass = 'new-tweet';
							model.myLastId = undefined;
				
							this.controller.get(panel.id + '-beacon').addClassName('show');
						}
						else{
							this.controller.get(panel.id + '-beacon').removeClassName('show');
						}
						scrollId = k; // set the index of the new tweet to auto-scroll to
						break; //no need to keep on iterating if we've found our match
					}			
				}
				model.myLastId = undefined;
			}
		}

		if(fullLoad === 1) {
			if(scrollId < 10) {
				model.items = tweets.slice(0,10);
			}
			else{
				model.items = tweets.slice(0,scrollId+1);
			} 
		}	//end block 
		
		if (panel.update) {
			for (i = 0; i < model.items.length; i++) {
				var tweet = model.items[i];

				tweet.time_str = this.timeSince(tweet.created_at);
				// block below added by DC
				if(tweet.favorited) {
					if (!tweet.favSet){
						//tweet.user.name = favSym + tweet.user.name;
						tweet.favSet = true;
						//tweet.favstar = favSym;
					}
					tweet.fav_class = 'show';
				}
				else {
					//if(tweet.favSet){
						//tweet.user.name = tweet.user.name.replace(favSym,"");
						tweet.favSet = false;
						tweet.fav_class = 'hide';
						//tweet.favstar = "";
					//}
				}//end block
			}
		}

		this.controller.modelChanged(panel.model);
		if (scrollId !== 0) {
			this.controller.get('list-' + panel.id).mojo.revealItem(scrollId, true);
		}
		if (model.items.length === 0 || (this.loadingMore && tweets.length === 0)) {
			this.controller.get(more).hide();
		}
		this.loading = false;
	},
	getDMs: function(panel, lastId, maxId) {
		
		var args = {
			'count': this.count,
			'include_entities': 'true'
		};

		if (lastId) {
			args.since_id = lastId;
		}
		if (maxId) {
			args.max_id = maxId;
		}
		var Twitter = new TwitterAPI(this.user);
		var prefs = new LocalStorage(); //added by DC
		var dmTo = "←"; //"◄←"; //"☞"; //"To:"; 
		var dmFrom = "→"; //"►→"; //"☜"; "From:";
		// Not reading prefs for some reason.  probably out of context
		//if (prefs.read('hideAvatar')) {
			//dmTo = "To:";
			//dmFrom = "From:";
		//} //added by DC

		Twitter.timeline(panel, function(r1, m1) {
			Twitter.timeline(panel, function(r2, m2) {
				for (var i = 0, tweet; tweet = r1.responseJSON[i]; i++) {
					tweet.user = tweet.sender;
					tweet.dm						= true;
					//tweet.user.name = tweet.user.name + dmFrom;// added by DC
					tweet.dir = dmFrom;
					// Use unicode above instead of bitmap below.  This way it scales with the font selection
					//tweet.direction_arrow_img = "images/low/arrow_left.png";
				}

				for (var i = 0, tweet; tweet = r2.responseJSON[i]; i++) {
					var id	= tweet.sender.id_str;
					var img	= tweet.sender.profile_image_url;

					tweet.user = tweet.recipient;

					//tweet.user.name = tweet.user.name + dmTo;  // added by DC
					tweet.dir = dmTo;
					// Use unicode above instead of bitmap below.  This way it scales with the font selection
					//tweet.direction_arrow_img = "images/low/arrow_right.png";
					tweet.user.profile_image_url	= img;
					tweet.user.id_str				= id;
					tweet.dm						= true;
				}

				var joined	= r1.responseJSON.concat(r2.responseJSON);

				joined.sort(function(a, b) {
					return((new Date(b.created_at)) - (new Date(a.created_at)));
				});

				this.gotItems({ responseJSON: joined }, m2);
			}.bind(this), args, this, 'sentMessages');
		}.bind(this), args, this);
	},
	fillGap: function(panel) {
		var args = {
			count: this.count,
			include_entities: 'true',
			max_id: panel.gapStart,
			since_id: panel.gapEnd
		};
		var Twitter = new TwitterAPI(this.user);
		Twitter.timeline(panel, this.gotGap.bind(this), args, this);
	},
	gotGap: function(response, meta) {
		banner('Not done yet');
	},
	timeSince: function(time) {
		//using a modified Date function in helpers/date.js
		var d = new Date(time);
		return d.toRelativeTime(1500);
	},
	loadLists: function() {
		var Twitter = new TwitterAPI(this.user);
		Twitter.userLists({'user_id':this.user.id}, function(response){
			var lists = response.responseJSON.lists;
			if (lists.length > 0) {
				if (lists.length === 1) {
					this.controller.get('your-lists').addClassName('single');
				}
				this.listsModel.items = lists;
				this.controller.modelChanged(this.listsModel);
				this.controller.get('your-lists').show();
			}
		}.bind(this));

		Twitter.listSubscriptions({'user_id':this.user.id}, function(response) {
			var subs = response.responseJSON.lists;
			if (subs.length > 0) {
				if (subs.length === 1) {
					this.controller.get('lists-you-follow').addClassName('single');
				}
				this.listsYouFollowModel.items = subs;
				this.controller.modelChanged(this.listsYouFollowModel);
				this.controller.get('lists-you-follow').show();
			}
		}.bind(this));
	},
	newTweet: function(event) {
		if (this.toasters.items.length === 0) {
			this.toggleCompose({});
		}
		//this.controller.stageController.pushScene("compose-tweet");
	},
	toggleCompose: function(opts) {
		this.toasters.add(new ComposeToaster(opts, this));
	},
	refreshTapped: function(event) {
		if (Ajax.activeRequestCount === 0) {
			this.refreshAll();
		}
	},
	moreButtonTapped: function(event) {
		//update the index
		//Block added by DC to fix LoadMore bug on TP
		var i;
		
		for (i=0; i<5; i++){
			switch (this.panelLabels[i]) {
				case "home":
					if(event.srcElement.id == "more-home") {
						this.timeline = i;
					}
					break;
				case "mentions":
					if(event.srcElement.id == "more-mentions") {
						this.timeline = i;
					}
					break;
				case "messages":
					if(event.srcElement.id == "more-messages") {
						this.timeline = i;
					}
					break;
				default:
					break;
			}
		}//end block DC
		
		this.loadMore(this.timeline);
	},
	windowResized: function(event) {
		this.setScrollerSizes();
	},
	shimTapped: function(event) {
		this.toasters.nuke();
	},
	newAccountTapped: function(event) {
		var args = {
			name: global.authStage,
			lightweight: true
		};

		var self = this;
		var pushMainScene = function(stageController) {
			stageController.user = {};
			stageController.users = self.users;
			stageController.pushScene('oauth', true);
		};

		var app = Mojo.Controller.getAppController();
		var authStage = app.getStageProxy(global.authStage);
		if (authStage) {
			authStage.activate();
		}
		else {
			setTimeout(function() {
				app.createStageWithCallback(args, pushMainScene, "card");
			}, 200);
		}
	},
	openAccount: function(userId) {
		var users = new Account();
		users.all(function(r) {
			var user;
			for (var i=0; i < r.length; i++) {
				var u = r[i];
				if (u.key == userId) {
					user = u;
				}
			}
			var stageName = global.mainStage + user.key;
			var args = {
				name: stageName,
				lightweight: true
			};

			var pushMainScene = function(stageController) {
				global.stageActions(stageController);
				var launchArgs = {
					user: user,
					users: r
				};
				stageController.pushScene('launch', launchArgs);
			};

			var app = Mojo.Controller.getAppController();
			var userStage = app.getStageProxy(stageName);

			if (userStage) {
				userStage.activate();
			}
			else {
				app.createStageWithCallback(args, pushMainScene, "card");
			}

			// Enable the card icon if it is set to 'auto'
			global.multiCard = true;
		}.bind(this));
	},
	logout: function() {
		var accounts = new Lawnchair('phnxAccounts');
		var user = this.user;
		accounts.remove(user.id);
		var prefs = new LocalStorage();
		var am = new Account();
		am.all(function(r){
			if (r.length > 0) {
				// change the default account to the next one in line
				prefs.write('defaultAccount', r[0].id);
				this.openAccount(r[0].id);
			}
			else {
				prefs.write('defaultAccount', '0');
				this.newAccountTapped();

			}
			setTimeout(function(){
				var app = this.controller.stageController.getAppController();
				app.closeStage(global.mainStage + user.id);
			}.bind(this), 500);
		}.bind(this));
	},
	tweetTapped: function(event) {
		if (this.toasters.items.length === 0) {
			Mojo.Log.info(event.originalEvent.srcElement.id);

			if (event.originalEvent.srcElement.id === 'gap') {
				// Load the gap if it's gappy
				Mojo.Log.info('gaptastic!');
				var panel = this.getPanel(this.panels[this.timeline]);
				this.fillGap(panel);
			}
			else {
				this.toasters.add(new TweetToaster(event.item, this));
			}
		}
	},
	addCommas: function(nStr) {
		//from http://www.mredkj.com/javascript/nfbasic.html
		//used in the profile toaster to format counts
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	},
	formatCount: function(str) {
		var count = parseInt(str, 10);
		if (count > 9999) {
			//format in shorthand format for over 10k
			var milForm = count / 1000000;
			var thouForm = count / 1000;
			var newCount;
			if (milForm >= 1) {
				//count is in the millions
				newCount = parseInt(milForm, 10);
				return newCount + 'm';
			}
			else if (thouForm >= 1) {
				//count is in the thousands
				newCount = parseInt(thouForm, 10);
				return newCount + 'k';
			}
		}
		else {
			//format the count with commas
			return this.addCommas(count);
		}
	},
	moveIndicator: function(panelId) {
		//Edit here for panel order change DC

	var positions = {};
	
	var order = ["first","second","third","fourth","fifth"];
	
	for (i=0; i<5; i++){
		positions[this.panelLabels[i]] = order[i];			
	}
	/*positions['home'] = 'first';
	positions['mentions'] = 'second';
	positions['messages'] = 'third';
	positions['lists'] = 'fourth';
	positions['search'] = 'fifth';
*/
//		var positions = {
/*			'home': 'first',
			'mentions': 'second',
			'messages': 'third',
			'lists': 'fourth',
			'search': 'fifth'
*/
/*
			'home': 'first',
			'mentions': 'second',
			'messages': 'fifth',
			'lists': 'third',
			'search': 'fourth'


		};
*/


		this.controller.get('indicator').className = ''; // remove existing classes
		this.controller.get('indicator').addClassName(positions[panelId]);
	},
	navButtonTapped: function(event) {
		var screenWidth = this.controller.window.innerWidth;
		var panelWidth = 320;
		var src = event.srcElement;

		while (src && (!src.id || 0 != src.id.indexOf('nav-'))) {
			src = src.parentNode;
		}

		var id = src.id;
		var panelId = id.substr(id.indexOf('-') + 1);

		var panelIndex;
		//get the index of the panel for the nav item
		for (i=0; i < this.panels.length; i++) {
			if (this.panels[i].id === panelId) {
				panelIndex = i;
			}
		}

		//if it's the current panel, scroll to the top
		//otherwise, scroll to that panel
		if (this.timeline === panelIndex || screenWidth > panelWidth) {
			var scroller = this.controller.get(panelId + '-scroller');

			if (scroller) {
				var position = scroller.mojo.getScrollPosition();
				var size = scroller.mojo.scrollerSize();
				if (position.top === 0) {
					// scroll to bottom
					scroller.mojo.scrollTo(0, -99999999, true);
				} else {
					scroller.mojo.scrollTo(0, 0,true);
				}
			}
		}else{
			this.scrollTo(panelIndex);
		}
	},
	listTapped: function(event) {
		var listId = event.item.id_str;
		var Twitter = new TwitterAPI(this.user);
		Twitter.listStatuses({'list_id': listId, "count": "100", 'include_entities': 'true'}, function(response){
			var opts = {
				id: listId,
				name: event.item.slug,
				type: 'list',
				items: response.responseJSON,
				user: this.user
			};

			this.controller.stageController.pushScene('status', opts);
		}.bind(this));
	},
	searchListTapped: function(event) {
		var query = event.item.name;
		this.search(query);
	},
	search: function(query) {
		var Twitter = new TwitterAPI(this.user);
		Twitter.search(query, function(response) {
			// this.toasters.add(new SearchToaster(query, response.responseJSON, this));
			var opts = {
				type: 'search',
				query: query,
				items: response.responseJSON.results,
				user: this.user
			};
			this.controller.stageController.pushScene('status', opts);
		}.bind(this));
	},
	rtTapped: function(event) {
		var Twitter = new TwitterAPI(this.user);
		var id = event.srcElement.id;
		var opts = {
			type: 'retweets',
			user: this.user,
			rtType: id
		};

		if (id === 'rt-others') {
			Twitter.retweetsToMe(function(response) {
				if (response.responseJSON.length > 0) {
					opts.name = 'RTs by Others';
					opts.items = response.responseJSON;
					this.controller.stageController.pushScene('status', opts);
				}
				else {
					banner('Twitter did not find anything');
				}
			}.bind(this));
		}
		else if (id === 'rt-yours') {
			// These were loaded when the app started so no need to get them again!
			opts.name = 'RTs by You';
			opts.items = this.user.retweetedItems;
			this.controller.stageController.pushScene('status', opts);
		}
		else if (id === 'rt-ofyou') {
			Twitter.retweetsOfMe(function(response) {
				if (response.responseJSON.length > 0) {
					opts.name = 'RTs of You';
					opts.items = response.responseJSON;
					this.controller.stageController.pushScene('status', opts);
				}
				else {
					banner('Twitter did not find anything');
				}
			}.bind(this));
		}
	},
	getRetweeted: function() {
		// We load the tweets the user has retweeted in order to be able to undo the Retweets
		setTimeout(function(){
			this.user.retweeted = [];
			this.user.retweetedItems = [];
			var Twitter = new TwitterAPI(this.user);
			Twitter.retweetsByMe(function(response) {
				if (response.responseJSON.length > 0) {
					var items = response.responseJSON;
					this.user.retweetedItems = items;

					for (var i=0; i < items.length; i++) {
						var rtId = items[i].retweeted_status.id_str;
						this.user.retweeted.push(rtId);
					}
				}
			}.bind(this));
		}.bind(this), 2000);
	},
	headerTapped: function(event) {
		// Show the user's profile
		var Twitter = new TwitterAPI(this.user);
		Twitter.getUser(this.user.username, function(response){
			this.controller.stageController.pushScene({
				name: 'profile',
				disableSceneScroller: true
			}, response.responseJSON);
		}.bind(this));
	},
	stageActivate: function(event) {
		var prefs = new LocalStorage();
		if (prefs.read('refreshOnMaximize')) {
			this.refreshAll();
		}
	},
	addListeners: function(event) {
		this.controller.listen(this.controller.get('sideScroller'), Mojo.Event.propertyChange, this.scrollerChanged.bind(this));
		this.controller.listen(this.controller.get('sideScroller'), 'scroll', this.sideScrollChanged.bind(this));
		this.controller.listen(this.controller.get('rt-others'), Mojo.Event.tap, this.rtTapped.bind(this));
		this.controller.listen(this.controller.get('rt-yours'), Mojo.Event.tap, this.rtTapped.bind(this));
		this.controller.listen(this.controller.get('rt-ofyou'), Mojo.Event.tap, this.rtTapped.bind(this));
		this.controller.listen(this.controller.get('refresh'), Mojo.Event.tap, this.refreshTapped.bind(this));
		this.controller.listen(this.controller.get('new-tweet'), Mojo.Event.tap, this.newTweet.bind(this));
		this.controller.listen(this.controller.get('header-title'), Mojo.Event.tap, this.headerTapped.bind(this));
		this.controller.listen(this.controller.get('shim'), Mojo.Event.tap, this.shimTapped.bind(this));
		this.controller.listen(this.controller.window, 'resize', this.windowResized.bind(this));
		this.controller.listen(this.controller.get('nav-home'), Mojo.Event.tap, this.navButtonTapped.bind(this));
		this.controller.listen(this.controller.get('nav-mentions'), Mojo.Event.tap, this.navButtonTapped.bind(this));
		this.controller.listen(this.controller.get('nav-messages'), Mojo.Event.tap, this.navButtonTapped.bind(this));
		this.controller.listen(this.controller.get('nav-lists'), Mojo.Event.tap, this.navButtonTapped.bind(this));
		this.controller.listen(this.controller.get('nav-search'), Mojo.Event.tap, this.navButtonTapped.bind(this));
		this.controller.listen(this.controller.get('your-lists-list'), Mojo.Event.listTap, this.listTapped.bind(this));
		this.controller.listen(this.controller.get('lists-you-follow-list'), Mojo.Event.listTap, this.listTapped.bind(this));
		this.controller.listen(this.controller.get('saved-searches-list'), Mojo.Event.listTap, this.searchListTapped.bind(this));
		this.controller.listen(this.controller.get('trending-topics-list'), Mojo.Event.listTap, this.searchListTapped.bind(this));


		this.controller.get(this.controller.document).observe("keyup", function(e) {
			// banner(e.keyCode + ' is the key');
			if (e.keyCode !== 27 && e.keyCode !== 57575 && this.toasters.items.length === 0) {
				// type to tweet, ignore the back gesture

				// keycodes for punctuation and symbols are not normal
				// so only ascii chars are passed to the compose toaster for now...
				var text = Mojo.Char.isValidWrittenChar(e.keyCode);
				// Need to change index for timeline below if changing order of panels - DC
				var panel = this.panels[this.timeline];
				if (panel.id !== "search" && this.controller.get('txtSearch').value.length === 0) {
				//if (this.timeline !== 4 && this.controller.get('txtSearch').value.length === 0) {
					this.toggleCompose({
						'text': text
					});
				}
				else {
					// type to search on the search panel
					if (e.keyCode !== 13) {
						if (this.controller.get('txtSearch').value.length === 0) {
							this.controller.get('txtSearch').value = text;
						}

						var len = this.controller.get('txtSearch').value.length;
						this.controller.get('txtSearch').setSelectionRange(len,len); //focus the cursor at the end
						this.controller.get('txtSearch').focus();
					}
				}
			}
		}.bind(this));
		this.controller.get('txtSearch').observe('keydown', function(e) {
			if (e.keyCode === 13 && this.controller.get('txtSearch').value.length > 0) {
				this.search(this.controller.get('txtSearch').value);
				e.stop();
			}
		}.bind(this));
	},
	stopListening: function() {
		this.controller.stopListening(this.controller.get('sideScroller'), Mojo.Event.propertyChange, this.scrollerChanged);
		this.controller.stopListening(this.controller.get('sideScroller'), 'scroll', this.sideScrollChanged);
		this.controller.stopListening(this.controller.get('rt-others'), Mojo.Event.tap, this.rtTapped);
		this.controller.stopListening(this.controller.get('rt-yours'), Mojo.Event.tap, this.rtTapped);
		this.controller.stopListening(this.controller.get('rt-ofyou'), Mojo.Event.tap, this.rtTapped);
		this.controller.stopListening(this.controller.get('refresh'), Mojo.Event.tap, this.refreshTapped);
		this.controller.stopListening(this.controller.get('new-tweet'), Mojo.Event.tap, this.newTweet);
		this.controller.stopListening(this.controller.get('header-title'), Mojo.Event.tap, this.headerTapped);
		this.controller.stopListening(this.controller.get('shim'), Mojo.Event.tap, this.shimTapped);
		this.controller.stopListening(this.controller.window, 'resize', this.windowResized);
		this.controller.stopListening(this.controller.get('nav-home'), Mojo.Event.tap, this.navButtonTapped);
		this.controller.stopListening(this.controller.get('nav-mentions'), Mojo.Event.tap, this.navButtonTapped);
		this.controller.stopListening(this.controller.get('nav-messages'), Mojo.Event.tap, this.navButtonTapped);
		this.controller.stopListening(this.controller.get('nav-lists'), Mojo.Event.tap, this.navButtonTapped);
		this.controller.stopListening(this.controller.get('nav-search'), Mojo.Event.tap, this.navButtonTapped);
		this.controller.stopListening(this.controller.get('your-lists-list'), Mojo.Event.listTap, this.listTapped);
		this.controller.stopListening(this.controller.get('lists-you-follow-list'), Mojo.Event.listTap, this.listTapped);
		this.controller.stopListening(this.controller.get('saved-searches-list'), Mojo.Event.listTap, this.searchListTapped);
		this.controller.stopListening(this.controller.get('trending-topics-list'), Mojo.Event.listTap, this.searchListTapped);
	},
	activate: function(event) {
		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		var prefs = new LocalStorage();
		global.setFontSize(body, prefs.read('fontSize'));
		global.setLayout(body, prefs.read('barlayout'));
		global.setTabOrder(body, prefs.read('taborder'));
		global.setShowThumbs(body, prefs.read('showThumbs'));
		global.setShowEmoji(body, prefs.read('showEmoji'));		
		
		//global.setHideAvatar(body, prefs.read('hideAvatar')); // added by DC
	},
	deactivate: function(event) {
		this.controller.get(this.controller.document).stopObserving("keyup");
		this.controller.get('txtSearch').stopObserving('keydown');
	},
	cleanup: function(event) {
		this.stopListening();
	},
	setUser: function(user) {
		this.controller.window.user = user;
	}
};
