var ComposeToaster = Class.create(Toaster, {
	initialize: function(opts, assistant) {
		if (!assistant) {
			return;
		}

		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.textarea = 'txtCompose-' + this.id;
		this.completebar = 'complete-bar-' + this.id;
		this.assistant = assistant;
		this.controller = assistant.controller;
		this.user = this.controller.stageController.user;
		this.shim = false; //hide the shim when this toaster is toasty
		this.dm = false;
		this.reply = false;
		this.reply_id = '';
		this.geo = false;
		this.lat = 0;
		this.lng = 0;
		this.to = {};
		this.rt = false;
		this.availableChars = 140;
		this.count = 140;
		this.images = []; //any images to be uploaded
		this.uploading = false;
		this.sending = false;

		var toasterObj = {
			toasterId: this.id
		};

		if (opts.rt) {
			this.rt = true;
		}

		if (opts.dm) {
			this.dm = true;
			this.to = opts.user;
			toasterObj.to = opts.user.screen_name;
		}

		this.render(toasterObj, 'templates/toasters/compose');

		if (opts.text) {
			var txt;
			if (opts.text === '0') {
				txt = '@';
			}
			else {
				txt = opts.text;
			}
			get(this.textarea).value = txt;
			this.updateCounter();
		}

		// Select reply-all names at first
		if (opts.selectStart && opts.selectEnd) {
			get(this.textarea).selectionStart = opts.selectStart;
			get(this.textarea).selectionEnd = opts.selectEnd;
		}
		else if (this.rt) {
			get(this.textarea).setSelectionRange(0,0); //focus the cursor at the beginning
		}
		else {
			var len = get(this.textarea).value.length;
			get(this.textarea).setSelectionRange(len,len); //focus the cursor at the end
		}

		if (opts.reply_id) {
			this.reply = true;
			this.reply_id = opts.reply_id;
			get('submit-' + this.id).update('Post Reply');
		}

		if (opts.dm) {
			get('dm-' + this.id).addClassName('show');
			get('submit-' + this.id).update('Send Message');
		}

		// Need a timeout because sometimes the tapend event cancels the focus()
		setTimeout(function(){
			get(this.textarea).focus();
		}.bind(this), 0);
	},
	updateCounter: function() {
		var count = this.availableChars - get(this.textarea).value.length;
		get('count-' + this.id).update(count);
	},
	autoComplete: function() {
		var bar		= get(this.completebar);
		var ta		= get(this.textarea);
		var value	= ta.value;
		var end		= ta.selectionStart - 1;
		var start;

		bar.innerHTML = '';
		this.pos	= null;

		for (start = end; start >= 0; start--) {
			var c = value.charAt(start);

			switch (c) {
				case ' ': case '\t': case '\n': case '\r':
					// There was no @ in this word
					// console.log('Got to the start of the word with no @');
					if (this.autoCorrect) {
						ta.setAttribute("autocorrect", "on");
					}
					return;

				case '@':
					// console.log('found an @: ' + start);
					if (this.autoCorrect) {
						ta.setAttribute("autocorrect", "off");
					}
					break;

				default:
					continue;
			}

			break;
		}

		if (start < 0) {
			// console.log('Hit the begining of the value with no @');
			return;
		} else if ((end - start) < 1) {
			// Search string isn't long enough
			// console.log('Gotta give me more');
			return;
		}

		if (start > 0) {
			switch (value.charAt(start - 1)) {
				case ' ': case '\t': case '\n': case '\r':
					break;

				default:
					// console.log('The @ was in the middle of a word');
					// A @ in the middle of the word should be ignored
					return;
			}
		}

		var match = value.slice(start + 1, end + 1).toLowerCase();
		// console.log('Search for things that match: ' + match);

		var matches = [];
		for (var user, i = 0; (user = global.following[i]); i++) {
			if (-1 != user.screen_name.toLowerCase().indexOf(match)) {
				if (matches.length <= 10) {
					matches.push('<div class="compose-match" x-mojo-tap-highlight="immediate">' + user.screen_name + '</div>');
				} else {
					matches.push('<div class="compose-over">...</div>');
					break;
				}
			}
		}

		bar.innerHTML = matches.join('\n');
		this.pos = { 'start': start, 'end': end, 'value': value  };
	},
	addUser: function(event) {
		var button	= event.srcElement;
		var bar		= get(this.completebar);
		var ta		= get(this.textarea);

		if (!this.pos || !button.className || 0 != button.className.indexOf('compose-match')) {
			return;
		}

		var user = button.innerHTML;

		// Autocorrect tends to freak out when inserting a name. Turn it off and
		// leave it off until the user types at least one more character.
		ta.setAttribute("autocorrect", "off");

		ta.value = this.pos.value.slice(0, this.pos.start) + '@' + user;

		var rest = this.pos.value.slice(this.pos.end + 1);
		ta.value += ' ' + rest;

		/* Hide the bar */
		bar.innerHTML = '';
		this.pos = null;

		/* Prevent losing focus */
		this.refocus = true;
	},
	showKeyboard: function() {
		// Show the virtual keyboard with the type set to email (4) which shows
		// the '@' and '.COM' buttons. URL (7) may be useful too, which shows a
		// '/' key instead of a '@' key.
		try {
			this.controller.window.PalmSystem.setManualKeyboardEnabled(true);
			this.controller.window.PalmSystem.keyboardShow(4);
		} catch (e) {
			// This is fine. This is only need for devices without a physical
			// keyboard.
		}
	},
	hideKeyboard: function() {
		// Do everything possible to get the keyboard to hide
		try {
			this.controller.window.PalmSystem.setManualKeyboardEnabled(true);
			this.controller.window.PalmSystem.keyboardHide();
			this.controller.window.PalmSystem.setManualKeyboardEnabled(false);
		} catch (e) {
			// This is fine. This is only need for devices without a physical
			// keyboard.
		}

		// Ensure we don't refocus
		this.refocus = false;
		get(this.textarea).blur();
	},
	submitTweet: function(event) {
		var txt = get(this.textarea).value;
		var Twitter = new TwitterAPI(this.user);
		var args;

		if (this.uploading) {
			ex('An upload is in progress.');
		} else if (this.sending) {
			;
		} else if (txt.length > this.availableChars) {
			var words		= txt.match(/[^\s]+/g);
			var todone		= false;
			var to			= [];
			var mentions	= [];
			var messages	= [];
			var length		= 0;

			// Find all mentions in the message. Each part should cc all
			// of them. Include any hashes too.
			//
			// Count the length of these words so we know how much space
			// to save at the end of each aprt.
			for (var i = 0, word; word = words[i]; i++) {
				if (0 == word.indexOf('.@')) {
					todone = true;
					word = word.slice(1);
				} else if (0 == word.indexOf('#')) {
					todone = true;
				} else if (0 == word.indexOf('@')) {
					;
				} else {
					todone = true;
					continue;
				}

				// Count the length of the word, even if it is already in our
				// list so that it can be included in the right order.
				length += word.length + 1;

				if (-1 != mentions.indexOf(word) ||
					-1 != to.indexOf(word)
				) {
					// We've already found this guy
					continue;
				}

				if (!todone) {
					// The message is addressed directly to this user
					to.push(word);

					// These will be inserted before the message, so they do not
					// need to be in the message itself.
					words.shift();
					i--;
				} else {
					// The message mentioned this user
					mentions.push(word);
				}
			}

			if (length > 100 || this.dm) {
				// TODO	Allow splitting a DM in the future

				// Ya gotta give me a little bit of room to work with. How am I
				// supposed to split that? Jerk!

				ex('Keep it under 140, please!');
				return;
			}

			console.log('Mentions require ' + length + ' chars');

			var opts = {
				title: 'Your message is over 140 characters. Would you like to split it into multiple messages?',
				callback: function() {
					this.assistant.toasters.back();

					this.easterEggs(txt); //display some joke banners teehee

					while (words.length) {
						var left	= this.availableChars - length - 15;
						var msg		= [];

						while (words.length && left > 0) {
							if (0 == words[0].indexOf('@') ||
								0 == words[0].indexOf('#')
							) {
								// This is a mention or tag, so it's length is
								// already accounted for
								msg.push(words.shift());
							} else if (words[0].length < left) {
								left -= (words[0].length + 1);
								msg.push(words.shift());
							} else {
								break;
							}
						}

						var add = [];
						for (var i = 0, word; word = mentions[i]; i++) {
							if (-1 == msg.indexOf(word)) {
								add.push(word);
							}
						}

						if (add.length) {
							msg.push(' // ' + add.join(' '));
						}

						messages.push(msg.join(' '));
					}

					// Add a prefix to each message: "x of y: "
					var totext = '';

					if (to.length) {
						totext = to.join(' ') + ' ';
					}

					for (var i = 0; messages[i]; i++) {
						messages[i] = totext + (i + 1) + ' of ' + messages.length + ': ' + messages[i];
					}

					var sendfunc = function()
					{
						var msg = messages.shift();

						if (!msg) {
							// We're all done!
							var refresh = (new LocalStorage()).read('refreshOnSubmit');

							if (refresh) {
								this.assistant.refreshAll();
							}

							if (!this.rt) {
								this.assistant.toasters.back();
							} else {
								// If it's a retweet we want to go back 2 toasters to close the RT toaster
								this.assistant.toasters.backX(2);
							}
							return;
						}

						args = { 'status': msg };

						if (this.reply) {
							args.in_reply_to_status_id = this.reply_id;
						}

						if (this.geo) {
							args['lat' ] = this.lat;
							args['long'] = this.lng;
						}

						Twitter.postTweet(args, function(response, meta) {
							// Make the next message a reply to this one
							// this.reply = true;
							// this.reply_id = response.responseJSON.id;

							// Send the next part
							sendfunc();
						}.bind(this));
					}.bind(this);

					// kick it off
					sendfunc();

					this.sending = true;
					get('submit-' + this.id).setStyle({'opacity': '.4'});
				}.bind(this),

				cancel: function() {
					this.assistant.toasters.back();

					// Restore the previous value
					get(this.textarea).value = txt;
					get(this.textarea).focus();
				}.bind(this)
			};

			this.hideKeyboard();
			this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));
		} else if (txt.length === 0) {
			ex('That tweet is kind of empty.');
		} else if (!this.dm) {
			this.easterEggs(txt); //display some joke banners teehee
			args = {'status': txt};

			if (this.reply) {
				args.in_reply_to_status_id = this.reply_id;
			}

			if (this.geo) {
				args['lat'] = this.lat;
				args['long'] = this.lng;
			}

			this.sending = true;
			get('submit-' + this.id).setStyle({'opacity': '.4'});

			Twitter.postTweet(args, function(response, meta) {
				var prefs = new LocalStorage();
				var refresh = prefs.read('refreshOnSubmit');

				if (refresh) {
					this.assistant.refreshAll();
				}

				if (!this.rt) {
					this.assistant.toasters.back();
				} else {
					// If it's a retweet we want to go back 2 toasters to close the RT toaster
					this.assistant.toasters.backX(2);
				}
			}.bind(this));
		} else {
			args = {'text': txt, 'user_id': this.to.id_str};

			this.sending = true;
			get('submit-' + this.id).setStyle({'opacity': '.4'});

			Twitter.newDM(args, function(response) {
				var prefs = new LocalStorage();
				var refresh = prefs.read('refreshOnSubmit');

				if (refresh) {
					this.assistant.refreshAll();
				}

				this.assistant.toasters.back();
			}.bind(this));
		}
	},
	easterEggs: function(t) {
		t = t.toLowerCase().replace(/phnx\.ws/gi, '');

		if (t.indexOf('packers') > -1) {
			banner('Go Packers! :)');
		} else if (t.indexOf('phnx') > -1 || t.indexOf('macaw') > -1) {
			banner("Hey, that's me!");
		}
	},
	geotagTapped: function(event) {
		if (!this.geo) {
			this.getLocation();
		}
		else {
			this.geo = false;
			this.lat = 0;
			this.lng = 0;
			this.controller.get('geotag-' + this.id).removeClassName('active');
			banner('Location removed from tweet.');
		}
	},
	getLocation: function(){
		banner('Locating you...');
		this.controller.serviceRequest('palm://com.palm.location', {
			method : 'getCurrentPosition',
			parameters: {
				accuracy: 3,
				responseTime: 1,
				maximumAge: 90
			},
			onSuccess: this.gotLocation.bind(this),
			onFailure: function(response) {
				ex("There was an error getting a GPS fix.");
			}
		});
	},
	gotLocation: function(response){
		this.geo = true;
		this.lat = response.latitude;
		this.lng = response.longitude;
		this.controller.get('geotag-' + this.id).addClassName('active');
		banner('Found you!');
	},
	photoTapped: function(event) {
		var params = {
			defaultKind: 'image',
			kinds: ['image'],
			onSelect: function(file){
				var path = file.fullPath;
				this.upload(path);
			}.bind(this)
		};

		Mojo.FilePicker.pickFile(params, this.controller.stageController);
	},
	addImage: function(path) {
		this.images.push(path);
		this.availableChars -= 25; // the twitpic url is 25 characters long
		this.updateCounter();
	},
	upload: function(path) {
		this.uploading = true;
		get('submit-' + this.id).setStyle({'opacity': '.4'});
		get('loading').addClassName('show');
		var currentUser = getUser();
		var args = [
			{"key":"consumerKey","data": Config.key},
			{"key":"consumerSecret","data": Config.secret},
			{"key":"token","data": currentUser.token},
			{"key":"secret","data": currentUser.secret}
		];
		this.controller.serviceRequest('palm://com.palm.downloadmanager/', {
			method: 'upload',
			parameters: {
				'url': 'http://photos.phnxapp.com/upload',
				'fileLabel': 'photo',
				'fileName': path,
				'postParameters': args,
				'subscribe': true
			},
			onSuccess: this.uploadSuccess.bind(this),
			onFailure: function() {
				this.uploading = false;
				get('submit-' + this.id).setStyle({'opacity': '1'});
				get('loading').removeClassName('loading');
				ex('Error uploading image.');
			}
		});
	},
	uploadPhotos: function() {
		for (var i=0; i < this.images.length; i++) {
			var img = this.images[i];
			this.upload(img);
		}
	},
	uploadSuccess: function(response) {
		if (response.completed) {
			this.uploading = false;
			get('submit-' + this.id).setStyle({'opacity': '1'});
			get('loading').removeClassName('show');
			if (get(this.textarea).value.length > 0) {
				get(this.textarea).value = get(this.textarea).value + ' ';
			}
			get(this.textarea).value = get(this.textarea).value + response.responseString;
			this.updateCounter();
		}
	},
	linkTapped: function(event) {
		var txt = this.controller.get(this.textarea).value;
		var urls = txt.extractUrls();
		var bitly = new BitlyAPI({
			custom: false,
			user: Config.bitlyUser,
			key: Config.bitlyKey
		});

		var callback = function(shrt, lng){
			this.controller.get(this.textarea).value = this.controller.get(this.textarea).value.replace(new RegExp(lng, 'g'), shrt);
		};

		for (var i=0; i < urls.length; i++) {
			var u = urls[i];
			if (u.indexOf('bit.ly') < 0) {
				bitly.shorten(u, callback.bind(this));
			}
		}
	},
	emojiTapped: function(event) {
		var callback = function(result) {
			if (result && result.selectedEmoji != null) {
				var text = this.controller.get(this.textarea).value;
				if(result.selectedEmoji2){
					this.controller.get(this.textarea).value = text + convertUnicodeCodePointsToString(['0x' + result.selectedEmoji]) + convertUnicodeCodePointsToString(['0x' + result.selectedEmoji2]);
				} else{
					this.controller.get(this.textarea).value = text + convertUnicodeCodePointsToString(['0x' + result.selectedEmoji]);
				}
				this.updateCounter();
			}
		}.bind(this);
        
		this.controller.stageController.pushScene("emoji-dialog", callback);
	},
	cancelTapped: function(event) {
		this.assistant.toasters.back();
	},
	setup: function() {
		if (!get(this.textarea)) {
			return;
		}

		var prefs = new LocalStorage();
		if (prefs.read('enterToSubmit')) {
			get(this.textarea).observe('keydown', function(e){
				if (e.keyCode === 13) {
					this.submitTweet();
					e.stop();
				}
			}.bind(this));
		}

		this.autoCorrect = prefs.read('autoCorrect');

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
		Mojo.Event.listen(get('photo-' + this.id), Mojo.Event.tap, this.photoTapped.bind(this));
		Mojo.Event.listen(get('geotag-' + this.id), Mojo.Event.tap, this.geotagTapped.bind(this));
		Mojo.Event.listen(get('link-' + this.id), Mojo.Event.tap, this.linkTapped.bind(this));
		Mojo.Event.listen(get('emoji-' + this.id), Mojo.Event.tap, this.emojiTapped.bind(this));
		Mojo.Event.listen(get('cancel-' + this.id), Mojo.Event.tap, this.cancelTapped.bind(this));
		Mojo.Event.listen(get('complete-bar-' + this.id), Mojo.Event.tap, this.addUser.bind(this));
	},
	cleanup: function() {
		if (!get(this.textarea)) {
			return;
		}

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
		Mojo.Event.stopListening(get('emoji-' + this.id), Mojo.Event.tap, this.emojiTapped);
		Mojo.Event.stopListening(get('cancel-' + this.id), Mojo.Event.tap, this.cancelTapped);
		Mojo.Event.stopListening(get('complete-bar-' + this.id), Mojo.Event.tap, this.addUser);
	}
});
