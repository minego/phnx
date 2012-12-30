var ManageTabsToaster = Class.create(Toaster, {
	initialize: function(assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.visible = false;
		this.shim = true;

		this.assistant = assistant;
		this.controller = getController();
		this.user = this.controller.stageController.user;

		this.model = { items: this.getItems()  };

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
		if (this.model.items.length > 1) {
			this.model.items.splice(event.index, 1);
			this.saveItems();
		}
	},
	tabMove: function(event) {
		var items = this.model.items.splice(event.fromIndex, 1);

		this.model.items.splice(event.toIndex, 0, items[0]);
		this.saveItems();
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},
	addTapped: function(event) {
		this.saveItems();

		var possible	= 'h,m,f,d,l,s'.split(',');
		var menuitems	= [];

		for (var i = 0, p; p = possible[i]; i++) {
			for (var x = 0, item; item = this.model.items[x]; x++) {
				if (p === item.value) {
					break;
				}
			}

			if (item) {
				continue;
			}

			menuitems.push({
				label:		this.getLabel(p),
				command:	p
			});
		}

		if (menuitems.length > 0) {
			this.controller.popupSubmenu({
				onChoose: function(command) {
					var list = get('convo-list-' + this.id);

					if (!this.getLabel(command)) {
						return;
					}

					list.mojo.noticeRemovedItems(0, this.model.items.length);

					this.model.items = this.getItems();
					this.model.items.push({
						text:	this.getLabel(command),
						value:	command
					});

					list.mojo.noticeAddedItems(0, this.model.items);

					this.saveItems();
				}.bind(this),

				placeNear: this.controller.get('add-' + this.id),
				items: menuitems
			});
		}
	},

	getLabel: function(value) {
		if (!value) {
			return(null);
		}

		switch (value.toLowerCase().charAt(0)) {
			case "h":
				return("home");

			case "m":
				return("mentions");

			case "f":
				return("favorites");

			case "d":
				return("messages");

			case "l":
				return("lists");

			case "s":
				return("search");

			default:
				return(null);
		}
	},

	getItems: function() {
		var prefs		= new LocalStorage();
		var tabOrder	= prefs.read('taborder');
		var tabs		= tabOrder.split(',');
		var items		= [];

		for (var i = 0, tab; tab = tabs[i]; i++) {
			items.push({
				text:	this.getLabel(tab),
				value:	tab
			});
		}

		return(items);
	},

	saveItems: function() {
		var tabs = [];

		for (var i = 0, item; item = this.model.items[i]; i++) {
			if (item.deleted) {
				continue;
			}

			tabs.push(item.value);
		}

		var prefs		= new LocalStorage();
		var oldvalue	= prefs.read('taborder');
		var newvalue	= tabs.join(',');

		if (oldvalue !== newvalue) {
			console.log('Saving tab order: ' + newvalue);

			prefs.write('taborder', newvalue);
			this.changed = true;
		}

		if (this.model.items.length == 6) {
			this.controller.get('add-'  + this.id).setStyle({'opacity': '.4'});
		} else {
			this.controller.get('add-'  + this.id).setStyle({'opacity': '1'});
		}
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

		this.saveItems();
	},
	cleanup: function() {
		this.saveItems();

		this.controller.stopListening(get('convo-list-' + this.id), Mojo.Event.listDelete, this.tabDelete);
		this.controller.stopListening(get('convo-list-' + this.id), Mojo.Event.listReorder, this.tabMove);
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
		Mojo.Event.stopListening(this.controller.get('add-'  + this.id), Mojo.Event.tap, this.addTapped);

		if (this.changed && this.assistant && this.assistant.activate) {
			this.assistant.activate.bind(this.assistant)();
		}
	}
});

