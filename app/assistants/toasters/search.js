var SearchToaster = Class.create(Toaster, {
	initialize: function(title, response, assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.shim = true;
		this.assistant = assistant;
		this.controller = getController();
		this.user = this.controller.stageController.user;
		this.title = title;

		var items = response.results;
		var th = new TweetHelper();
		var prefs = new LocalStorage();
		var processVine = prefs.read('showVine');
		var absTimeStampVal = prefs.read('absoluteTimeStamps');
		for (var i=0; i < items.length; i++) {
			items[i] = th.process(items[i],this.listModel,this.controller,processVine,absTimeStampVal);
		}

		//this.listModel = {"items": items};
		this.listModel.items = items;

		this.render({'toasterId':this.id, title: this.title}, 'templates/toasters/status-list');

		this.controller.setupWidget('status-scroller-' + this.id, {mode: 'vertical'},{});

		var prefs = new LocalStorage();
		this.controller.setupWidget('status-list-' + this.id, {itemTemplate: "templates/tweets/search",listTemplate: "templates/list", renderLimit: 200}, this.listModel);
	},
	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		var screenHeight = this.controller.window.innerHeight;
		get('status-scroller-' + this.id).setStyle({'max-height': (screenHeight - 65) + 'px'});
		get(this.nodeId).setStyle({'max-height': (screenHeight - 45) + 'px'});
		this.controller.listen(get('status-list-' + this.id), Mojo.Event.listTap, this.tweetTapped.bind(this));
	},
	tweetTapped: function(event) {
		// load the tweet first so we can get the user object and reply IDs, and other info
		// (not included in search results)
		var tmpThumb = event.item.thumbnail;
		var tmpThumb2 = event.item.thumbnail2;
		var tmpMediaUrl = event.item.mediaUrl;
		var tmpMediaUrl2 = event.item.mediaUrl2;
		var prefs = new LocalStorage();
		var processVine = prefs.read('showVine');
		var absTimeStampVal = prefs.read('absoluteTimeStamps');

		Mojo.Log.error('item: ' + event.item.id_str);
		var Twitter = new TwitterAPI(this.user);
		Twitter.getStatus(event.item.id_str, function(response){
			var th = new TweetHelper();
			var tweet = th.process(response.responseJSON,null,null,processVine,absTimeStampVal);
			tweet.thumbnail = tmpThumb;
			tweet.mediaUrl = tmpMediaUrl;
			tweet.thumbnail2 = tmpThumb2;
			tweet.mediaUrl2 = tmpMediaUrl2;
			this.assistant.toasters.add(new TweetToaster(tweet, this.assistant));
		}.bind(this));
	}
});
