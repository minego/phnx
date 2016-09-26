var StatusListToaster = Class.create(Toaster, {
	initialize: function(title, items, assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		// this.visible = false;
		this.shim = true;
		this.assistant = assistant;
		this.controller = getController();
		this.title = title;

		var th = new TweetHelper();
		var prefs = new LocalStorage();
		var processVine = prefs.read('showVine');
		var mutedUsers = prefs.read('mutedUsers');
		var hideGifs = prefs.read('hideGifThumbsInTimeline');

		for (var i=0; i < items.length; i++) {
			items[i] = th.process(items[i],this.listModel,this.controller,processVine,mutedUsers,hideGifs);
			if(items[i].is_quote_status && typeof(items[i].quoted_status_id_str) != "undefined" && typeof(items[i].quoted_status) != "undefined"){
				items[i].quoted_status = th.process(items[i].quoted_status,this.listModel,this.controller,false);
				items[i].quote_class = 'show';
			}
		}
		//th.getQuotedTweets(this.listModel,this.controller);
		//this.listModel = {"items": items};
		this.listModel.items = items;
		this.render({'toasterId':this.id, title: this.title}, 'templates/toasters/status-list');

		this.controller.setupWidget('status-scroller-' + this.id, {mode: 'vertical'},{});
		this.controller.setupWidget('status-list-' + this.id, {itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: 200}, this.listModel);

//		this.controller.setupWidget('status-list-' + this.id, {itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: 200}, this.listModel);

	},
	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		var screenHeight = this.controller.window.innerHeight;
		get('status-scroller-' + this.id).setStyle({'max-height': (screenHeight - 65) + 'px'});
		get(this.nodeId).setStyle({'max-height': (screenHeight - 45) + 'px'});
		this.controller.listen(get('status-list-' + this.id), Mojo.Event.listTap, this.tweetTapped.bind(this));

		Mojo.Event.listen(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
	},
	cleanup: function() {
		this.controller.stopListening(get('status-list-' + this.id), Mojo.Event.listTap, this.tweetTapped.bind(this));
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
	},
	tweetTapped: function(event) {
		this.assistant.toasters.add(new TweetToaster(event.item, this.assistant));
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	}
});
