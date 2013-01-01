var ManageTabsToaster = Class.create(Toaster, {
	initialize: function(assistant) {
		this.id			= toasterIndex++;
		this.nodeId		= 'toaster-' + this.id;
		this.visible	= false;
		this.shim		= true;

		this.assistant	= assistant;
		this.controller	= getController();
		this.user		= this.controller.stageController.user;
		this.users		= this.controller.stageController.users;

		this.model		= { items: this.getItems() };

		this.reshow		= this.reshow.bind(this);

		this.render({'toasterId':this.id}, 'templates/toasters/managetabs');

		this.controller.setupWidget('convo-scroller-' + this.id, {mode: 'vertical'},{});
		this.controller.setupWidget('convo-list-' + this.id,
		{
			itemTemplate:		"templates/filter-item",
			listTemplate:		"templates/list",
			swipeToDelete:		true,
			autoconfirmDelete:	true,
			reorderable:		true
		}, this.model);
	},
	tabDelete: function(event) {
		var tabs	= (new LocalStorage()).read('tabs', this.user.id);

		tabs.splice(event.index, 1);

		(new LocalStorage()).write('tabs', tabs, this.user.id);
		this.changed = true;
	},
	tabMove: function(event) {
		var tabs	= (new LocalStorage()).read('tabs', this.user.id);
		var tmp;

		tmp = tabs.splice(event.fromIndex, 1);
		tabs.splice(event.toIndex, 0, tmp[0]);

		(new LocalStorage()).write('tabs', tabs, this.user.id);
		this.changed = true;
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},
	addTapped: function(event) {
		this.assistant.toasters.add(new AddTabToaster(this.assistant));
		this.changed = true;
	},

	getLabel: function(tab) {
		if (!tab || !tab.type) {
			return(null);
		}

		switch (tab.type.toLowerCase().charAt(0)) {
			case "h":
				return("home");

			case "m":
				return("mentions");

			case "f":
				return("favorites");

			case "d":
				return("messages");

			case "l":
				if (tab.owner && tab.slug) {
					return("list: " + tab.owner + '/' + tab.slug);
				}

				return("lists");

			case "s":
				if (tab.search) {
					return("search: " + tab.search);
				}

				return("search");

			default:
				return(null);
		}
	},

	getAccount: function(tab) {
		if (!tab || !tab.account || -1 == tab.account) {
			return(null);
		}

		if (tab.account == this.user.id) {
			return(null);
		}

		if (this.users) {
			for (var i = 0, a; a = this.users[i]; i++) {
				if (a.id == tab.account) {
					return('@' + a.username);
				}
			}
		}

		return('unknown account');
	},

	getItems: function() {
		var tabs	= (new LocalStorage()).read('tabs', this.user.id);
		var items	= [];

		for (var i = 0, tab; tab = tabs[i]; i++) {
			var text	= this.getLabel(tab);
			var account	= this.getAccount(tab);

			if (account) {
				text += ' (' + account + ')';
			}

			items.push({
				text:	text,
				value:	tab
			});
		}

		return(items);
	},

	reshow: function() {
		get('convo-list-' + this.id).mojo.noticeRemovedItems(0, this.model.items.length);
		this.model.items = this.getItems();
		get('convo-list-' + this.id).mojo.noticeAddedItems(0, this.model.items);
	},

	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		var screenHeight = this.controller.window.innerHeight;
		get('convo-scroller-' + this.id).setStyle({'max-height': (screenHeight - 155) + 'px'});
		get(this.nodeId).setStyle({'max-height': (screenHeight - 65) + 'px'});
		this.controller.listen(get('convo-list-' + this.id), Mojo.Event.listDelete, this.tabDelete.bind(this));
		this.controller.listen(get('convo-list-' + this.id), Mojo.Event.listReorder, this.tabMove.bind(this));

		Mojo.Event.listen(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
		Mojo.Event.listen(this.controller.get('add-'  + this.id), Mojo.Event.tap, this.addTapped.bind(this));
	},
	cleanup: function() {
		this.controller.stopListening(get('convo-list-' + this.id), Mojo.Event.listDelete, this.tabDelete);
		this.controller.stopListening(get('convo-list-' + this.id), Mojo.Event.listReorder, this.tabMove);
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
		Mojo.Event.stopListening(this.controller.get('add-'  + this.id), Mojo.Event.tap, this.addTapped);

		if (this.changed && this.assistant && this.assistant.activate) {
			this.assistant.activate.bind(this.assistant)();
		}
	}
});

