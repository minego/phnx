// Note: phnx themes are not loaded in the dashboard stage so don't use those styles.
function DashboardAssistant(items, resource, account, accounts) {
	this.count = 0;
	this.items = items;
	this.resource = resource;
	this.account = account;
	this.accounts = accounts;
}

DashboardAssistant.prototype = {
	setup: function() {

		this.controller.listen(this.controller.stageController.document, Mojo.Event.stageActivate, this.stageActivate.bind(this));

		// Display the dashboard
		this.update(this.items, this.resource, this.account, this.accounts);
	},
	update: function(items, resource, account, accounts) {
		this.items = items;
		this.resource = resource;
		this.account = account;
		this.accounts = accounts;
		var prefs = new LocalStorage();
		// Show a new notification and update the dashboard
		var from;
		if (items[0].user) {
			this.title = this.resource.noun + ' from @' + items[0].user.screen_name;
			from = items[0].user.screen_name;
		}
		else {
			// Direct messages have different property names
			if (prefs.read('notificationShieldMessages')) {
				this.title = 'New update';
				from = "";
			}
			else{
				this.title = 'Message from @' + items[0].sender.screen_name;
				from = items[0].sender.screen_name;
			}
		}

		var bannerMessage = '';
		if (prefs.read('notificationShieldMessages')) {
			this.message = "New tweets";
			var bannerMessage = this.message;
		}
		else{
			this.message = items[0].text;
			var bannerMessage = '@' + from + ': ' + this.message;
      this.message = emojify(this.message,16);
      //var bannerMessage = '@' + from + ': ' + this.message;
		}
		this.count += items.length;

		//var bannerMessage = '@' + from + ': ' + this.message;

		var notificationSound = prefs.read('notificationSound');
		var notificationSoundFilePath = prefs.read('notificationSoundFilePath');
		var notificationSoundClass;

		if(notificationSound === 'notificationsCustom'){
			notificationSoundClass = 'notifications';
		} else {
			notificationSoundClass = notificationSound;
		}
		var bannerParams = {
			messageText: bannerMessage,
			soundClass: notificationSoundClass
		};
		
		if(notificationSound === 'notificationsCustom') {
			bannerParams.soundFile = notificationSoundFilePath;
		} else {
			bannerParams.soundFile = "";
		}

		Mojo.Controller.getAppController().showBanner(bannerParams, {source: "notification"}, 'phnx');
		if(prefs.read('notificationBlink')){
			this.controller.stageController.indicateNewContent(true); // flashy
		}
		var info = {title: this.title, message: this.message, count: this.count};

		var renderedInfo = Mojo.View.render({object: info, template: 'dashboard/item-info'});
		var infoElement = this.controller.get('dashboardinfo');
		infoElement.innerHTML = renderedInfo;
		this.listenDashboard();

		//Send notification message to BT watch SE MBW-150 via metaviews MW150
		this.getTweaksPrefs = new Mojo.Service.Request("palm://org.webosinternals.tweaks.prefs/", {
			method: 'get', parameters: {'owner': "bluetooth-mbw150",
			keys: ["mbwMacaw","mbwMacawColour","mbwAll"]},
			onSuccess: function(response) {
				if(response) {
					if(response.mbwMacaw == true && response.mbwAll == true) {
						var notificationColour = 0xCA;
						if(response.mbwMacawColour){
							notificationColour = parseInt(response.mbwMacawColour,16);
						}
						//If true - Report BannerMessage to SE-Watch MBW150
						var request = new Mojo.Service.Request('palm://com.palm.applicationManager', {
					        method: 'open',
					        parameters: {
					            id: "de.metaviewsoft.mwatch",
					            params: {command: "SMS", info: bannerMessage, wordwrap: true, appid: "net.minego.phnx", color: notificationColour}
				   	    	 },
				     	   	onSuccess: function() {},
				       	  	onFailure: function() {}
				          	});
					}
				}
			}.bind(this)});
	},
	listenDashboard: function() {
		var prefs = new LocalStorage();
		this.controller.listen(this.controller.get('dashboard-icon'), Mojo.Event.tap, this.iconTapped.bind(this));
		if (prefs.read('notificationShieldMessages')) {
			this.controller.listen(this.controller.get('dashboard-body'), Mojo.Event.tap, this.iconTapped.bind(this));
		}
		else {
			this.controller.listen(this.controller.get('dashboard-body'), Mojo.Event.tap, this.bodyTapped.bind(this));
		}
	},
	iconTapped: function(event) {
		var launchArgs = {
			user: this.account,
			users: this.accounts,
			autoScroll: false
		};
		this.createStage(launchArgs);
	},
	bodyTapped: function(event) {
		var launchArgs = {
			user: this.account,
			users: this.accounts,
			autoScroll: true,
			panel: this.resource.name
		};
		this.createStage(launchArgs);
	},
	createStage: function(launchArgs) {
		var app = this.controller.stageController.getAppController();
		var stageName = global.mainStage + this.account.id;
		Mojo.Log.info('Launching stage ' + stageName);
		var args = {
			name: stageName,
			lightweight: true
		};

		var pushMainScene = function(stageController) {
			global.stageActions(stageController);
			stageController.pushScene('launch', launchArgs);
		};

		var userStage = app.getStageProxy(stageName);

		if (!userStage) {
			app.createStageWithCallback(args, pushMainScene, "card");
		}
		else {
			userStage.activate();
			if (launchArgs.autoScroll) {
				userStage.delegateToSceneAssistant('refreshAndScrollTo', this.resource.name);
			}
		}
	},
	stageActivate: function(event) {
		this.controller.stageController.indicateNewContent(false); // no more flashy
	},
	cleanup: function() {
		this.controller.stopListening(this.controller.stageController.document, Mojo.Event.stageActivate, this.stageActivate);
		var appController = Mojo.Controller.getAppController();
		appController.closeStage(global.dashboardStage);
	}
};
