function PreferencesAssistant() {
	this.prefs = new LocalStorage();

	var accounts = [];
	for (var i=0; i < global.accounts.length; i++) {
		var acct = global.accounts[i];
		accounts.push({
			label: '@' + acct.username,
			value: acct.id
		});
	}

	// Add stuff here to auto-render them to the scene and auto-save on scene close.
	// Toggle and select widgets are the only ones that are supported so far

	var advanced = [];

	if (Mojo.Environment.DeviceInfo.modelNameAscii != "TouchPad") {
		advanced.push(
			{key: 'forwardSwipe', type: 'select', label: 'Forward Swipe', items: [
				{label: 'Refresh All', value: 'all'},
				{label: 'Refresh Current', value: 'current'}
			]}
		);
	}
	advanced.push({key: 'sendAnalytics', type: 'toggle', label: 'Send <strong>anonymous</strong> statistics to the developer to help improve phnx'});
	advanced.push({key: 'delReceivedDM', type: 'toggle', label: 'Allow deletion of received DMs'});

	this.sections = {
			'General Settings': [
				{key: 'theme', type: 'select', label: 'Theme', items: [
					{label: 'Rebirth', value: 'rebirth'},
					{label: 'Ash', value: 'ash'},
					{label: 'Pure', value: 'pure'}
					//{label: 'Sunnyvale', value: 'sunnyvale'}
				]},
				{key: 'barlayout', type: 'select', label: 'Layout', items: [
					{label: 'Tabs above Toolbar', value: 'swapped'},
					{label: 'Toolbar above Tabs', value: 'original'},
					{label: 'Hide Toolbar', value: 'no-toolbar'},
					{label: 'Hide Tabs', value: 'no-nav'},
					{label: 'Hide Tabs & Toolbar', value: 'none'}
				]},
				// block inserted by DC
				{key: 'taborder', type: 'select', label: 'TabOrder', items: [
					{label: 'Home,@,DM,L,S', value: 'hmdls'},
					{label: 'Home,@,DM,S,L', value: 'hmdsl'},
					{label: 'Home,@,S,DM,L', value: 'hmsdl'},
					{label: 'Home,@,S,L,DM', value: 'hmsld'},
					{label: 'Home,@,L,DM,S', value: 'hmlds'},
					{label: 'Home,@,L,S,DM', value: 'hmlsd'}
				]},
				// end block
				{key: 'browserSelection', type: 'select', label: 'Browser', items: [
					{label: 'In-App Browser', value: 'inAppBrowser'},
					{label: 'Stock Browser', value: 'stockBrowser'},
					{label: 'Ask', value: 'ask' }
				]},
				{key: 'fontSize', type: 'select', label: 'Font Size', items: [
					{label: 'Tiny', value: 'tiny'},
					{label: 'Small', value: 'small'},
					{label: 'Medium', value: 'medium'},
					{label: 'Large', value: 'large'},
					{label: 'Huge', value: 'huge'}
				]},
				{key: 'cardIcons', type: 'select', label: 'Show card icons', items: [
					{label: 'Automatic', value: 'auto'},
					{label: 'Always', value: 'always'},
					{label: 'Never', value: 'never'}
				]},
				{key: 'refreshOnMaximize', type: 'toggle', label: 'Auto Refresh'},
				{key: 'refreshOnSubmit', type: 'toggle', label: 'Refresh after post'},
				{key: 'refreshFlushAtLaunch', type: 'toggle', label: 'Refresh & flush at launch'},				
				{key: 'enterToSubmit', type: 'toggle', label: 'Enter to submit'},
				{key: 'autoCorrect', type: 'toggle', label: 'Auto Correct'},
				{key: 'hideAvatar', type: 'toggle', label: 'Hide Avatars (requires re-start of app)'},
				{key: 'showThumbs', type: 'toggle', label: 'Show Inline Thumbnail previews'}
			],
			'Notifications': [
				{key: 'notifications', type: 'toggle', label: 'Notifications'},
				{key: 'notificationInterval', type: 'select', label: 'Check Every', items:[
					{label: '5 min', value: '00:05'},
					{label: '15 min', value: '00:15'},
					{label: '30 min', value: '00:30'},
					{label: '1 hour', value: '01:00'},
					{label: '2 hours', value: '02:00'},
					{label: '6 hours', value: '06:00'},
					{label: '12 hours', value: '12:00'}
				]},
				//Block added by DC
				{key: 'notificationSound', type: 'select', label: 'Notification Sound', items: [
					{label: 'Notification', value: 'notifications'},
					{label: 'Vibrate', value: 'vibrate'},
					{label: 'Mute', value: 'none' }
				]}, //End block
				{key: 'notificationHome', type: 'toggle', label: 'Home Timeline'},
				{key: 'notificationMentions', type: 'toggle', label: 'Mentions'},
				{key: 'notificationMessages', type: 'toggle', label: 'Messages'},
				{key: 'notificationShieldMessages', type: 'toggle', label: 'Shield Messages'}
			],
			'Advanced Settings': advanced
	};

	if (global.accounts.length > 1) {
		this.sections['General Settings'].push({key: 'defaultAccount', type: 'select', label: 'Default User', items: accounts});
	}
	this.widgets = {}; // holds attributes and models for widgets
}

