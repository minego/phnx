var ProfileToaster = Class.create(Toaster, {
	initialize: function(user, assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.visible = false;
		this.shim = true;
		this.controller = getController();
		this.user = this.controller.stageController.user;

		var Twitter = new TwitterAPI(this.user);
		if (typeof(user) === 'string') {
			Twitter.getUser(user, function(response){
				this.user = response;
				this.user.toasterId = this.id;
                this.user.description = this.processDescription(this.user.description);
				this.render(this.user, 'templates/toasters/profile');
			}.bind(this));
		}
		else {
			this.user = user;
			this.user.toasterId = this.id;
            this.user.description = this.processDescription(this.user.description);
			this.render(this.user, 'templates/toasters/profile');
		}
	},
    processDescription: function(desc) {
		var parsed = emojify(desc,16);
		/*if(desc.indexOf('<img class="emoji" src=') > -1){
			tweet.emoji_class = 'show';
		}*/
        
        return parsed;
    }
});