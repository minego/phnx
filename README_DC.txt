--- Please note: I have NEVER coded ANYTHING in javescript, css OR HTML.  I've just worked my way around the code and learned from that.
---  Thanks must go to all who have gone before me - the code is extremely well laid out and has helped me to learn.
---  Sorry if I've screwed things up as I'm new to this.

Modified tweet.js to allow deleting of other people's direct messages (line 62)
Modified appinfo.json to keep version number 1.27 but change id to com.lestersoftware.phnx to avoid normal update conflicts
Modified changelog.js for version number and description
Modified preferences-assistant.js, local.js and tweet.js to give option for received DMs ('delReceivedDM')
Modified preferences-assistant.js and local.js to give option to shield DMs (notificationShieldMessages)
Modified dashboard-assistant.js to perform the DM shielding
Modified local.js, preferences-assistant.js, phnx.css, main-assistant.js, app-globals.js, profile-assistant.js, timeline.js, status-list.js for hideAvatar
Added item-no-avatar.html for hideAvatar
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