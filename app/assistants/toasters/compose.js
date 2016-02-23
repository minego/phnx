/*
	This function should be used to open the compose toaster. It will open the
	toaster or a new compose card depending on the user's preference.
*/
var OpenComposeToaster = function OpenComposeToaster(toasters, args, assistant, override)
{
	var newcard	= false;

	if (typeof(override) !== 'undefined') {
		newcard = override;
	} else {
		var prefs = new LocalStorage();

		newcard = prefs.read('composeCard');
	}

	if (!newcard && toasters) {
		toasters.add(new ComposeToaster(args, assistant));
	} else {
		setTimeout(function() {
			var app		= Mojo.Controller.getAppController();
			var name	= global.getComposeStageName();

			app.createStageWithCallback({
					name:			name,
					lightweight:	true
				}, function(stageController) {
					global.stageActions(stageController);

					stageController.pushScene('compose', {
						stageName:		name,
						user:			assistant.user,
						users:			assistant.users,

						toasterOpts:	args
					});
				}, "card");
		}, 200);
	}
};

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

function splitStringAtInterval (string, interval) {
	var result = [];
	for (var i=0; i<string.length; i+=interval)
 	 result.push(string.substring (i, i+interval));
	return result;
};

var ComposeToaster = Class.create(Toaster, {
	initialize: function(opts, assistant) {
		if (!assistant) {
			return;
		}

		this.opts			= opts;
		this.id				= toasterIndex++;
		this.nodeId			= 'toaster-' + this.id;
		this.textarea		= 'txtCompose-' + this.id;
		this.completebar	= 'complete-bar-' + this.id;
		this.assistant		= assistant;
		this.controller		= assistant.controller;
		this.user			= opts.from || this.controller.stageController.user;
		this.shim			= false; //hide the shim when this toaster is toasty
		this.dm				= false;
		this.reply			= false;
		this.reply_id		= '';
		this.geo			= false;
		this.lat			= 0;
		this.lng			= 0;
		this.to				= {};
		this.from			= {};
		this.rt				= false;
		this.availableChars	= 140;
		this.count			= 140;
		this.images			= []; //any images to be uploaded
		this.uploading		= false;
		this.sending		= false;

		/*
			If enabled composing will not actuall send. This is used to allow
			debugging of compose behaviors such as splits, auto complete, etc.

			This will also shorten the allowed characters to 30 in order to help
			with testing splits.
		*/
		this.debug			= false;

		if (this.debug) {
			console.log("WARNING: Debug is enabled, you can't actually send a tweet");

			this.availableChars	= 30;
			this.count			= 30;
		}

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

		toasterObj.from = this.user.username

		this.render(toasterObj, 'templates/toasters/compose');

		if (opts.text) {
			var txt;
			if (opts.text === '0') {
				txt = '@';
			} else {
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

		get('compose-' + this.id).addClassName('show');
		// Need a timeout because sometimes the tapend event cancels the focus()
		setTimeout(function(){
			get(this.textarea).focus();
		}.bind(this), 0);
	},
	updateCounter: function() {
		var txt		= get(this.textarea).value;
		if (txt.length <= this.availableChars) {
			get('count-' + this.id).update(this.availableChars - txt.length);
			return;
		}
		var msgs	= this.split(txt);
		get('count-' + this.id).update(
			(this.availableChars - 1 - msgs[msgs.length - 1].length) +
			'x' + msgs.length);
	},
	composeTxtWithEmoji: function() {
		var bar		= get(this.completebar);
		var ta		= get(this.textarea);
		var value	= ta.value;

		//bar.innerHTML = '';
		this.pos	= null;

		bar.innerHTML = emojify(ta.value,16);
		if(bar.innerHTML.indexOf('<img class="emoji" src=') === -1){
			bar.innerHTML = '';
		}
	},
	autoComplete: function() {
		var bar		= get(this.completebar);
		var ta		= get(this.textarea);
		var value	= ta.value;
		var end		= ta.selectionStart - 1;
		var start;

		//bar.innerHTML = '';
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

		if (!this.pos || !button.className || 0 !== button.className.indexOf('compose-match')) {
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

	splitPrep: function(txt) {
		var words		= txt.match(/[^\s]+/g);
		var todone		= false;
		var to			= [];
		var mentions	= [];
		var needed		= 0;
		var length		= 0;

		/*
			Find all mentions in the message. Each part should cc all of them.

			Count the length of these words so we know how much space to save
			in each tweet.
		*/
		if (!this.dm) {
			for (var i = 0, word; word = words[i]; i++) {
				if (0 === word.indexOf('.@') || 0 === word.indexOf('"@')) {
					todone = true;
					word = word.slice(1);
				} else if (0 === word.indexOf('@')) {
					;
				} else {
					todone = true;

					if (length) {
						length++;
					}
					length += word.length;
					continue;
				}

				/*
					Count the length of the word, even if it is already in our list
					so that it can be included in the right order.
				*/
				needed += word.length + 1;

				if (-1 != mentions.indexOf(word) ||
					-1 != to.indexOf(word)
				) {
					/* No point in including the same recipient twice */
					continue;
				}

				if (!todone) {
					/*
						The message is addressed directly to these users, so they
						need to be included at the start of each part.
					*/
					to.push(word);

					/*
						These will be inserted before the message, so they do not
						need to be in the message itself.
					*/
					words.shift();
					i--;
				} else {
					/* The message mentioned this user */
					mentions.push(word);
				}
			}
		}

		for (var i = 0, word; word = words[i]; i++) {
			if(word.length > (140-(needed+ (mentions.length ? 14 : 10)))){
				var chunks;
				chunks = splitStringAtInterval(word,140-(needed+ (mentions.length ? 14 : 10)));
				words.splice(i,1);
				words = words.concat(chunks).unique(); 
			}
		}

		/* Include 10 chars padding for the "x of y" text */
		return({
			words:		words,
			to:			to,
			mentions:	mentions,
			length:		length,
			needed:		needed + (mentions.length ? 14 : 10)
		});
	},

	split: function(txt, info) {
		var messages = [];
		if (!info) {
			info = this.splitPrep(txt);
		}

		while (info.words.length) {
			/*
				Include 1 extra character when counting the length since the
				check below will assume a space.
			*/
			var left	= this.availableChars - info.needed + 1;
			var msg		= [];
			while (info.words.length && left > 0) {
				if (0 === info.words[0].indexOf('@') ||
					0 === info.words[0].indexOf('.@') ||
					0 === info.words[0].indexOf('".@')
				) {
					/*
						This is a mention, so it's length is already
						accounted for.
					*/
					msg.push(info.words.shift());
				} else if (info.words[0].length < left) {
					left -= (info.words[0].length + 1);
					msg.push(info.words.shift());
				} else {
					break;
				}
			}
			var add = [];
			for (var i = 0, word; word = info.mentions[i]; i++) {
				//First conditional needed as .@mentions were causing greater than 140char tweets
				if (-1 == msg.indexOf('.'+word) && -1 == msg.indexOf('"'+word)){
					if (-1 == msg.indexOf(word)) {
						add.push(word);
					}
				}
			}
			if (add.length) {
				msg.push(' // ' + add.join(' '));
			}

			messages.push(msg.join(' '));
		}
		/* Add a prefix to each message: "x of y: " */
		var totext = '';

		if (info.to.length) {
			totext = info.to.join(' ') + ' ';
		}
		for (var i = 0; messages[i]; i++) {
			messages[i] = totext + (i + 1) + ' of ' + messages.length + ': ' + messages[i];
		}

		return(messages);
	},

	submitTweet: function(event) {
		var txt		= get(this.textarea).value;
		var Twitter	= new TwitterAPI(this.user);
		var args;

		var sendfunc;

		if (!this.dm) {
			sendfunc = function sendTweet(txt, cb, reply_id) {
				args = {'status': txt};

				if (this.reply) {
					args.in_reply_to_status_id = this.reply_id;
				}
				if (reply_id){
					args.in_reply_to_status_id = reply_id;
				}

				if (this.geo) {
					args['lat'] = this.lat;
					args['long'] = this.lng;
				}

				if (this.photo) {
					args.photo = this.photo;
				}

				Twitter.postTweet(args, cb);
			}.bind(this);
		} else {
			sendfunc = function sendDM(txt, cb) {
				//Mojo.Log.error('sendingDM to screen_name: ' + this.to.screen_name);
				//Mojo.Log.error('sendingDM to id: ' + this.to.id_str);
				//args = {'text': txt, 'user_id': this.to.id_str};
				//Line above gives 'from' id_str (instead of 'to' id_str) if you DM from a DM you previously tweeted (ie, you replied to your own DM). Screen_name holds the proper 'to' name
				args = {'text': txt, 'screen_name': this.to.screen_name};

				Twitter.newDM(args, cb);
			}.bind(this);
		}

		if (this.debug) {
			/*
				Disable actual sending, just print the messages that would have
				been sent.

				Toggle the 'this.debug' var to turn this on.
			*/
			sendfunc = function dummyCB(txt, cb) {
				console.log("tweet: " + txt);

				cb();
			}.bind(this);
		}

		if (this.uploading) {
			ex('An upload is in progress.');
		} else if (this.sending) {
			;
		} else if (txt.length > this.availableChars) {
			var messages	= [];
			var info		= this.splitPrep(txt);

			if (info.needed > 100) {
				// Ya gotta give me a little bit of room to work with. How am I
				// supposed to split that? Jerk!

				ex('Keep it under 140, please!');
				return;
			}

			console.log('Mentions require ' + info.needed + ' chars');

			var opts = {
				title: 'Your message is over 140 characters. Would you like to split it into multiple messages?',
				callback: function() {
					this.assistant.toasters.back();

					if (!this.dm) {
						//display some joke banners teehee
						this.easterEggs(txt);
					}

					messages = this.split(txt, info);
					var sendnext = function(response) {
						var reply_id;
						if(response){
							reply_id = response.responseJSON.id_str;
						}

						var msg = messages.shift();

						if (!msg) {
							// We're all done!
							var refresh = (new LocalStorage()).read('refreshOnSubmit');

							if (refresh) {
								this.assistant.refreshAll();
							}

							if (!this.rt || this.dm) {
								this.assistant.toasters.back();
							} else {
								// If it's a retweet we want to go back 2 toasters to close the RT toaster
								this.assistant.toasters.backX(2);
							}
							return;
						}
						sendfunc(msg, sendnext, reply_id);
					}.bind(this);

					/* kick it off */
					sendnext();

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
		} else {
			if (!this.dm) {
				//display some joke banners teehee
				this.easterEggs(txt);
			}
			sendfunc(txt, function(response) {
				var prefs = new LocalStorage();
				var refresh = prefs.read('refreshOnSubmit');
				if (refresh) {
					if(typeof this.assistant.refreshAll == 'function'){
						this.assistant.refreshAll();
					}
				}
				if (!this.rt || this.dm) {
					this.assistant.toasters.back();
				} else {
					// If it's a retweet we want to go back 2 toasters to close the RT toaster
					this.assistant.toasters.backX(2);
				}
			}.bind(this));
			//For some reason if tweet is composed from justtype, toaster won't hide so you need the following to hide it on submit
			//this.assistant.toasters.back();
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
		if (this.photo) {
			var opts = {
				title: 'You already have a photo attached. Would you like to remove it?',
				callback: function() {
					this.assistant.toasters.back();

					/* Clear the photo */
					delete this.photo;

					get('photo-' + this.id).addClassName('photo');
					get('photo-' + this.id).removeClassName('photo-checked');

					this.photoTapped();
				}.bind(this),

				cancel: function() {
					this.assistant.toasters.back();
				}.bind(this)
			};

			this.hideKeyboard();
			this.assistant.toasters.add(new ConfirmToaster(opts, this.assistant));

			return;
		}

		var params = {
			defaultKind:		'image',
			kinds:				['image'],

			onSelect: function(file){
				/*
					Save the path to the photo, and change the icon to show that
					a photo has been selected.
				*/
				this.photo = file.fullPath;

				get('photo-' + this.id).removeClassName('photo');
				get('photo-' + this.id).addClassName('photo-checked');
			}.bind(this)
		};

		Mojo.FilePicker.pickFile(params, this.controller.stageController);
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
			//Below line won't shorten if the link has a '?' in it.  As we are just replacing and really don't need a regexp, just do a simple replace
			//this.controller.get(this.textarea).value = this.controller.get(this.textarea).value.replace(new RegExp(lng, 'g'), shrt);
			this.controller.get(this.textarea).value = this.controller.get(this.textarea).value.split(lng).join(shrt);
		};

		for (var i=0; i < urls.length; i++) {
			var u = urls[i];
			if (u.indexOf('bit.ly') < 0) {
				bitly.shorten(u, callback.bind(this));
			}
		}
	},
	emojiTapped: function(event) {
		//Moved outside of callback as on webOS 1.4.5 values defaulted to 0 and weren't reading current cursor value
		var txtArea = this.controller.get(this.textarea);
		var startPos = txtArea.selectionStart;
		var endPos = txtArea.selectionEnd;
		var scrollTop = txtArea.scrollTop;

		var callback = function(result) {
			if (result && result.selectedEmoji !== null) {
				//var txtArea = this.controller.get(this.textarea);
				var emojiChars;

				//if(result.selectedEmoji2){
				//	emojiChars = convertUnicodeCodePointsToString(['0x' + result.selectedEmoji]) + convertUnicodeCodePointsToString(['0x' + result.selectedEmoji2]);
				//} else{
				//	emojiChars = convertUnicodeCodePointsToString(['0x' + result.selectedEmoji]);
				//}

				emojiChars = result.emojiStringFinal;
				//Mojo.Log.error("emojiString: " + result.emojiString);
				if (txtArea.selectionStart || txtArea.selectionStart == '0') {
					//var startPos = txtArea.selectionStart;
					//var endPos = txtArea.selectionEnd;
					//var scrollTop = txtArea.scrollTop;

					txtArea.value = txtArea.value.substring(0, startPos) + emojiChars + txtArea.value.substring(endPos, txtArea.value.length);
					//txtArea.focus();
					setTimeout(function(){
						txtArea.focus();
						txtArea.setSelectionRange(startPos + emojiChars.length,startPos + emojiChars.length); //focus the cursor at current pos
					}, 200);
					txtArea.selectionStart = startPos + emojiChars.length;
					txtArea.selectionEnd = startPos + emojiChars.length;
				} else {
					txtArea.value += emojiChars;
				}
				this.updateCounter();
				this.composeTxtWithEmoji();
			}
		}.bind(this);

		this.controller.stageController.pushScene("emoji-dialog", callback);
	},
	newCardTapped: function(event) {
		this.opts.text = get(this.textarea).value;

		OpenComposeToaster(null, this.opts, this, true);
		this.assistant.toasters.back();
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
			this.composeTxtWithEmoji();
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
				} catch (ex) {
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
		Mojo.Event.listen(get('newcard-' + this.id), Mojo.Event.tap, this.newCardTapped.bind(this));
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
		Mojo.Event.stopListening(get('newcard-' + this.id), Mojo.Event.tap, this.newCardTapped);
		Mojo.Event.stopListening(get('cancel-' + this.id), Mojo.Event.tap, this.cancelTapped);
		Mojo.Event.stopListening(get('complete-bar-' + this.id), Mojo.Event.tap, this.addUser);
	}
});
