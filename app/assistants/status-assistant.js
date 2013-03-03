function StatusAssistant(opts) {
	this.opts = opts;
	this.toasters = new ToasterChain();
	this.itemsModel = {items: []};
	this.loading = false;
	this.query_id = 0;
	this.matchFound = 0;
}

StatusAssistant.prototype = {
	setup: function() {
		
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: global.menuItems});
		if (this.opts.newCard) {
			Mojo.Log.info('this is a new card');
			// Apply theme / font and all that junk
			var prefs = new LocalStorage();
			var theme = prefs.read('theme');
			this.controller.stageController.loadStylesheet('stylesheets/' + theme +'.css');

			var body = this.controller.stageController.document.getElementsByTagName("body")[0];
			var font = prefs.read('fontSize');
			global.setFontSize(body, font);

			var img = 'images/low/' + this.opts.type + '-card.png';
			var cardHtml = Mojo.View.render({
				object: {image: img},
				template: 'templates/account-card'
			});
			this.controller.get('account-shim').update(cardHtml);
		}

		if (this.opts.type === 'search' || this.opts.type === 'retweets') {
			// Hide the load more button (not supported for searches or RTs yet)
			this.controller.get('more').hide();
		}

		if (this.opts.type === 'search') {
			this.initSearch();
		} else if (this.opts.type === 'list' || this.opts.type === 'retweets') {		
			this.initList();
		}

		this.controller.listen('shim', Mojo.Event.tap, this.shimTapped.bind(this));
		this.controller.listen('refresh', Mojo.Event.tap, this.refreshTapped.bind(this));
		this.controller.listen('footer', Mojo.Event.tap, this.footerTapped.bind(this));
		this.controller.listen('more', Mojo.Event.tap, this.moreTapped.bind(this));

		var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);
		
		if(this.opts.type === 'search') {
			for (var i=0; i<this.opts.savedSearchesModel.items.length; i++) {			
				if(this.opts.savedSearchesModel.items[i].name == this.opts.query) {
					this.matchFound = 1;
					this.query_id = this.opts.savedSearchesModel.items[i].id;
				} 
			}
			if(this.matchFound === 0) {
				this.controller.listen('save-search', Mojo.Event.tap, this.saveSearchTapped.bind(this));
				this.controller.get('delete-search').setStyle({'display':'none'});
			} else {
				this.controller.listen('delete-search', Mojo.Event.tap, this.deleteSearchTapped.bind(this));
				this.controller.get('save-search').setStyle({'display':'none'});
			}
		} else {
			this.controller.get('save-search').setStyle({'display':'none'});
			this.controller.get('delete-search').setStyle({'display':'none'});
		}

		if (!this.opts.newCard) {
			this.controller.listen('new-card', Mojo.Event.tap, this.newCardTapped.bind(this));
			this.controller.listen('back-button', Mojo.Event.tap, this.backTapped.bind(this));
		} else {
			this.controller.get('new-card').setStyle({'display':'none'});
			this.controller.get('back-button').setStyle({'display':'none'});
		}
	},
	initSearch: function() {
		var opts = this.opts;

		// Set the scene's title
		var title = opts.query.substr(0,16);
		this.controller.get('header-title').update(title);

		if (opts.items) {
			// Items are already loaded, don't do a search
			this.setupList(opts.items);
		} else {
			// Search twitter for the items
			var Twitter = new TwitterAPI(opts.user, this.controller.stageController);
			Twitter.search(opts.query, function(r){
				var items = r.responseJSON.results;
				this.setupList(items);
			}.bind(this));
		}
	},
	initList: function() {
		var opts = this.opts;

		// Set the scene's title
		var title = opts.name.substr(0,16);
		this.controller.get('header-title').update(title);

		if (opts.items) {
			// Items are already loaded, don't do a search
			this.setupList(opts.items);
		}
	},
	setupList: function(items) {
		var th = new TweetHelper();
		var type = this.opts.type;
		for (var i=0; i < items.length; i++) {
			if (type === 'search') {
				items[i] = th.processSearch(items[i]);
			}
			else if (type === 'list' || type === 'retweets') {
				items[i] = th.process(items[i]);
			}
		}

		var templates = {
			"search": "search",
			"list": "item-one-column",
			"retweets": "item-one-column"
		};

		this.itemsModel.items = items;
		this.controller.setupWidget('list-items', {itemTemplate: "templates/tweets/" + templates[type],listTemplate: "templates/list", renderLimit: 1000}, this.itemsModel);
		this.controller.listen('list-items', Mojo.Event.listTap, this.tweetTapped.bind(this));
		// this.controller.modelChanged(this.itemsModel);
		this.updateCount();
	},
	refreshSearch: function() {
		var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);

		var args = {
			q: this.opts.query,
			since_id: this.itemsModel.items[0].id_str
		};

		Twitter.search(args, function(r){
			var items = r.responseJSON.results;
			this.gotItems(items);
		}.bind(this));
	},
	loadList: function(args, callback) {
		var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);
		var opts = {'list_id': this.opts.id, "count": "100", 'include_entities': 'true'};

		for (var key in args) {
			opts[key] = args[key];
		}

		Twitter.listStatuses(opts, function(response){
			callback(response.responseJSON);
		}.bind(this));
	},
	loadRTs: function(args, callback) {
		var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);
		var opts = {'list_id': this.opts.id, "count": "100", 'include_entities': 'true'};

		for (var key in args) {
			opts[key] = args[key];
		}

		var type = this.opts.rtType;

		if (type === 'rt-ofyou') {
			Twitter.retweetsOfMe(opts, function(r){
				callback(r.responseJSON);
			});
		}
	},
	gotItems: function(items) {
		// var items = r.responseJSON.results;
		var type = this.opts.type;
		var th = new TweetHelper();
		var newId;
		for (var i = items.length - 1; i >= 0; i--){
			if (i == items.length -1) {
				newId = items[i].id_str;
				items[i].cssClass = 'new-tweet';
				var msg = items.length + ' New Tweet';
				if (items.length > 1) {
					msg += 's'; //pluralize
				}
				items[i].dividerMessage = msg;
			}
			this.itemsModel.items.splice(0,0, items[i]);
		}
		for (i=0; i < this.itemsModel.items.length; i++) {
			var tweet = this.itemsModel.items[i];
			if (type === 'search') {
				tweet = th.processSearch(tweet);
			}
			else if (type === 'list'  || type === 'retweets') {
				tweet = th.process(tweet);
			}

			if (tweet.id_str !== newId) {
				tweet.cssClass = 'old-tweet';
			}
		}
		this.controller.modelChanged(this.itemsModel);
		this.controller.get('list-items').mojo.revealItem(items.length, true);
		this.updateCount();
	},
	tweetTapped: function(event) {
		if (this.toasters.items.length === 0) {
			if (this.opts.type === 'search') {
				var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);
				Twitter.getStatus(event.item.id_str, function(response){
					var th = new TweetHelper();
					var tweet = th.process(response.responseJSON);
					this.toasters.add(new TweetToaster(tweet, this));
				}.bind(this));
			} else if (this.opts.type === 'list' || this.opts.type === 'retweets') {
				this.toasters.add(new TweetToaster(event.item, this));
			}
		} else {
			// This is a bit of a hack because shimTapped isn't being hit..
			this.toasters.nuke();
		}
	},
	updateCount: function() {
		var count = this.itemsModel.items.length;
		this.controller.get('footer').update(count + ' tweets');
	},
	handleCommand: function(event) {
		if (event.type === Mojo.Event.back) {
			if (this.toasters.items.length > 0) {
				this.toasters.back();
				event.stop();
			}
		} else if (event.type === Mojo.Event.forward) {
			if (!this.loading) {
				this.refreshTapped();
			}
		}
	},
	shimTapped: function(event) {
		this.toasters.nuke();
	},
	saveSearchTapped: function(event) {
		//Mojo.Log.info('SaveSearch tapped');
		var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);

		Twitter.saveSearch(this.opts.query, function(response){
		}.bind(this));

		//need to have error checking in here to make sure search was actually saved.

		//banner('Saving search ' + this.opts.query.substr(0,16) + ' : ' + this.query_id );
		banner('Saving search ' + this.opts.query.substr(0,16));
		this.matchFound = 1;
		this.controller.stopListening('save-search', Mojo.Event.tap, this.saveSearchTapped);
		this.controller.get('save-search').setStyle({'display':'none'});
		this.controller.listen('delete-search', Mojo.Event.tap, this.deleteSearchTapped.bind(this));
		this.controller.get('delete-search').setStyle({'display':'inline'});
	},
	deleteSearchTapped: function(event) {
		//Mojo.Log.error('DeleteSearch tapped');
		var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);
		//Mojo.Log.error('delete QueryId:' + this.query_id);

		Twitter.getSavedSearches(function(response){
			var savedSearches = response.responseJSON;
			//Mojo.Log.error('savedSearches length: ' + savedSearches.length);
			//Mojo.Log.error('this.opts.savedSearchesModesl.items length: ' + this.opts.savedSearchesModel.items.length);
			//Mojo.Log.error('getting saved searches');
			for (var i=0; i<savedSearches.length; i++) {
				//Mojo.Log.error(i + ' : 1Delete QueryId:' + this.query_id);			
				if(savedSearches[i].name == this.opts.query) {
					this.query_id = savedSearches[i].id;
					//Mojo.Log.error('Delete name:' + this.opts.savedSeachesModel.items[i].name);
				} 
				//Mojo.Log.error('2Delete QueryId:' + this.query_id);
			}
		}.bind(this));

		//need to have error checking in here to make sure search was actually saved.
		//Mojo.Log.error('3Delete QueryId:' + this.query_id);
		if(this.matchFound === 1) {
			//setTimeout(this.executeDeleteSearch(),5000);
			setTimeout(this.executeDeleteSearch(),5000);
			this.matchFound = 0;
		}		

		this.controller.stopListening('delete-search', Mojo.Event.tap, this.deleteSearchTapped);
		this.controller.get('delete-search').setStyle({'display':'none'});
		this.controller.listen('save-search', Mojo.Event.tap, this.saveSearchTapped.bind(this));
		this.controller.get('save-search').setStyle({'display':'inline'});
		this.matchFound = 0;

	},
	executeDeleteSearch: function() {
		//Mojo.Log.error('Actually deleting QueryId:' + this.query_id);
		var Twitter = new TwitterAPI(this.opts.user, this.controller.stageController);
		
		Twitter.deleteSearch(this.query_id, function(response){
			//banner('Deleting search ' + this.query_id + ' ' + this.opts.query);
			banner('Deleting search ' + this.opts.query);
		}.bind(this));
	},
	newCardTapped: function(event) {
		var stageName = global.statusStage + global.stageId++;

		var appController = Mojo.Controller.getAppController();

		var pushCard = function(stageController){
			stageController.user = this.opts.user;
			global.stageActions(stageController);
			var opts = this.opts;
			opts.newCard = true;
			stageController.pushScene('status', opts);
		}.bind(this);

		appController.createStageWithCallback({name: stageName, lightweight: true}, pushCard);

		this.controller.stageController.popScene();
	},
	backTapped: function(event) {
		if (this.toasters.items.length > 0) {
			this.toasters.back();
		} else {
			this.controller.stageController.popScene();
		}
	},
	refreshTapped: function(event) {
		if (this.opts.type === 'search') {
			this.refreshSearch();
		} else {
			var args = {'since_id': this.itemsModel.items[0].id_str};
			if (this.opts.type === 'list') {
				this.loadList(args, this.gotItems.bind(this));
			} else if (this.opts.type === 'retweets') {
				this.loadRTs(args, this.gotItems.bind(this));
			}
		}
	},
	footerTapped: function(event) {
		var scroller = this.controller.getSceneScroller();
		var position = this.controller.get(scroller).mojo.getScrollPosition();
		if (position.top === 0) {
			// scroll to bottom
			this.controller.get(scroller).mojo.scrollTo(0, -99999999, true);
		}
		else {
			this.controller.get(scroller).mojo.scrollTo(0, 0,true);
		}
	},
	moreTapped: function(event) {
		var args = {'max_id': this.itemsModel.items[this.itemsModel.items.length - 1].id_str};
		if (this.opts.type === 'list') {
			this.loadList(args, this.gotMore.bind(this));
		} else if (this.opts.type === 'retweets') {
			this.loadRTs(args, this.gotMore.bind(this));
		}
	},
	gotMore: function(tweets) {
		var model = this.itemsModel;
		var i;
		var th = new TweetHelper();

		for (i=1; i < tweets.length; i++) {
			//start the loop at i = 1 so tweets aren't duplicated
			model.items.splice((model.items.length - 1) + i, 0, tweets[i]);
		}

		for (i=0; i < model.items.length; i++) {
			model.items[i] = th.process(model.items[i]);
		}

		this.controller.modelChanged(model);
		this.updateCount();
	},
	cleanup: function() {
		this.controller.stopListening('refresh', Mojo.Event.tap, this.refreshTapped);
		this.controller.stopListening('shim', Mojo.Event.tap, this.shimTapped);
		this.controller.stopListening('footer', Mojo.Event.tap, this.footerTapped);
		this.controller.stopListening('more', Mojo.Event.tap, this.moreTapped);
		this.controller.stopListening('list-items', Mojo.Event.listTap, this.tweetTapped);

		if(this.opts.type === 'search') {
			this.controller.stopListening('save-search', Mojo.Event.tap, this.saveSearchTapped);
			this.controller.stopListening('delete-search', Mojo.Event.tap, this.deleteSearchTapped);
		}

		if (!this.opts.newCard) {
			this.controller.stopListening('new-card', Mojo.Event.tap, this.newCardTapped.bind(this));
			this.controller.stopListening('back-button', Mojo.Event.tap, this.backTapped.bind(this));
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
			false, // prefs.read('hideToolbar'),
			prefs.read('hideTabs')
		);

		global.setHide(body,
			prefs.read('hideAvatar'),
			prefs.read('hideUsername'),
			prefs.read('hideScreenname'),
			prefs.read('hideTime'),
			prefs.read('hideVia'),
			prefs.read('hideTweetBorder'),
			prefs.read('hideSearchTimelineThumbs') 
		);
	}
};
