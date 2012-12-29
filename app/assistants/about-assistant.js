function AboutAssistant(){}

AboutAssistant.prototype = {
	setup: function() {
		var appMenu = [
			Mojo.Menu.editItem,
			{
				label: 'Contact Support',
				command: 'cmdSupport'
			}
		];

		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: appMenu});
		this.controller.get('version').update(Mojo.appInfo.version);

		this.closeTapped = this.closeTapped.bind(this);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);

		this.controller.listen('about-body', Mojo.Event.tap, this.awesomeSauce.bind(this));
		this.controller.listen('series-of-tubes', Mojo.Event.tap, this.coolio.bind(this));
	},
	closeTapped: function() {
		this.controller.stageController.popScene();
	},
	awesomeSauce: function(event) {
		if (!event.srcElement || !event.srcElement.id ||
			0 != event.srcElement.id.indexOf('@')
		) {
			return;
		}

		// cut off the leading @
		var user = event.srcElement.id.slice(1);

		var Twitter = new TwitterAPI(this.controller.stageController.user);
		Twitter.getUser(user, function(r){
			this.controller.stageController.pushScene({
				name: 'profile',
				disableSceneScroller: true
			}, r.responseJSON);
		}.bind(this));
	},
	coolio: function(event) {
		global.openBrowser('http://github.com/minego/phnx');
	},
	cleanup: function() {
		this.controller.stopListening('about-body', Mojo.Event.tap, this.awesomeSauce);
		this.controller.stopListening('series-of-tubes', Mojo.Event.tap, this.coolio);
		this.controller.stopListening(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
	}
};
