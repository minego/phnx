var ManageMutedUsersToaster = Class.create(Toaster, {
	initialize: function(title, items, assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.shim = true;
		this.assistant = assistant;
		this.controller = getController();
		this.title = title;

		this.listModel = {"items": items};
		// Use the status list template - it's just a scrollers with a list & title
		this.render({'toasterId':this.id, title: this.title}, 'templates/toasters/mutedusers');

		this.controller.setupWidget('status-scroller-' + this.id, {mode: 'vertical'},{});
		this.controller.setupWidget('status-list-' + this.id, {
			itemTemplate: "templates/muteduser-item",
			listTemplate: "templates/list",
			swipeToDelete:		true,
			autoconfirmDelete:	true,
			renderLimit: 100
		}, this.listModel);
	},
	mutedUserDelete: function(event) {
		var opts = {
			title: 'Are you sure you want to un-mute this user: "@' + event.item.screen_name + '"?',
			callback: function() {
				this.listModel.items.splice(event.index, 1);

				this.saveItems();
				this.assistant.toasters.back();
			}.bind(this),

			cancel: function() {
				this.assistant.toasters.back();
			}.bind(this)
		};
		this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));
	},	
	userTapped: function(event) {
		var Twitter = new TwitterAPI(this.controller.stageController.user);
		Twitter.getUser(event.item.screen_name, function(r){
			this.controller.stageController.pushScene({
				name: 'profile',
				disableSceneScroller: true
			}, r.responseJSON);
		}.bind(this));
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},
	/*getItems: function() {
		var prefs	= new LocalStorage();
		var mutedUsers	= prefs.read('mutedUsers');
		var ids	= [];
		var count = 0;

		if(mutedUsers){
			for (var i = 0, m; m = mutedUsers[i]; i++) {
				ids.push(m.id);
				count++;
			}
			if(count > 0) {
				var Twitter = new TwitterAPI(this.user);
				Twitter.getUsersById(ids.join(','), function(r){
					//r.responseJSON;
				}.bind(this));	
			}				
		}
		return(items);
	},*/
	saveItems: function() {
		var mutedUsers = [];

		for (var i = 0, m; m = this.listModel.items[i]; i++) {
			if (!m.deleted) {
				mutedUsers.push({user: m.screen_name,id: m.id});
			}
		}
		console.log(Object.toJSON(mutedUsers));
		(new LocalStorage()).write('mutedUsers', mutedUsers);
	},
	reshow: function() {
		get('status-list-' + this.id).mojo.noticeRemovedItems(0, this.listModel.items.length);
		//this.listModel.items = this.getItems();
		get('status-list-' + this.id).mojo.noticeAddedItems(0, this.listModel.items);
	},
	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		var screenHeight = this.controller.window.innerHeight;
		get('status-scroller-' + this.id).setStyle({'max-height': (screenHeight - 65) + 'px'});
		get(this.nodeId).setStyle({'max-height': (screenHeight - 45) + 'px'});
		this.controller.listen(get('status-list-' + this.id), Mojo.Event.listDelete, this.mutedUserDelete.bind(this));
		this.controller.listen(get('status-list-' + this.id), Mojo.Event.listTap, this.userTapped.bind(this));
		Mojo.Event.listen(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
	},
	cleanup: function() {
		this.controller.stopListening(get('status-list-' + this.id), Mojo.Event.listDelete, this.mutedUserDelete);
		this.controller.stopListening(get('status-list-' + this.id), Mojo.Event.listTap, this.userTapped);
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
	}
});
