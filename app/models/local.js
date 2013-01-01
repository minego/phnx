/* Uses a cookie right now for saving key/value pairs */
function LocalStorage() {
	this.defaults = {
		notifications: true,
		notificationInterval: '00:15',
		notificationSound: 'notifications',
		notificationBlink: true,
		notificationHome: false,
		notificationMentions: true,
		notificationMessages: true,
		notificationShieldMessages: false,
		enterToSend: false,
		fontSize: 'small',
		barlayout: 'swapped',
		theme: 'pure',
		api: 'https://api.twitter.com',
		defaultAccount: '0',
		refreshOnSubmit: false,
		refreshFlushAtLaunch: false,
		enterToSubmit: false,
		delReceivedDM: false,
		hideAvatar: false,
		hideTweetBorder: true,
		showThumbs: 'showThumbs',
		showEmoji: 'showEmoji',
		limitToLocale: false,
		cardIcons: 'auto',
		browserSelection: 'stockBrowser',
		forwardSwipe: 'current',
		refreshOnMaximize: false,
		autoCorrect: true,
		filters: [],
		version: null,

// TODO	taborder is going away, being replaced by tabs (as json)
		taborder: 'h,m,f,d,l,s',
		tabs: [
			{ "type": "h" },
			{ "type": "m" },
			{ "type": "f" },
			{ "type": "d" },
			{ "type": "l" },
			{ "type": "s" }
		]
	};

	/*
		These preferences should be read with a user ID and are specific to a
		account.
	*/
	this.peraccount = {
		tabs: true
	};

	this.cookie = new Mojo.Model.Cookie('phnxStore');

	if (typeof(this.cookie.get()) !== 'undefined') {
		this.data = this.cookie.get();
	} else {
		this.data = this.defaults;
	}
}

LocalStorage.prototype = {
	read: function(key, accountid) {
		/* Attempt to read the key from the cookie */
		var value = this.data[key];

		if (typeof(value) !== 'undefined') {
			if (key == 'cardIcons') {
				/* Update old settings. This used to be a bool */
				if (value === true) {
					value = 'auto';
				} else if (value === false) {
					value = 'never';
				}
			}

			if (this.peraccount[key]) {
				/* If there is a value for this user then return it */
				if (typeof(value[accountid.toString()]) !== 'undefined') {
					return(value[accountid.toString()]);
				}
			} else {
				return(value);
			}
		}

		if (typeof(this.defaults[key]) != 'undefined') {
			return(this.defaults[key]);
		} else {
			/* Return null if it doesn't exist. */
			Mojo.Log.error('Key ' + key + ' doesn\'t exist.');
			return(null);
		}
	},

	write: function(key, value, accountid) {
		if (this.peraccount[key]) {
			if (!this.data[key]) {
				this.data[key] = {};
			}

			this.data[key][accountid.toString()] = value;
		} else {
			this.data[key] = value;
		}

		this.cookie.put(this.data);
		Mojo.Log.info('Saved ' + key + ': ' + value);
	}
};