PreferencesAssistant.prototype = {
	setup: function() {
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: global.prefsMenu});

		var widgetHtml, html;
		var pageHtml = '';
		for (var sectionId in this.sections) {
			var sectionItems = this.sections[sectionId];
			widgetHtml = '';
			for (var i=0; i < sectionItems.length; i++) {
				var widget = sectionItems[i];

				if (widget.type === 'toggle') {
					html = Mojo.View.render({
						object: widget,
						template: 'preferences/toggle'
					});

					widgetHtml += html;

					this.controller.setupWidget('toggle-' + widget.key,
						this.widgets['attr_' + widget.key] = {
							trueValue: true,
							falseValue: false,
							trueLabel: 'On',
							falseLabel: 'Off'
						},
						this.widgets['model_' + widget.key] = {
							value: this.prefs.read(widget.key)
						}
					);
				}
				else if (widget.type === 'select') {
					html = Mojo.View.render({
						object: widget,
						template: 'preferences/select'
					});

					widgetHtml += html;
					this.controller.setupWidget('select-' + widget.key,
						this.widgets['attr_' + widget.key] = {
							choices: widget.items,
							labelPlacement: Mojo.Widget.labelPlacementLeft,
							label: widget.label
						},
						this.widgets['model_' + widget.key] = {
							value: this.prefs.read(widget.key)
						}
					);
				}
			}

			// set up section html
			var secObj = {
				title: sectionId,
				items: widgetHtml
			};

			//Block modified/addded by DC
			var sectionHtml;
			if(sectionId === 'General Settings'){
				sectionHtml = Mojo.View.render({
					object: secObj,
					template: 'preferences/top_section'
				});
			}
			else{
				sectionHtml = Mojo.View.render({
					object: secObj,
					template: 'preferences/section'
				});
			} //end block

			pageHtml += sectionHtml;
		}

		this.controller.get('sections').update(pageHtml);

		// Manually add listeners after the elements are on the DOM
		this.closeTapped = this.closeTapped.bind(this);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);

		this.controller.listen(this.controller.get('select-theme'), Mojo.Event.propertyChange, this.themeChanged.bind(this));
		this.controller.listen(this.controller.get('select-barlayout'), Mojo.Event.propertyChange, this.layoutChanged.bind(this));
		this.controller.listen(this.controller.get('select-taborder'), Mojo.Event.propertyChange, this.tabOrderChanged.bind(this));
		this.controller.listen(this.controller.get('select-fontSize'), Mojo.Event.propertyChange, this.fontChanged.bind(this));
		this.controller.listen(this.controller.get('toggle-hideAvatar'), Mojo.Event.propertyChange, this.hideAvatarChanged.bind(this)); //added by DC
		this.controller.listen(this.controller.get('toggle-showThumbs'), Mojo.Event.propertyChange, this.showThumbsChanged.bind(this)); //added by DC
	},
	closeTapped: function() {
		this.controller.stageController.popScene();
	},
	themeChanged: function(event) {
		var newTheme = event.value;
		Mojo.Log.info('theme changed to ' + newTheme);

		// Remove the old theme
		var oldTheme = this.prefs.read('theme');
		this.controller.stageController.unloadStylesheet('stylesheets/' + oldTheme + '.css');

		// Apply the new theme
		this.controller.stageController.loadStylesheet('stylesheets/' + newTheme + '.css');
	},
	fontChanged: function(event) {
		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		global.setFontSize(body, event.value);
	},
	layoutChanged: function(event) {
		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		global.setLayout(body, event.value);
	},
	//block added by DC
	tabOrderChanged: function(event) {
		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		global.setTabOrder(body, event.value);
		banner("Please re-start to re-order panels");
	}, //end block DC	
	hideAvatarChanged: function(event) {
		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		global.setHideAvatar(body, event.value);
	}, // added by DC
	showThumbsChanged: function(event) {
		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		global.setShowThumbs(body, event.value);
	}, // added by DC

	cleanup: function() {
		// Save preferences on exit.
		for (var sectionId in this.sections) {
			var sectionItems = this.sections[sectionId];
			for (var i=0; i < sectionItems.length; i++) {
				var item = sectionItems[i];
				this.prefs.write(item.key, this.widgets['model_' + item.key].value);
			}
		}

		// Start the background notifications timer
		global.setTimer(); //added by DC

		// Manually remove any listeners from above
		this.controller.stopListening(this.controller.get('select-theme'), Mojo.Event.propertyChange, this.themeChanged);
		this.controller.stopListening(this.controller.get('select-barlayout'), Mojo.Event.propertyChange, this.layoutChanged);
		this.controller.stopListening(this.controller.get('select-taborder'), Mojo.Event.propertyChange, this.tabOrderChanged);	
		this.controller.stopListening(this.controller.get('select-fontSize'), Mojo.Event.propertyChange, this.fontChanged);
		this.controller.stopListening(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
		this.controller.stopListening(this.controller.get('toggle-hideAvatar'), Mojo.Event.propertyChange, this.hideAvatarChanged); // added by DC
		this.controller.stopListening(this.controller.get('toggle-showThumbs'), Mojo.Event.propertyChange, this.shotThumbsChanged); // added by DC
	}
};
