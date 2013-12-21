var ManageMutedUsersToaster = Class.create(Toaster, {
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
		this.render({'toasterId':this.id}, 'templates/toasters/mutedusers');

		this.controller.setupWidget('convo-scroller-' + this.id, {mode: 'vertical'},{});
		this.controller.setupWidget('convo-list-' + this.id,
		{
			itemTemplate:		"templates/muteduser-item",
			listTemplate:		"templates/list",
			swipeToDelete:		true,
			autoconfirmDelete:	true
		}, this.model);
	},
	mutedUserDelete: function(event) {
		var opts = {
			title: 'Are you sure you want to un-mute this user: "' + event.item.user + '"?',
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

	getItems: function() {
		var prefs	= new LocalStorage();
		var mutedUsers	= prefs.read('mutedUsers');
		var items	= [];

		if(mutedUsers){
			for (var i = 0, m; m = mutedUsers[i]; i++) {
				//items.push({ user: m });
				items.push(m);
			}
		}

		return(items);
	},

	saveItems: function() {
		var mutedUsers = [];

		for (var i = 0, m; m = this.model.items[i]; i++) {
			if (!m.deleted) {
				mutedUsers.push(m);
			}
		}
console.log(Object.toJSON(mutedUsers));
		(new LocalStorage()).write('mutedUsers', mutedUsers);
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
		this.controller.listen(get('convo-list-' + this.id), Mojo.Event.listDelete, this.mutedUserDelete.bind(this));

		Mojo.Event.listen(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
	},
	cleanup: function() {
		this.controller.stopListening(get('convo-list-' + this.id), Mojo.Event.listDelete, this.mutedUserDelete);
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
	}
});

