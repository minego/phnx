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
Modified tweet.js, main-assistant.js, profile-assistant.js, status-assistant.js, convo.js, search.js, status-list.js to support vine videos.
Modified main-assistant.js, tweet.js, item-one-column.html, item.html, search.html, phnx.css, to show conversation icon on tweets in timeline if part of a convo.
Commented out some lines in tweet.js as twitpic no longer gives us access to the full image so can't preview it.
Modified tweet.js to give option to send tweet and links to facebook.
Updated tweet.js to support free and pro versions of ReadOnTouch and added tweet id to send to Read It Later
Modified main-assistant.js, preferences-assistant.js, profile-assistant.js, status-assistant.js, convo.js, search.js, status-list.js, tweet.js and local.js to obey new preference setting to process vine links
Modified tweet.js to setup support for @zhephree's neato! and foursquare apps.  Not enabled until neato! V2.0 supports cross-app launching and foursquare not enabled as its not resolving the links as expected.
Modified local.js to allow for custom tab order to work on fresh clean install
Modified phnx.css, preferences-assistant.js, local.js, app-globals.js, status-assistant.js, profile-assistant.js, main-assistant.js to add option to restore phnx style shim fades in bg for phones (TP remains normal)
Modified compose.js so emoji position was correct on webos 1.4.5
Modified profile-assistant.js so mentions work again
Modified profile-assistant.js to hide retweets in mentions
Modified tweet.js to allow playing of "justsayin" mp3's
Modified tweet.js to allow playing of "audioboo" mp3's 
Modified compose.js to allow for splitting of .@mention tweets without failing with >140chars
Modified app-assistant.js, appinfo.json, compose.js for prelim improvement of JustType launching. Not really working properly yet.
Updated main-assistant.js so that panels on touchpad that are from other accounts show account name next to panel id.
Modified app-assistant.js and appinfo.json to allow for tweeting and user searching from JustType.  Working properly now.
Modified app-assistant.js and status-assistant.js to give cross-app launching of "search".
Modified profile-assistant.js to better handle display of retweets in history, mentions (still hides but processes list better), and favourites
Modified main-assistant.js, status-assistant.js and tweet.js to fix searching of tags from tweets
Modified compose.js to handle tweets that contain huge single words that when spanned (so with mentions, part x of x, etc), will create tweets larger than one 140. No longer locks up luna.
Modified compose.js to ignore all special characters when attempting to shorten an html link (like '?').
Modified tweet.js to update retweet counter. Doesn't refresh toaster but will be updated if you re-open it.
Modified tweet.js, local.js, preferences-assistant.js, app-assistant.js and appinfo.json to allow passing of 4sq.com links through the foursquare app.  However, to use this function it requires V2.8.5 of foursquare.  I have made a pull request, but in the meantime, you could get from my github repo (davec555).
Modified user-item.html and phnx.css to show real name as well as twitter handle when showing list of followers/following.
Modifed twitter.js to return followers/friends in order.
Modified tweet.js to only add max 500 retweets to displayed list.
Modified twitter.js to only add max 500 followers/following to displayed list.
Modified compose.js to fix multi-tweet spanning with mentions and 'to' mentions.  Accidently had removed a little loop that did this previously.  Whoops.
Modified String.js and compose.js so that tweets with '“@username' are parsed and linked correctly.
Modified preferences-assistant.js, local.js, tweet.js, user.html, search.html, item.html, item-one-column.html, convo.html, convo-item.html and tweet-item.html to display absolute or relative timestamps.  Details view remains as was.
Modified main-assistant.js, profile-assistant.js, status-assistant.js, convo.js, search.js, status-list.js and tweet.js to fix preference reading for absTimeStamp val.
Modified app-globals.js and phnx.css for absTimeStamp use.
Updated profile.html and content.html to show Profile avatar using V1.1 API.
Updated convo-item.html to show emoji signifier if relevant.
Updated tweet.js to add Instagram video support.
Updated main-assistant.js slight cleanup.
Updated emoji.js so flags show in emoji dialog.
Updated compose.js so that cursor shows and its position is updated when inserting emoji.
Modified main-assistant.js so that holding on a nav icon in the tabs bar will scroll the current list to the New Items separator. Tap still scrolls to top or bottom of list.
Modified preferences-assistant.js, profile-assistant.js & local.js to give Pref option to specify number of items returned for timeline/mentions/favourites in Profile view.
Modified app-assistant.js, main-assistant.js, preferences-assistant.js, status-assistant.js, tweet.js, twitter.js and local.js to give Pref options to specifiy number of items returned for lists, searches and retweets.
Modified main-assistant.js and phnx.css to support gaps.
Modified profile.html, content.html, twitter.js and profile-assistant.js so that url's in the profile view of the user show as expanded links (not twitter t.co links)
Created hires icons/buttons/images for Pre3
Modified main-assistant.js so auto-complete list is populated when Refresh & Flush at launch is enabled.
Created hi-res load-fade.png for Pre3 to remove faint horizontal line
Modified tweet.js and main-assistant.js to allow for higher res avatars on Pre3.
Modified tweet.js (both of them), details.html and phnx.css to show number of favourites a tweet has received and also expanded the width of the retweet button so its less likely to wrap to the next line.
Modified compose.js so that tweets spanning multiple tweets set the reply_id flag to the earlier portion of the split tweet, so conversations will show all parts of the multi-part tweets instead of just the one selected.
Modified main-assistant.js and profile-assistant.js so that tweet taps from lists will refresh the fav and retweet counts and update details toaster so counts are accurate.
Modified tweet.js so that fav/unfav'ing refreshes the displayed details toaster.
Modified main-assistant.js, preferences-assistant.js and local.js to allow for pull-to-refres refresh&flush option.
Modified main-assistant.js, preferences-assistant.js and app-assistant.js to add extra menu for LoadCounts.
Modified phnx.css and convo-item.html so that conversation view shows only small thumbnails as fullwidth thumbs were disappearing due to auto height which resulted in height of 0.  If I can work around this bug I'll return to full width.
Modified preferences-assistant.js, local.js, tweet.js and toggle.html to allow for option to Mobilize web links for the stockBrowser for easier reading on phones.
Modified main-assistant.js so that owning user of panel is used for updating fav/retweets when tapping a tweet.
Updated tweet.js and main-assistant.js to clean up refreshing of retweets/favs and to re-instate showing retweeters when clicking the retweet count button.
Modified main-assistant.js to show 'Release to refresh & flush' when pull to refresh has hit the required count.
Updated profile-assistant.js so that hi-res avatar is used on a Pre3 for profile pic
Fixed comments in css files to be /* */ pairs instead of //
Updated finishAuth-scene.html to hopefully show avatars of those involved in the project.  Had been api V1 calls.
Modified finishAuth-assistant.js so that contributors are followed if tapped.
Modified phnx.css to fix TP profile details toaster issues (didnt always clear bottom of screen when hiding and tweet didnt fit full width)
Modified phnx.css to fix TP profile convo list to display full width
Modified both tweet.js to handle changed links to vines
Modified main-assistant.js to respect max load count of list timeline if its a panel
Modified main-assistant.js to allow for listStatuses to be on panels > 6 on phones (previously would never refresh due to bug with beacons). Also allows marker to work again.
Modified main-assistant.js and tweet.js so fav's redraw timeline lists without requiring a twitter refresh.
Modified main-assistant.js so that the tweet after a filtered tweet is processed properly.
Modified phnx.css, preferences-assistant.js, profile-assistant.js, tweet.js, status-list.js, search.js, convo.js, status-assistant.js, main-assistant.js, item.html and item-one-column.html to support mutedUsers.
Modified local.js, main-assistant.js, sources.json. Added mutedusers.js, mutedusers.html and muteduser-item.html.  Added menu option under Prefs to show toaster with currently muted users.  Allows for swipe to unmute.
Modified muteduser-item.html to include the '@' symbol.
Modified main-assistant.js to count number of muted tweets.
Uncommented out twitpic stuff in tweet.js as large previews are available again.
Modified tweet.js to check for existing thumbnail in slot 1 when passing tweet entities.
Modified muteduser.js, mutedusers.html, muteduser-item.html, profile-assistant.js, tweet.js, main-assistant.js, twitter.js and phnx.css to save id's of muted users and to allow mini-profile to show in mutedusers toaster.
Modified both tweet.js, pictureView-assistant.js, pictureView-scene.html, phnx.css, profile-assistant.js to allow for saving of images from preview scene.
Modified preferences-scene.html, section.html, ash.css, phnx.css and rebirth.css to force preferences section header to be fixed and non-transparent.
Modified profile-assistant.js and mutedusers.js to only save "id" in the db.  "user" was not needed.
Modified preferences-assistant.js, main-assistant.js, profile-assistant.js, status-assistant.js, app-globals.js and local.js to give option to hide count of muted new tweets.
Modified section.html, ash.css, rebirth.css and phnx.css to force solid section header only in preferences.
Discovered that modifications to finishAuth-scene.html don't necessarily show up til a luna restart!  Makes it hard to debug.  Don't know why its kept in memory.
Modified phnx.css and finishAuth-scene.html to fix issues introduced with the Prefs section-header change.
Modified tweet.js to account for change in Vine code.
Modified main-assistant.js to check properly for newMutedTweets on launch.
Modified profile-assistant.js to allow for Fav hearts to showup.
Modified phnx.css and user-list.js to fix toaster issues (didnt always clear bottom of screen when hiding from a full user list)
Modified tweet.js (TweetToaster) to set this.id.  Previously only this.toastId was set, but for the toaster to be able to be completely removed, it needed this.id.  could have caused big memory bloat if user opened heaps of details toasters.
Modified user-list.js, phnx.css, toaster.js to improve toaster popup and popdown. Now moves the proper number of pixels based on the toaster height, as well as varying the transition duration.
Modified profile-assistant.js to work properly in mentions if first entry is a RT.
Modified phnx.css by adding padding-top to .convo-list to help alleviate problem with first entry not being able to be selected. Still unsure what is preventing it. I know its the width of a panel though, as on the TP you can selected it if you move to the right one panel width and then select the item.
Modified both tweet.js files and preferences-assistant.js to allow for processing of Vine tweets only on tweet tap (not in timelines).
Modified main-assistant.js, profile-assistant.js, twitter.js, content.html and added nouserretweets.js to allow for option to hide/show specific user's retweets
Modified tweet.js to help with youtu.be shortened links
Modified preferences-assistant.js, tweet.js, local.js and added misc folder with readme and a patch file to allow use of webOS2.1.2 version of the youtube app to be used on webOS2.2.4 devices.  Advanced Settings has option to select app (if running webOS2.2.2)
Modified main-assistant.js, preferences-assistant.js, twitter.js and local.js to allow for selection of Trending Topics region. Adjust in General Settings.
Modified status-assistant.js to not show retweets on searches
Modified phnx.css, user-item.html and muteduser-item.html to show verified status next to user names in user lists (followers, following, muted-users)
Modified preferences-assistant.js to added Honduras to trending locations (but doesn't work so commented out)
Modified tweet.js, main-assistant.js, preferences-assistant.js, profile-assistant.js, status-assistant.js, convo.js, search.js, status-list.js, local.js, item-one-column.html, search.html and item.html to hide gif's in timeline but still show in details (to help with animated gifs slowing everything down)
Modified profile-assistant.js to jump to top/bottom of panel when nav buttons are tapped in profile view
Modified main-assistant.js to add prelim code for js garbage collect on refresh and flush.  Can't get it working yet.
Modified preferences-assistant.js, local.js and main-assistant.js to add scroll to bottom on Load More tap.
Modified phnx.css and main-scene.html to show highlight on refresh button when tapped.
Changed emoji graphics over to freely distributable EmojiOne graphics and updated about-scene.html to attribute them. Only old graphics are: 1F508, 1F68B, 27BF & E50A.  Will replace when they become available.
Updated emoji to now include 1F508, 1F68B and 27BF.  E50A is still old and may be removed in the future as the emojione team believes its not part of the unicode spec and apple dropped it in ios5
Modified both tweet.js files to allow for twitter.com links referencing other tweets to display in its own toaster instead of loading the webpage.
Modified both tweet.js files to allow for twitter.com links referencing other twitter users to show the profile panel instead of loading the webpage.
Modified main-assistant.js to stop search text field from automatically jumping to the end.
Modified tweet.js to fix newer style vine links in parsed vine webpage.
Modified tweet.js to allow /videos_h264high/ field in vine links.
Modified both tweet.js files to allow for twitter videos (hires only) to play when clicking on the thumbnail in details.
Modified main-assistant.js to add more entries to the trending list and to allow display of long DMs.
Modified tweet.js to mobilize links using Google rather than expired Instapaper Mobilizer.
Modified both tweet.js files to support additional links to instagram.
Modified phnx.css to highlight 'Load More Tweets' on tap.
Modified emoji.js and emoji-dialog-assistant.js and added new V2.0 emojione pngs.
Modified phnx.css to scale emoji in details toaster a little larger.
Modified compose.js and phnx.css to have preview of tweet including emoji
Modified tweet.js, preferences-assistant.js and app-globals.js to allow use of LuneTube on phones (non-TP devices)
Modifified compose.js and compose.html to show sending account in card view
Modified item-info.html and phnx.css to show emoji in dashboard notifications
Modified compose.js to fix replying to your own DM.  Would DM yourself instead of the previous recipient.
Modified preferences-assistant.js and tweet.js to separate browser and lunetube launching. LuneTube is now directly called.
Modified emoji-dialog-assistant.js and compose.js to allow adding multiple emoji at once.
Modified preferences-assistant.js, tweet.js and app-globals.js to allow for use of MetaView's OfflineBrowswer
Modified tweet.js so the OfflineBrowser doesn't check Mobilize option - always uses full web page link
Modified tweet.js, twitter.js, mutedusers.js, profile-assistant.js and main-assistant.js to allow friends, followers and mutedusers to work properly with id's larger than 53 bits (javascript limitation)
Modified main-assistant.js to update id's found in mutedUsers db to id_str on launch.
Modified main-assistant.js to allow for account loading by tap-holding header bar.
Modified emoji.js to fix display of heavy black heart emoji variant.
Modified emoji.js to add new emoji added in latest Unicode standard and emojione.
Updated cnvtSBEmojiCodeToUnicode.pl to v2
Modified emoji.js, emoji-dialog-asisstant.js and main-assistant.js to only show default emoji and added support to tap-hold on emoji to show alt skin types.