/* Uses a cookie right now for saving key/value pairs */
function LocalStorage() {
	this.defaults = {
		notifications: true,
		notificationInterval: '00:15',
		notificationHome: false,
		notificationMentions: true,
		notificationMessages: true,
		enterToSend: false,
		fontSize: 'small',
		barlayout: 'swapped',
		theme: 'pure',
		api: 'https://api.twitter.com',
		defaultAccount: '0',
		refreshOnSubmit: false,
		enterToSubmit: false,
		sendAnalytics: true,
		limitToLocale: false,
		cardIcons: 'auto',
		browserSelection: 'inAppBrowser',
		forwardSwipe: 'current',
		refreshOnMaximize: false,
		autoCorrect: true,
		filters: [],
		version: null
	};

	this.cookie = new Mojo.Model.Cookie('phnxStore');

	if (typeof(this.cookie.get()) !== 'undefined') {
		this.data = this.cookie.get();
	}
	else {
		this.data = this.defaults;
	}
}

LocalStorage.prototype = {
	read: function(key) {
		if (typeof(this.data[key]) !== 'undefined') {
			// Attempt to read the key from the cookie

			if (key == 'cardIcons') {
				// Update old settings. This used to be a bool
				if (this.data[key] === true) {
					this.data[key] = 'auto';
				} else if (this.data[key] === false) {
					this.data[key] = 'never';
				}
			}

			return this.data[key];
		}
		else if (typeof(this.defaults[key]) != 'undefined') {
			// Check the defaults if it doesn't exist
			return this.defaults[key];
		}
		else {
			// Return null if it doesn't exist.
			Mojo.Log.error('Key ' + key + ' doesn\'t exist.');
			return null;
		}
	},
	write: function(key, value) {
		this.data[key] = value;
		this.cookie.put(this.data);
		Mojo.Log.info('Saved ' + key + ': ' + value);
	}
};
