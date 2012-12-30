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

	this.panelLabels = [ "home", "mentions", "favorites", "messages", "lists", "search"];

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

		createEmojiHash();

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

		// Start the background notifications timer
		global.setTimer();

		this.user = this.controller.stageController.user;
		this.users = this.controller.stageController.users;

		// These nouns are used in the "X New {Noun}" message
		this.nouns = {
			'home':			'Tweet',
			'mentions':		'Mention',
			'messages':		'Direct Message',
			'favorites':	'Favorite'
		};

		var i;
		var homeItems		= this.user.home		|| [];
		var mentionsItems	= this.user.mentions	|| [];
		var favoriteItems	= this.user.favorites	|| [];
		var messagesItems	= this.user.messages	|| [];

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

		for (i=0; i < favoriteItems.length; i++) {
			tweet = favoriteItems[i];
			d = new Date(tweet.created_at);
			tweet.time_str = d.toRelativeTime(1500);
		}

		for (i=0; i < messagesItems.length; i++) {
			tweet = messagesItems[i];
			d = new Date(tweet.created_at);
			tweet.time_str = d.toRelativeTime(1500);
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

		var prefs = new LocalStorage();
		var tmp;

		/* Update old settings */
		if ((tmp = prefs.read('barlayout'))) {
			if (tmp != 'swapped') {
				prefs.write('barlayout',	'original');
			}

			if (tmp == 'no-toolbar') {
				prefs.write('hideToolbar',	true);
				prefs.write('hideTabs',		false);

				/* If you only have the toolbar then put it on top */
				prefs.write('barlayout',	'swapped');
			} else if (tmp == 'no-nav') {
				prefs.write('hideToolbar',	false);
				prefs.write('hideTabs',		true);
			} else if (tmp == 'none') {
				prefs.write('hideToolbar',	true);
				prefs.write('hideTabs',		true);
			}
		}

		/* Set the panel order based on the user's preferred tab order */
		this.panels			= [];
		this.panelLabels	= [];
		this.tabOrder		= prefs.read('taborder');
		this.tabs			= this.tabOrder.split(',');
		var bar				= this.controller.get('nav-bar');
		var hide			= this.controller.get('nav-bar-hidden');

		/*
			Move all of the tab icons to a hidden div. Any that are being used
			will be moved back.
		*/
		while (bar.lastChild) {
			hide.appendChild(bar.lastChild);
		}

		/* Adjust the position of the tabs if there are less than the full 6 */
		if (this.tabs.length < 6 && !this.largedevice) {
			bar.setStyle({
				marginLeft: parseInt((6 - this.tabs.length) * (53 / 2)) + 'px'
			});
		}

		for (var i = 0, tab; tab = this.tabs[i]; i++) {
			var panel = null;

			switch (tab.toLowerCase().charAt(0)) {
				case "h":
					panel = {
						id:			"home",
						type:		"timeline",
						resource:	"home",
						refresh:	true,
						update:		true,
						model:		{ items: homeItems },
						icon:		"nav-home"
					};
					break;

				case "m":
					panel = {
						id:			"mentions",
						type:		"timeline",
						resource:	"mentions",
						refresh:	true,
						update:		true,
						model:		{ items: mentionsItems },
						icon:		"nav-mentions"
					};
					break;

				case "f":
					panel = {
						id:			"favorites",
						type:		"timeline",
						resource:	"userFavorites",
						refresh:	true,
						update:		true,
						model:		{ items: favoriteItems },
						icon:		"nav-favorites"
					};
					break;

				case "d":
					panel = {
						id:			"messages",
						type:		"timeline",
						resource:	"messages",
						refresh:	true,
						update:		true,
						model:		{ items: messagesItems },
						icon:		"nav-messages"
					};
					break;

				case "l":
					panel = {
						id:			"lists",
						type:		"lists",
						refresh:	false,
						update:		false,
						icon:		"nav-lists"
					};
					break;

				case "s":
					panel = {
						id:			"search",
						type:		"search",
						refresh:	false,
						update:		false,
						icon:		"nav-search"
					};
					break;
			}

			if (panel) {
				if (!panel.title) {
					panel.title = panel.id;
				}

				if (panel.title) {
					this.panelLabels.push(panel.title);
				}

				if (panel.icon) {
					bar.appendChild(this.controller.get(panel.icon));
				}

				panel.index		= this.panels.length;
				panel.position	= this.panels.length + 1;

				if (!panel.model) {
					panel.model = {};
				}
				panel.model.id = panel.id;

				this.panels.push(panel);
			}

			/* Always include the end cap */
			bar.appendChild(this.controller.get('nav-endcap'));
		}

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
				label: 'Compose',
				command: 'cmdNewTweet'
			},
			{
				label: 'Refresh',
				command: 'cmdRefresh'
			},
			{
				label: 'Refresh & Flush',
				command: 'cmdRefreshFlush'
			},
			{
				label: 'Lookup User',
				command: 'cmdFindUser'
			},
			{
				label: 'Preferences & Accounts',
				items: [
					{
						label: 'Accounts',
						items: accountMenuItems
					},
					{
						label: 'General Settings',
						command: 'cmdPreferencesGeneral'
					},
					{
						label: 'Appearance',
						command: 'cmdPreferencesAppearance'
					},
					{
						label: 'Notifications',
						command: 'cmdPreferencesNotifications'
					},
					{
						label: 'Advanced Settings',
						command: 'cmdPreferencesAdvanced'
					},
					{
						label: 'Change Tab Order',
						command: 'cmdManageTabs'
					},
					{
						label: 'Manage Filters',
						command: 'cmdManageFilters'
					}
				]
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
		for (var j = 0, panel; panel = this.panels[j]; j++) {
			var content = Mojo.View.render({
				object: panel,
				template: 'templates/panels/' + panel.type
			});
			panelHtml += content;

			this.controller.get('scrollItems').update(panelHtml);

			this.controller.setupWidget(panel.id + "-scroller",{mode: 'vertical'},{});
			if (panel.type === "timeline") {
				this.controller.setupWidget('list-' + panel.id,{itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: this.renderLimit}, panel.model);
				showThumbs = prefs.read('showThumbs'); // added by DC
				showEmoji = prefs.read('showEmoji'); // added by DC

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
		var scrollmode;

		/*
			Do not snap on the TouchPad because the snap behavior doesn't behave
			well there.
		*/
		if (screenWidth <= this.panelWidth) {
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

		this.moveIndicator(null);

		this.addListeners();
		setTimeout(function(){
			var prefs = new LocalStorage();

			if (prefs.read('refreshFlushAtLaunch') == false) {
				this.refreshAll();
			} else {
				for (var j = 0, panel; panel = this.panels[j]; j++) {
					if (panel.type === "timeline") {
						this.refreshPanelFlush(panel);
					}
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
			else if (event.command === 'cmdRefreshFlush') {
				var screenWidth = this.controller.window.innerWidth;
				if (Ajax.activeRequestCount === 0) {
					//Need to refresh all on Touchpad - DC
					if (screenWidth <= this.panelWidth) {
						this.refreshPanelFlush(this.panels[this.timeline]);
					} else {
						for (var j = 0, panel; panel = this.panels[j]; j++) {
							if(panel.type === "timeline") {
								this.refreshPanelFlush(panel);
							}
						}
					}
				}
			}
			else if (event.command === 'cmdFindUser') {
				this.toasters.add(new LookupToaster(this));
			}
			else if (event.command === 'cmdAddFilter') {
				this.toasters.add(new AddFilterToaster(this));
			}
			else if (event.command === 'cmdManageTabs') {
				this.toasters.add(new ManageTabsToaster(this));
			}
			else if (event.command === 'cmdManageFilters') {
				this.toasters.add(new ManageFiltersToaster(this));
			}
			else if (event.command === 'cmdChangelog') {
				this.toasters.add(new ChangelogToaster(this));
			}
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
		if (this.controller && this.controller.window) {
			var screenHeight = this.controller.window.innerHeight;
			var screenWidth = this.controller.window.innerWidth;
			var height = screenHeight - 0; //subtract the header
			var i;

			this.panelWidth = 320;

			//grab each panel element. There should be as many of these as there are in this.panels

			if (screenWidth > this.panelWidth) {
				if (screenHeight > screenWidth) {
					// There are only 2 panels in portrait
					this.panelWidth += 43;
				}

				// On large devices there are 21px of padding and 1px border
				this.panelWidth += 22;
			} else {
				// Account for the border, 1px
				this.panelWidth += 1;
			}
			// console.log(this.panelWidth);

			var panelElements = this.controller.select('.panel');
			var totalWidth = 0; //the width of the main container
			for (i=0; i < panelElements.length; i++) {
				var panel = panelElements[i];
				panel.setStyle({
					"width": this.panelWidth + "px"
				});
				totalWidth += this.panelWidth;

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

	/*
		NOTE: This callback has this bound to the panel, and panel.assistant is
		set to the assistant.
	*/
	scrollStarted: function(event) {
		var		panel		= this;
		var		scroller	= panel.assistant.controller.get(panel.id + '-scroller');
		var		pos;

		panel.assistant.controller.get(panel.id + "-ptr-text").removeClassName('ptr-text-showing');

		/* Show the "release to refresh" text, after a delay */
		if (panel.refresh) {
			clearTimeout(panel.timeout);

			if (!(pos = scroller.mojo.getScrollPosition()) || pos.top < -5) {
				/* The scroll has to start near the top */
				return;
			}

			panel.timeout = setTimeout(function() {
				if ((pos = scroller.mojo.getScrollPosition()) && pos.top >= 1) {
					panel.ptr = true;
					panel.assistant.controller.get(panel.id + "-ptr-text").addClassName('ptr-text-showing');
				}
			}.bind(panel), 500);
		}
	},

	/*
		This event detects the scroll position when the user's finger leaves the
		screen. If the user is pulling the list down, and is past a specific
		threshold then trigger a refresh.

		NOTE: This callback has this bound to the panel, and panel.assistant is
		set to the assistant.
	*/
	scrollStopped: function(event) {
		var		panel		= this;
		var		scroller	= panel.assistant.controller.get(panel.id + '-scroller');
		var		pos;

		clearTimeout(panel.timeout);
		if (!panel.refresh) {
			return;
		}

		if (!panel.ptr) {
			/* They haven't been holding it long enough */
			return;
		}
		panel.ptr = false;

		/* Hide the "release to refresh" text */
		panel.assistant.controller.get(panel.id + "-ptr-text").removeClassName('ptr-text-showing');

		if ((pos = scroller.mojo.getScrollPosition())) {
			if (pos.top > 10 && Ajax.activeRequestCount === 0) {
				panel.assistant.refreshPanel(panel);
			}
			// Mojo.Log.info(pos.top);
		}
	},

	sideScrollerChanged: function(event) {
		var panel = this.panels[event.value];
		var screenWidth = this.controller.window.innerWidth;

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
		if (panel.id === "search" || screenWidth > this.panelWidth) {
		//if (event.value === 4 || screenWidth > this.panelWidth) {
			// enable the search box
			this.controller.get('txtSearch').disabled = false;
			if (this.searchLoaded === false) {
				this.searchLoaded = true;
				this.loadSearch();
			}
		} else {
			var search = this.controller.get('txtSearch');

			if (search) {
				search.value = '';
				search.blur();
				search.disabled = true;
			}
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

		if (screenWidth > this.panelWidth) {
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
			if (this.panels[j].type === "timeline") {
				this.refreshPanel(this.panels[j]);
			}
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
			setTimeout(function() {
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
			}.bind(this), 200);
		} else if (panel.id === 'search') {
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
		if (!this.controller) {
			return;
		}

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
        var model = this.panels[this.timeline].model;

        if (model && model.items && model.items.length > 0) {
            this.loadingMore = true;
            var maxId = model.items[model.items.length - 1].id_str;
            var panel = this.panels[this.timeline];

            if (panel.id === 'messages') {
                this.getDMs(panel, undefined, maxId);
            } else {
                this.getTweets(panel, undefined, maxId);
            }
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

					// TODO: Make this message tappable to load gaps
					var msg = tweetCount + ' New ' + this.nouns[panel.id];
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
							// TODO: Make this message tappable to load gaps
							var msg = k + ' New ' + this.nouns[panel.id];
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
				case "favorites":
					if(event.srcElement.id == "more-favorites") {
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
		var i		= 0;
		var l		= 0;
		var panel	= null;

		if (panelId) {
			for (i = 0; panel = this.panels[i]; i++) {
				if (panel.id === panelId) {
					break;
				}
			}
		}

		l = 20;
		l += (i * 53);

		/* If we have less than 6 icons account for the offset */
		l += parseInt((6 - this.tabs.length) * (53 / 2));

		this.controller.get('indicator').setStyle({
			left:	l + 'px'
		});
	},
	navButtonTapped: function(event) {
		var screenWidth = this.controller.window.innerWidth;
		var src = event.srcElement;

		while (src && (!src.id || 0 != src.id.indexOf('nav-'))) {
			src = src.parentNode;
		}

		var id = src.id;
		var panelId = id.substr(id.indexOf('-') + 1);
		var panelIndex;

		// Get the index of the panel for the nav item
		for (var i = 0, p; p = this.panels[i]; i++) {
			if (p.id === panelId) {
				panelIndex = i;
			}
		}

		// If it's the current panel, scroll to the top otherwise, scroll to
		// that panel
		if (this.timeline === panelIndex || screenWidth > this.panelWidth) {
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
		} else {
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
		for (var j=0; j < this.panels.length; j++) {
			var panel = this.panels[j];

			panel.assistant = this;

			this.controller.listen(this.controller.get(panel.id + '-scroller'), Mojo.Event.dragStart, this.scrollStarted.bind(panel));
			this.controller.listen(this.controller.get(panel.id + '-scroller'), Mojo.Event.dragEnd, this.scrollStopped.bind(panel));
		}

		this.controller.listen(this.controller.window, 'resize', this.windowResized.bind(this));

		/*
			Add the appropriate listeners.

			This loop is setup to allow for errors because some of these targets
			will not exist depending on which tabs are configured.
		*/
		var listen = [
			[ 'sideScroller',			Mojo.Event.propertyChange,	this.sideScrollerChanged],
			[ 'sideScroller',			'scroll',					this.sideScrollChanged	],
			[ 'rt-others',				Mojo.Event.tap,				this.rtTapped			],
			[ 'rt-yours',				Mojo.Event.tap,				this.rtTapped			],
			[ 'rt-ofyou',				Mojo.Event.tap,				this.rtTapped			],
			[ 'refresh',				Mojo.Event.tap,				this.refreshTapped		],
			[ 'new-tweet',				Mojo.Event.tap,				this.newTweet			],
			[ 'header-title',			Mojo.Event.tap,				this.headerTapped		],
			[ 'shim',					Mojo.Event.tap,				this.shimTapped			],
			[ 'nav-home',				Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-mentions',			Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-favorites',			Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-messages',			Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-lists',				Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-search',				Mojo.Event.tap,				this.navButtonTapped	],
			[ 'your-lists-list',		Mojo.Event.listTap,			this.listTapped			],
			[ 'lists-you-follow-list',	Mojo.Event.listTap,			this.listTapped			],
			[ 'saved-searches-list',	Mojo.Event.listTap,			this.searchListTapped	],
			[ 'trending-topics-list',	Mojo.Event.listTap,			this.searchListTapped	]
		];
		for (var i = 0, l; l = listen[i]; i++) {
			try {
				var target;

				if ((target = this.controller.get(l[0]))) {
					this.controller.listen(target, l[1], l[2].bind(this));
				}
			} catch (e) {
				console.log('Failed to start event listener #: ' + (i + 1));
			}
		}

		this.controller.get(this.controller.document).observe("keyup", function(e) {
			// banner(e.keyCode + ' is the key');
			if (e.keyCode !== 27 && e.keyCode !== 57575 && this.toasters.items.length === 0) {
				// type to tweet, ignore the back gesture

				// keycodes for punctuation and symbols are not normal
				// so only ascii chars are passed to the compose toaster for now...
				var text	= Mojo.Char.isValidWrittenChar(e.keyCode);
				var panel	= this.panels[this.timeline];
				var search	= this.controller.get('txtSearch');

				if (panel.id !== "search") {
					this.toggleCompose({
						'text': text
					});
				} else if (search) {
					// type to search on the search panel
					if (e.keyCode !== 13) {
						if (search.value.length === 0) {
							search.value = text;
						}

						var len = search.value.length;
						search.setSelectionRange(len,len); //focus the cursor at the end
						search.focus();
					}
				}
			}
		}.bind(this));

		var search;

		if ((search = this.controller.get('txtSearch'))) {
			search.observe('keydown', function(e) {
				if (e.keyCode === 13 && this.controller.get('txtSearch').value.length > 0) {
					this.search(this.controller.get('txtSearch').value);
					e.stop();
				}
			}.bind(this));
		}
	},
	stopListening: function() {
		for (var j=0; j < this.panels.length; j++) {
			var panel = this.panels[j];

			this.controller.stopListening(this.controller.get(panel.id + '-scroller'), Mojo.Event.dragStart, this.scrollStarted);
			this.controller.stopListening(this.controller.get(panel.id + '-scroller'), Mojo.Event.dragEnd, this.scrollStopped);
		}

		this.controller.stopListening(this.controller.window, 'resize', this.windowResized);

		var listen = [
			[ 'sideScroller',			Mojo.Event.propertyChange,	this.sideScrollerChanged],
			[ 'sideScroller',			'scroll',					this.sideScrollChanged	],
			[ 'rt-others',				Mojo.Event.tap,				this.rtTapped			],
			[ 'rt-yours',				Mojo.Event.tap,				this.rtTapped			],
			[ 'rt-ofyou',				Mojo.Event.tap,				this.rtTapped			],
			[ 'refresh',				Mojo.Event.tap,				this.refreshTapped		],
			[ 'new-tweet',				Mojo.Event.tap,				this.newTweet			],
			[ 'header-title',			Mojo.Event.tap,				this.headerTapped		],
			[ 'shim',					Mojo.Event.tap,				this.shimTapped			],
			[ 'nav-home',				Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-mentions',			Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-favorites',			Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-messages',			Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-lists',				Mojo.Event.tap,				this.navButtonTapped	],
			[ 'nav-search',				Mojo.Event.tap,				this.navButtonTapped	],
			[ 'your-lists-list',		Mojo.Event.listTap,			this.listTapped			],
			[ 'lists-you-follow-list',	Mojo.Event.listTap,			this.listTapped			],
			[ 'saved-searches-list',	Mojo.Event.listTap,			this.searchListTapped	],
			[ 'trending-topics-list',	Mojo.Event.listTap,			this.searchListTapped	]
		];
		for (var i = 0, l; l = listen[i]; i++) {
			try {
				var target;

				if ((target = this.controller.get(l[0]))) {
					this.controller.stopListening(target, l[1], l[2]);
				}
			} catch (e) {
				console.log('Failed to stop event listener #: ' + (i + 1));
			}
		}
	},
	activate: function(event) {
		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		var prefs = new LocalStorage();

		global.setShowThumbs(body,	prefs.read('showThumbs'));
		global.setShowEmoji(body,	prefs.read('showEmoji'));
		global.setFontSize(body,	prefs.read('fontSize'));

		global.setLayout(body,
			prefs.read('barlayout'),
			prefs.read('hideToolbar'),
			prefs.read('hideTabs')
		);

		global.setHide(body,
			prefs.read('hideAvatar'),
			prefs.read('hideUsername'),
			prefs.read('hideScreenname'),
			prefs.read('hideTime'),
			prefs.read('hideVia'),
			prefs.read('hideTweetBorder')
		);

		var tabOrder = prefs.read('taborder');

		if (this.tabOrder && tabOrder && tabOrder !== this.tabOrder) {
			/*
				The tab order has changed. Relaunch this scene to force it to
				render again with the new tab order.
			*/
			this.controller.stageController.swapScene({
				name: "main",
				transition: Mojo.Transition.crossFade,
				disableSceneScroller: true
			}, this.opts);
		}
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
