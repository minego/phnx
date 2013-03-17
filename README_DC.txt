--- Please note: I have NEVER coded ANYTHING in javescript, css OR HTML.  I've just worked my way around the code and learned from that.
---  Thanks must go to all who have gone before me - the code is extremely well laid out and has helped me to learn.
---  Sorry if I've screwed things up as I'm new to this.

Modified tweet.js to allow deleting of other people's direct messages (line 62)
Modified appinfo.json to keep version number 1.28 but change id to com.lestersoftware.phnx to avoid normal update conflicts
Modified changelog.js for version number and description
Modified preferences-assistant.js, local.js and tweet.js to give option for received DMs ('delReceivedDM')
Modified preferences-assistant.js and local.js to give option to shield DMs (notificationShieldMessages)
Modified dashboard-assistant.js to perform the DM shielding
Modified local.js, preferences-assistant.js, phnx.css, main-assistant.js, app-globals.js, profile-assistant.js, timeline.js, status-list.js for hideAvatar
Modified finishAuth-scene.html to use content-wrapper-no-avatar to align username properly
Altering panel order:
	Alter main-scene.html (1 place) and main-assistant.js (4 places)
Modified phnx.css for enableAvatar and disableAvatar, app-globals.js and preferences-assistant.js. Displays banner when toggling hideAvatar option
Added arrow_left.png and arrow_right.png for direct message sent/received, and modified phnx.css, main-assistant.js and item-no-avatar.html to use arrows for dm
Added star to favorites on timelines - adjusted main-assistant.js and tweet.js.  Auto updates timeline if RefreshAfterPost is set in prefs
Added search-no-avatar.html and modified profile-assistant.js for hideAvatar
Added from_user_name on searches
Modified status-assistant.js to respect hideAvatar setting for lists, retweets, trends and searches.
Modified main-assistant.js, preferences-assistant.js, app-globals.js and local.js for panel re-ordering. Last 3 panels can be re-ordered in preferences
Added top_section.html and modified preferences-assistant.js to push down first section heading in prefs
Added to preferences-assistant.js, dashboard-assistant.js and local.js to allow for sound/vibrate/mute for notifications
Added menu to View menu in main-assistant.js to allow for a flush and refresh (this removes previously externally deleted tweets from timeline and cache)
Modified preferences-assistant.js, local.js and main-assistant.js to allow for a flush refresh on app launch
Version bumped to 1.28 for push back to main git, and added contributor link in finishAuth-scene.html and about-scene.html
Added setTimer() to cleanup of preferences-asisstant.js so that background notifications are activated if selected when exited prefs.  Normally it would only be activated on app launch.
Modified main-assistant.js to give a marker of new tweets when refresh and flush at launch option is used.
Modified changelog.js to increase renderLimit to show more entries. Also increased renderLimit for userLists for followers and following.
Modified main-assistant.js moreButtonTapped() to check for which panel the LoadMore button was tapped on.  Fixes bug with TouchPad always refreshing Home Timeline.
Added entities.media parsing to tweet.js so that twitter (t.co) photos show up with preview and not the twitter webpage
Modified item.html, item-no-avatar.html, phnx.css, preferences-assistant.js, local.js, main-assistant.js, app-globals and tweet.js to show inline image thumbnails 
Updated way that favourite star works in timelines and direction arrows of DMs.
Modified tweet.js to show time of tweet (or date if over 24hrs) in details view and removed "via" from details view of DMs
Modified item-no-avatar.html, item.html, phnx.cc, details.html, tweet.js(helpers) and added emoji.js to support display of tweets containing unicode emoji
Modified handling of emoji display and inline thumbnails to allow for display in timeline and details, details only, or never.  No longer requires restart when changing preference.
HideAvatars no longer needs app restart and in the process removed item-no-avatar.html
Added a showPanels class in finishAuth-scene.html to always show the avatars of the contribs, regardless of the HideAvatar pref.
Updated emoji-dialog-assistant.js, compose.js, sources.js and emoji.js (plus added hashTable.js) to compse using unicode characters. Also updated all 1.5 icons to unicode names and added a couple missing ones from the normal emoji folder. Finally transcodes between Softbank to Unicode on display.
Updated item.html, details.html and tweet.js to allow for up to 2 inline thumbnails.
Updated phnx.css to do slight repo on emoji icon in compose toaster and slight change to layout of emoji list.
Updated preferences-assistant.js, phnx.css, black.css, main-assistant.js, app-globals.js and local.js to allow for HideTweetBorder option.
Added "background:transparent" in phnx.css to get rid of lower border in emoji dialogue
Made sure all emoji exist under normal (32x32) and 1.5 (48x48) and converted the 1.5 from 64x64 to 48x48, as they aren't required any bigger. Change inspired by Antonio Morales' MojoWhatsup. Also, force using the 48x48 for emoji dialog.
Updated phnx.css, profile-assistant.js and content.html so profile_banner is applied to profile page if it exists. Also modified pure.css and sunnyvale.css so banner could be seen over bg color.
Updated app-globals.js to refer to Project Macaw instead of phnx in menu.
Updated pure.css and sunnyvale.css so that "verified" text is easier to read.
Updated profile-banner to fill full panel width.
Updated local.js, preferences-assistant.js, app-assistant.js and dashboard-assistant.js to give pref option to toggle blink notifications 
Updated content.html, item.html, details.html and user-item.html to display lock icon if account is protected.
Updated convo-item.html to show lock and thumbnails, and updated phnx.css to make convo list full panel width if hideAvatars is enabled.
Modified phnx.css, pure.css and sunnyvale.css so color of "user since" in profile is more readable.
Updated link checking for youtube addresses similar to "youtube.com/#/watch".
Updated phnx.css so that url's are displayed in their entirety in details mode on touchpad.
Added list-noptr.html for search an lists panels, and modified main-assistant.js to stop toaster popup on entering search text. 
Modified tweet.js to show inline thumbs of direct referenced .jpg, .jpeg, .gif and .png files.
Modified twitter.js, tweet.js, search.html and seach-no-avatar.html for inline thumbs and emoji on search.  Also, search.html and search-no-avatar.html are now unicode.
Modified preferences-assistant.js, app-globals.js, local.js, status-assistant.js, main-assistant.js and phnx.css to give a toggle (may add to dropdown if I can think of a nice way of doing it), to hide thumbnails in search timeline but show everywhere else.  Implemented option as some quite "unexpected" images came up while doing searches ;)
Modified changelog.js to up the renderlimit of the list scroller
Modified main-assistant.js, item.html and details.html to change favstar from star to heart symbol.
Modified search.html to show 'via' source.
Modified search.js and removed search-no-avatar.html as its no longer needed.
Added item-one-column.html and modified status-assistant.js, search.html and phnx.css for full device width lists, retweet lists and searches.
Modified compose.js so emoji are inserted at current cursor position
Modified phnx.css and lists.html to add .search-list-item.only for retweet panel
Modified main-assistant.js as new 1.1 api changes the way lists are handled. Shows users lists now, however all lists are shown there.  need to filter somehow.
Updated tweet.js and twitter.js to allow for deleting of DM's with 1.1 api
Added save/restore script to saverestore folder (see README inside that folder for instructions)
Modified status-scene.html so that first item of search/lists etc doesn't appear under header
Modified search.html and phnx.css so that search/trending topics panel obeys top layout properly
Modified twitter.js and profile-assistant.js to prepare for extra profile stuff.  Attempting to set profile image but no luck yet so commented out in profile-assistant.js 
Updated tweet.js and twitter.js to allow favoriting with 1.1 api
Modified profile-assistant.js so if users profile is opened in a new card, no option button is shown if there are 0 options.
Updated tweet.js so sending to DataJog works again.  Also allows sending of selected link.
Modified tweet.js so reference to PaperMache is now Instapaper (as PaperMache is not actually used to share link).
Modified profile-assistant.js to adjust the height very slightly to make full height.
Modified twitter.js, main-assistant.js, status-assistant.js and status-scene.html to support saving/deleting searches
Modified profile-assistant.js so that open in new card obeys prefs.
Modified phnx.css to help with profile panel width issues.  Still working on favourites.
Modified phnx.css so landscape and profile both show all panel columns in profile.
Modified status-assistant.js so tweets are full width on tp for new-card searches and lists
Modified status-assistant.js and profile-assistant.js so that if using a new card, the close button kills the card.
Modified preferences-assistant.js, dashboard-assistant.js and added pick.html and empty.html to allow for custom notification sounds.
Modified tweet-highlight.png to make higher and updated phnx.css, preferences-assistant.js, main-assistant.js, profile-assistant.js, status-assistant.js, app-globals.js to allow for full width thumbnails in timelines
MOdified tweet.js to remove via via via bug on search refreshes as well as preventing double html unescaping of source
Modified String.js to obey linebreaks
Modified phnx.css so that search timelines obey fullThumbWidth preference
Modified config.js with new keys for bit.ly
Modified both tweet.js to accomodate vine videos. Thumbs don't show up in timeline until refresh - need to fix
