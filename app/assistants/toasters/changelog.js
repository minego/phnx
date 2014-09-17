var ChangelogToaster = Class.create(Toaster, {
	items: [
		{ version: '1.5.5' },
		{ item: 'Replaced emoji with EmojiOne graphics'},
		{ version: '1.5.4' },
		{ item: 'Refresh button highlights when tapped'},
		{ item: 'Pref option to scroll to bottom of timeline on Load More tap'},
		{ item: 'Nav icons in profile view will now scroll to top/bottom of panel'},
		{ item: 'Option to hide gifs from timeline views to help with reducing cpu load due to animations'},
		{ version: '1.5.3' },
		{ item: 'User lists show "verified" tick next to username'},
		{ item: 'Searches no longer show retweets'},
		{ item: 'Added Trending Location to General Settings preference page.  If your country is not listed, please tweet @baldric555 and it will be added'},
		{ item: 'Added option to use YouTube app from webOS2.1.2 on webOS2.2.4 devices if installed'},
		{ item: 'Helped youtu.be shortened links work a bit better on webOS2.2.4'},
		{ version: '1.5.2' },
		{ item: 'Possible to now hide/show retweets of a specified user. Configure in Profile view'},
		{ item: 'Vine option in Advanced Prefs now relates to Timelines.  If it is "off" tweets with Vine links are processed on tap.  This means that Vine thumbs will not show in timelines'},
		{ item: 'Work-around for first entry in list toaster not being able to be selected (like Filters, Panel Order etc)'},
		{ item: 'Profile Mentions work now if first returned entry was a RT'},
		{ item: 'Improved toaster pop-up/down animations'},
		{ item: 'Fixed Details toaster cleanup'},
		{ version: '1.5.1' },
		{ item: 'Fixed display of final authorization panel'},
		{ item: 'Fixed Vine videos from playing in the background'},
		{ item: 'Fav hearts now show in Profile view'},
		{ version: '1.5.0' },
		{ item: 'ProjectMacaw now requires FileMgr service'},
		{ item: 'Prefs option to hide New count of muted tweets'},
		{ item: 'Prefs section header now fixed at top of scene'},
		{ item: 'Saving of images from preview scene'},
		{ version: '1.4.9' },
		{ item: 'Previews are once again available for twitpic images'},
		{ item: 'Un/mute user in profile options. See list of muted users (and swipe to un-mute) using "Preferences & Account" menu. Prefs option in Appearance globally mutes specified users from timelines.'},
		{ item: 'Favoriting now updates timeline lists immediately without requiring a refresh'},
		{ item: 'Fixed bug where tweet after a removed filtered tweet is processed correctly'},
		{ item: 'Panels greater than the 6th panel on phones now refresh and marker works after scrolling to those panels'},
		{ version: '1.4.8' },
		{ item: 'Fixed vine links'},
		{ version: '1.4.7' },
		{ item: 'TP in portrait mode displays conversations and changelog full width'},
		{ item: 'Details toaster completely hides on TP in portrait mode and tweet text fills width'},
		{ item: 'Avatars updated for contributors on final authorization panel and allows for following of contributors on tap'},
		{ item: 'Pref option to Mobilize web links launched in system browser.  Also added pop-up to mobilize link'},
		{ item: 'Advanced pref option to allow for a Refresh&Flush after specified number of pull-to-refreshes per panel'},
		{ item: 'Retweet and Favourite counts are updated before displaying Details toaster'},
		{ item: 'Multi-part tweets are now flagged as replies to the previous part of the long tweet when viewing a conversation'},
		{ item: 'Added number of favorites for a tweet in Details toaster'},
		{ item: 'Expanded width of Retweet count in Details toaster'},
		{ item: 'Higher res avatars on Pre3'},
		{ item: 'Created some additional Pre3 hires buttons/icons'},
		{ item: 'Expanded URLs shown on profile page'},
		{ item: 'Prelim work for "gap" support'},
		{ item: 'Pref options added to specify number of results for Home, Mentions and Favorites timeline'},
		{ item: 'Pref options added to specify number of results for lists, searches and retweets'},
		{ item: 'Pref option added to specify number of results to return for timeline/mentions/favourites in Profile view'},
		{ item: 'Holding a Navigation Tab icon scrolls to the New Item separator if one exists. Tap still scrolls to top/bottom' },
		{ item: 'Emoji dialog shows flags again' },
		{ item: 'Cursor updates correctly in compose toaster when inserting emoji' },

		{ version: '1.4.6' },
		{ item: 'Added Instagram video support' },
		{ item: 'Added preference option to display timestamps as absolute or relative' },
		{ item: 'Follows/Following and Retweets now max out properly at newest 500 items' },
		{ item: 'Follows/Following now returns users in order - newest at top' },
		{ item: 'Option to pass 4sq.com links through foursquare app.  Requires V2.8.5 of foursquare' },
		{ item: 'Tweets containing huge words no longer cause crash and span correctly' },
		{ item: 'Search #tags from tweets works again (as well as refreshing already displayed searches)' }, 
		{ item: 'Profile history, mentions and favourites handle retweets correctly' },
		{ item: 'Cross-app launching allows using PM for twitter searches (but you cannot save this search like normal)' },
		{ item: 'JustType works for composing tweets and searching for users. Compose tweet will be sent by default user' },
		{ item: 'Panel names show account name for non-current panel owners on TP' },
		
		{ version: '1.4.5' },
		{ item: 'Support for "audioboo" audio' },
		{ item: 'Profile Mentions now no longer display retweets' },
		{ item: 'Mentions work in profile panel again' },
		{ item: 'Suppport for "justsayin" audio' },
		
		{ version: '1.4.4' },
		{ item: 'Emoji compose placement should now work on webOS 1.4.5 instead of being placed at head of tweet' },
		{ item: '"Fade BG" option to allow for phnx style bg fades on phones' },
		{ item: 'Change Tab Order should now work for everyone' },
		{ item: 'Can now send link to free and pro versions of ReadOnTouch' },
		{ item: 'Added "Send to Facebook" and "Send link to Facebook"' },
		{ item: 'Clicking on TwitPic thumb or link now loads webpage as large image is no longer available through this service' },
		{ item: 'Conversation icon shows on tweets in timelines if tweet is part of a convo' },
		{ item: 'Preliminary support for Vine videos' },
		{ item: 'Updated bit.ly keys so link shortening works again' },
		{ item: 'Line breaks are now respected on tweets' },
		{ item: 'Added option to show thumbnails in timeline full image width.  Will not scale above 100% of width of original image'},
		{ item: 'Added ability to use custom notification sounds' },
		
		{ version: '1.4.3' },
		{ item: 'Close button on new cards now closes the card on TP' },
		{ item: 'Bug fixed new-card views on touchpad to use full width' },
		{ item: 'Bug fixed profile view panel layout for touchpad' },
		
		{ version: '1.4.2' },
		{ item: 'Save/Delete searches'},
		
		{ version: '1.4.1' },
		{ item: 'Changed image upload service to twitpic' },

		{ version: '1.4.0' },
		{ item: 'Updated to the twitter 1.1 API' },
		{ item: '"Send URL via DataJog" fixed and "Send link via DataJog"' },
		{ item: 'Search/Trending panel now obeys top layout' },
		{ item: 'First item in lists, searches, retweets no longer hides under header' },
		{ item: 'Flag emoji now work again' },
		{ item: 'Emoji are now inserted at current cursor position' },

		{ version: '1.3.7' },
		{ item: 'Corrected sending of split tweets, which was broken in 1.3.6' },

		{ version: '1.3.6' },
		{ item: 'List/Retweet/Search timelines are now full width on TP' },
		{ item: 'Added "via" source in search timeline' },
		{ item: 'Changed favourite flag from "★" to "♥" to keep things consistant' },
		{ item: 'Option to toggle inline thumbs from showing in search timelines.  Helps to hide "unexpected" images popping up' },
		{ item: 'Inline thumbs and emoji are now shown in search lists' },
		{ item: '.jpg, .jpeg, .png & .gif images directly mentioned in tweets are shown as thumbnails' },
		{ item: 'Fixed search field' },
		{ item: 'URLs are shown in there entirety in details mode on touchpad' },
		{ item: '"User since..." added to profile page' },
		{ item: 'Convo list fits panel width if hideAvatars is enabled' },
		{ item: 'Show padlock and thumbnails in conversation toaster' },
		{ item: 'Allow customizing the tab order, and allow removing unwanted tabs' },
		{ item: 'Allow composing in a new card' },

		{ version: '1.3.5' },
		{ item: 'Corrected styling issues in the profile page' },

		{ version: '1.3.4' },
		{ item: 'Added a favorites panel (and did some work to prepare for customizing panel layouts)' },
		{ item: 'Added padlock item to users who have protected accounts' },
		{ item: 'Display 2 full columns instead of 2 and a half in portrait view on the TouchPad' },

		{ version: '1.3.3' },
		{ item: 'Replaced most remaining phnx branching with Project Macaw branding' },
		{ item: 'Toasters are no longer transparent' },
		{ item: 'Fixed issues with loading tweet details after a search' },
		{ item: 'Reorganized the app menu' },
		{ item: 'Corrected a number of minor bugs in the filters dialog' },
		{ item: 'Allow adding a new filter by tapping on a hashtag when viewing a tweet' },
		{ item: 'Allow splitting DMs that are longer than 140 characters' },
		{ item: 'Display the number of tweets that will be required to split a long message when composing a tweet' },
		{ item: 'Added Blink notification toggle' },
		{ item: 'Updated how profile-banner is displayed' },

		{ version: '1.3.2' },
		{ item: 'If profile-banner exists, then it is displayed on newly laid out profile page' }, 
		{ item: 'Unified all emoji, and converted highres images to 48x48 from 64x64 (thanks again to Antonio Morales MojoWhatsup)' },
		{ item: 'Emoji dialog now uses 48x48 images on all platforms' },
		{ item: 'Added "Hide Tweet Borders" option to Appearance preference page' },
		{ item: 'Up to 2 inline thumbnails can now be shown in timeline and details' },
		{ item: 'Updated emoji compose support to use Unicode rather than Softbank encoding' },
		{ item: 'Tweets containing emoji using Softbank codes (aka V1.3.1 of Project Macaw and older and sub-IOS5) are now transcoded to Unicode and displayed in tweets' },

        { version: '1.3.1' },
        { item: 'Fixed bugs related to the new layout options' },

        { version: '1.3.00' },
        { item: 'Emoji support in 1.3 is BETA. Some glyphs may not work yet.' },
        { item: 'Implemented emoji support for composing tweets.' },
        { item: 'Add displaying emoji to a few more locations (search, dashboard).' },
        { item: 'Add hires icons.' },
        { item: 'Re-add Sunnyvale theme as Pure+Rebirth.' },
        { item: 'Reorganized the preferences page' },
        { item: 'Added additional options for layout, and for which fields are displayed for a tweet' },

		{ version: '1.2.33' },
		{ item: 'Added the "black" theme' },
		{ item: 'Minor bug fixes' },
		{ item: 'Change colour of emoji denote symbol "☺" and DM direction for Pure style' },

		{ version: '1.2.32' },
		{ item: 'Minor bug fixes' },

		{ version: '1.2.31' },
		{ item: 'Implemented pull to refresh' },

		{ version: '1.2.28' },
		{ item: 'Modified to allow deletion of received DMs and added preference option' },
		{ item: 'Modified to allow shielded notifications for received DMs and added preference option' },
		{ item: 'Modified to allow hiding of Avatars in timelines, lists, searches and trends.  Also added preference option.' },
		{ item: 'Modified display of usernames after auth on Welcome scene' },
		{ item: 'Modified display of usernames in DMs to show who sent/received' },
		{ item: 'Modified to show star next to favorites in timeline. Pref refreshAfterPost allows auto update of timeline' },
		{ item: 'Added display name in tweets from searches' },
		// { item: 'Added preliminary panel re-ordering via preferences.  Requires app restart' },
		{ item: 'Fixed pref display issue with header of first section' },
		{ item: 'Added notification sound type selection in preferences' },
		{ item: 'Added View->RefreshFlush menu to flush timeline of externally deleted tweets' },
		{ item: 'Added Refresh and Flush at launch preference option' },
		{ item: 'Notifications are applied upon exiting preferences screen, previously required at re-start' },
		{ item: 'Refresh and Flush at launch shows marker with new tweets' },
		{ item: 'Fixed beacon lighting with refresh and flush' },
		{ item: 'Fixed Refresh and Flush to load only new tweets or last 10 instead of all' },
		{ item: 'Fixed changeLog and followers/following to show more entries' },
		{ item: 'Fixed LoadMore bug on TP that only loaded more in Home timeline' },
		{ item: 'Media parsing allows for pic.twitter photos to be shown in preview and not twitter webpage' },
		{ item: 'Added ShowInlineThumbnails to prefs to show thumbs in timelines and details view' },
		{ item: 'Thumbnail can now be tapped in details view to view media' },
		{ item: 'Time (or date) of tweet now shown in tweet details view and "via" removed from dm details' },
		{ item: 'Added support for display of unicode emoji (thanks to Tarek Galal\'s code for "wazzap")' },
		{ item: 'Prefs option to show emoji/thumbnails in timeline and details, details only, or never' },
		{ item: 'A "☺" will appear in the footer of timeline tweets to denote tweet has emoji' },

		{ version: '1.2.24' },
		{ item: 'Display both the twitter screen name and display name in the timeline' },

		{ version: '1.2.22' },
		{ item: 'Added option to ask the user what to do when a link is clicked on. Option can be enabled in preferences, or by long pressing a URL when viewing a tweet.' },
		{ item: 'Corrected behavior when clicking on "Tweets" when viewing a user profile' },
		{ item: 'Remove the close button when viewing a profile on a device with a gesture area to ensure that the menu button remains visible.' },

		{ version: '1.2.20' },
		{ item: 'ReadItLater and Instapaper support'},
		{ item: 'Top bar in the preferences scene is now static'},
		{ item: 'Call the app controller to handle links instead of sending them to the stock browser. This works for if you have a different default browser then the stock browser.'},

		{ version: '1.2.18' },
		{ item: 'Added help scene' },
		{ item: 'Use HTTPS for all twitter access' },
		{ item: 'Updated the finished authentiation scene layout' },
		{ item: 'Added preference for using the in-app browser or the stock browser' },

		{ version: '1.2.17' },
		{ item: 'Added a changelog' },
		{ item:	'Disable the post button while posting a tweet' },
		{ item:	'Added an "automatic" mode for the card icon feature' },

		{ version: '1.2.16' },
		{ item:	'Added filters (Select "Manage Filters" from the app menu)' },
		{ item:	'Include RTs in the timeline' },
		{ item:	'Use "Pure" as the default theme' },
		{ item:	'Show recipient name on sent DMs' },
		{ item:	'Allow deleting sent DMs' },

		{ version: '1.2.15' },
		{ item:	'Improved column layout on the TouchPad' },
		{ item:	'Added support for sending notifications to the MW150 bluetooth watch (Thanks @linuxq)' },
		{ item:	'Fixed a bug that would cause a RT to be displayed in the timeline twice in some situations' },
		{ item:	'Hide a tweet after blocking or reporting spam' },
		{ item:	'Display sent DMs' }
	],

	initialize: function(assistant) {
		this.id = toasterIndex++;
		this.nodeId = 'toaster-' + this.id;
		this.visible = false;
		this.shim = true;

		this.assistant = assistant;
		this.controller = getController();
		this.user = this.controller.stageController.user;

		this.render({'toasterId':this.id}, 'templates/toasters/changelog');

		this.controller.setupWidget('convo-scroller-' + this.id, {mode: 'vertical'},{});
		this.controller.setupWidget('convo-list-' + this.id,
		{
			itemTemplate:		"templates/changelog-item",
			listTemplate:		"templates/list",
			// Below added by DC as changeLog display was maxing out
			renderLimit: 250
		}, this);
	},
	backTapped: function(event) {
		this.assistant.toasters.back();
	},
	setup: function() {
		this.controller.instantiateChildWidgets(get('toasters'));

		var screenHeight = this.controller.window.innerHeight;
		get('convo-scroller-' + this.id).setStyle({'max-height': (screenHeight - 85) + 'px'});
		get(this.nodeId).setStyle({'max-height': (screenHeight - 65) + 'px'});

		Mojo.Event.listen(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped.bind(this));
	},
	cleanup: function() {
		Mojo.Event.stopListening(this.controller.get('back-' + this.id), Mojo.Event.tap, this.backTapped);
	}
});

