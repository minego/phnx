function ComposeTweetAssistant(opts) {
		this.textarea = 'txtCompose';
		stageController = this.controller.stageController;
		this.count = 140;
		this.sending = false;


}

ComposeTweetAssistant.prototype.setup = function() {
	var prefs = new LocalStorage();
		if (prefs.read('enterToSubmit')) {
			get(this.textarea).observe('keydown', function(e){
				if (e.keyCode === 13) {
					this.submitTweet();
					e.stop();
				}
			}.bind(this));
		}
		get(this.textarea).observe('change', function(e) {
			this.updateCounter();
		}.bind(this));

		get(this.textarea).observe('keyup', function(e){
			this.updateCounter();
			this.autoComplete();
		}.bind(this));

		// Start with autocorrect disabled. Only turn it on when the cursor is
		// in a word that does not start with @.
		get(this.textarea).setAttribute("autocorrect", "off");

		try {
			this.controller.window.PalmSystem.setManualKeyboardEnabled(true);
		} catch (e) {
			// This is fine. This is only need for devices without a physical
			// keyboard.
		}

		get(this.textarea).observe('focus', function(e){
			this.showKeyboard();
		}.bind(this));
		get(this.textarea).observe('click', function(e){
			this.showKeyboard();
		}.bind(this));

		get(this.textarea).observe('blur', function(e){
			if (this.refocus) {
				this.showKeyboard();
				try {
					get(this.textarea).focus();
				} catch (e) {
				}

				// Reset each time
				this.refocus = false;
			}
		}.bind(this));

		Mojo.Event.listen(get('submit-' + this.id), Mojo.Event.tap, this.submitTweet.bind(this));
};

ComposeTweetAssistant.prototype.updateCounter = function() {
		var count = this.availableChars - get(this.textarea).value.length;
		get('count-' + this.id).update(count);
};

ComposeTweetAssistant.prototype.submitTweet = function(event) {
		var txt = get(this.textarea).value;
		var Twitter = new TwitterAPI(this.user);
		var args;
		var sendfunc = function()
					{
						var msg = messages.shift();

						if (!msg) {
							// We're all done!
							var refresh = (new LocalStorage()).read('refreshOnSubmit');

							if (refresh) {
								this.assistant.refreshAll();
							}

							return;
						}

						args = { 'status': msg };

						Twitter.postTweet(args, function(response, meta) {
							// Make the next message a reply to this one
							// this.reply = true;
							// this.reply_id = response.responseJSON.id;

							// Send the next part
							sendfunc();
						}.bind(this));
					}.bind(this);

					sendfunc();

					this.sending = true;
}		
ComposeTweetAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

ComposeTweetAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

ComposeTweetAssistant.prototype.cleanup = function(event) {
	get(this.textarea).stopObserving('click');
		get(this.textarea).stopObserving('focus');
		get(this.textarea).stopObserving('blur');

		get(this.textarea).stopObserving('keyup');
		get(this.textarea).stopObserving('change');
		var prefs = new LocalStorage();
		if (prefs.read('enterToSubmit')) {
			get(this.textarea).stopObserving('keydown');
		}

		this.hideKeyboard();

		Mojo.Event.stopListening(get('submit-' + this.id), Mojo.Event.tap, this.submitTweet);
		Mojo.Event.stopListening(get('photo-' + this.id), Mojo.Event.tap, this.photoTapped);
		Mojo.Event.stopListening(get('geotag-' + this.id), Mojo.Event.tap, this.geotagTapped);
		Mojo.Event.stopListening(get('link-' + this.id), Mojo.Event.tap, this.linkTapped);
		Mojo.Event.stopListening(get('cancel-' + this.id), Mojo.Event.tap, this.cancelTapped);
		Mojo.Event.stopListening(get('complete-bar-' + this.id), Mojo.Event.tap, this.addUser);
	};
