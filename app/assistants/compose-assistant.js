/*
	This scene doesn't actually handle compose, it is just used to open the
	compose toaster (when composing in a new card).

	You probably want to look there instead of here to make changes to compose.
*/
function ComposeAssistant(opts) {
	if (typeof(opts) === 'undefined') {
		opts = {};
	}

	this.opts			= opts;

	/*
		Override the back call and nuke call on this.toasters so we can detect
		when there are no toasters left. When that happens we need to close this
		stage.
	*/
	this.toasters		= new ToasterChain();
	this.toasterBack	= this.toasters.back.bind(this.toasters);
	this.toasterNuke	= this.toasters.nuke.bind(this.toasters);

	this.toasters.back	= function back() {
		this.toasterBack();

		if (this.toasters.items.length === 0) {
			this.nuke();
		}
	}.bind(this);

	this.toasters.nuke	= function nuke() {
		this.toasterNuke();

		if (this.toasters.items.length === 0) {
			this.nuke();
		}
	}.bind(this);
}

ComposeAssistant.prototype = {
	setup: function() {
		// set css classes based on device
		console.log(Mojo.Environment.DeviceInfo.modelNameAscii);

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

		this.addListeners();
	},

	handleCommand: function(event) {
		console.log('Unhandled command: ' + event.type + ', ' + event.command);
	},
	newTweet: function(opts) {
		if (this.toasters.items.length === 0) {
			Mojo.Log.info('Opening tweet toaster');
			this.toasters.add(new ComposeToaster(opts, this));
		}
	},
	shimTapped: function(event) {
		this.toasters.nuke();
	},
	addListeners: function(event) {
		this.controller.listen(this.controller.get('shim'), Mojo.Event.tap, this.shimTapped.bind(this));
	},
	stopListening: function() {
		this.controller.stopListening(this.controller.get('shim'), Mojo.Event.tap, this.shimTapped);
	},
	activate: function(event) {
		var prefs = new LocalStorage();
		global.setTheme(prefs.read('theme'), null, this.controller.stageController);

		global.doc = this.controller.stageController.document;

		this.controller.stageController.user	= this.opts.user;
		this.controller.stageController.users	= this.opts.users || [ this.user ];

		this.newTweet(this.opts.toasterOpts);
	},
	deactivate: function(event) {
	},
	cleanup: function(event) {
		this.stopListening();
	},

	nuke: function() {
		var app = this.controller.stageController.getAppController();

		app.closeStage(this.opts.stageName);
	}
};
