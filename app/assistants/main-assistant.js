function MainAssistant(opts) {
	if (typeof(opts) === 'undefined') {
		opts = {};
	}
	this.opts = opts;
	this.offset = 0;
	this.currentPage = 0; //index position of the item in the below array

	this.loadingMore = false; //flag to determine if items should go to the bottom of a list
	this.imagePreview = false;
	this.loadingGaps = false;
	this.loading = false;

	this.savedSearchesLoaded = false;
	this.searchLoaded = false;
	this.switcher = false;

	this.myLastId = undefined;
	this.oldBookmarkIndex = undefined;
	this.count = 300; //how many tweets to load each request
	this.renderLimit = 1000; //umm...this scares me. used in list widgets to prevent flickering...
	this.toasters = new ToasterChain();
	this.savedSearchesModel = {items: []};

}
function decStrNum (n) {
    n = n.toString();
    var result=n;
    var i=n.length-1;
    while (i>-1) {
      if (n[i]==="0") {
        result=result.substring(0,i)+"9"+result.substring(i+1);
        i --;
      }
      else {
        result=result.substring(0,i)+(parseInt(n[i],10)).toString()+result.substring(i+1);
        return result;
      }
    }
    return result;
}

MainAssistant.prototype = {
	setup: function() {
		// set css classes based on device
		console.log(Mojo.Environment.DeviceInfo.modelNameAscii);

		createEmojiHash();
		createSpecialMultiEmojiHash();
		createSkinnableEmojiHash();
		
		this.controller.serviceRequest('palm://ca.canucksoftware.systoolsmgr/', {
			method: 'version',
			onSuccess: function(ver){
				//Mojo.Log.error('ver: ' + ver.version);
				global.sysToolsMgrVer = ver.version;
			},
			onFailure: function(ver){
				//Mojo.Log.error('Could not run systoolsmgr');
				global.sysToolsMgrVer = 0;
			}
		});

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

		this.user	= this.controller.stageController.user;
		this.user.noUserRetweets = [];
		this.users	= this.controller.stageController.users || [ this.user ];
		var prefs	= new LocalStorage();
		var mutedUsers = prefs.read('mutedUsers');
		var tmp;
		
		if(mutedUsers && mutedUsers.length > 0) {
			var flagWriteMutedUsers = 0;
			for (var m = 0, mutedUser; mutedUser = mutedUsers[m]; m++) {
				if(!mutedUser.id_str){
					flagWriteMutedUsers = 1;
					mutedUsers[m].id_str = mutedUser.id.toString();
				}
			}
			if(flagWriteMutedUsers === 1) {
				var items	= [];
		
				if(mutedUsers) {
					//Mojo.Log.error('writing pref for mutedUsers');
					for (var i = 0, m; m = mutedUsers[i]; i++) {
						//if(m.id && m.user) 
						if(m.id_str) {
							items.push({id_str: m.id_str});
							//Mojo.Log.error('id_str: ' + m.id_str);
						}
					}
				}
				
				prefs.write('mutedUsers',items);
				mutedUsers = prefs.read('mutedUsers');
			}
		}		

		// These nouns are used in the "X New {Noun}" message
		this.nouns = {
			'home':			'Tweet',
			'mentions':		'Mention',
			'messages':		'Direct Message',
			'favorites':	'Favorite'
		};

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
		this.tabs			= prefs.read('tabs', this.user.id);
		var bar				= this.controller.get('nav-bar');
		var barhtml			= [];
		var th				= new TweetHelper();

		/*
			On a phone the tabs are sized such that it can fit 6. If there are
			less then the bar needs to be centered.
		*/
		if (this.tabs.length < 6 && !this.largedevice) {
			bar.setStyle({
				marginLeft: parseInt((6 - this.tabs.length) * (53 / 2)) + 'px'
			});
		}

		/**
			this.panels:
				@id is used for identifying specific features of some columns
				@index is used for html elements
				@resource is used by the resource helper to figure out endpoint urls
				@refresh tells if this panel should be refreshed globally
				@update tells if this panel should be updated globally
		**/
		for (var i = 0, tab; tab = this.tabs[i]; i++) {
			var panel	= null;
			var user	= this.getAccount(tab.account);

			if (!user) {
				continue;
			}

			switch (tab.type.toLowerCase().charAt(0)) {
				case "h":
					panel = {
						id:			"home",
						type:		"timeline",
						resource:	"home",
						refresh:	true,
						update:		true,
						icon:		"nav-home",
						count: 0
					};
					break;

				case "m":
					panel = {
						id:			"mentions",
						type:		"timeline",
						resource:	"mentions",
						refresh:	true,
						update:		true,
						icon:		"nav-mentions",
						count: 0
					};
					break;

				case "f":
					panel = {
						id:			"favorites",
						type:		"timeline",
						resource:	"userFavorites",
						refresh:	true,
						update:		true,
						icon:		"nav-favorites",
						count: 0
					};
					break;

				case "d":
					panel = {
						id:			"messages",
						type:		"timeline",
						resource:	"messages",
						refresh:	true,
						update:		true,
						icon:		"nav-messages",
						count: 0
					};
					break;

				case "l":
					if (tab.slug && tab.owner) {
						var id = 'list:' + tab.owner + '/' + tab.slug;

						/* A specific list */
						panel = {
							title:		tab.slug,
							id:			id,
							type:		"timeline",
							resource:	"listStatuses",
							refresh:	true,
							update:		true,
							icon:		"nav-lists",
							count: 0
						};
					} else {
						/* Show the lists that the user has and/or follows */
						panel = {
							id:			"lists",
							type:		"lists",
							refresh:	false,
							update:		false,
							icon:		"nav-lists"
						};
					}
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
				/* Load any cached items */
				panel.model = {
					items: user[panel.id] || []
				};

				/* Update mutedUser status and timestamps */
				for (var x = 0, tweet; tweet = panel.model.items[x]; x++) {
					var d = new Date(tweet.created_at);
					tweet.time_str = d.toRelativeTime(1500);

					if(mutedUsers && mutedUsers.length > 0){
						for (var m = 0, mutedUser; mutedUser = mutedUsers[m]; m++) {
							//if (tweet.user.screen_name.indexOf(mutedUser.user) > -1) {
							if (tweet.user.id_str === mutedUser.id_str) {
								tweet.hideTweet_class = 'hide';
								break;
							} else if (tweet.retweeter && (tweet.retweeter.id_str === mutedUser.id_str)) {
								//(tweet.retweeter.screen_name.indexOf(mutedUser.user) > -1)) 
								tweet.hideTweet_class = 'hide';
								break;								
							} else {
								delete tweet.hideTweet_class;
							}
						}
					} else {
						delete tweet.hideTweet_class;
					}
				}

				panel.tab = tab;

				if (!panel.title) {
					panel.title = panel.id;
				}

				if (panel.title) {
					this.panelLabels.push(panel.title);
				}

				panel.index			= this.panels.length;
				panel.model.index	= panel.index;

				this.panels.push(panel);

				if (this.panels.length <= 6 || this.largedevice) {
					barhtml.push('<div id="nav-' + panel.index + '"');
					barhtml.push('	class="nav-icon ' + panel.icon + '">');

					if (this.largedevice) {
						if(user.username === this.user.username){
							barhtml.push('<p>' + panel.title + '</p>');
						} else {
							barhtml.push('<p>' + panel.title + ' (' + user.username + ')</p>');
						}
					}

					barhtml.push('<div id="beacon-' + panel.index + '" class="beacon"></div>');
					barhtml.push('</div>');
				}
			}
		}

		/* Always include the end cap */
		barhtml.push('<div class="nav-icon nav-endcap"></div>');

		bar.update(barhtml.join('\n'));

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
		} else {
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
			label: 'Make shortcut - current account',
			command: 'cmdCreateShortcut'
		});
		accountMenuItems.push({
			label: 'Make shortcut - all accounts',
			command: 'cmdCreateAllShortcuts'
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
//			
//				label: 'Check Rate Limit',
//				command: 'cmdRateLimit'
//			,
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
						label: 'Load Counts',
						command: 'cmdPreferencesLoadCounts'
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
					},
					{
						label: 'Manage Muted Users',
						command: 'cmdManageMutedUsers'
					}
				]
			},
			{
				label: 'About',
				items: [
					{
						label: 'About Macaw 2018',
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
				]
			}
		];

		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: menuItems});

		// create the panels
		var panelHtml = '';
		showThumbs = prefs.read('showThumbs'); // added by DC
		showEmoji = prefs.read('showEmoji'); // added by DC

		for (var j = 0, panel; panel = this.panels[j]; j++) {
			var content = Mojo.View.render({
				object: panel,
				template: 'templates/panels/' + panel.type
			});
			panelHtml += content;

			this.controller.get('scrollItems').update(panelHtml);

			this.controller.setupWidget("scroller-" + j, {mode: 'vertical'},{});
			if (panel.type === "timeline") {
				this.controller.setupWidget('list-' + panel.index, {
					itemTemplate:	"templates/tweets/item",
					listTemplate:	"templates/list",
					renderLimit:	this.renderLimit
				}, panel.model);
			}
		}

		// Set up Lists and Search widgets
		this.trendingTopicsModel = {items: []};

		this.controller.setupWidget('trending-topics-list',{itemTemplate: "templates/search-list-item",listTemplate: "templates/list-noptr", renderLimit: 50}, this.trendingTopicsModel);
		this.controller.setupWidget('saved-searches-list',{itemTemplate: "templates/search-list-item",listTemplate: "templates/list-noptr", renderLimit: 30}, this.savedSearchesModel);

		this.listsModel = {items: []};
		this.listsYouFollowModel = {items: []};

		this.controller.setupWidget('your-lists-list',{itemTemplate: "templates/list-item",listTemplate: "templates/list-noptr", renderLimit: 30}, this.listsModel);
		this.controller.setupWidget('lists-you-follow-list',{itemTemplate: "templates/list-follows",listTemplate: "templates/list-noptr", renderLimit: 30}, this.listsYouFollowModel);

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

		// listen to the lists
		for (i=0; i < timelineLists.length; i++) {
			var el = timelineLists[i];

			this.controller.listen(el, Mojo.Event.listTap, this.tweetTapped.bind(this));
			this.controller.listen(el, Mojo.Event.hold, this.tweetHeld.bind(this));
		}

		// listen to the load more buttons
		for (i=0; i < loadMoreBtns.length; i++) {
			var btn = loadMoreBtns[i];
			this.controller.listen(btn, Mojo.Event.tap, this.moreButtonTapped.bind(this));
		}

		this.moveIndicator(0);

		this.addListeners();

		var prefs = new LocalStorage();
		var refreshDelay = prefs.read('refreshDelay');

		setTimeout(function() {
			var prefs = new LocalStorage();

			if (prefs.read('refreshFlushAtLaunch') == false) {
				this.refreshAll();
			} else {
				for (var j = 0, panel; panel = this.panels[j]; j++) {
					if (panel.type === "timeline" || panel.type === "search") {
						//this.refreshPanelFlush(panel);
						this.refreshPanelFlushTimeout(j,refreshDelay,panel);
					}
				}
				// Load the list of people being followed for auto complete
				if (!global.following || !global.following.length) {
					this.refreshFollowing();
				}
			}

			// TODO	Either make these work for each account or don't let you
			//		add that column for alternate accounts...
			//
			//		Same goes for search. It probably doesn't make much sense
			//		to do search from different accounts anyway.
			//
			//		Also it doesn't make sense to load the lists and get RTs if
			//		that panel isn't configured...
			this.loadLists();

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

	/* Command to garbage collect the heap - gc is unknown so commenting out*/
	garbageCollect: function() {
		/*Mojo.Log.error("GC'ing javascript heap");
		// Do it twice to clear out dangling references (v8 oddity)
		//var secondRound = function(){
		this.controller.serviceRequest('palm://com.palm.lunastats',{
			method: 'gc',
			parameters: {}
		});
		//};
		//secondRound = secondRound.bind(this);
		//this.controller.serviceRequest('palm://com.palm.lunastats',{
		//	method: 'gc',
		//	parameters: {},
		//	onComplete: secondRound
		//});
		*/
	},
	handleCommand: function(event) {
		if (event.type === Mojo.Event.back) {
			var prefs = new LocalStorage(); //added by DC
			var refresh = prefs.read('refreshOnSubmit'); //added by DC
			if (this.toasters.items.length > 0) {
				if (this.imagePreview) {
					this.toasters.items[this.toasters.items.length - 1].closePreview();
				} else {
					this.toasters.back();
				}
				event.stop();
			}
		} else if (event.type === Mojo.Event.forward) {
			var prefs = new LocalStorage();
			var onSwipe = prefs.read('forwardSwipe');
			if (Ajax.activeRequestCount === 0) {
				if (onSwipe === 'current') {
					this.refresh();
				} else if (onSwipe === 'all') {
					this.refreshAll();
				}
			}
		} else if (typeof(event.command) !== 'undefined') {
			if (event.command.indexOf('font-') > -1) {
				this.changeFont(event.command);
			} else if (event.command.indexOf('account-') > -1) {
				var userId = event.command.substr(event.command.indexOf('-') + 1);
				this.openAccount(userId);
			} else if (event.command === 'cmdNewAccount') {
				this.newAccountTapped();
			} else if (event.command === 'cmdMyProfile') {
				// this.showProfile(this.user.username, true);
				var Twitter = new TwitterAPI(this.user);
				Twitter.getUser(this.user.username, function(response){
					this.controller.stageController.pushScene({
						name: 'profile',
						disableSceneScroller: true
					}, response.responseJSON);
				}.bind(this));
			} else if (event.command === 'cmdNewTweet') {
				this.newTweet();
			} else if (event.command === 'cmdRefresh') {
				if (Ajax.activeRequestCount === 0) {
					this.refreshAll();
				}
			} else if (event.command === 'cmdRefreshFlush') {
				var screenWidth = this.controller.window.innerWidth;
				if (Ajax.activeRequestCount === 0) {
					//Need to refresh all on Touchpad - DC
					if (screenWidth <= this.panelWidth) {
						this.refreshPanelFlush(this.panels[this.timeline]);
					} else {
						for (var j = 0, panel; panel = this.panels[j]; j++) {
							if(panel.type === "timeline" || panel.type === "search") {
								this.refreshPanelFlush(panel);
							}
						}
					}
				}
			} else if (event.command === 'cmdFindUser') {
				this.toasters.add(new LookupToaster(this));
			} else if (event.command === 'cmdRateLimit') {
				var Twitter = new TwitterAPI(this.user);
				Twitter.rateLimit();
			} else if (event.command === 'cmdAddFilter') {
				this.toasters.add(new AddFilterToaster(this));
			} else if (event.command === 'cmdManageTabs') {
				this.toasters.add(new ManageTabsToaster(this));
			} else if (event.command === 'cmdManageFilters') {
				this.toasters.add(new ManageFiltersToaster(this));
			} else if (event.command === 'cmdManageMutedUsers') {
				var prefs	= new LocalStorage();
				var mutedUsers	= prefs.read('mutedUsers');
				var ids	= [];

				if(mutedUsers){
					var count = 0;
					for (var i = 0, m; m = mutedUsers[i]; i++) {
						ids.push(decStrNum(m.id_str));
						//Mojo.Log.error('id: ' +  decStrNum(m.id_str) + ' id_str: ' + m.id_str);
						count++;
					}
					if(count > 0) {
						var Twitter = new TwitterAPI(this.user);
						Twitter.getUsersById(ids.join(','), function(r){
							this.toasters.add(new ManageMutedUsersToaster("Muted Users",r.responseJSON,this));
						}.bind(this));	
					} else {
						banner('Muted User list is empty');
					}
				}
			} else if (event.command === 'cmdCreateShortcut') {
				this.createShortcut(this.user);
			} else if (event.command === 'cmdCreateAllShortcuts'){
				this.createAllShortcuts(this.users);
			} else if (event.command === 'cmdChangelog') {
				this.toasters.add(new ChangelogToaster(this));
			} else if (event.command === 'cmdRemoveAccount') {
				this.logout();
			} else if (event.command === 'cmdLoginRil') {
				this.controller.stageController.pushScene("ril-login");
			}
		}
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
			height += 1; //On Pre3 there is 1 extra line at bottom that needs to be accounted for
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
				this.controller.get("scroller-" + i).setStyle({"max-height": height + "px"});
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
		var		scroller	= panel.assistant.controller.get('scroller-' + panel.index);
		var		ptr			= panel.assistant.controller.get('ptr-text-' + panel.index);
		var		pos;

		if (ptr) {
			ptr.removeClassName('ptr-text-showing');
		}

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
					if (ptr) {
						var prefs = new LocalStorage();
						var ptrCount = prefs.read('ptrCount');

						if((panel.count+1 >= ptrCount) && ptrCount !== 0){
							panel.assistant.controller.get("ptr-text-" + panel.index).update('Release to refresh & flush');
						}
						ptr.addClassName('ptr-text-showing');
					}
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
		var		scroller	= panel.assistant.controller.get('scroller-' + panel.index);
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
		panel.assistant.controller.get("ptr-text-" + panel.index).removeClassName('ptr-text-showing');

		if ((pos = scroller.mojo.getScrollPosition())) {
			if (pos.top > 10 && Ajax.activeRequestCount === 0) {
				var prefs = new LocalStorage();
				var ptrCount = prefs.read('ptrCount');

				panel.count++;
				// 17-NOV-2018 - George Mari
				// Our direct messages panel will always be a refresh & flush operation.
				// Why?  Because when the Twitter API changed for direct messages, we could no longer
				// retrieve only direct messages since a certain message id, like we still can for 
				// regular tweets.  So no need to manage gaps, load more at the end, etc.  Just always get 
				// the last 50 messages, which is the max the API allows us, currently.  This means we won't 
				// keep around old messages older than the last 50.
				if(((panel.count >= ptrCount) && ptrCount !== 0) || panel.id == 'messages') {
					panel.assistant.refreshPanelFlush(panel);
					panel.assistant.controller.get("ptr-text-" + panel.index).update('Release to refresh ');
					panel.count = 0;
				} else {
					panel.assistant.refreshPanel(panel);
				}
			}
			// Mojo.Log.info(pos.top);
		}
	},

	sideScrollerChanged: function(event) {
		var panel = this.panels[event.value];
		var screenWidth = this.controller.window.innerWidth;

		//hide the beacon and new content indicator on the old panel
		var oldPanel = this.panels[this.timeline];
		if (oldPanel.index < 6 || this.largedevice) {
			if (oldPanel && oldPanel.refresh) {
				this.controller.get('beacon-' + oldPanel.index).removeClassName('show');
			}
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
			this.moveIndicator(panel.index);
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
		var prefs = new LocalStorage();
		var trendLocation = prefs.read('trendLocation');

		Twitter.trends(trendLocation, function(response){
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
				} else {
					this.controller.get('saved-searches').removeClassName('single');
				}
				this.savedSearchesModel.items = savedSearches;
				this.controller.modelChanged(this.savedSearchesModel);
				this.controller.get('saved-searches').show();
				this.savedSearchesLoaded = true;
			} else {
				this.controller.get('saved-searches').hide();
			}
		}.bind(this));
	},
	createShortcut: function(user) {
		var callParams = {
			id: Mojo.Controller.appInfo.id,
			'icon': Mojo.Controller.appInfo.icon,
			'title': "Project Macaw " + user.username,
			'params': {"action": "userlaunch","userid": user.id}
		};
		this.controller.serviceRequest('palm://com.palm.applicationManager/addLaunchPoint', {
			parameters: callParams,
			onSuccess: function() {
				this.shortcutAddLaunchIconSuccess(user);
			}.bind(this),
			onFailure: function() {
				setTimeout( function() {
					this.shortcutAddLaunchIconFailure(user);
				}.bind(this),2000);
			}.bind(this)
		});
	},
	
	createAllShortcutsTimeout: function(i,users){
		setTimeout(function () {
			this.createShortcut(users[i]);
		}.bind(this),i*5000);
	},
	createAllShortcuts: function(users) {
		var i;
		for (i=0; i < users.length; i++) {
			// Call via a separate timeout function so that there is a pause between each creation to allow the notifications their time in the spotlight
			this.createAllShortcutsTimeout(i,users);
		}
	},

	shortcutAddLaunchIconSuccess: function(user) {
		Mojo.Controller.getAppController().showBanner("Shortcut created for " + user.username, {}, 'shortcutBanner');
		//setTimeout(this.shortcutBannerTimeout.bind(this), 2000);
	},
	
	shortcutBannerTimeout: function() {
		//Mojo.Controller.getAppController().removeBanner('shortcutBanner');
	},
	
	shortcutAddLaunchIconFailure: function(user) {
		Mojo.Log.error('unable to create shortcut for ' + user.username);
		Mojo.Controller.getAppController().showBanner("Unable to create Shortcut for " + user.username, {}, 'shortcutBanner');
		//setTimeout(this.shortcutBannerTimeout.bind(this), 2000);	      
	},
	refreshPanelFlushTimeout: function(delay,refreshDelay,panel){
		setTimeout(function () {
			//this.createShortcut(users[i]);
			this.refreshPanelFlush(panel);
		}.bind(this),delay*refreshDelay);
	},
	refreshAllTimeout: function(delay, refreshDelay, panel){
		setTimeout(function () {
			this.refreshPanel(panel);
		}.bind(this),delay*refreshDelay);

	},
	refreshAll: function() {
		var prefs = new LocalStorage();
		var refreshDelay = prefs.read('refreshDelay');
		for (var j=0; j < this.panels.length; j++) {
			if (this.panels[j].type === "timeline" || this.panels[j].type === "search") {
				//this.refreshPanel(this.panels[j]);
				this.refreshAllTimeout(j,refreshDelay,this.panels[j]);
			}
		}

		// Load the list of people being followed for auto complete
		if (!global.following || !global.following.length) {
			this.refreshFollowing();
		}
	},
	refreshFollowing: function() {
		global.following = [];

		for (var i = 0, u; u = this.users[i]; i++) {
			var Twitter = new TwitterAPI(u);

			Twitter.getFriends(this.user.id, function(r) {
				var		f;

				while ((f = r.shift())) {
					for (var u, i = 0; (u = global.following[i]); i++) {
						//Mojo.Log.error('following: ' + global.following[i].screen_name);
						if (u.screen_name.toLowerCase() === f.screen_name.toLowerCase()) {
							f = null;
							break;
						}
					}

					if (f) {
						global.following.push(f);
					}
				}
			});
		}
	},
	refresh: function() {
		this.refreshPanel(this.panels[this.timeline]);
	},
	refreshPanelId: function(id) {
		this.refreshPanel(this.getPanel(id));
	},
	refreshPanel: function(panel) {
		//Mojo.Log.error('panel.id: ' + panel.id);
		if (panel.refresh) {
			var lastId = undefined;

			this.loadingMore = false;
			this.loadingGaps = false;

			setTimeout(function() {
				if (!panel.model.items) {
					panel.model.items = [];
				}

				if (panel.model.items.length > 0) {
					// grab the second tweet for gap detection
					var tweet = panel.model.items[1];

					if (tweet) {
						if (tweet.dm) {
							lastId = tweet.id;
						}
						if (tweet.is_rt) {
								lastId = tweet.original_id;
						} else {
							lastId = tweet.id_str;
						}
					}
				}
				this.getTweets(panel, lastId);
			}.bind(this), 200);
		} else if (panel.id === 'search') {
			this.loadSearch();
		}
	},
	refreshPanelFlush: function(panel) {
		this.loadingMore = false;
		this.loadingGaps = false;
		var lastId = undefined;
		//var myLastId = undefined;
		//Mojo.Log.error('panel.id: ' + panel.id);

		if (panel.model.items.length > 0) {
			var tweet = panel.model.items[0];

			if (tweet) {
				if (tweet.is_rt) {
					if (typeof(tweet.retweeted_status) !== "undefined") {
						panel.model.myLastId = tweed.tweet.retweeted_status[0].id;
					} else {
						panel.model.myLastId = tweet.id_str;
					}
				} else {
					panel.model.myLastId = tweet.id_str;
				}
				if (tweet.dm) {
					panel.model.myLastId = tweet.id;
				}
			}
		}

		panel.model.items = {};
		panel.model.items.length = 0;

		if (panel.refresh) {
			setTimeout(function() {
				if (panel.model.items.length > 0) {
					// grab the second tweet for gap detection
					var tweet = panel.model.items[1];

					if (tweet) {
						if (tweet.is_rt) {
							if (typeof(tweet.retweeted_status) !== "undefined") {
								lastId = tweet.original_id;
							}
						} else {
							lastId = tweet.id_str;
						}
						if (tweet.dm) {
							lastId = tweet.id;
						}
					}
				}

//			panel.model.items = {};
//			panel.model.items.length = 0;

				this.getTweets(panel, lastId);
				//this.garbageCollect();
			}.bind(this), 200);
		} else if (panel.id === 'search') {
			this.loadSearch();
			//this.garbageCollect();
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
		var maxId;

		// 20-NOV-2018 - George Mari
		// Don't Load More if we are on the messages panel,
		// because since the new API for messages was implemented, we get all messages (max of 50 allowed by API)
		// each time we refresh the panel.
		if (this.panels[this.timeline].id == 'messages') {
			Mojo.Log.info('loadMore: skipping load for messages panel...');
			return;

		}
		if (model && model.items && model.items.length > 0) {
			this.loadingMore = true;
			if (model.items[model.items.length-1].is_rt) {
				maxId = model.items[model.items.length-1].original_id;
			} else {
				maxId = model.items[model.items.length-1].id_str;
			}
			var panel = this.panels[this.timeline];

			this.getTweets(panel, undefined, maxId);
		}
	},

	getDMs: function(Twitter, args, panel) {
		var prefs = new LocalStorage(); //added by DC
		var dmTo = "←"; //"◄←"; //"☞"; //"To:";
		var dmFrom = "→"; //"►→"; //"☜"; "From:";

		//Mojo.Log.error('getDMs: entered...');
		//Mojo.Log.error('getDMs: args: ', Object.toJSON(args));
		
		//Mojo.Log.info('getDMs: point 1...');
			Twitter.timeline(panel, function(r2, m2) {

				var dm_sender = '';
				var dm_sender_list = '';
				this.dm_info = [];
				//Mojo.Log.info('getDMs r2 length: ' + r2.responseJSON.events.length);

				//Mojo.Log.info('getDMs - typeof this.user: ' + typeof this.user);
				//Mojo.Log.info('getDMs - this.user: ' + JSON.stringify(this.user));

				for (var i = 0, tweet; tweet = r2.responseJSON.events[i]; i++) {
					tweet.user = tweet.message_create.sender_id;
					tweet.dm						= true;
					//tweet.user.name = tweet.user.name + dmFrom;// added by DC
					if (tweet.user == this.user.id) {
						tweet.dir = dmFrom;
						}
					else {
						tweet.dir = dmTo;
						}
					// Use unicode above instead of bitmap below.  This way it scales with the font selection
					//tweet.direction_arrow_img = "images/low/arrow_left.png";
					//Mojo.Log.info('getDMs dm text: ' + tweet.message_create.message_data.text);

					// this.dm_info will hold things we will need later to display the direct message,
					// such as the message sender's screen_name, and profile_image_url
					this.dm_info[tweet.message_create.sender_id] = new Object();
				}
				// dm_sender_list will be a comma-separated list of the unique sender_ids 
				// from our retrieved list of direct messages.
				for (dm_sender in this.dm_info) {
					//Mojo.Log.info('getDMs - dm_sender: ' + dm_sender + ' /type: ' + typeof this.dm_info[dm_sender]);
					if (typeof this.dm_info[dm_sender] != 'function') {
						dm_sender_list = dm_sender_list + dm_sender + ',';
					}
				}
				// Trim the last comma character from the string
				if (dm_sender_list.lastIndexOf(',') == dm_sender_list.length - 1) {
					dm_sender_list = dm_sender_list.slice(0, -1);
				}	
				// Mojo.Log.info('getDMs - dm_sender_list: ' + dm_sender_list);

				for (var i = 0, tweet; tweet = r2.responseJSON.events[i]; i++) {
					//Mojo.Log.info('getDMs in 2nd loop, i = ' + i);
					var id	= tweet.message_create.sender_id;
					/*
					var img = tweet.sender.profile_image_url;
					if (Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3"){ 
						img	= img.replace('_normal', '_bigger'); // Use higher res avatar for Pre3
					}
					*/
					//Mojo.Log.info('getDMs: point 2.1...');
					tweet.user = tweet.message_create.target.recipient_id;

					//tweet.user.name = tweet.user.name + dmTo;  // added by DC
					//tweet.dir = dmTo;
					// Use unicode above instead of bitmap below.  This way it
					// scales with the font selection

					//tweet.direction_arrow_img = "images/low/arrow_right.png";
					//tweet.user.profile_image_url	= img;
					tweet.user.id_str				= id;
					tweet.dm						= true;
				}

				//	var joined	= r1.responseJSON.concat(r2.responseJSON);
				var joined	= r2.responseJSON.events;

				// Mojo.Log.info('getDMs: point 3...');
				joined.sort(function(a, b) {
					return b.created_timestamp - a.created_timestamp;
				});
				// Mojo.Log.info('getDMs: point 4...');
				Twitter.getUsersById(dm_sender_list, function(r3){
					var i;
					//Mojo.Log.info('getDMs - getUsersById responseJSON array length: ' + r3.responseJSON.length);
					//Mojo.Log.info('process dm getUsersById responseJSON: ' + JSON.stringify(r3.responseJSON));
					for (i = 0; i < r3.responseJSON.length; i = i + 1) {
						//Mojo.Log.info('getDMs index for this.dm_info: ' + r3.responseJSON[i].id_str);
						this.dm_info[r3.responseJSON[i].id_str].screen_name = r3.responseJSON[i].screen_name;
						//Mojo.Log.info('getDMs screen name: ' + r3.responseJSON[i].screen_name);
						//Mojo.Log.info('getDMs this.dm_info screen name: ' + this.dm_info[r3.responseJSON[i].id_str].screen_name);
						this.dm_info[r3.responseJSON[i].id_str].profile_image_url = r3.responseJSON[i].profile_image_url;
						//Mojo.Log.info('getDMs profile image url: ' + r3.responseJSON[i].profile_image_url);
						//Mojo.Log.info('getDMs this.dm_info profile image url: ' + this.dm_info[r3.responseJSON[i].id_str].profile_image_url);
						//Mojo.Log.info('getDms - this.dm_info is: ' + Object.toJSON(this.dm_info));
					}
					//Mojo.Log.info('getDMs - about to call gotItems.  this.dm_info length is: ' + this.dm_info.length);
					this.gotItems({ responseJSON: joined }, panel, 0, this.dm_info);

					}.bind(this));	

				// Mojo.Log.info('getDMs: point 5...');
			}.bind(this), args, this, 'directmessages');
	
	},

	getAccount: function(id) {
		if (!id) {
			return(this.user);
		}

		if (this.users) {
			for (var i = 0, u; u = this.users[i]; i++) {
				if (u.id == id) {
					return(u);
				}
			}
		}

		return(null);
	},

	getTweets: function(panel, lastId, maxId, tappedId) {
		var Twitter;
		var user	= this.getAccount(panel.tab.account);
		var prefs = new LocalStorage();
		var homeMaxResults = prefs.read('homeMaxResults');
		var mentionsMaxResults = prefs.read('mentionsMaxResults');
		var favMaxResults = prefs.read('favMaxResults');
		var listMaxResults = prefs.read('listMaxResults');
		var args	= {
			//'count':			this.count,
			//'count':			homeMaxResults,
			'include_entities':	'true',
			'full_text': 'true'
		};
		var dm_args = {
			count: 50
			};

		switch(panel.resource){
			case 'home':
				args.count = homeMaxResults;
				break;
			case 'mentions':
				args.count = mentionsMaxResults;
				break;
			case 'userFavorites':
				args.count = favMaxResults;
				break;
			case 'listStatuses':
				args.count = listMaxResults;
				break;				
			default:
				args.count = 200;
				break;
		}
		
		if (!user) {
			console.log('Invalid account: ' + panel.tab.account);
			return;
		}
		Twitter = new TwitterAPI(user);

		if(lastId && maxId) {
			args.count++;
		}
		if (lastId) {
			args.since_id = lastId;
		}

		if (maxId) {
			args.max_id = maxId;
		}

		if (panel.resource === 'messages') {
			/*
				Loading DMs requires 2 requests in order to get both sent and
				received messages.
				16-NOV-2018 - George Mari
				Loading DMs no longer requires 2 requests.  Twitter changed their API.
			*/
			this.getDMs(Twitter, dm_args, panel);
			return;
		}

		args['include_rts'] = '1';

		var gotItemsCB = function(response, meta) {
			this.gotItems(response, panel, tappedId);
		}.bind(this);

		// TODO	Allow a search results panel
		if (!panel.tab.slug) {
			/* Normal timeline */
			Twitter.timeline(panel, gotItemsCB, args, this);
		} else {
			/* List */
			args['slug'] = panel.tab.slug;
			args['owner_screen_name'] = panel.tab.owner;

			Twitter.listStatuses(args, gotItemsCB);
		}
	},

	gotItems: function(response, panel, tappedId, msg_info) {
		// one-size-fits-all function to handle timeline updates
		// Does lots of looping to update relative times. Needs optimization
		var model		= panel.model;
		var scroller	= "scroller-" + panel.index;
		var more		= "more-" + panel.index;
		var tweets		= response.responseJSON;
		var xCount		= tweets.length;
		var th			= new TweetHelper();
		var favSym		= "♥"; //"★"; //added by DC
		var filters		= (new LocalStorage()).read('filters');
		var user		= this.getAccount(panel.tab.account);
		var prefs = new LocalStorage();
		var processVine = prefs.read('showVine');
		var mutedUsers = prefs.read('mutedUsers');
		var hideGifs = prefs.read('hideGifThumbsInTimeline');
		var muteSelectedUsers = prefs.read('muteSelectedUsers');
		var hideNewMutedTweets = prefs.read('hideNewMutedTweets');
		var showThumbs = prefs.read('showThumbs');
		var scrollMoreToBottom = prefs.read('scrollMoreToBottom');
		//Mojo.Log.info('xCount: ' + xCount); //Twitter doesn't always return the number of tweets you are expecting, which is VERY annoying.
		//Mojo.Log.info('gotItems - response is: ' + Object.toJSON(tweets));
		for (var i = 0, tweet; tweet = tweets[i]; i++) {
			//Mojo.Log.info('gotItems: point 1...');
			// Store a reference to the account that loaded this tweet //
			tweet.owner = user.id;

			if (tweet.dm || !th.filter(tweet, filters)) {
				//Mojo.Log.info('gotItems: tweet.dm is true...');
				//Mojo.Log.info('gotItems - response:' + typeof response);
				//Mojo.Log.info('gotItems - panel:' + typeof panel);
				//Mojo.Log.info('gotItems - tappedId:' + typeof tappedId);
				//Mojo.Log.info('gotItems - msg_info:' + typeof msg_info);

				tweets[i] = th.process(tweet,panel.model,this.controller,processVine,mutedUsers,hideGifs, msg_info);
				if(tweets[i].is_quote_status && typeof(tweets[i].quoted_status_id_str) != "undefined" && typeof(tweets[i].quoted_status) != "undefined"){
					tweets[i].quoted_status = th.process(tweets[i].quoted_status,panel.model,this.controller,false);
					tweets[i].quote_class = 'show';
				}
			} else {
				tweets.splice(i, 1);
				i--;
			}
		}

		//th.getQuotedTweets(panel.model,this.controller);

		if (panel.index < 6 || this.largedevice) {
			if (tweets.length > 1) {
				if (!this.loadingMore) {
					this.controller.get('beacon-' + panel.index).addClassName('show');
				}
			} else {
				this.controller.get('beacon-' + panel.index).removeClassName('show');
			}
		}

		var scrollId = 0; // this is the INDEX (not ID, sorry) of the new tweet to scroll to
		var fullLoad = 0; // added by DC. Used to flag when full 1:1 tweet pull is used
		var gapIndex = 0; //gapIndex will need to be an array for multiple gaps for hold and scrollto

		//Mojo.Log.error('loadingGaps: ' + this.loadingGaps);
		if (model.items.length > 0 && this.loadingMore) {
			// loading "more" items (not refreshing), so append to bottom
			// start the loop at i = 1 so tweets aren't duplicated

			for (var i = 1, tweet; tweet = tweets[i]; i++) {
				model.items.splice((model.items.length - 1) + i, 0, tweet);
			}
			//if(!panel.scrollId)
			//	panel.scrollId = 0;
			// else 
			if(scrollMoreToBottom){
				panel.scrollId += xCount-1;
				scrollId = panel.scrollId;
			} else {
				if(!panel.scrollId){
					panel.scrollId = 0;
				}
			}
		} else if (model.items.length > 0 && this.loadingGaps) {
			//filling a gap
			// loop through old tweets to find gap index
			//Mojo.Log.error('loading gaps...' + model.items.length);

			for (k=0; k < model.items.length; k++) {
				if (model.items[k].cssClass === 'new-tweet'){
					model.items[k].cssClass = "old-tweet";
					//Mojo.Log.error('found new-tweet div at: ' + k);
					if(model.items[k].id_str === tappedId) {
						gapIndex = k+1;
					}
				}
				if (model.items[k].cssClass === 'are-gaps'){
					//Mojo.Log.error('found are-gaps div at: ' + k);
					if(model.items[k].id_str === tappedId) {
						model.items[k].cssClass = "no-gaps";
						gapIndex = k+1;
					}
					//Mojo.Log.error('gapIndex = ' + gapIndex);
				}
			}

			var dividerTweet ={
				index: 0,
				mutedCount: 0,
				tweetCount: 0,
				noun: '',
				hasGap: false
			};
			//Mojo.Log.error('xCount: ' + xCount);
			if(xCount !== 0) {
				//Mojo.Log.error('Splicing in ' + xCount + ' tweets at index ' + gapIndex);
				tweets[tweets.length-1].cssClass = 'are-gaps';
			
				// TODO: Make this message tappable to load gaps
				var msg = xCount-1 + ' Revealed ' + (this.nouns[panel.id] || "Tweet");

				if (xCount-1 > 1) {
					msg += 's'; //pluralize
				}

				if(tweets[tweets.length - 1].id_str !== model.items[gapIndex].gapEnd){
					msg += '<br /><span>Tap to load missing tweets</span>';
					dividerTweet.hasGap = true;
				}

				tweets[tweets.length-1].dividerMessage = msg;
				tweets[tweets.length-1].gapStart = tweets[tweets.length-1].id_str;
				tweets[tweets.length-1].gapEnd = model.items[gapIndex].id_str;
				dividerTweet.index = tweets.length-1;
				dividerTweet.tweetCount = xCount-1;
				dividerTweet.noun = this.nouns[panel.id];
				//maybe clear out model.items[gapIndex].gapStart and .gapEnd here

				for (var i = 1, tweet; tweet = tweets[i]; i++) {
					model.items.splice((gapIndex-1) + i, 0, tweet);
					if (tweet.hideTweet_class) {
						dividerTweet.mutedCount++;
					}
				}

				if(!panel.scrollId){
					panel.scrollId = 0;
				}	else {
					panel.scrollId+=xCount-1;
					scrollId = panel.scrollId; //new DC
				}

				if((dividerTweet.mutedCount > 0) && muteSelectedUsers === true) {
					var msg = "";
					var unMutedTweetCount = dividerTweet.tweetCount-dividerTweet.mutedCount;
					if(hideNewMutedTweets){
						if(unMutedTweetCount > 0){
							msg = unMutedTweetCount + ' Revealed ' + (dividerTweet.noun || "Tweet");
							if (unMutedTweetCount > 1) {
								msg += 's'; //pluralize
							}
						} else {
							model.items[(gapIndex-1) + dividerTweet.index].cssClass = 'old-tweet';
						}
					} else {
						msg = unMutedTweetCount + ' (+' + dividerTweet.mutedCount + ')' + ' Revealed ' + (dividerTweet.noun || "Tweet");
						if (dividerTweet.tweetCount > 1) {
							msg += 's'; //pluralize
						}
					}

					if (dividerTweet.hasGap) {
						msg += '<br /><span>Tap to load missing tweets</span>';
						//model.items[dividerTweet.index].cssClass = 'are-gaps';
						model.items[(gapIndex-1) + dividerTweet.index].cssClass = 'are-gaps';
					}
					model.items[(gapIndex-1) + dividerTweet.index].dividerMessage = msg;
				}
			} else {
				panel.scrollId = 0;
			}
		} else if (model.items.length > 0 && !this.loadingMore && panel.id !== 'messages') {
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
			} else {
				hasGap = true;
				loopCount = tweets.length - 1;
				tweets[tweets.length - 1].gapStart = tweets[tweets.length - 1].id_str;
				tweets[tweets.length - 1].gapEnd = model.items[0].id_str;
			}

			//hasGap = false; // ignore gap detection in this release

			var j;
			var dividerTweet ={
				index: 0,
				mutedCount: 0,
				tweetCount: 0,
				noun: ''
			};

			for (j = loopCount; j >= 0; j--) {
				//doing a backwards (upwards?) loop to get the items in the right order
				if (j === loopCount) {
					tweets[j].cssClass = 'new-tweet';

					// TODO: Make this message tappable to load gaps
					var msg = tweetCount + ' New ' + (this.nouns[panel.id] || "Tweet");

					if (tweetCount > 1) {
						msg += 's'; //pluralize
					}

					if (hasGap) {
						msg += '<br /><span>Tap to load missing tweets</span>';
						tweets[j].cssClass = 'are-gaps';
					}
					tweets[j].dividerMessage = msg;
					dividerTweet.index = j;
					dividerTweet.tweetCount = tweetCount;
					dividerTweet.noun = this.nouns[panel.id];
				}
				if (tweets[j].hideTweet_class) {
					dividerTweet.mutedCount++;
				}
				model.items.splice(0,0,tweets[j]);
			}

			if(tweetCount !== 0){
				scrollId = tweetCount; // set the index of the new tweet to auto-scroll to
				panel.scrollId= scrollId;
				if((dividerTweet.mutedCount > 0) && muteSelectedUsers === true) {
					var msg = "";
					var unMutedTweetCount = dividerTweet.tweetCount-dividerTweet.mutedCount;
					if(hideNewMutedTweets){
						if(unMutedTweetCount > 0){
							msg = dividerTweet.tweetCount-dividerTweet.mutedCount + ' New ' + (dividerTweet.noun || "Tweet");
							if (unMutedTweetCount > 1) {
								msg += 's'; //pluralize
							}
						} else {
							model.items[dividerTweet.index].cssClass = 'old-tweet';
						}
					} else {
						msg = dividerTweet.tweetCount-dividerTweet.mutedCount + ' (+' + dividerTweet.mutedCount + ')' + ' New ' + (dividerTweet.noun || "Tweet");
						if (dividerTweet.tweetCount > 1) {
							msg += 's'; //pluralize
						}
					}

					if (hasGap) {
						msg += '<br /><span>Tap to load missing tweets</span>';
						model.items[dividerTweet.index].cssClass = 'are-gaps';
					}
					model.items[dividerTweet.index].dividerMessage = msg;
				}
			}
		} else {
			// the timeline was empty so do a 1:1 mirror of the tweets response
			model.items = tweets;
			fullLoad = 1;
			if(!panel.scrollId){
				panel.scrollId = 0;
			}
		}

		// Write a few (10) of the latest tweets to the user's cache (async)
		user[panel.id] = model.items.slice(0, 10);

		var account = new Account();
		account.load(user);
		account.save();

		// Save the recent ids for notification checks
		if (tweets.length > 0 && !this.loadingMore) {
			var store = new LocalStorage();

			store.write(user.id + '_' + panel.id, tweets[0].id_str);
		}

		var dividerTweet ={
			index: 0,
			mutedCount: 0,
			tweetCount: 0,
			noun: ''
		};

		//Block added by DC - allows new tweet marker to work after refresh and flush
		//if (panel.update) 
		if (panel.refresh) {
			if(model.myLastId) {
				for(k=0; k < model.items.length; k++){
					//Mojo.Log.error('k: ' + k + ' model.items[k].id_str: ' + model.items[k].id_str + ' model.myLastId: ' + model.myLastId);
					if(model.items[k].id_str === model.myLastId) {
						if(k > 0) {
							// TODO: Make this message tappable to load gaps
							var msg = k + ' New ' + (this.nouns[panel.id] || "Tweet");

							if (k > 1) {
								msg += 's'; //pluralize
							}
							model.items[k-1].dividerMessage = msg;
							model.items[k-1].cssClass = 'new-tweet';
							model.myLastId = undefined;

							if (panel.index < 6 || this.largedevice) {
								this.controller.get('beacon-' + panel.index).addClassName('show');
							}
							dividerTweet.index = k-1;
							dividerTweet.tweetCount = k;
							dividerTweet.noun = this.nouns[panel.id];
						} else {
							if (panel.index < 6 || this.largedevice) {
								this.controller.get('beacon-' + panel.index).removeClassName('show');
							}
						}
						scrollId = k; // set the index of the new tweet to auto-scroll to
						panel.scrollId = scrollId;
						break; //no need to keep on iterating if we've found our match
					}
					if (model.items[k].hideTweet_class) {
						dividerTweet.mutedCount++;
					}
				}
				model.myLastId = undefined;
			}
		}

		if (fullLoad === 1 && panel.id !== 'messages') {
			if (scrollId < 10) {
				model.items = tweets.slice(0,10);
			} else {
				model.items = tweets.slice(0,scrollId+1);
			}
		}	//end block

		if((dividerTweet.mutedCount > 0) && muteSelectedUsers === true && panel.id !== 'messages') {
			var msg = "";
			var unMutedTweetCount = dividerTweet.tweetCount-dividerTweet.mutedCount;
			if(hideNewMutedTweets){
				if(unMutedTweetCount > 0){
					msg = unMutedTweetCount + ' New ' + (dividerTweet.noun || "Tweet");
					if (unMutedTweetCount > 1) {
						msg += 's'; //pluralize
					}
				} else {
					model.items[dividerTweet.index].cssClass = 'old-tweet';
				}
			} else {
				msg = unMutedTweetCount + ' (+' + dividerTweet.mutedCount + ')' + ' New ' + (dividerTweet.noun || "Tweet");
				if (dividerTweet.tweetCount > 1) {
					msg += 's'; //pluralize
				}
			}
	
			if (hasGap) {
				msg += '<br /><span>Tap to load missing tweets</span>';
				model.items[dividerTweet.index].cssClass = 'are-gaps';
			}
			model.items[dividerTweet.index].dividerMessage = msg;
		}


		if (panel.update) {
			for (i = 0; i < model.items.length; i++) {
				var tweet = model.items[i];

				tweet.time_str = this.timeSince(tweet.created_at);
				if(mutedUsers && mutedUsers.length > 0){
					for (var m = 0, mutedUser; mutedUser = mutedUsers[m]; m++) {
						//if (tweet.user.screen_name.indexOf(mutedUser.user) > -1) 
						if (tweet.user.id_str === mutedUser.id_str) {
							tweet.hideTweet_class = 'hide';
							break;
						} else if (tweet.retweeter && (tweet.retweeter.id_str === mutedUser.id_str)) {
							//(tweet.retweeter.screen_name.indexOf(mutedUser.user) > -1)) 
							tweet.hideTweet_class = 'hide';
							break;
						}	else {
							delete tweet.hideTweet_class;
						}
					}
				} else {
					delete tweet.hideTweet_class;
				}
				if (tweet.in_reply_to_status_id_str !== null && tweet.in_reply_to_status_id_str) {
					tweet.convo_class = 'show';
				}
				// block below added by DC
				if(tweet.favorited) {
					if (!tweet.favSet){
						//tweet.user.name = favSym + tweet.user.name;
						tweet.favSet = true;
						//tweet.favstar = favSym;
					}
					tweet.fav_class = 'show';
				} else {
					//if(tweet.favSet)
						//tweet.user.name = tweet.user.name.replace(favSym,"");
						tweet.favSet = false;
						tweet.fav_class = 'hide';
						//tweet.favstar = "";
					//
				}//end block
			}
		}

		this.controller.modelChanged(panel.model);
		if (scrollId !== 0) {
			if(this.loadingMore){
				setTimeout(function(){
					this.controller.get('scroller-'+panel.index).mojo.scrollTo(0, -99999999, true);
				}.bind(this), 1000);
				// As thumbs load a little slower, add a second scroll to try and compensate
				if(showThumbs === 'showThumbs') {
					setTimeout(function(){
						this.controller.get('scroller-'+panel.index).mojo.scrollTo(0, -99999999, true);
					}.bind(this), 4000);
				}
			} else {
				this.controller.get('list-' + panel.index).mojo.revealItem(scrollId, true);
			}
		}
		if (model.items.length === 0 || (this.loadingMore && tweets.length === 0)) {
			this.controller.get(more).hide();
		}
		//panel.scrollId= scrollId;
		this.loading = false;
	},
	fillGap: function(panel,startGapId,endGapId,tappedId) {
		if(!panel){
			return;
		} else {
			if(startGapId && endGapId){
				var user	= this.getAccount(panel.tab.account);
				this.loadingGaps = true;
				var Twitter;

				if (!user) {
					return;
				}
				this.getTweets(panel, endGapId, startGapId, tappedId);
			} else {
				this.refresh();
			}	
		}
	},
	gotGap: function(response, meta) {
		banner('Not done yet');
		//this.gotItems(response, panel);
	},
	timeSince: function(time) {
		//using a modified Date function in helpers/date.js
		var d = new Date(time);
		return d.toRelativeTime(1500);
	},
	loadLists: function() {
		var Twitter = new TwitterAPI(this.user);

		Twitter.userLists({'user_id':this.user.id}, function(response){
			//var lists = response.responseJSON.lists;
			var lists = response.responseJSON;
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
	},
	toggleCompose: function(opts) {
		OpenComposeToaster(this.toasters, opts, this);
	},
	refreshTapped: function(event) {
		if (Ajax.activeRequestCount === 0) {
			this.refreshAll();
		}
	},
	refreshHeld: function(event){
		event.preventDefault();
		//Mojo.Controller.getAppController().playSoundNotification("vibrate", "");			
		
		// Only works if app is a com.palm.app and not net.minego :(
		//this.controller.serviceRequest("palm://com.palm.vibrate", {
		//	method: 'vibrate',
		//	parameters: { 'period': 0, 'duration': 50 }
		//	}
		//);

		if(global.sysToolsMgrVer == '1.0.7' && global.haptics == true && global.hapticsRefresh == true){
			this.controller.serviceRequest('palm://ca.canucksoftware.systoolsmgr/', {
				method: 'deviceVibrate',
				parameters: { 'period': 0, 'duration': 40},
				onSuccess: function(result) {
					//yay! service request was successful
					this.controller.modelChanged(this.panels[this.timeline].model);
				}.bind(this),
				onFailure: function(result) {
					//Sorry, didn't work;
					this.controller.modelChanged(this.panels[this.timeline].model);
				}.bind(this)
			});
		} else {
			// Older version of systoolsmgr
			this.controller.modelChanged(this.panels[this.timeline].model);
		}
		
		//Mojo.Log.error('panel.id: ' + this.panels[this.timeline].id);
		//this.controller.modelChanged(this.panels[this.timeline].model);
		event.stop();
	},
	moreButtonTapped: function(event) {
		var id		= event.srcElement.id;
		var index	= id.substr(id.indexOf('-') + 1);

		this.timeline = index;
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
		} else {
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
			} else {
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
			} else {
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
				//Mojo.Log.error('gaptastic!');

				// TODO	This is not a good way to find the panel...
				//Mojo.Log.error('this.timeline1: ' + this.timeline);
				var src = event.srcElement;
				var id			= src.id.substr(src.id.indexOf('-') + 1);
				var panelIndex	= parseInt(id);
				//var panel = this.getPanel(this.panels[panelIndex]);
				this.timeline = id;
				var panel = this.panels[this.timeline];
	
				//Mojo.Log.error('event.item.gapStart:event.item.gapEnd : ' + event.item.gapStart + ' : ' + event.item.gapEnd);
				this.fillGap(panel,event.item.gapStart,event.item.gapEnd,event.item.id_str);
			} else {
				if(event.originalEvent.srcElement.id === "quote-wrapper" | event.originalEvent.srcElement.id === "quote-avatar" | event.originalEvent.srcElement.id === "quote-screenname" |event.originalEvent.srcElement.id === "quote-username" |event.originalEvent.srcElement.id === "quote-text"| event.originalEvent.srcElement.id === "quote-thumb-timeline"| event.originalEvent.srcElement.id === "quote-thumb-wrapper"
					| event.originalEvent.srcElement.id === "quote-inline-thumb" | event.originalEvent.srcElement.id === "quote-inline-thumb2" | event.originalEvent.srcElement.id === "quote-inline-thumb3" | event.originalEvent.srcElement.id === "quote-inline-thumb4" | event.originalEvent.srcElement.id === "quote-thumbnail"| event.originalEvent.srcElement.id === "quote-thumbnail2" | event.originalEvent.srcElement.id === "quote-thumbnail3"| event.originalEvent.srcElement.id === "quote-thumbnail4"
					| event.originalEvent.srcElement.id === "quote-time"| event.originalEvent.srcElement.id === "quote-time-abs"| event.originalEvent.srcElement.id === "quote-via"| event.originalEvent.srcElement.id === "quote-rt-avatar" | event.originalEvent.srcElement.id === "quote-footer" | event.originalEvent.srcElement.id === "via-link"){
					//Check below is only really needed if the #via-link doesn't have a pointer-events: none.
					if(typeof(event.item.quoted_status) != "undefined"){
						//Mojo.Log.error('quote.text: ' + event.item.quoted_status.text);
						this.toasters.add(new TweetToaster(event.item.quoted_status, this, this.savedSearchesModel));
				  } else {
						this.toasters.add(new TweetToaster(event.item, this, this.savedSearchesModel));
				 	}
				} else {
					//Mojo.Log.error('dump: ' + JSON.stringify(event.originalEvent.srcElement));
					this.toasters.add(new TweetToaster(event.item, this, this.savedSearchesModel));
				}
			}
		}
	},
	tweetHeld: function(event) {
		event.preventDefault();

		// Write a few (10) of the latest tweets to the user's cache (async)
		var panel	= this.panels[this.timeline];

		var currTarget=event.target;		
		var currItem = this.controller.get('list-' + panel.index).mojo.getItemByNode(currTarget);
		var tweetIndex = panel.model.items.map(function (tweet) { return tweet.id_str; }).indexOf(currItem.id_str);

		//Mojo.Log.error('tweets.length: ' + this.tweets.length);
		this.user[panel.id] = panel.model.items.slice(tweetIndex, tweetIndex+10);

		//for (var i = 1; tweetId = this.user[panel.id][i]; i++) {
		//	Mojo.Log.error('tweetId: ' + tweetId.id_str);
		//}
		var account = new Account();
		account.load(this.user);
		account.save();

		// Save the recent ids for notification checks
		if (panel.model.items.length > 0 && !this.loadingMore) {
			var store = new LocalStorage();

			store.write(this.user.id + '_' + panel.id, panel.model.items[tweetIndex].id_str);
		}
		
		if(this.oldBookmarkIndex){
			//Mojo.Log.error('this.oldBookmarkIndex: ' + this.oldBookmarkIndex);
			if(this.oldBookmarkIndex>0){
				panel.model.items[this.oldBookmarkIndex-1].cssClass = 'old-tweet';
				panel.model.items[this.oldBookmarkIndex-1].dividerMessage = "";
			}
		}
		if(tweetIndex>0){
			panel.model.items[tweetIndex-1].dividerMessage = "Bookmark";
			panel.model.items[tweetIndex-1].cssClass = 'new-tweet';
		}
		this.oldBookmarkIndex = tweetIndex;

		//Mojo.Controller.getAppController().playSoundNotification("vibrate", "","50");	
		
		// Only works if app is a com.palm.app and not net.minego :(
		//this.controller.serviceRequest("palm://com.palm.vibrate", {
		//	method: 'vibrate',
		//	parameters: { 'period': 0, 'duration': 50 }
		//	}
		//);				

		if(global.sysToolsMgrVer == '1.0.7' && global.haptics == true && global.hapticsBookmark == true){
			this.controller.serviceRequest('palm://ca.canucksoftware.systoolsmgr/', {
				method: 'deviceVibrate',
				parameters: { 'period': 0, 'duration': 40},
				onSuccess: function(result) {
					//yay! service request was successful
						this.controller.modelChanged(this.panels[this.timeline].model);
				}.bind(this),
				onFailure: function(result) {
					//Sorry, didn't work;
					this.controller.modelChanged(this.panels[this.timeline].model);
				}.bind(this)
			});
		} else {
			// Older version of systoolsmgr
			this.controller.modelChanged(this.panels[this.timeline].model);
		}

		//banner('Bookmark set');
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
			} else if (thouForm >= 1) {
				//count is in the thousands
				newCount = parseInt(thouForm, 10);
				return newCount + 'k';
			}
		} else {
			//format the count with commas
			return this.addCommas(count);
		}
	},
	moveIndicator: function(index) {
		var panel	= this.panels[index];
		var l;

		l = 20;
		l += (index * 53);

		/* If we have less than 6 icons account for the offset */
		if (this.panels.length < 6) {
			l += parseInt((6 - this.panels.length) * (53 / 2));
		}

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

		var id			= src.id.substr(src.id.indexOf('-') + 1);
		var panelIndex	= parseInt(id);

		// If it's the current panel, scroll to the top otherwise, scroll to
		// that panel
		if (this.timeline == panelIndex || screenWidth > this.panelWidth) {
			var scroller = this.controller.get('scroller-' + panelIndex);
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
	navButtonHeld: function(event) {
		//Mojo.Controller.getAppController().playSoundNotification("vibrate", "");			

		// Only works if app is a com.palm.app and not net.minego :(
		//this.controller.serviceRequest("palm://com.palm.vibrate", {
		//	method: 'vibrate',
		//	parameters: { 'period': 0, 'duration': 50 }
		//	}
		//);

		if(global.sysToolsMgrVer == '1.0.7' && global.haptics == true && global.hapticsScroll == true) {
			this.controller.serviceRequest('palm://ca.canucksoftware.systoolsmgr/', {
				method: 'deviceVibrate',
				parameters: { 'period': 0, 'duration': 40},
				onSuccess: function(result) {
					//yay! service request was successful
				}.bind(this),
				onFailure: function(result) {
					//Sorry, didn't work;
				}.bind(this)
			});
		} else {
			// Older version of systoolsmgr
		}

		var screenWidth = this.controller.window.innerWidth;
		var src = event.srcElement;

		while (src && (!src.id || 0 != src.id.indexOf('nav-'))) {
			src = src.parentNode;
		}

		var id			= src.id.substr(src.id.indexOf('-') + 1);
		var panelIndex	= parseInt(id);
		//var panel = this.getPanel(panelIndex);

		// If it's the current panel, scroll to the top otherwise, scroll to
		// that panel
		if (this.timeline == panelIndex || screenWidth > this.panelWidth) {
			var scroller = this.controller.get('scroller-' + panelIndex);

			if (scroller) {
				var position = scroller.mojo.getScrollPosition();
				var size = scroller.mojo.scrollerSize();
				if (this.panels[panelIndex].scrollId !== 0) {
					this.controller.get('list-' + panelIndex).mojo.revealItem(this.panels[panelIndex].scrollId, true);
				} 
			}
		} else {
			this.scrollTo(panelIndex);
		}
		event.stop(); //to prevent navButtonTapped from executing as well
	},
	listTapped: function(event) {
		var listId = event.item.id_str;
		var Twitter = new TwitterAPI(this.user);
		var prefs = new LocalStorage();
		var listMaxResults = prefs.read('listMaxResults');

		Twitter.listStatuses({'list_id': listId, "count": listMaxResults, 'include_entities': 'true'}, function(response){
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
		var prefs = new LocalStorage();
		var searchMaxResults = prefs.read('searchMaxResults');

		var args = {
			q: query,
			count: searchMaxResults
		};
		Twitter.search(args, function(response) {
			// this.toasters.add(new SearchToaster(query, response.responseJSON, this));
			var opts = {
				type: 'search',
				query: query,
				items: response.responseJSON.statuses,
				user: this.user,
				savedSearchesModel: this.savedSearchesModel, // Added by DC
				assistant: this,
				controller: this.controller 
			};
			this.controller.stageController.pushScene('status', opts);
			this.controller.modelChanged(this.savedSearchesModel);
			//this.controller.get('saved-searches').show();
		}.bind(this));
	},
	rtTapped: function(event) {
		var Twitter = new TwitterAPI(this.user);
		var prefs = new LocalStorage();
		var rtMaxResults = prefs.read('rtMaxResults');
				
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
				} else {
					banner('Twitter did not find anything');
				}
			}.bind(this));
		} else if (id === 'rt-yours') {
			// These were loaded when the app started so no need to get them again!
			opts.name = 'RTs by You';
			opts.items = this.user.retweetedItems;
			this.controller.stageController.pushScene('status', opts);
		} else if (id === 'rt-ofyou') {
			Twitter.retweetsOfMe({"count": rtMaxResults}, function(response) {
				if (response.responseJSON.length > 0) {
					opts.name = 'RTs of You';
					opts.items = response.responseJSON;
					this.controller.stageController.pushScene('status', opts);
				} else {
					banner('Twitter did not find anything');
				}
			}.bind(this));
		}
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
	headerHeld: function(event) {
		/* Prevent the tap event */
		event.preventDefault();
		
		var am = new Account();
		am.all(function(r){
			this.users = r;
		}.bind(this));

		var accountMenuItems = [];
		if (this.users) {
			var chosen = false;
			for (i=0; i < this.users.length; i++) {
				if(this.users[i].id === this.user.id){
					chosen = true;
				} else{
					chosen = false;
				}
				accountMenuItems.push({
					label: '@' + this.users[i].username,
					command: 'account-' + this.users[i].id,
					chosen: chosen
				});
			}
		} else {
			var me = {
				label: '@' + this.user.username,
				command: 'account-' + this.user.id
			};
			this.users = [me];
			accountMenuItems.push(me);
		}
				
		// Only works if app is a com.palm.app and not net.minego :(
		//this.controller.serviceRequest("palm://com.palm.vibrate", {
		//	method: 'vibrate',
		//	parameters: { 'period': 0, 'duration': 50 }
		//	}
		//);

		if(global.sysToolsMgrVer == '1.0.7' && global.haptics == true && global.hapticsAccount == true){
			this.controller.serviceRequest('palm://ca.canucksoftware.systoolsmgr/', {
				method: 'deviceVibrate',
				parameters: { 'period': 0, 'duration': 40},
				onSuccess: function(result) {
					//yay! service request was successful
					this.controller.popupSubmenu({
						placeNear:	this.controller.get('header-title'),
						toggleCmd: true,
						items: accountMenuItems,
						onChoose: function(command) {
							if(command){
								this.openAccount(command.substr(command.indexOf('-') + 1));
							}
						}.bind(this)
					});
				}.bind(this),
				onFailure: function(result) {
					//Sorry, didn't work;
					this.controller.popupSubmenu({
						placeNear:	this.controller.get('header-title'),
						toggleCmd: true,
						items: accountMenuItems,
						onChoose: function(command) {
							if(command){
								this.openAccount(command.substr(command.indexOf('-') + 1));
							}
						}.bind(this)
					});
				}.bind(this)
			});
		} else {
			//Older version of systoolsmgr
			this.controller.popupSubmenu({
				placeNear:	this.controller.get('header-title'),
				toggleCmd: true,
				items: accountMenuItems,
				onChoose: function(command) {
					if(command){
						this.openAccount(command.substr(command.indexOf('-') + 1));
					}
				}.bind(this)
			});
		}
		
		event.stop();
	},
	stageActivate: function(event) {
		var prefs = new LocalStorage();

		if (prefs.read('refreshOnMaximize')) {
			this.refreshAll();
		}
	},
	addListeners: function(event) {
		this.controller.listen(this.controller.window, 'resize', this.windowResized.bind(this));

		/*
			Add the appropriate listeners.

			This loop is setup to allow for errors because some of these targets
			will not exist depending on which tabs are configured.
		*/
		this.listeners = [
			[ 'sideScroller',			Mojo.Event.propertyChange,	this.sideScrollerChanged],
			[ 'sideScroller',			'scroll',					this.sideScrollChanged	],
			[ 'rt-others',				Mojo.Event.tap,				this.rtTapped			],
			[ 'rt-yours',				Mojo.Event.tap,				this.rtTapped			],
			[ 'rt-ofyou',				Mojo.Event.tap,				this.rtTapped			],
			[ 'refresh',				Mojo.Event.tap,				this.refreshTapped		],
			[ 'refresh',				Mojo.Event.hold,			this.refreshHeld		],
			[ 'new-tweet',				Mojo.Event.tap,				this.newTweet			],
			[ 'header-title',			Mojo.Event.tap,				this.headerTapped		],
			[ 'header-title',			Mojo.Event.hold,				this.headerHeld		],
			[ 'shim',					Mojo.Event.tap,				this.shimTapped			],
			[ 'your-lists-list',		Mojo.Event.listTap,			this.listTapped			],
			[ 'lists-you-follow-list',	Mojo.Event.listTap,			this.listTapped			],
			[ 'saved-searches-list',	Mojo.Event.listTap,			this.searchListTapped	],
			[ 'trending-topics-list',	Mojo.Event.listTap,			this.searchListTapped	]
		];

		/* Include a listener for each nav icon that was generated */
		for (var i = 0, panel; panel = this.panels[i]; i++) {
			if (this.largedevice || i < 6) {
				this.listeners.push([ 'nav-' + i,
										Mojo.Event.tap,				this.navButtonTapped	]);
				this.listeners.push([ 'nav-' + i,
										Mojo.Event.hold,				this.navButtonHeld	]);
			}

			panel.assistant = this;
			this.controller.listen(this.controller.get('scroller-' + i), Mojo.Event.dragStart, this.scrollStarted.bind(panel));
			this.controller.listen(this.controller.get('scroller-' + i), Mojo.Event.dragEnd, this.scrollStopped.bind(panel));
		}

		for (var i = 0, l; l = this.listeners[i]; i++) {
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

				if (panel.id !== "search" && (!search || search.value.length === 0)) {
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
						//search.setSelectionRange(len,len); //focus the cursor at the end // Not sure why this was needed - it was very annoying. Removed DC
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
			this.controller.stopListening(this.controller.get('scroller-' + j), Mojo.Event.dragStart, this.scrollStarted);
			this.controller.stopListening(this.controller.get('scroller-' + j), Mojo.Event.dragEnd, this.scrollStopped);
		}

		this.controller.stopListening(this.controller.window, 'resize', this.windowResized);

		for (var i = 0, l; l = this.listeners[i]; i++) {
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

		global.setBitrate(body, prefs.read('bitrate'));
		global.setShowThumbs(body,	prefs.read('showThumbs'));
		global.setFullWidthThumbs(body, prefs.read('fullWidthThumbs'));
		global.setShowEmoji(body,	prefs.read('showEmoji'));
		global.setMuteSelectedUsers(body, prefs.read('muteSelectedUsers'));
		global.setAbsTimeStamp(body, prefs.read('absoluteTimeStamps'));
		global.setFadeShim(body, prefs.read('fadeShim'));
		global.setFontSize(body,	prefs.read('fontSize'));

		global.setLayout(body,
			prefs.read('barlayout'),
			prefs.read('hideToolbar'),
			prefs.read('hideTabs')
		);

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
		
		global.setHaptics(body,
			prefs.read('haptics'),
			prefs.read('hapticsRefresh'),
			prefs.read('hapticsAccount'),
			prefs.read('hapticsBookmark'),
			prefs.read('hapticsScroll')
		);

		if (this.tabs) {
			var tabs	= prefs.read('tabs', this.user.id);
			var a		= Object.toJSON(tabs		).toLowerCase();
			var b		= Object.toJSON(this.tabs	).toLowerCase();

			if (a !== b) {
				/*
					The tab order has changed. Relaunch this scene to force it
					to render again with the new tab order.

					This is much easier then trying to cleanup and re-render.
				*/
				this.controller.stageController.swapScene({
					name: "main",
					transition: Mojo.Transition.crossFade,
					disableSceneScroller: true
				}, this.opts);
			}
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
