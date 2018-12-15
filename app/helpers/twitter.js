// TODO: Remove the assistant parameter from these functions
// TODO: Remove the panel parameter from these functions. Use closures instead.
// TODO: Allow custom API (for Chinese users)

var TwitterAPI = function(user, stageController) {
	this.apibase		= 'https://api.twitter.com';
	this.version		= '1.1';
	this.key			= Config.key;
	this.secret			= Config.secret;
	this.user			= user;
	this.token			= user.token;
	this.tokenSecret	= user.secret;

	if (stageController) {
		this.stage = stageController;
	} else {
		this.stage = false;
	}

	this.endpoints = {
		home:				'statuses/home_timeline',
		mentions:			'statuses/mentions_timeline',
		directmessages:	'direct_messages/events/list',
		favorite:			'favorites/create',
		unfavorite:			'favorites/destroy',
		retweet:			'statuses/retweet',
		destroy:			'statuses/destroy',
		destroyDM:			'direct_messages/events/destroy',
		statusShow:			'statuses/show',
		statusUpdate:		'statuses/update',
		statusesLookup:		'statuses/lookup',
		statusUpdateMedia:	'statuses/update_with_media',
		showUser:			'users/show',
		lookupUsers:		'users/lookup',
		userTimeline:		'statuses/user_timeline',
		userFavorites:		'favorites/list',
		followUser:			'friendships/create',
		unfollowUser:		'friendships/destroy',
		userRetweetStatus:	'friendships/update',
		noUserRetweets:			'friendships/no_retweets/ids',
		rateLimit:			'application/rate_limit_status',
		trends:				'trends/place',
		savedSearches:		'saved_searches/list',
		saveSearch:			'saved_searches/create',
		deleteSearch:		'saved_searches/destroy',
		searchTweets:		'search/tweets',
		newDM:				'direct_messages/events/new',
		lists:				'lists/list',
		listSubscriptions:	'lists/subscriptions',
		listStatuses:		'lists/statuses',
		statusRetweets:		'statuses/retweets',
		retweetsOfMe:		'statuses/retweets_of_me',
		block:				'blocks/create',
		report:				'users/report_spam',
		friendshipExists:	'friendships/show',
		followers:			'followers/ids',
		friends:			'friends/ids',
		updateProfileImage:	'account/update_profile_image'
	};
};

