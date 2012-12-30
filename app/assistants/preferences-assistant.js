function PreferencesAssistant(section) {
	this.prefs = new LocalStorage();
	this.section = section;

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
	advanced.push({key: 'delReceivedDM', type: 'toggle', label: 'Allow deletion of received DMs'});

	this.sections = {
		'General Settings': [
			// end block
			{key: 'browserSelection', type: 'select', label: 'Browser', items: [
				{label: 'In-App Browser', value: 'inAppBrowser'},
				{label: 'Stock Browser', value: 'stockBrowser'},
				{label: 'Ask', value: 'ask' }
			]},
			{key: 'cardIcons', type: 'select', label: 'Card icons', items: [
				{label: 'Automatic', value: 'auto'},
				{label: 'Always Show', value: 'always'},
				{label: 'Never Show', value: 'never'}
			]},
			{key: 'refreshOnMaximize', type: 'toggle', label: 'Auto Refresh'},
			{key: 'refreshOnSubmit', type: 'toggle', label: 'Refresh after post'},
			{key: 'refreshFlushAtLaunch', type: 'toggle', label: 'Refresh & flush at launch'},
			{key: 'enterToSubmit', type: 'toggle', label: 'Enter to submit'},
			{key: 'autoCorrect', type: 'toggle', label: 'Auto Correct'}
		],
		'Appearance': [
			{key: 'theme', type: 'select', label: 'Theme', items: [
				{label: 'Rebirth', value: 'rebirth'},
				{label: 'Ash', value: 'ash'},
				{label: 'Pure', value: 'pure'},
				{label: 'Sunnyvale', value: 'sunnyvale'},
				{label: 'Black', value: 'black'},
				{label: 'Cinder', value: 'cinder'},
				{label: 'Awakening', value: 'awakening'},
				{label: 'Cleanse', value: 'cleanse'}
			]},
			{key: 'barlayout', type: 'select', label: 'Layout', items: [
				{label: 'Tabs above Toolbar', value: 'swapped'},
				{label: 'Toolbar above Tabs', value: 'original'}
			]},
			{key: 'hideTabs', type: 'toggle', label: 'Hide Tabs'},
			{key: 'hideToolbar', type: 'toggle', label: 'Hide Toolbar'},

			{key: 'fontSize', type: 'select', label: 'Font Size', items: [
				{label: 'Tiny',		value: 'tiny'},
				{label: 'Small',	value: 'small'},
				{label: 'Medium',	value: 'medium'},
				{label: 'Large',	value: 'large'},
				{label: 'Huge',		value: 'huge'}
			]},

			{key: 'showThumbs', type: 'select', label: 'Thumbnails', items: [
				{label: 'Never Show', value: 'noThumbs'},
				{label: 'Details Only', value: 'detailsThumbs'},
				{label: 'Always Show', value: 'showThumbs'}
			]},
			{key: 'showEmoji', type: 'select', label: 'emoji', items: [
				{label: 'Never Show', value: 'noEmoji'},
				{label: 'Details Only', value: 'detailsEmoji'},
				{label: 'Always Show', value: 'showEmoji'}
			]},

			{key: 'hideAvatar',		type: 'toggle', label: 'Hide Avatars'},
			{key: 'hideUsername',	type: 'toggle', label: 'Hide Name'},
			{key: 'hideScreenname',	type: 'toggle', label: 'Hide Username'},
			{key: 'hideTime',		type: 'toggle', label: 'Hide Time'},
			{key: 'hideVia',		type: 'toggle', label: 'Hide Client Name'},
			{key: 'hideTweetBorder',		type: 'toggle', label: 'Hide Border between Tweets'}
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
			{key: 'notificationSound', type: 'select', label: 'Alert', items: [
				{label: 'Sound', value: 'notifications'},
				{label: 'Vibrate', value: 'vibrate'},
				{label: 'Mute', value: 'none' }
			]},
			{key: 'notificationBlink', type: 'toggle', label: 'Blink'},
			{key: 'notificationHome', type: 'toggle', label: 'Home Timeline'},
			{key: 'notificationMentions', type: 'toggle', label: 'Mentions'},
			{key: 'notificationMessages', type: 'toggle', label: 'Messages'},
			{key: 'notificationShieldMessages', type: 'toggle', label: 'Shield Messages'}
		],
		'Advanced Settings': advanced
	};

	if (global.accounts.length > 1) {
		this.sections['General Settings'].push({
			key: 'defaultAccount',
			type: 'select',
			label: 'Default User',
			items: accounts
		});
	}

	this.widgets = {}; // holds attributes and models for widgets
}

