function AppAssistant(opts) {
	this.toasters = new ToasterChain();
}

AppAssistant.prototype = {
	setup: function() {
		var prefs = new LocalStorage();
	},
	handleLaunch: function(params, opts) {
		if (params.action === 'checkNotifications') {
			var prefs = new LocalStorage();
			var stageFocused = false; // temporaray

			if (prefs.read('notifications') && !stageFocused) {
				// Only background check notifications when enabled
				// and when there are no stages present
				this.checkNotifications();
			} else if (prefs.read('notifications') && stageFocused) {
				global.setTimer(); // reset the timer anyway
			}
		} else if (params.dockMode) {
			this.launchMain();
			// This is exhibition mode
//		} else if (params.composeTweet) {
		} else if (params.action === 'tweet') {
			// code for x-launch-params still work-in-progress
			Mojo.Log.info("Called Launch Param tweet correctly: " + params.msg);
			var prefs = new LocalStorage();	
			var defaultUser = prefs.read('defaultAccount');
			//this.launchMain();
			var am = new Account();
			var accounts;
			var user = {};

			am.all(function(r){
				accounts = r;
				if (accounts.length > 0) {
					//Mojo.Log.info('Starting app, accounts exist');
					// Push the main scene with the first account set as default.
					if (defaultUser !== '0') {
						for (var i=0; i < accounts.length; i++) {
							if (accounts[i].id === defaultUser) {
								user = accounts[i];
							}
						}
					}
					else {
						// Use the first user if an explicit default has not been chosen
						user = accounts[0];
					}
				}

				// Check if the user's stage is active & has scenes
				var appController = Mojo.Controller.getAppController();
				var userStage = appController.getStageProxy(global.mainStage + user.key);
				var userStageController = appController.getStageController(global.mainStage + user.key);
				if (userStage) {
					//Force new card composing until i can work out how to prevent the double compose toaster problem - last param set to true for new card
					//this.launchMain();
					if(userStageController) {
						userStageController.window.focus();
					}
					//OpenComposeToaster(this.toasters,{'from':user,'text':params.msg} , this);
					OpenComposeToaster(this.toasters,{'from':user,'text':params.msg} , this, true);
				} else {
					// Load the list of people being followed for auto complete
					if (!global.following || !global.following.length) {
						this.refreshFollowing(user);
					}
					OpenComposeToaster(this.toasters,{'from':user,'text':params.msg} , this, true);
				}
			}.bind(this));
    } else if (params.action === 'user') {
			// code for x-launch-params still work-in-progress
			/*		"search": {
			"displayName":	"Search User Project Macaw",
			"url":			"net.minego.phnx",
			"launchParam":	{ "action": "user", "userid":"#{searchTerms}" }
			}*/
			Mojo.Log.info("Called Launch Param user correctly: " + params.userid);
			var prefs = new LocalStorage();	
			var defaultUser = prefs.read('defaultAccount');
			var am = new Account();
			var accounts;
			var user = {};

			am.all(function(r){
				accounts = r;
				if (accounts.length > 0) {
					//Mojo.Log.info('Starting app, accounts exist');
					// Push the main scene with the first account set as default.
					if (defaultUser !== '0') {
						for (var i=0; i < accounts.length; i++) {
							if (accounts[i].id === defaultUser) {
								user = accounts[i];
							}
						}
					}
					else {
						// Use the first user if an explicit default has not been chosen
						user = accounts[0];
					}
				}
				
				// Check if the user's stage is active & has scenes
				var appController = Mojo.Controller.getAppController();
				var userStage = appController.getStageProxy(global.mainStage + user.key);
				var userStageController = appController.getStageController(global.mainStage + user.key);
				if (userStage) {
					if(userStageController) {
						userStageController.window.focus();
					}
				} else {
					this.launchMain();
				}				
				if (params.userid.length > 0) {
					var Twitter = new TwitterAPI(user);
					Twitter.getUser(params.userid, function(r){
						this.controller.getActiveStageController().pushScene({
							name: 'profile',
							disableSceneScroller: true
						}, r.responseJSON);
					}.bind(this));
				}
			}.bind(this));
    } else if (params.action === 'search') {
			// code for x-launch-params still work-in-progress
			/*		"search": {
			"displayName":	"Search Project Macaw",
			"url":			"net.minego.phnx",
			"launchParam":	{ "action": "search", "searchTerms":"#{searchTerms}" }
			}*/
			Mojo.Log.info("Called Launch Param search correctly: " + params.searchTerms);
			var prefs = new LocalStorage();	
			var defaultUser = prefs.read('defaultAccount');
			this.launchMain();
			var am = new Account();
			var accounts;
			var user = {};

			am.all(function(r){
				accounts = r;
				if (accounts.length > 0) {
					//Mojo.Log.info('Starting app, accounts exist');
					// Push the main scene with the first account set as default.
					if (defaultUser !== '0') {
						for (var i=0; i < accounts.length; i++) {
							if (accounts[i].id === defaultUser) {
								user = accounts[i];
							}
						}
					}
					else {
						// Use the first user if an explicit default has not been chosen
						user = accounts[0];
					}
				}
				if (params.searchTerms.length > 0) {
					var Twitter = new TwitterAPI(user);
					//var savedSearchesModel = {items: []};
					Twitter.getSavedSearches(function(response){
						savedSearchesModel.items = response.responseJSON;
					}.bind(this));
					var prefs = new LocalStorage();
					var searchMaxResults = prefs.read('searchMaxResults');

					var args = {
						q: params.searchTerms,
						count: searchMaxResults
					};					
					Twitter.search(args, function(response) {
					// this.toasters.add(new SearchToaster(query, response.responseJSON, this));
						var opts = {
							type: 'search',
							query: params.searchTerms,
							items: response.responseJSON.statuses,
							user: user,
							//savedSearchesModel: savedSearchesModel, // Added by DC
							savedSearchesModel: null,
							assistant: this,
							controller: this.controller 
						};
						this.controller.getActiveStageController().pushScene('status', opts);
						this.controller.modelChanged(savedSearchesModel);
						//this.controller.get('saved-searches').show();
					}.bind(this));
				}
			}.bind(this));
    } else if (params.action === 'userlaunch') {
			// code for x-launch-params still work-in-progress
			// Launch with specifed user
			//"launchParam":	{ "action": "userLaunch", "userid":"#{searchTerms}" }

			Mojo.Log.info("Called Launch Param user correctly: " + params.userid);
			var prefs = new LocalStorage();	
			var defaultUser = prefs.read('defaultAccount');
			var am = new Account();
			var accounts;
			var user = {};

			am.all(function(r){
				accounts = r;
				if (accounts.length > 0) {
					//Mojo.Log.info('Starting app, accounts exist');
					// Push the main scene with the first account set as default.
					if (params.userid.length > 0) {
						user = accounts[0]; // Set a default in case supplied userid not found
						for (var i=0; i < accounts.length; i++) {
							if (accounts[i].id === params.userid) {
								user = accounts[i];
								break;
							}
						}
					}
					else {
						// Use the first user if an explicit default has not been chosen
						user = accounts[0];
					}
				}
				
				// Check if the user's stage is active & has scenes
				var appController = Mojo.Controller.getAppController();
				var userStage = appController.getStageProxy(global.mainStage + user.key);
				var userStageController = appController.getStageController(global.mainStage + user.key);
				if (userStage) {
					if(userStageController) {
						userStageController.window.focus();
					}
				} else {
					var launchArgs = {
						user: user,
						users: accounts
					};
					var stageName = global.mainStage + user.key;

					this.pushStage(stageName, launchArgs);					
					//this.launchMain();
				}				
			}.bind(this));
    } else {
			Mojo.Log.info('params: ' + params);
			// Launch the app normally, load the default user if it exists.
			this.launchMain();
			//Removed line below - not quite sure why it was there.
			//this.toasters.add({}, new ComposeToaster(this));
			// this.checkNotifications(); // for debugging
		}
		var stageCallback = function(stageController) {
			Mojo.Log.error('RUNNING stageCallback');

			switch(params.action) {

				/**
				 * {
				 *   action:"tweet",
				 *   msg:"Some Text",
				 *   account:"ACCOUNT_HASH" // optional
				 * }
				 */
				case 'tweet':
						this.toasters.add(new ComposeToaster({
							'text':params.msg}, this
						));
					break;
			}
		};
	},
	refreshFollowing: function(user) {
		//Same as main-assistant refreshFollowing - needed for JustType launch etc
		global.following = [];

		//Just load based on supplied user
		//for (var i = 0, u; u = this.users[i]; i++) {
			var Twitter = new TwitterAPI(user);

			Twitter.getFriends(user.id, function(r) {
				var		f;

				while ((f = r.shift())) {
					for (var u, i = 0; (u = global.following[i]); i++) {
						//Mojo.Log.error('following: ' + global.following[i].screen_name);
						if (u.screen_name.toLowerCase() ===
							f.screen_name.toLowerCase()
						) {
							f = null;
							break;
						}
					}

					if (f) {
						global.following.push(f);
					}
				}
			});
		//}
	},
	handleCommand: function(event) {
		var stage = this.controller.getActiveStageController();

		if (event.command === 'cmdPreferences') {
			stage.pushScene('preferences');
		} else if (event.command === 'cmdPreferencesGeneral') {
			stage.pushScene('preferences', 'General Settings');
		} else if (event.command === 'cmdPreferencesAppearance') {
			stage.pushScene('preferences', 'Appearance');
		} else if (event.command === 'cmdPreferencesNotifications') {
			stage.pushScene('preferences', 'Notifications');
		} else if (event.command === 'cmdPreferencesLoadCounts') {
			stage.pushScene('preferences', 'Load Counts');
		} else if (event.command === 'cmdPreferencesAdvanced') {
			stage.pushScene('preferences', 'Advanced Settings');
		} else if (event.command === 'cmdAbout') {
			stage.pushScene('about');
		} else if (event.command === 'cmdSupport') {
			stage.pushScene('help');
		}
	},
	launchMain: function() {
		var prefs = new LocalStorage();
		this.userCookie = new Mojo.Model.Cookie('phoenixFirstRun');

		var user = {};

		var defaultUser = prefs.read('defaultAccount');

		// The app poops out on very first load if the Lawnchair store doesn't exist.
		// Using a cookie to get around this...
		if (typeof(this.userCookie.get()) !== "undefined") {
			var am = new Account();
			var accounts;
			am.all(function(r){
				accounts = r;
				if (accounts.length > 0) {
					Mojo.Log.info('Starting app, accounts exist');
					// Push the main scene with the first account set as default.
					if (defaultUser !== '0') {
						for (var i=0; i < accounts.length; i++) {
							if (accounts[i].id === defaultUser) {
								user = accounts[i];
							}
						}
					}
					else {
						// Use the first user if an explicit default has not been chosen
						user = accounts[0];
					}

					Mojo.Log.info('User set as ' + user.screen_name);

					var launchArgs = {
						user: user,
						users: accounts
					};
					prefs.write('defaultAccount', user.id);
					var stageName = global.mainStage + user.key;

					this.pushStage(stageName, launchArgs);
				}
				else {
					this.launchNew();
				}
			}.bind(this));
		} else {
			// This is the very first time the app is being launched,
			// so just init the Lawnchair store

			// Set the cookie, too.
			this.userCookie.put({
				run: true
			});

			var store = new Lawnchair('phnxAccounts');
			this.launchNew();
		}

	},
	launchNew: function() {
		var launchArgs = {};
		var stageName = global.authStage;
		this.pushStage(stageName, launchArgs);
	},
	pushStage: function(stageName, launchArgs) {
		var args = {
			name: stageName,
			lightweight: true
		};

		var pushMainScene = function(stageController) {
			if (stageName !== global.authStage) {
				global.stageActions(stageController);
			}
			stageController.pushScene('launch', launchArgs);
		};

		var userStage = this.controller.getStageProxy(stageName);
		if (!userStage) {
			this.controller.createStageWithCallback(args, pushMainScene, "card");
		} else {
			userStage.activate();
		}
	},
	checkNotifications: function() {
		// Check for notifications
		// Mojo.Log.info('Checking notifications');
		var prefs = new LocalStorage();

		am = new Account();
		am.all(function(r){

			var callback = function(response, meta) {
				// 05-DEC-2018 - George Mari
				// This same callback is used when checking notifications for the home timeline,
				// mentions, and direct messages.  For the first 2, our response will ONLY contain 
				// new tweets that we should show a notification for.
				// But for direct messages, Twitter always sends us a list of our 50 most 
				// recent messages - retrieving only the new ones is not possible.
				// So for direct messages, we need to somehow manually compare our JSON response 
				// to what we already have stored, to see if anything is new.
				// Mojo.Log.info('checkNotifications callback: ' + meta.resource.name);
				// Mojo.Log.info(response.responseJSON ? Object.toJSON(response.responseJSON) : response.responseJSON);
				if (meta.resource.name == 'directmessages' && response.responseJSON) {
					// The first thing we need to do with direct messages is figure out whether we have any new ones.
					// Twitter doesn't do that for us any more - we have to do it manually.
					// Our response will have attribures "id" and "created_timestamp" that we should be able to use.
					// Our meta.resource.lastId (?) holds the "id" of the most recent direct message for this account.
					var allMessages = [];
					var newMessages = [];

					// Make a copy of the array of returned events/messages
					allMessages = response.responseJSON.events.slice();
					var i;
					var dm_sender_list = '';
					var unique_dm_senders = [];

					for (i = 0; i < allMessages.length; i=i+1) {
						// Our response all recent direct messages - ones we have received, and also ones we have sent.
						// We don't want a notification for a message we sent, so exclude those.
						if (allMessages[i].id > meta.resource.lastId && allMessages[i].message_create.sender_id != meta.user.id) {
							var newMessage = {};
							newMessage.id = allMessages[i].id;
							newMessage.created_timestamp = allMessages[i].created_timestamp;
							newMessage.sender = {};
							newMessage.sender.id = allMessages[i].message_create.sender_id;
							unique_dm_senders[newMessage.sender.id] = {};
							// dm_sender_list = dm_sender_list + newMessage.sender.id + ',';
							// screen name doesn't come as part of the response - we'll have to get it later...
							newMessage.sender.screen_name = '';
							newMessage.text = allMessages[i].message_create.message_data.text;
							newMessages.push(newMessage);
						}
					}

					if (newMessages.length > 0) {
						// dm_sender_list will be a comma-separated list of the unique sender_ids 
						// from our retrieved list of direct messages.
						for (dm_sender in unique_dm_senders) {
							if (typeof unique_dm_senders[dm_sender] != 'function') {
								dm_sender_list = dm_sender_list + dm_sender + ',';
							}
						}

						// Trim the last comma character from the string
						if (dm_sender_list.lastIndexOf(',') == dm_sender_list.length - 1) {
							dm_sender_list = dm_sender_list.slice(0, -1);
						}	
						// Mojo.Log.info('checkNotifications callback - dm_sender_list: ' + dm_sender_list);

						// After we create our array of new messages, we should sort it by the created_timestamp attribute
						if (newMessages.length > 0) {
							newMessages.sort(function(a, b) {
								return b.created_timestamp - a.created_timestamp;
							});
						}
						// Get the screen names for the senders of our direct messages
						Twitter.getUsersById(dm_sender_list, function(user_response) {
							var i;
							for (i = 0; i < user_response.responseJSON.length; i = i + 1) {
								var j;
								for (j = 0; j < newMessages.length; j = j + 1) {
									if (newMessages[j].sender.id == user_response.responseJSON[i].id_str) {
										newMessages[j].sender.screen_name = user_response.responseJSON[i].screen_name;
									}
								}
							}
						// We now have all of our needed information to display the dashboard for our notifications.
						// But first, save the id of the most recent direct message, so we can use it for comparison in the future.
						prefs.write(meta.user.id + '_' + meta.resource.name, newMessages[0].id);
						this.createDashboard(meta.resource, newMessages, meta.user, r);
						}.bind(this));
					}
				}
				// Not processing direct messages...
				else if (response.responseJSON.length > 0) {
					prefs.write(meta.user.id + '_' + meta.resource.name, response.responseJSON[0].id_str);
					this.createDashboard(meta.resource, response.responseJSON, meta.user, r);
				}
			};

			for (var i=0; i < r.length; i++) {
				var user = r[i];
				Mojo.Log.info('Checking ' + user.username + ' notifications');

				// Name matches panel IDs in main-assistant
				// Noun is used in dashboard title
				// 05-DEC-2018 - George Mari
				// lastId/since_id is no longer an option when retrieving direct messages, so we shouldn't append this anymore
				// to the URL when checking direct messages for notification purposes.
				var resources = [
					{name: 'home', noun: 'Tweet', lastId: prefs.read(user.id + '_home'), enabled: prefs.read('notificationHome')},
					{name: 'mentions', noun: 'Mention', lastId: prefs.read(user.id + '_mentions'), enabled: prefs.read('notificationMentions')},
					{name: 'directmessages', noun: 'Direct Message', lastId: prefs.read(user.id + '_directmessages'), enabled: prefs.read('notificationMessages')}
				];

				for (var j=0; j < resources.length; j++) {
					var resource = resources[j];
					if (resource.enabled && resource.lastId !== null) {
						// Mojo.Log.info('Checking ' + resource.name + ' last ID:' + resource.lastId);
						var Twitter = new TwitterAPI(user);
						if (resource.name == 'directmessages') {
							Twitter.notificationCheck(resource, callback.bind(this), {"count": '50'}, user);
						} 
						else {
							Twitter.notificationCheck(resource, callback.bind(this), {"since_id": resource.lastId}, user);
						}
					}
				}
			}
		}.bind(this));

		// Reset the alarm
		global.setTimer();
	},
	createDashboard: function(resource, items, account, accounts) {
		var appController = Mojo.Controller.getAppController();
		var dashboardStage = appController.getStageProxy(global.dashboardStage);

		var userId;

		if (items[0].user) {
			userId = items[0].user.id_str;
		}
		else if (items[0].sender) {
			userId = items[0].sender.id_str;
		}

		// Check if the user's stage is active & has scenes
		var userStage = appController.getStageProxy(global.mainStage + userId);

		if (userStage && userStage.isActiveAndHasScenes()) {
			userStage.delegateToSceneAssistant('refreshPanelId', resource.name);
		}
		else {
			if (dashboardStage) {
				dashboardStage.delegateToSceneAssistant('update', items, resource, account, accounts);
			}
			else {
				var pushDashboard = function(stageController){
					stageController.pushScene('dashboard', items, resource, account, accounts);
				};
				appController.createStageWithCallback({name: global.dashboardStage, lightweight: true}, pushDashboard, 'dashboard');
			}
		}
	}
};
