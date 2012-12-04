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
		for (var i=0; i < items.length; i++) {
			items[i] = th.process(items[i]);
		}

		this.listModel = {"items": items};

		this.render({'toasterId':this.id, title: this.title}, 'templates/toasters/status-list');

		this.controller.setupWidget('status-scroller-' + this.id, {mode: 'vertical'},{});
		var prefs = new LocalStorage();
			if (prefs.read('hideAvatar')) {
				this.controller.setupWidget('status-list-' + this.id, {itemTemplate: "templates/tweets/item-no-avatar",listTemplate: "templates/list", renderLimit: 200}, this.listModel);
			}
			else{
				this.controller.setupWidget('status-list-' + this.id, {itemTemplate: "templates/tweets/item",listTemplate: "templates/list", renderLimit: 200}, this.listModel);
			}//added by DC

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
