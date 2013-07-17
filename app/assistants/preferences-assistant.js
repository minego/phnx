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
	advanced.push({key: 'delReceivedDM', type: 'toggle', label: 'Allow deletion of received DMs'},
				{key: 'showVine', type: 'toggle', label: 'Process Vine links - warning *resource hog*'},
				{key: 'useFoursquareApp', type: 'toggle', label: 'Pass 4sq.com links to Foursquare app (requires v2.8.5)'}
	);

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
			{key: 'autoCorrect', type: 'toggle', label: 'Auto Correct'},
			{key: 'composeCard', type: 'toggle', label: 'Compose in new Card'},
			{key: 'profileMaxResults', type: 'select', label: 'Profile Max Items', items: [
				{label: '10', value: 10},
				{label: '25', value: 25},
				{label: '50', value: 50},
				{label: '75', value: 75},
				{label: '100', value: 100}
			]},
			{key: 'listMaxResults', type: 'select', label: 'List Max Items', items: [
				{label: '10', value: 10},
				{label: '25', value: 25},
				{label: '50', value: 50},
				{label: '75', value: 75},
				{label: '100', value: 100}
			]},
			{key: 'rtMaxResults', type: 'select', label: 'Retweet Max Items', items: [
				{label: '10', value: 10},
				{label: '25', value: 25},
				{label: '50', value: 50},
				{label: '75', value: 75},
				{label: '100', value: 100}
			]},
			{key: 'searchMaxResults', type: 'select', label: 'Search Max Items', items: [
				{label: '10', value: 10},
				{label: '25', value: 25},
				{label: '50', value: 50},
				{label: '75', value: 75},
				{label: '100', value: 100}
			]}		
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
			{key: 'fullWidthThumbs', type: 'toggle', label: 'Full Width Thumbnails'},
			{key: 'hideSearchTimelineThumbs',		type: 'toggle', label: 'Hide Search Timeline Thumbnails'},
			{key: 'showEmoji', type: 'select', label: 'emoji', items: [
				{label: 'Never Show', value: 'noEmoji'},
				{label: 'Details Only', value: 'detailsEmoji'},
				{label: 'Always Show', value: 'showEmoji'}
			]},
			{key: 'absoluteTimeStamps', type: 'toggle', label: 'Absolute TimeStamps'},
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
				{label: 'System Sound', value: 'notifications'},
				{label: 'Custom Sound', value: 'notificationsCustom'},
				{label: 'Vibrate', value: 'vibrate'},
				{label: 'Mute', value: 'none' }
			]},
			{key: 'notificationSoundFilePath', type: 'pick', label: 'Tone'},
			{key: 'notificationSoundName', type: 'hidden', label: ''},
			{key: 'notificationBlink', type: 'toggle', label: 'Blink'},
			{key: 'notificationHome', type: 'toggle', label: 'Home Timeline'},
			{key: 'notificationMentions', type: 'toggle', label: 'Mentions'},
			{key: 'notificationMessages', type: 'toggle', label: 'Messages'},
			{key: 'notificationShieldMessages', type: 'toggle', label: 'Shield Messages'}
		],
		'Advanced Settings': advanced
	};

	if (Mojo.Environment.DeviceInfo.modelNameAscii != "TouchPad") {
		this.sections['Appearance'].push(
			{key: 'fadeShim', type: 'toggle', label: 'Fade BG'}
		);
	}

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
				} else if (widget.type === 'pick') {
					html = Mojo.View.render({
						object: widget,
						template: 'preferences/pick'
					});

					widgetHtml += html;
					this.controller.setupWidget('pick-' + widget.key,
						this.widgets['attr_' + widget.key] = {
						},
						this.widgets['model_' + widget.key] = {
							value: this.prefs.read(widget.key)
						}
					);
				}	else if (widget.type === 'hidden') {
					//So the auto writing of prefs can still occur but without creating any displayed widgets.
					//Probably a better way of doing it, but it works for now.
					html = Mojo.View.render({
						object: widget,
						template: 'preferences/empty'
					});

					widgetHtml += html;
					this.controller.setupWidget('hidden-' + widget.key,
						this.widgets['attr_' + widget.key] = {
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

		var prefs = new LocalStorage();
		
		this.controller.get('sections').update(pageHtml);
		
		if (!this.section || this.section == "Notifications") {
			if (prefs.read('notificationSound') === "notificationsCustom") {
				this.controller.get('tonePathRow').show();
			} else {
				this.controller.get('tonePathRow').hide();
			}
			this.controller.get('tonePath').update(prefs.read('notificationSoundName'));
		}
		
		// Manually add listeners after the elements are on the DOM
		this.closeTapped = this.closeTapped.bind(this);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);

		this.controller.listen(this.controller.get('select-sectionlist'), Mojo.Event.propertyChange, this.sectionChanged.bind(this));

		if (!this.section || this.section == "Appearance") {
			this.controller.listen(this.controller.get('select-theme'), Mojo.Event.propertyChange, this.themeChanged.bind(this));
		}

		if (!this.section || this.section == "Notifications") {
			this.controller.listen('select-notificationSound', Mojo.Event.propertyChange, this.soundChanged.bind(this));
			//this.controller.listen('tonePathRow', Mojo.Event.tap, this.tonePathTapHandler.bindAsEventListener(this));
			this.controller.listen('tonePathRow', Mojo.Event.tap, this.tonePathTapHandler.bind(this));
		}
	},
	closeTapped: function() {
		this.controller.stageController.popScene();
	},
	tonePathTapHandler: function() {
		//Mojo.Log.info('Custom sound tapped!');
		var prefs = new LocalStorage();
		
		Mojo.FilePicker.pickFile({
			onSelect : this.tonePathSelectionHandler.bind(this),
			kinds : ["ringtone"],
			defaultKind : "ringtone",
			actionType : "open",
			filePath : this.widgets['model_notificationSoundFilePath'].value //prefs.read('notificationSoundFilePath')
		}, this.controller.stageController);
	},
	tonePathSelectionHandler: function(selection) {
		var prefs = this.prefs;
		//prefs.write('notificationSoundFilePath', selection.fullPath);
		//prefs.write('notificationSoundName', selection.name);		
		this.controller.get('tonePath').update(selection.name);
		this.widgets['model_notificationSoundFilePath'].value = selection.fullPath;
		this.widgets['model_notificationSoundName'].value = selection.name;
	},
	soundChanged: function(event) {
		//Mojo.Log.info('event: ' + event.value);
		if (event.value == "notificationsCustom") {
			this.controller.get('tonePathRow').show();
		} else {
			this.controller.get('tonePathRow').hide();
		}
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
				//Mojo.Log.info('prefs: ' + item.key + ' : ' + this.widgets['model_' + item.key].value);
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
		global.setFullWidthThumbs(body, prefs.read('fullWidthThumbs'));
		global.setShowEmoji(body,	prefs.read('showEmoji'));
		global.setAbsTimeStamp(body, prefs.read('absoluteTimeStamps'));
		global.setFadeShim(body, prefs.read('fadeShim'));
		global.setFontSize(body,	prefs.read('fontSize'));
		
		global.setHide(body,
			prefs.read('hideAvatar'),
			prefs.read('hideUsername'),
			prefs.read('hideScreenname'),
			prefs.read('hideTime'),
			prefs.read('hideVia'),
			prefs.read('hideTweetBorder'),
			prefs.read('hideSearchTimelineThumbs')
		);

		// Start the background notifications timer
		global.setTimer();

		// Manually remove any listeners from above
		this.controller.stopListening(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);

		if (!this.section || this.section == "Appearance") {
			this.controller.stopListening(this.controller.get('select-theme'), Mojo.Event.propertyChange, this.themeChanged);
			this.controller.stopListening(this.controller.get('select-sectionlist'), Mojo.Event.propertyChange, this.sectionChanged);
		}
		if(!this.section || this.section == "Notifications") {
			this.controller.stopListening('select-notificationSound', Mojo.Event.propertyChange, this.soundChanged);
			this.controller.stopListening('tonePathRow', Mojo.Event.tap, this.tonePathTapHandler);
		}
	}
};
