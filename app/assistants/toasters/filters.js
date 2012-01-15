var ManageFiltersToaster = Class.create(Toaster, {
	initialize: function(assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.visible = false;
		this.shim = true;

		this.assistant = assistant;
		this.controller = getController();
		this.user = this.controller.stageController.user;

		this.model = { items: this.getItems()  };

		this.reshow = this.reshow.bind(this);
		this.render({'toasterId':this.id}, 'templates/toasters/filters');

		this.controller.setupWidget('convo-scroller-' + this.id, {mode: 'vertical'},{});
		this.controller.setupWidget('convo-list-' + this.id,
		{
			itemTemplate:		"templates/filter-item",
			listTemplate:		"templates/list",
			swipeToDelete:		true,
			autoconfirmDelete:	true
		}, this.model);
	},
	filterDelete: function(event) {
		var opts = {
			title: 'Are you sure you want to remove this filter: "' + event.item.text + '"?',
			callback: function() {
				this.model.items.splice(event.index, 1);

				this.saveItems();
				this.assistant.toasters.back();
			}.bind(this),

			cancel: function() {
				this.assistant.toasters.back();
			}.bind(this)
		};
		this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},
	addTapped: function(event) {
		this.saveItems();
		this.assistant.toasters.add(new AddFilterToaster(this.assistant));
	},

	getItems: function() {
		var prefs	= new LocalStorage();
		var filters	= prefs.read('filters');
		var items	= [];

		for (var i = 0, f; f = filters[i]; i++) {
			items.push({ text: f });
		}

		return(items);
	},

	saveItems: function() {
		var filters = [];

		for (var i = 0, f; f = this.model.items[i]; i++) {
			if (!f.deleted) {
				filters.push(f.text);
			}
		}
console.log(Object.toJSON(filters));
		(new LocalStorage()).write('filters', filters);
	},

	reshow: function() {
		get('convo-list-' + this.id).mojo.noticeRemovedItems(0, this.model.items.length);
		this.model.items = this.getItems();
		get('convo-list-' + this.id).mojo.noticeAddedItems(0, this.model.items);
	},

	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		var screenHeight = this.controller.window.innerHeight;
		get('convo-scroller-' + this.id).setStyle({'max-height': (screenHeight - 85) + 'px'});
		get(this.nodeId).setStyle({'max-height': (screenHeight - 65) + 'px'});
		this.controller.listen(get('convo-list-' + this.id), Mojo.Event.listDelete, this.filterDelete.bind(this));

		Mojo.Event.listen(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
		Mojo.Event.listen(this.controller.get('add-'  + this.id), Mojo.Event.tap, this.addTapped.bind(this));
	},
	cleanup: function() {
		this.controller.stopListening(get('convo-list-' + this.id), Mojo.Event.listDelete, this.filterDelete);
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
		Mojo.Event.stopListening(this.controller.get('add-'  + this.id), Mojo.Event.tap, this.addTapped);
	}
});

