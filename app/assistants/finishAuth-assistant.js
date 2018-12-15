function FinishAuthAssistant(r) {
	this.tokens = {
		oauth_token: '',
		oauth_token_secret: '',
		user_id: '',
		screen_name: ''
	};
	this.response = r.response;
}
FinishAuthAssistant.prototype = {
	setup: function() {
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: global.menuItems});
		this.userCookie = new Mojo.Model.Cookie('phoenixFirstRun');
		this.themeCookie = new Mojo.Model.Cookie('phnxTheme');

		//load the selected theme
		if (typeof(this.themeCookie.get()) !== "undefined"){
			this.controller.document.getElementsByTagName("body")[0].addClassName(this.themeCookie.get().className);
		}
		else{
			this.controller.document.getElementsByTagName("body")[0].addClassName('default');
		}
		
		//var Twitter = new TwitterAPI(this.controller.stageController.user);
		/*Twitter.getUser("baldric555", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('baldric555 img: ' + tmp_img);
		}.bind(this));
		Twitter.getUser("projectmacaw", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('projectmacaw img: ' + tmp_img);
		}.bind(this));
		Twitter.getUser("_minego", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('_minego img: ' + tmp_img);
		}.bind(this));
		Twitter.getUser("dkirker", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('dkirker img: ' + tmp_img);
		}.bind(this));
		Twitter.getUser("phnxapp", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('phnxapp img: ' + tmp_img);
		}.bind(this));
		Twitter.getUser("rmxdave", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('rmxdave img: ' + tmp_img);
		}.bind(this));
		Twitter.getUser("awesomeapps_", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('awesomeapps_ img: ' + tmp_img);
		}.bind(this));
		Twitter.getUser("penduin", function(r){
			var tmp_img = r.responseJSON.profile_image_url.replace('_normal', '_bigger');
			Mojo.Log.error('penduin img: ' + tmp_img);
		}.bind(this));		
		*/
		this.loadSuggestedUsers();
		this.listen();
		var tokens = this.response.strip().split('&');
		var i;
		for (i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (token.substr(0, 12) === 'oauth_token=') {
				this.tokens.oauth_token = token.substr(12);
			}
			else if (token.substr(0, 18) === 'oauth_token_secret') {
				this.tokens.oauth_token_secret = token.substr(19);
			}
			else if (token.substr(0,8) === 'user_id=') {
				this.tokens.user_id = token.substr(8);
			}
			else if (token.substr(0,12) === 'screen_name=') {
				this.tokens.screen_name = token.substr(12);
			}
		}
		this.storeTokens();
	},
	loadSuggestedUsers: function() {
		//TODO: AJAX call to web service to download suggested users.
	},
	storeTokens: function() {
		var account = new Account();
		this.user = {
			key: this.tokens.user_id,
			id: this.tokens.user_id,
			username: this.tokens.screen_name,
			token: this.tokens.oauth_token,
			secret: this.tokens.oauth_token_secret
		};
		account.load(this.user);
		account.save();
		if (global.accounts.length === 0) {
			var prefs = new LocalStorage();
			prefs.write('defaultAccount', this.user.id);
		}
		global.accounts.push(this.user);
		this.controller.stageController.Toasters = new ToasterChain();
	},
	nextTapped: function(event) {
		// TODO: Create stage for this user, close this stage
		var account = new Account();
		account.all(this.createStage.bind(this));
	},
	createStage: function(accounts) {
		var stageName = global.mainStage + this.user.id;
		var args = {
			name: stageName,
			lightweight: true
		};

		var launchArgs = {
			user: this.user,
			users: accounts
		};

		var pushMainScene = function(stageController) {
			global.stageActions(stageController);
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
		setTimeout(function(){
			app.closeStage(global.authStage);
		}, 1000);
	},
	followTapped: function(event) {
		var userId = event.currentTarget.id;
		var user = this.user;
		var Twitter = new TwitterAPI(user);
		Twitter.followUserName(userId, function(response, meta) {
			banner('Thanks for following!');
		}, this);
	},
	listen: function(event) {
		this.controller.listen('next-button', Mojo.Event.tap, this.nextTapped.bind(this));
		this.controller.listen('rmxdave', Mojo.Event.tap, this.followTapped.bind(this));
		this.controller.listen('georgemari', Mojo.Event.tap, this.followTapped.bind(this));
		this.controller.listen('Macaw2018', Mojo.Event.tap, this.followTapped.bind(this));
		this.controller.listen('ProjectMacaw', Mojo.Event.tap, this.followTapped.bind(this));
		this.controller.listen('_minego', Mojo.Event.tap, this.followTapped.bind(this));
		this.controller.listen('baldric555', Mojo.Event.tap, this.followTapped.bind(this));
		this.controller.listen('dkirker', Mojo.Event.tap, this.followTapped.bind(this));
		this.controller.listen('penduin', Mojo.Event.tap, this.followTapped.bind(this));							
	},
	cleanup: function(event) {
		this.controller.stopListening('next-button', Mojo.Event.tap, this.nextTapped);
		this.controller.stopListening('rmxdave', Mojo.Event.tap, this.followTapped);
		this.controller.stopListening('georgemari', Mojo.Event.tap, this.followTapped);
		this.controller.stopListening('Macaw2018', Mojo.Event.tap, this.followTapped);
		this.controller.stopListening('ProjectMacaw', Mojo.Event.tap, this.followTapped);
		this.controller.stopListening('_minego', Mojo.Event.tap, this.followTapped);
		this.controller.stopListening('baldric555', Mojo.Event.tap, this.followTapped);
		this.controller.stopListening('dkirker', Mojo.Event.tap, this.followTapped);
		this.controller.stopListening('penduin', Mojo.Event.tap, this.followTapped);					
	}
};
