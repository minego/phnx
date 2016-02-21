var global = {
	toasterIndex:		0,
	mainStage:			'phnxMain-',
	dashboardStage:		'phnxDashboard',
	authStage:			'phnxAuth',
	statusStage:		'phnxStatus-',
	userStage:			'phnxUser-',
	stageId:			0,
	stageFocused:		false,
	accounts:			[],
	stages:				[],
	following:			[],
	multiCard:			false,
	doc:				document,
	composeStageCount:	0,

	fontSizes: [
		{ label: 'Small',	command: 'font-small'	},
		{ label: 'Medium',	command: 'font-medium'	},
		{ label: 'Large',	command: 'font-large'	}
	],

	menuItems: [
		Mojo.Menu.editItem,
		{
			label: 'Preferences',
			command: 'cmdPreferences'
		},
		{
			label: 'About Project Macaw',
			command: 'cmdAbout'
		},
		{
			label: 'Contact Support',
			command: 'cmdSupport'
		}
	],
	prefsMenu: [
		Mojo.Menu.editItem,
		{
			label: 'About Project Macaw',
			command: 'cmdAbout'
		},
		{
			label: 'Contact Support',
			command: 'cmdSupport'
		}
	],
	setTimer: function() {
		// Create a system alarm to check for notifications
		var prefs = new LocalStorage();
		var appId = Mojo.appInfo.id;

		if (prefs.read('notifications')) {
			var timeout = new Mojo.Service.Request("palm://com.palm.power/timeout", {
				method: "set",
				parameters: {
					"wakeup": true,
					"key": "phnxNotifications",
					"uri": "palm://com.palm.applicationManager/open",
					"params" : "{'id': '" + appId + "','params': {'action':'checkNotifications'}}",
					"in": prefs.read('notificationInterval') + ":00"
				},
				onSuccess: function(response) {
					Mojo.Log.info('Timer set');
				},
				onFailure: function(response) {
					ex(response.errorText);
				}
			});
		}
	},
	openBrowser: function(src, url) {
		var service = new Mojo.Service.Request("palm://com.palm.applicationManager", {
			method: "launch",
			parameters: {
				id: "com.palm.app.browser",
				params: {
					target: src
				}
			},
			onSuccess : function (e){ Mojo.Log.info("Open success, results="+JSON.stringify(e)); },
      		onFailure : function (e){ Mojo.Log.info("Open failure, results="+JSON.stringify(e)); }    
		});
		//this.stageController.pushScene('webview');
	},
	banner: function(message) {
		Mojo.Controller.getAppController().showBanner(message, {source: 'notification'});
	},
	ex: function(error) {
		Mojo.Log.error(error);
		Mojo.Controller.getAppController().showBanner({messageText: error, icon: 'images/low/error.png'}, {source: 'notification'});
	},
	fail: function() {
		Mojo.Controller.getAppController().showBanner({messageText: 'Twitter failed. Please try again.', icon: 'images/low/failwhale.png'}, {source: 'notification'});
	},
	getController: function() {
		var app = Mojo.Controller.getAppController();
		var stage = app.getActiveStageController();
		return stage.activeScene();
	},
	getUser: function() {
		var app = Mojo.Controller.getAppController();
		var stage = app.getActiveStageController();
		return stage.user;
	},
	stageActions: function(stageController) {
		// Actions / listeners that are run on stage creation

		// Set the account shim size
		var screenHeight = stageController.window.innerHeight;
		var shim = stageController.document.getElementById('account-shim');
		Element.extend(shim);
		shim.className = 'ignore';
		// Amount of active requests
		stageController.requests = 0;

		var activate = function(event) {
			Mojo.Log.info('activate scene');

			// save a reference to the stage's document
			global.doc = stageController.document;
			Mojo.Log.info('stage doc set');

			// Close the notification stage right away
			var app = stageController.getAppController();
			var dashStage = app.getStageProxy(global.dashboardStage);
			if (dashStage) {
				app.closeStage(global.dashboardStage);
			}

			var prefs = new LocalStorage();

			if (prefs.read('refreshOnMaximize')) {
				stageController.delegateToSceneAssistant('refreshAll');
			}
			stageController.delegateToSceneAssistant('activate');

			// Hide the account shim if it is shown
			stageController.document.getElementById('account-shim').className = 'ignore';
		};

		var deactivate = function(event) {
			Mojo.Log.info('deactivate scene');

			// show the account shim if it is enabled
			var prefs = new LocalStorage();

			switch (prefs.read('cardIcons')) {
				case 'never':
					break;

				case 'auto':
					if (!global.multiCard) {
						break;
					}
					// fall through

				default:
				case 'always':
					stageController.document.getElementById('account-shim').className = 'show';
					break;
			}
		};

		// Add stage listeners
		Mojo.Event.listen(stageController.document, Mojo.Event.stageActivate, activate);
		Mojo.Event.listen(stageController.document, Mojo.Event.stageDeactivate, deactivate);
	},
	getComposeStageName: function()
	{
		/*
			Return a unique name for each compose page so that there can be
			multiple compose cards open at once.
		*/
		return('phnxCompose' + (++this.composeStageCount));
	},
	setLayout: function(body, layout, hideToolbar, hideTabs) {
		var layouts = ['swapped', 'original', 'no-toolbar', 'no-nav', 'none', 'no-top'];

		for (var i=0; i < layouts.length; i++) {
			Element.removeClassName(body, 'layout-' + layouts[i]);
		}

		Element.addClassName(body, 'layout-' + layout);

		if (hideToolbar) {
			Element.addClassName(body, 'layout-no-toolbar');
		}

		if (hideTabs) {
			Element.addClassName(body, 'layout-no-nav');
		}

		if (layout == 'swapped' ? hideTabs : hideToolbar) {
			/* Hide the space at the top if there is no top bar */
			Element.addClassName(body, 'layout-no-top');
		}
	},

	setFontSize: function(body, font) {
		var fonts = ['tiny','small', 'medium', 'large','huge'];
		for (var i=0; i < fonts.length; i++) {
			Element.removeClassName(body, 'font-' + fonts[i]);
		}
		Element.addClassName(body, 'font-' + font);
	},
	setHide: function(body, hideNewMutedTweets, hideAvatar, hideUsername, hideScreenname, hideTime, hideVia, hideTweetBorder, hideSearchTimelineThumbs) {
		if (hideAvatar) {
			Element.removeClassName(body, 'showAvatar');
		} else {
			Element.addClassName(body, 'showAvatar');
		}

		if (hideUsername) {
			Element.addClassName(body, 'hideUsername');
		} else {
			Element.removeClassName(body, 'hideUsername');
		}

		if (hideScreenname) {
			Element.addClassName(body, 'hideScreenname');
		} else {
			Element.removeClassName(body, 'hideScreenname');
		}

		if (hideTime) {
			Element.addClassName(body, 'hideTime');
		} else {
			Element.removeClassName(body, 'hideTime');
		}

		if (hideVia) {
			Element.addClassName(body, 'hideVia');
		} else {
			Element.removeClassName(body, 'hideVia');
		}

		if (hideTweetBorder) {
			Element.addClassName(body, 'hideTweetBorder');
		} else {
			Element.removeClassName(body, 'hideTweetBorder');
		}
		
		if(hideSearchTimelineThumbs) {
			Element.addClassName(body, 'hideSearchTimelineThumbs');
		} else {
			Element.removeClassName(body, 'hideSearchTimelineThumbs');
		}
	},
	setShowThumbs: function(body, showThumbsStatus) {
		Element.removeClassName(body, 'showThumbs');
		Element.removeClassName(body, 'detailsThumbs');
		if(showThumbsStatus === 'showThumbs'){
			Element.addClassName(body, 'showThumbs');
		}	else if(showThumbsStatus === 'detailsThumbs'){
			Element.addClassName(body, 'detailsThumbs');
		}
	},
	setFullWidthThumbs: function(body, fullWidthThumbsStatus) {
		if(fullWidthThumbsStatus){
			Element.addClassName(body, 'fullWidthThumbs');
		} else {
			Element.removeClassName(body, 'fullWidthThumbs');
		}
	},
	setShowEmoji: function(body, showEmojiStatus) {
		Element.removeClassName(body, 'showEmoji');
		Element.removeClassName(body, 'detailsEmoji');
		if(showEmojiStatus === 'showEmoji'){
			Element.addClassName(body, 'showEmoji');
		} else if(showEmojiStatus === 'detailsEmoji'){
			Element.addClassName(body, 'detailsEmoji');
		}
	},
	setMuteSelectedUsers: function(body, muteSelectedUsers) {
		if(muteSelectedUsers){
			Element.addClassName(body, 'muteUsers');
		} else {
			Element.removeClassName(body, 'muteUsers');
		}
	},
	setAbsTimeStamp: function(body, absoluteTimeStamps) {
		if(absoluteTimeStamps){
			Element.addClassName(body, 'absTimeStamps');
			Element.removeClassName(body, 'relTimeStamps');
		} else {
			Element.addClassName(body, 'relTimeStamps');
			Element.removeClassName(body, 'absTimeStamps');
		}
	},
	setFadeShim: function(body, fadeShimStatus) {
		if(fadeShimStatus){
			Element.addClassName(body, 'fadeShim');
		} else {
			Element.removeClassName(body, 'fadeShim');
		}
	},
	setTheme: function(newTheme, oldTheme, stageController) {
		var inherit = {
			'black':		[ 'ash' ],
			'cinder':		[ 'ash' ],
			'awakening':	[ 'ash' ],
			'cleanse':		[ 'ash' ]
		};

		Mojo.Log.info('theme changed to ' + newTheme);

		/* Remove the old theme */
		if (oldTheme) {
			stageController.unloadStylesheet('stylesheets/' + oldTheme + '.css');
		}

		/* Some themes inherit from others */
		try {
			for (var i = 0, base; base = inherit[newTheme][i]; i++) {
				stageController.loadStylesheet('stylesheets/' + base + '.css');
			}
		} catch (e) {};

		/* Apply the new theme */
		stageController.loadStylesheet('stylesheets/' + newTheme + '.css');
	}
};

/* This is an auto-incremented number for toaster IDs */
var toasterIndex = 0;

/* Show a banner message */
function banner(message){
	global.banner(message);
}

/* Handle exeptions, errors, and failure */
function ex(error){
	global.ex(error);
}

/* Replacement for PrototypeJS's $() */
function get(id) {
	var el = global.doc.getElementById(id);
	Element.extend(el);
	return el;
}

function getController() {
	return global.getController();
}

function getUser() {
	return global.getUser();
}

/* Gets / extends an element on the respective user's stage controller */
function g(userId, elementId) {
	var stageName = global.mainStage + userId;
	var app = Mojo.Controller.getAppController();
	var stage = app.getStageProxy(stageName);
	var element;

	if (stage) {
		element = stage.document.getElementById(elementId);
	} else {
		element = document.getElementById(elementId);
	}

	Element.extend(element);
	return element;
}
