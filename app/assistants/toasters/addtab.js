var AddTabToaster = Class.create(Toaster, {
	initialize: function(assistant) {
		this.id			= toasterIndex++;
		this.nodeId		= 'toaster-' + this.id;
		this.visible	= false;
		this.shim		= true;

		// We save the scene's assistant here
		this.assistant	= assistant;
		this.controller	= getController();
		this.user		= this.controller.stageController.user;
		this.users		= this.controller.stageController.users;

		this.model		= {
			toasterId:	this.id,
			type:		'h',
			account:	-1,
			owner:		'@' + this.user.username
		};

		this.render(this.model, 'templates/toasters/addtab');

		/* Setup the account list */
		var users = [];

		if (this.users) {
			for (var i = 0, u; u = this.users[i]; i++) {
				users.push({
					label:	'@' + u.username,
					value:	u.id == this.user.id ? -1 : u.id
				});
			}
		} else {
			users.push({
				label:	'@' + this.user.username,
				value:	-1
			});
		}

		this.account = this.user.id;
		this.controller.setupWidget('select-account-' + this.id, {
			choices:			users,
			modelProperty:		'account',
			disabledProperty:	'accountdisabled',

			label:				$L('Account'),
			labelPlacement:		Mojo.Widget.labelPlacementLeft
		}, this.model);

		/* Allow selecting the type */
		this.controller.setupWidget('select-type-' + this.id, {
			choices: [
				{ label: "timeline",		value: "h" },
				{ label: "mentions",		value: "m" },
				{ label: "favorites",		value: "f" },
				{ label: "messages",		value: "d" },
				{ label: "lists",			value: "l" },
				{ label: "list timeline",	value: "L" },
				{ label: "search",			value: "s" }

				// TODO	renable search results when the panel can show them...
				// { label: "search results",	value: "S" }
			],
			modelProperty:	'type',

			label:			$L('Tab Type'),
			labelPlacement:	Mojo.Widget.labelPlacementLeft
		}, this.model);
	},
	saveTapped: function(event) {
		var prefs	= new LocalStorage();
		var tabs	= prefs.read('tabs', this.user.id);

		var newtab = {
			type:		this.model.type.toLowerCase()
		};

		if (-1 != this.model.account) {
			newtab.account = this.model.account;
		}

		switch (this.model.type) {
			case "S":
				newtab.search	= get('search-'	+ this.id).value;
				break;
			case "L":
				newtab.slug		= get('slug-'	+ this.id).value;
				newtab.owner	= get('owner-'	+ this.id).value;
				break;
		}

		/* Check for duplicates */
		var newjson = Object.toJSON(newtab).toLowerCase();
		for (var i = 0, t; t = tabs[i]; i++) {
			var tabjson = Object.toJSON(t).toLowerCase();

			if (newjson === tabjson) {
				/* Found a duplicate */
				ex('That tab already exists');
				return;
			}
		}

		tabs.push(newtab);
		prefs.write('tabs', tabs, this.user.id);

		this.assistant.toasters.back();
	},
	typeChanged: function(event) {
		get('listwrapper-'		+ this.id).setStyle({ display: "none" });
		get('searchwrapper-'	+ this.id).setStyle({ display: "none" });

		this.model.accountdisabled = false;

		switch (this.model.type) {
			case "s":
			case "l":
				// TODO Currently these don't support alternate accounts...
				this.model.account = -1;
				this.model.accountdisabled = true;
				break;

			case "S":
				get('searchwrapper-'+ this.id).setStyle({ display: "block" });
				break;
			case "L":
				get('listwrapper-'	+ this.id).setStyle({ display: "block" });
				break;

			default:
				break;
		}
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},
	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		this.controller.listen(get('select-type-' + this.id), Mojo.Event.propertyChange, this.typeChanged.bind(this));

		this.controller.listen(get('save-' + this.id), Mojo.Event.tap, this.saveTapped.bind(this));
		this.controller.listen(get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
	},
	cleanup: function() {
		this.controller.listen(get('select-type-' + this.id), Mojo.Event.propertyChange, this.typeChanged);

		this.controller.stopListening(get('save-' + this.id), Mojo.Event.tap, this.saveTapped);
		this.controller.stopListening(get('back-' + this.id), Mojo.Event.tap, this.backTapped);
	}
});