TwitterAPI.prototype = {
	url: function(endpoint) {
		// Build an API URL from all of the parts we store.
		return this.apibase + '/' + this.version + '/' + endpoint + '.json';
	},
	timeline: function(panel, callback, args, assistant, resource) {
		args.tweet_mode = "extended";
		this.sign('GET', this.url(this.endpoints[resource || panel.resource]), callback, args, {'panel': panel, 'assistant': assistant});
	},
	notificationCheck: function(resource, callback, args, user) {
		// Similar to timeline function but it needs to pass the user object to sign the request properly
		this.sign('GET', this.url(this.endpoints[resource.name]), callback, args, {"user": user, "resource": resource, "silent": true});
	},
	action: function(key, id, callback, assistant) {
		this.sign('POST', this.url(this.endpoints[key] + '/' + id), callback, {'id': id}, {'assistant': assistant});
	},
	favorite: function(key, id, callback, assistant) {
		this.sign('POST', this.url(this.endpoints[key]), callback, {'id': id}, {'assistant': assistant});
	},
	getStatus: function(id, callback, assistant) {
		this.sign('GET', this.url(this.endpoints.statusShow + '/' + id), callback, {'tweet_mode': 'extended','include_entities': 'true'}, {'assistant': assistant});
	},
	postTweet: function(args, callback, assistant) {
		if (!args.photo) {
			this.sign('POST', this.url(this.endpoints.statusUpdate), callback, args, {'assistant':assistant});
		} else {
			this.sign('POST', this.url(this.endpoints.statusUpdateMedia), callback, args, {'assistant':assistant});
			// this.sign('POST', 'http://sles/twittertest', callback, args, {'assistant':assistant});
		}
	},
	getUser: function(screen_name, callback) {
		this.sign('GET', this.url(this.endpoints.showUser), callback, {'screen_name': screen_name, include_entities: true}, {});
	},
	getUsersById: function(userIds, callback) {
		//Mojo.Log.info('getUsersById userIds: ' + userIds);
		this.sign('GET', this.url(this.endpoints.lookupUsers), callback, {'user_id': userIds}, {});
	},
	getUserTweets: function(args, callback) {
		// args.include_rts = true;
		args.tweet_mode = 'extended';
		this.sign('GET', this.url(this.endpoints.userTimeline), callback, args, {});
	},
	getFavorites: function(args, callback) {
		args.tweet_mode = 'extended';
		this.sign('GET', this.url(this.endpoints.userFavorites), callback, args, {});
	},
	followUserName: function(username, callback) {
		this.sign('POST', this.url(this.endpoints.followUser), callback, {'screen_name':username}, {});
	},
	followUser: function(id, callback) {
		this.sign('POST', this.url(this.endpoints.followUser), callback, {'user_id':id}, {});
	},
	unfollowUser: function(id, callback) {
		this.sign('POST', this.url(this.endpoints.unfollowUser), callback, {'user_id':id}, {});
	},
	userRetweetStatus: function(status, id, callback) {
		this.sign('POST', this.url(this.endpoints.userRetweetStatus), callback, {'user_id':id, 'retweets':status}, {});
	},
	noUserRetweets: function(callback) {
		this.sign('GET', this.url(this.endpoints.noUserRetweets), callback, {'stringify_ids':true}, {});
	},
	checkFollow: function(userA, userB, callback) {
		this.sign('GET', this.url(this.endpoints.friendshipExists), callback, {
			source_id:	userA,
			target_id:	userB
		}, {});
	},
	rateLimit: function() {
		// Displays a banner about the current rate limit
		this.sign('GET', this.url(this.endpoints.rateLimit), function(response, meta){
			var status = response.responseJSON;
			// Below resources no longer work with API V1.1
			//var resetDate = new Date(status.reset_time);
			//banner(status.remaining_hits + '/' + status.hourly_limit + ' until ' + resetDate.toUTCString());
			//Mojo.Log.error("Rate_Limits: " + status);
		}, {}, {});
	},
	trends: function(location, callback) {
		this.sign('GET', this.url(this.endpoints.trends), callback, { id: location }, {});
	},
	getSavedSearches: function(callback) {
		this.sign('GET', this.url(this.endpoints.savedSearches), callback, {}, {});
	},
	saveSearch: function(query, callback) {
		this.sign('POST', this.url(this.endpoints.saveSearch), callback, {'query':query}, {});
	},
	deleteSearch: function(id, callback) {
		this.sign('POST', this.url(this.endpoints.deleteSearch + '/' + id), callback, {'id':id}, {});
	},
	newDM: function(args, callback) {
		console.log('newDM - args: ' + Object.toJSON(args));
		this.signDM('POST', this.url(this.endpoints.newDM), callback, args, {});
	},
	destroyDM: function(args, callback) {
		this.sign('POST', this.url(this.endpoints.destroyDM), callback, args, {}); 
	},
	userLists: function(args, callback) {
		this.sign('GET', this.url(this.endpoints.lists), callback, args, {});
	},
	listSubscriptions: function(args, callback) {
		this.sign('GET', this.url(this.endpoints.listSubscriptions), callback, args, {});
	},
	listStatuses: function(args, callback) {
		args.tweet_mode = 'extended';
		this.sign('GET', this.url(this.endpoints.listStatuses), callback, args, {});
	},
	statusesLookup: function(ids, callback) {
		this.sign('GET', this.url(this.endpoints.statusesLookup), callback, {'tweet_mode':'extended','id':ids,'include_entities': 'true'}, {});
	},	
	search: function(passedArgs, callback) {
		// Query (passedArgs) can be either a string or an object literal with named parameters in it
		//var args = {"result_type":"mixed","count":"100","include_entities":"1"}; //DC Added include_entities for inline thumbs
		var args = {"tweet_mode":"extended","result_type":"mixed","include_entities":"1"}; //DC Added include_entities for inline thumbs

		if (typeof(passedArgs) === 'string') {
			args.q = passedArgs;
		}
		else {
			for (var key in passedArgs) {
				args[key] = passedArgs[key];
			}
		}
		// var prefs = new LocalStorage();
		// if (prefs.read('limitToLocale')) {
		// 	var locale = Mojo.Locale.getCurrentLocale();
		// 	args.lang = locale;
		// }

		this.sign('GET', this.url(this.endpoints.searchTweets), callback, args, {});
	},
	showRetweets: function(id, callback) {
		var args = {
			"count": 100,
			"tweet_mode": "extended"
		};
		this.sign('GET', this.url(this.endpoints.statusRetweets + '/' + id), callback, args, {});
	},
	retweetsOfMe: function(args, callback) {
		//this.sign('GET', this.url(this.endpoints.retweetsOfMe), callback, {"count": 100}, {});
		args.tweet_mode = "extended";
		this.sign('GET', this.url(this.endpoints.retweetsOfMe), callback, args, {});
	},
	block: function(id, callback) {
		this.sign('POST', this.url(this.endpoints.block), callback, {'user_id': id}, {});
	},
	report: function(id, callback) {
		this.sign('POST', this.url(this.endpoints.report), callback, {'user_id': id}, {});
	},
	getFollowers: function(userId, callback) {
		this.sign('GET', this.url(this.endpoints.followers), this.gotIds.bind(this), {'user_id': userId, 'stringify_ids': true, 'cursor': '-1'}, {callback: callback});
	},
	getFriends: function(userId, callback) {
		this.sign('GET', this.url(this.endpoints.friends), this.gotIds.bind(this), {'user_id': userId, 'stringify_ids': true, 'cursor': '-1'}, {callback: callback});
	},
	// Testing code for profile image upload - not ready - DC
	updateProfileImage: function(args, callback) {
		this.sign('POST', this.url(this.endpoints.updateProfileImage), callback, args, {});
	},
	gotIds: function(response, meta) {
		var start	= meta.start || 0;
		//var ids		= response.responseJSON.ids.slice(start, start + 99);
		var ids;
		if(start <= 400) {
			ids		= response.responseJSON.ids.slice(start, start + 100); // slice doesn't include the end number hence adding one more
		}
		var allIds = response.responseJSON.ids;

		if (!ids || ids.length <= 0) {
			var lookup = {};
			for (var i = 0, len = meta.results.length; i < len; i++) {
				lookup[meta.results[i].id_str] = meta.results[i];
			}
			var j = 0;
			for (var i = 0, len = meta.results.length; i < len; i++) {
				if(lookup[allIds[j]]){
					meta.results[i] = lookup[allIds[j]];
				} else {
					Mojo.Log.error('userId not found: ' + allIds[j]);
					i--;
				}
				j++;
			}
			meta.callback(meta.results || []);
			return;
		}
		//Mojo.Log.info('ids: ' + ids.join(','));
		meta.start	= start + 100;
		this.getUsersById(ids.join(','), function(r) {
			if (meta.results) {
				var tmp = meta.results;
				meta.results = tmp.concat(r.responseJSON);
			} else {
				meta.results = r.responseJSON;
			}
			this.gotIds(response, meta);
		}.bind(this));
	},
	signDM: function(httpMethod, url, callback, args, meta) {
		console.log('signDM - point 1 args: ' + Object.toJSON(args));
		var silent	= false; // if true, errors are not reported on the screen.
		//var original_args = {"event": {"type": "message_create", "message_create": {"target": {"recipient_id": "38175496"}, "message_data": {"text": args.event.message_create.message_data.text}}}};
		var original_args = args;

		if (meta.user) {
			silent = true;
		}

		if (meta.silent === true) {
			silent = true;
		}

		// args is an object literal of URL parameters to be included
		// meta is an object literal with data that needs to be passed through to the callback

		/*
			If a photo is being posted then do NOT include the args in the oauth
			signature. It should only include the query strings.
		*/
		var message = {
			method:		httpMethod,
			action:		url,
			parameters:	{}
		};

		//console.log('sign: ' + httpMethod + ' ' + url + '?' + Object.toJSON(args));

		OAuth.completeRequest(message, {
			consumerKey:		this.key,
			consumerSecret:		this.secret,
			token:				this.token,
			tokenSecret:		this.tokenSecret
		});
		// console.log('signDM - point 2 args: ' + Object.toJSON(args));

		var opts = {
			contentType:	'application/json',
			method:			httpMethod,
			success:			callback,
			silent:			silent,

			requestHeaders: {
				Accept:					'*/*',
				"Accept-Encoding":	'gzip, deflate',
				Authorization:			OAuth.getAuthorizationHeader(this.apibase, message.parameters),
				"Content-Type":		'application/json',
				"User-Agent":			'macaw2018'
			}
		};

		if (meta) {
			opts.meta = meta;
		}

		if (args.photo) {
			opts.photo = args.photo;
			delete args.photo;

			/* The args get sent as part of the post body */
			opts.postParameters = args;

			this.request(url, opts);
		} else {
			switch (httpMethod.toUpperCase()) {
				default:
				case 'GET':
					this.request(OAuth.addToURL(url, args), opts);
					//Mojo.Log.error('sign GET: ', OAuth.addToURL(url, args), Object.toJSON(opts));
					break;

				case 'POST':
					// 20-NOV-2018 - George Mari
					// For the direct message API, a non-encoded JSON object
					// is expected in the post body, so calling formEncode 
					// messes up what is expected.
					//console.log('signDM -  point 2 args: ' + Object.toJSON(args));
					//console.log('signDM -  point 3 original_args: ' + Object.toJSON(original_args));
					opts.postBody = original_args;
					//console.log('signDM - opts.postBody: ' + Object.toJSON(opts.postBody));
					this.request(url, opts);
					//Mojo.Log.info(url, Object.toJSON(opts));
					break;
			}
		}
	},
	sign: function(httpMethod, url, callback, args, meta) {
		var silent	= false; // if true, errors are not reported on the screen.

		if (meta.user) {
			silent = true;
		}

		if (meta.silent === true) {
			silent = true;
		}

		// args is an object literal of URL parameters to be included
		// meta is an object literal with data that needs to be passed through to the callback

		/*
			If a photo is being posted then do NOT include the args in the oauth
			signature. It should only include the query strings.
		*/
		var message = {
			method:		httpMethod,
			action:		url,
			parameters:	args.photo ? {} : args
		};

		// console.log('sign: ' + httpMethod + ' ' + url + '?' + Object.toJSON(args));

		OAuth.completeRequest(message, {
			consumerKey:		this.key,
			consumerSecret:		this.secret,
			token:				this.token,
			tokenSecret:		this.tokenSecret
		});

		var opts = {
			method:				httpMethod,
			encoding:			'UTF-8',
			success:			callback,
			silent:				silent,

			requestHeaders: {
				Authorization:	OAuth.getAuthorizationHeader(this.apibase, message.parameters),
				Accept:			'application/json'
			}
		};

		if (meta) {
			opts.meta = meta;
		}

		if (args.photo) {
			opts.photo = args.photo;
			delete args.photo;

			/* The args get sent as part of the post body */
			opts.postParameters = args;

			this.request(url, opts);
		} else {
			switch (httpMethod.toUpperCase()) {
				default:
				case 'GET':
					this.request(OAuth.addToURL(url, args), opts);
					//Mojo.Log.error('sign GET: ', OAuth.addToURL(url, args), Object.toJSON(opts));
					break;

				case 'POST':
					// 20-NOV-2018 - George Mari
					// For the new direct message API, a non-encoded JSON object
					// is expected in the post body, so calling formEncode 
					// seems to mess up what is expected.
					opts.postBody = OAuth.formEncode(args);
					this.request(url, opts);
					Mojo.Log.info(url, Object.toJSON(opts));
					break;
			}
		}
	},
	plain: function(httpMethod, url, args, callback, silent) {
		/* Send a plain HTTP request. No OAuth signing. */

		if (typeof(silent) === 'undefined') {
			silent = false;
		}

		var params = '';

		for (var key in args) {
			if (params !== '') {
				params += '&';
			}
			params += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
		}

		/* Remove the hidden backspace character (messes up searches sometimes) */
		params = params.replace('%08','');

		this.request(url, {
			method:		httpMethod,
			encoding:	'UTF-8',
			parameters:	params,
			success:	callback,
			silent:		silent
		});
	},
	request: function(url, opts) {
		/*
			A wrapper for the PrototypeJS request object, which allows for
			connection checking and timeouts.
		*/
		if (opts.postBody) {
			console.log('request - opts: ' + Object.toJSON(opts));
			console.log('request - opts.postBody: ' + Object.toJSON(opts.postBody));
		}
		var user		= this.user;
		var stage		= this.stage;

		if (!opts.silent || opts.silent === false) {
			this.toggleLoading(true);
		}

		var connectionResponse = function(r) {
			if (!r.isInternetConnectionAvailable) {
				this.toggleLoading(false);
				return;
			}

			opts.onSuccess = function(response) {
				//Mojo.Log.info('=================================================================');
				//Mojo.Log.info('Twitter request - success ' + response.status + ' on url: ' + url);
				//Mojo.Log.info('Twitter request - responseText is: ' + response.responseText);
				//Mojo.Log.info('Twitter request - responseJSON is: ' + JSON.stringify(response.responseJSON));
				//Mojo.Log.info('Twitter request - responseXML is: ' + response.responseXML);
				//Mojo.Log.info('Twitter request - responseJSON 1st array element: ' + JSON.stringify(response.responseJSON[0]));
				/*
				for(responsePropertyName in response) {
					Mojo.Log.info('Twitter request - property name: ' + responsePropertyName)
					}
				*/
				if (Ajax.activeRequestCount <= 1) {
					this.toggleLoading(false);
				}

				if (!opts.meta) {
					opts.success(response);
				} else {
					opts.success(response, opts.meta);
				}
			}.bind(this);

			opts.onFailure = function(transport) {
				if (Ajax.activeRequestCount <= 1 && opts.silent !== true) {
					this.toggleLoading(false);
				}

				Mojo.Log.info('Twitter request - HTTP Failure ' + transport.status + ' on ' + url);
				if (opts.silent !== true) {
					Mojo.Log.info('HTTP Failure ' + transport.status + ' on ' + url);

					if (transport.status >= 500 && transport.status <= 599) {
						/* 5xx is a server failure */
						global.fail();
					} else {
						Mojo.Log.info('request - transport object: ' + Object.toJSON(transport));
						Mojo.Log.info('request - transport object: ' + Object.toJSON(transport).slice(900));
						Mojo.Log.info('request - transport object: ' + Object.toJSON(transport).slice(1800));
						for (var i = 0, err; err = transport.responseJSON.errors[i]; i++) {
							global.ex(transport.status + ': ' + err.message);
						}
					}
				}
			}.bind(this);

			if (!opts.photo) {
				new Ajax.Request(url, opts);
			} else {
				var headers	= [];
				var params	= [];

				if (opts.requestHeaders) {
					var keys = Object.keys(opts.requestHeaders);

					for (var i = 0, key; key = keys[i]; i++) {
						if ('string' === typeof opts.requestHeaders[key]) {
							headers.push(key + ': ' + opts.requestHeaders[key]);
						}
					}
				}

				if (opts.postParameters) {
					var keys = Object.keys(opts.postParameters);

					for (var i = 0, key; key = keys[i]; i++) {
						if ('string' === typeof opts.postParameters[key]) {
							params.push({
								"key":	key,
								"data":	opts.postParameters[key]
							});
						}
					}
				}
				// Mojo.Log.error('headers: ' + Object.toJSON(headers));
				// Mojo.Log.error('params: ' + Object.toJSON(params));
				// Mojo.Log.error('opts: ' + Object.toJSON(opts));

				var req = new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
					method:					'upload',
					parameters: {
						url:				url,
						fileLabel:			'media',
						fileName:			opts.photo,
						subscribe:			true,
						postParameters:		params,
						customHttpHeaders:	headers
					},

					onSuccess: function(response) {
						if (!response.completed) {
							return;
						}
						// Mojo.Log.error(Object.toJSON(response));

						if (!response.responseJSON) {
							response.responseJSON = Mojo.parseJSON(response.responseString);
						}

						opts.onSuccess(response);
					}.bind(this),

					onFailure: opts.onFailure
				});
			}
		}.bind(this);

		var service = new Mojo.Service.Request('palm://com.palm.connectionmanager', {
			method:		'getStatus',
			onSuccess:	connectionResponse,
			onFailure:	connectionResponse
		});
	},
	toggleLoading: function(show) {
		var user = this.user;
		if (show) {
			if (this.stage === false) {
				g(user.id, 'loading').addClassName('show');
			}
			else {
				this.stage.document.getElementById('loading').className = 'show';
			}
		}
		else {
			if (this.stage === false) {
				g(user.id, 'loading').removeClassName('show');
			}
			else {
				this.stage.document.getElementById('loading').className = '';
			}
		}
	}
};