PreferencesAssistant.prototype = {
	setup: function() {
		var widgetHtml, html;
		var pageHtml = '';

		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: global.prefsMenu});

		for (var sectionId in this.sections) {
			var sectionItems = this.sections[sectionId];

			if (!this.section) {
				this.section = sectionId;
			}

			if (this.section != sectionId) {
				continue;
			}

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
				} else if (widget.type === 'select') {
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

			var sectionItems = [];
			for (var id in this.sections) {
				sectionItems.push({ label: id, value: id });
			}

			html = Mojo.View.render({
				object: {
					key: 'sectionlist',
					items: sectionItems
				},
				template: 'preferences/sectiontitle'
			});

			this.controller.setupWidget('select-sectionlist',
				this.widgets['attr_sectionlist'] = {
					choices: sectionItems
				},
				this.widgets['model_sectionlist'] = {
					value: sectionId
				}
			);

			// set up section html
			var secObj = {
				title: html,
				items: widgetHtml
			};

			pageHtml += Mojo.View.render({
				object: secObj,
				template: 'preferences/section'
			});

			break;
		}

		this.controller.get('sections').update(pageHtml);

		// Manually add listeners after the elements are on the DOM
		this.closeTapped = this.closeTapped.bind(this);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);

		if (!this.section || this.section == "Appearance") {
			this.controller.listen(this.controller.get('select-theme'), Mojo.Event.propertyChange, this.themeChanged.bind(this));
		}

		this.controller.listen(this.controller.get('select-sectionlist'), Mojo.Event.propertyChange, this.sectionChanged.bind(this));
	},
	closeTapped: function() {
		this.controller.stageController.popScene();
	},
	themeChanged: function(event) {
		global.setTheme(event.value, this.prefs.read('theme'),
			this.controller.stageController);
	},

	sectionChanged: function(event) {
		this.cleanup();
		this.controller.stageController.swapScene('preferences', event.value);
	},

	cleanup: function() {
		var prefs = this.prefs;

		// Save preferences on exit.
		for (var sectionId in this.sections) {
			var sectionItems = this.sections[sectionId];

			if (this.section && this.section != sectionId) {
				continue;
			}

			for (var i=0; i < sectionItems.length; i++) {
				var item = sectionItems[i];
				prefs.write(item.key, this.widgets['model_' + item.key].value);
			}
		}

		var body = this.controller.stageController.document.getElementsByTagName("body")[0];
		global.setLayout(body,
			prefs.read('barlayout'),
			prefs.read('hideToolbar'),
			prefs.read('hideTabs')
		);
		global.setShowThumbs(body,	prefs.read('showThumbs'));
		global.setShowEmoji(body,	prefs.read('showEmoji'));
		global.setFontSize(body,	prefs.read('fontSize'));

		global.setHide(body,
			prefs.read('hideAvatar'),
			prefs.read('hideUsername'),
			prefs.read('hideScreenname'),
			prefs.read('hideTime'),
			prefs.read('hideVia'),
			prefs.read('hideTweetBorder')
		);

		// Start the background notifications timer
		global.setTimer();

		// Manually remove any listeners from above
		this.controller.stopListening(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);

		if (!this.section || this.section == "Appearance") {
			this.controller.stopListening(this.controller.get('select-theme'), Mojo.Event.propertyChange, this.themeChanged);
			this.controller.stopListening(this.controller.get('select-sectionlist'), Mojo.Event.propertyChange, this.sectionChanged);
		}
	}
};
