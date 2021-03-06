var ConvoToaster = Class.create(Toaster, {
	initialize: function(tweet, assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.visible = false;
		this.shim = true;

		this.assistant = assistant;
		this.controller = getController();
		this.user = this.controller.stageController.user;
		this.tweet = tweet;
		this.convoModel = {items: [this.tweet]};

		this.render({'toasterId':this.id}, 'templates/toasters/convo');

		this.controller.setupWidget('convo-scroller-' + this.id, {mode: 'vertical'},{});
		this.controller.setupWidget('convo-list-' + this.id, {itemTemplate: "templates/tweets/convo-item",listTemplate: "templates/list", renderLimit: 200}, this.convoModel);

		this.getStatus(this.tweet.in_reply_to_status_id_str);
	},
	getStatus: function(id) {
		var Twitter = new TwitterAPI(this.user);
		Twitter.getStatus(id, function(response, meta) {
			var tweet = response.responseJSON;
			var th = new TweetHelper();
			var prefs = new LocalStorage();
			var processVine = prefs.read('showVine');
			var mutedUsers = prefs.read('mutedUsers');
			var hideGifs = prefs.read('hideGifThumbsInTimeline');
			tweet = th.process(tweet,this.convoModel,this.controller,processVine,mutedUsers,hideGifs);
			if(tweet.is_quote_status && typeof(tweet.quoted_status_id_str) != "undefined" && typeof(tweet.quoted_status) != "undefined"){
				tweet.quoted_status = th.process(tweet.quoted_status,this.convoModel,this.controller,false);
				tweet.quote_class = 'show';
			}
			//th.getQuotedTweets(this.convoModel,this.controller);
			this.convoModel.items.push(tweet);
			get('convo-list-' + this.id).mojo.noticeUpdatedItems(0, this.convoModel.items);
			if (tweet.in_reply_to_status_id_str !== null) {
				this.getStatus(tweet.in_reply_to_status_id_str);
			}
		}.bind(this));
	},
	tweetTapped: function(event) {
		if(event.originalEvent.srcElement.id === "quote-wrapper" | event.originalEvent.srcElement.id === "quote-avatar" | event.originalEvent.srcElement.id === "quote-screenname" |event.originalEvent.srcElement.id === "quote-username" |event.originalEvent.srcElement.id === "quote-text"| event.originalEvent.srcElement.id === "quote-thumb-timeline"| event.originalEvent.srcElement.id === "quote-thumb-wrapper"
			| event.originalEvent.srcElement.id === "quote-inline-thumb" | event.originalEvent.srcElement.id === "quote-inline-thumb2" | event.originalEvent.srcElement.id === "quote-inline-thumb3" | event.originalEvent.srcElement.id === "quote-inline-thumb4" | event.originalEvent.srcElement.id === "quote-thumbnail"| event.originalEvent.srcElement.id === "quote-thumbnail2" | event.originalEvent.srcElement.id === "quote-thumbnail3"| event.originalEvent.srcElement.id === "quote-thumbnail4"
			| event.originalEvent.srcElement.id === "quote-time"| event.originalEvent.srcElement.id === "quote-time-abs"| event.originalEvent.srcElement.id === "quote-via"| event.originalEvent.srcElement.id === "quote-rt-avatar" | event.originalEvent.srcElement.id === "quote-footer" | event.originalEvent.srcElement.id === "via-link"){
			//Check below is only really needed if the #via-link doesn't have a pointer-events: none.
			if(typeof(event.item.quoted_status) != "undefined"){
				//this.assistant.toasters.add(new TweetToaster(event.item.quoted_status, this.assistant, this.savedSearchesModel));
				this.assistant.toasters.add(new TweetToaster(event.item.quoted_status, this.assistant));
		  } else {
				//this.assistant.toasters.add(new TweetToaster(event.item, this.assistant, this.savedSearchesModel));
				this.assistant.toasters.add(new TweetToaster(event.item, this.assistant));
		 	}
		} else {
			//Mojo.Log.error('dump: ' + JSON.stringify(event.originalEvent.srcElement));
			//this.assistant.toasters.add(new TweetToaster(event.item, this.assistant, this.savedSearchesModel));
			this.assistant.toasters.add(new TweetToaster(event.item, this.assistant));
		}

//		this.assistant.toasters.add(new TweetToaster(event.item, this.assistant));
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},

	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		var screenHeight = this.controller.window.innerHeight;
		get('convo-scroller-' + this.id).setStyle({'max-height': (screenHeight - 85) + 'px'});
		get(this.nodeId).setStyle({'max-height': (screenHeight - 65) + 'px'});
		this.controller.listen(get('convo-list-' + this.id), Mojo.Event.listTap, this.tweetTapped.bind(this));

		Mojo.Event.listen(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
	},
	cleanup: function() {
		this.controller.stopListening(get('convo-list-' + this.id), Mojo.Event.listTap, this.tweetTapped);
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
	}
});
