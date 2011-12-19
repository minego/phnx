var AddFilterToaster = Class.create(Toaster, {
	initialize: function(assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.visible = false;
		this.shim = true;

		// We save the scene's assistant here
		this.assistant = assistant;
		this.controller = getController();
		this.user = this.controller.stageController.user;

		var obj = {
			toasterId: this.id
		};

		this.render(obj, 'templates/toasters/addfilter');
		get('txtFilter-' + this.id).focus();
	},
	saveTapped: function(event) {
		var prefs	= new LocalStorage();
		var value	= this.controller.get('txtFilter-' + this.id).value.toLowerCase();

		if (value && value.length > 0) {
			var filters = prefs.read('filters');

			if (-1 == filters.indexOf(value)) {
				filters.push(value);
			}
			prefs.write('filters', filters);
		}

		this.assistant.toasters.back();
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},
	setup: function() {
		Mojo.Event.listen(get('save-' + this.id), Mojo.Event.tap, this.saveTapped.bind(this));
		Mojo.Event.listen(get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));

		get('txtFilter-' + this.id).observe('keydown', function(e){
			if (e.keyCode === 13) {
				this.saveTapped();
				e.stop();
			} else if ((e.keyCode > 8 && e.keyCode < 14) || e.keyCode === 32) {
				/* Don't allow whitespace */
				e.stop();
			}
		}.bind(this));
	},
	cleanup: function() {
		get('txtFilter-' + this.id).blur();

		Mojo.Event.stopListening(get('save-' + this.id), Mojo.Event.tap, this.saveTapped);
		Mojo.Event.stopListening(get('back-' + this.id), Mojo.Event.tap, this.backTapped);
	}
});
