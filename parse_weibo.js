//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================

//UGH. Can't seem to get normal XHRs or jQuery's .load to give me the same document object
//of a Weibo account page that window.document would contain on a normal pageload. I suspect
//it's something about, like... even though the scripts (where all of the content is) are 
//loaded and "run", they are actually just functions that are meant to be run when some UI-related
//thing happens, and it doesn't happen in the behind the scenes stuff I'm doing. I have tried 
//every possible way of getting usable DOM stuff and nothing seems to work... BUT. The HTML definitely
//has the posts. Furthermore, it has the posts in the same HTML structure that we want to be able to parse,
//just, as a string inside a script. So, just find that specific script, extract the HTML string, 
//remove all of the escaping, and voila, we have some HTML that can go into a DOMParser. Then
//that DOM can be fed into the normal getAllPostCardwraps(). Hooray, not actually that messy!
//RETURNS: an object with int .weiboID, string .weiboNick, Element[] .cardwraps
function cardwrapsUIDNicknameFromScriptHTML(docHTML)
{
	let returnObject = {};
	
	//(might be nice to change this to regex:) \"domid\"\\s*:\s*\"Pl_Official_MyProfileFeed
	//start from "domid":"Pl_Official_MyProfileFeed
	//and then skip to character right after "html":"    (i.e. the one right after that last ")
	let domidOfficialMyProfileFeedIndex = docHTML.indexOf("\"domid\":\"Pl_Official_MyProfileFeed");
	if(domidOfficialMyProfileFeedIndex < 0)
		return {cardwraps: [], weiboID: WEIBO_NONEXISTANT_ID, weiboNick: ""};
	let ourHTMLString = docHTML.substring(domidOfficialMyProfileFeedIndex);
	let htmlStringStarterConst = "\"html\":\"";
	let htmlStringStarterIndex = ourHTMLString.indexOf(htmlStringStarterConst);
	if(htmlStringStarterIndex < 0)
		return {cardwraps: [], weiboID: WEIBO_NONEXISTANT_ID, weiboNick: ""};
	
	ourHTMLString = ourHTMLString.substring(htmlStringStarterIndex + htmlStringStarterConst.length,
	//chop off starting from "})</script>     ...thank you escapes!!!! 
											//anything within html: "" would look like <\/script> :D
											ourHTMLString.indexOf("\"})</script>"));


	//TOODO LONGTERM this is all relying on things looking a certain way...
	//..... LONGTERM so, i guess just keep monitoring and be ready to change when weibo does?


	//now, de-escape:
	//   \\ goes to \
	//   \" goes to "
	//    \n, \r, \t go to nothing
	ourHTMLString = ourHTMLString
					.replace(/\\\\/g, "\\")
					.replace(/\\\//g, "/")
					.replace(/\\\"/g, '"')
					.replace(/\\n/g, "")
					.replace(/\\r/g, "")
					.replace(/\\t/g, "");
	//console.log("STRIPPED: \n\n"+ourHTMLString);
					
	let aDOMParser = new DOMParser();
	returnObject.cardwraps = getAllPostCardwraps(aDOMParser.parseFromString(ourHTMLString, "text/html"));
	returnObject.weiboID = WEIBO_NONEXISTANT_ID;
	returnObject.weiboNick = "";
	
	//to get uid: 
	//node-type=\"focusLink\" action-data=\"uid=
	//[take everyhting after the = and up to next &]
	let UIDMarker = "node-type=\\\"focusLink\\\" action-data=\\\"uid=";
	let UIDstartIndex = docHTML.indexOf(UIDMarker);
	if(UIDstartIndex < 0)
		return returnObject;
	
	UIDstartIndex += UIDMarker.length;
	let UIDendIndex = UIDstartIndex;
	while(docHTML.charAt(UIDendIndex) >= '0' && docHTML.charAt(UIDendIndex) <= '9')
		UIDendIndex++;
	returnObject.weiboID = parseInt(docHTML.substring(UIDstartIndex, UIDendIndex), 10);
	
	//to get nickname:
	//<h1 class=\"username\">Nickyname<\/h1>
	//this is the only element with a class of "username"
	let nickMarker = "<h1 class=\\\"username\\\">";
	let nickStartIndex = docHTML.indexOf(nickMarker);
	if(nickStartIndex < 0)
		return returnObject;
	
	nickStartIndex += nickMarker.length;
	returnObject.weiboNick = docHTML.substring(nickStartIndex, docHTML.indexOf("<\\/h1>", nickStartIndex));
	
	return returnObject;
}

//documentObjOrRootElement is optional; defaults to the 'document' global.
//As the name suggests, this can either be a Document object (such as the default 'document' global),
//OR just an Element, presumably with lots of various children including some cardwraps.
function getAllPostCardwraps(documentObjOrRootElement)
{
	if(typeof documentObjOrRootElement === "undefined")
		documentObjOrRootElement = document;
	
	let thePostCandidates = documentObjOrRootElement.getElementsByClassName("WB_cardwrap");
	let thePosts = [];

	for(let pcInd = 0; pcInd < thePostCandidates.length; pcInd++)
	{
		let nowFindTime = thePostCandidates[pcInd].getElementsByTagName("a");
		let aInd;

		//HACK: just taking the first date found causes the reblog's date to be taken. soooo just take the last date found.
		let theDateEle = getLastElementByTagAttribute(thePostCandidates[pcInd], "a", ["node-type"], ["feed_list_item_date"]);

		if(theDateEle !== null) //real post cardwraps have a date, so no date = we don't care
			thePosts.push(thePostCandidates[pcInd]);
	}
	return thePosts;
}

function getUIDAndNickFromCardwrap(theCW)
{
	//<li><a action-type="feed_list_shield_by_user" href="javascript:void(0)" suda-data="key=smart_feed&value=block_sbsfeed" action-data="filter_type=1&uid=SOMEUID&nickname=SOMENICKNAME&gender=f" title="Blocked Weibo of SOMENICKNAME ">Blocked Weibo of SOMENICKNAME </a></li>
	//OR
	//<li><a action-type="feed_list_unfollow_by_user" href="javascript:void(0)" suda-data="key=feed_weibo_list&value=delete_addaten" action-data="uid=SOMEUID&nickname=SOMENICKNAME" title="取消关注SOMENICKNAME">取消关注SOMENICKNAME</a></li>
	let blockThemLink = getFirstElementByTagAttribute(theCW, "a", ["action-type"], ["feed_list_shield_by_user"]);
	if(blockThemLink === null) //both work equally well, so, just to be a little more robust, use either
		blockThemLink = getFirstElementByTagAttribute(theCW, "a", ["action-type"], ["feed_list_unfollow_by_user"]);
	if(blockThemLink === null)
		return null;
		
	let rawUIDNickString = blockThemLink.getAttribute("action-data");
	let uidIndex = rawUIDNickString.indexOf("uid=");
	if(uidIndex < 0)
		return null;
	let uidIndexEnd = rawUIDNickString.indexOf("&", uidIndex);
	if(uidIndexEnd < 0)
		uidIndexEnd = rawUIDNickString.length;
	let uidString = rawUIDNickString.substring(uidIndex+4, uidIndexEnd);
	
	let theRetThing = {};
	theRetThing.accountID = parseInt(uidString, 10);
	
	let nicknameIndex = rawUIDNickString.indexOf("nickname=");
	if(nicknameIndex < 0)
		return null;
	let nicknameIndexEnd = rawUIDNickString.indexOf("&", nicknameIndex);
	if(nicknameIndexEnd < 0)
		nicknameIndexEnd = rawUIDNickString.length;
	theRetThing.accountName = rawUIDNickString.substring(nicknameIndex+9, nicknameIndexEnd);
	
	return theRetThing;
}

//reblogCandidate should be a DOM div object of class "WB_expand" with "node-type" = "feed_list_forwardContent"
//wholePostDOM should be the DOM object of the overall post
//returns an object that you can assign to a somePost.reblog field, OR undefined
function parseReblog(reblogCandidate, wholePostDOM)
{
	//if we can't see who posted it, it's a deleted-by-author reblog; skip.
	let rebPosterInfo = reblogCandidate.getElementsByClassName("WB_info");
	if(typeof rebPosterInfo === "undefined" || rebPosterInfo.length === 0)
		return; //undefined
	
	let theNewReblog = {};

	//first extract who posted the reblogged post...
	let feedListOriginNick = getFirstElementByTagAttribute(rebPosterInfo[0], "a", ["node-type"], ["feed_list_originNick"]);
	if(feedListOriginNick !== null)
	{
		theNewReblog.authorName = feedListOriginNick.getAttribute("nick-name");
		let tempIDStr = feedListOriginNick.getAttribute("usercard");
		theNewReblog.authorID = parseInt(tempIDStr.substr(tempIDStr.indexOf("=")+1), 10);
	}

	//...then extract its date...
	let feedListItemDate = getFirstElementByTagAttribute(wholePostDOM, "a", ["node-type"], ["feed_list_item_date"]);
	if(feedListItemDate !== null)
		theNewReblog.datePosted = timeFromAltText(feedListItemDate.getAttribute("title"));


	//...and finally, extract the reblogged post's text
	let feedListReason = getFirstElementByClassAttribute(wholePostDOM, "WB_text", ["node-type"], ["feed_list_reason"]);
	if(feedListReason !== null)
		theNewReblog.text = stripWhitespaceFromPost(feedListReason.textContent);
	
	return theNewReblog;
}


//parses the user's homepage, e.g. http://weibo.com/u/123456789/home, and returns an array of the posts found on the page (without doing the fancy scrolling)
//returns an object with .oldestPost (msse), and .postsPresent (an array of UNsigned posts)
function parseWeiboHomepage()
{
	//parse the page: get all of the posts as far back as we can see (back to the dynamic forever-load thing at the bottom).
	let thePosts = [];
	
	let theRetThing = {};
	theRetThing.oldestPost = MSSE_DATE_MAX;

	let allPostCardwraps = getAllPostCardwraps();
	for(let cwInd = 0; cwInd < allPostCardwraps.length; cwInd++)
	{
		let theNewPost = {};
		theNewPost.datePosted = timeFromAltText( //NOTE: there is guaranteed to be a time element; getAllPostCardwraps() only returns real posts
								getLastElementByTagAttribute(allPostCardwraps[cwInd], "a", ["node-type"], ["feed_list_item_date"]).getAttribute("title"));

		theNewPost.dateDeleted = MSSE_DATE_MAX; //"never"
		
		//NOTE / sort of HACK: it's expected that as we go down the page, the posts get older.
		//however, there can be a pinned/hot post at the top, which will be older than everything else...
		//and we DON'T want to include that in our calculation of oldest post present. so, it turns out
		//the right approach (assuming we really do have them ordered top to bottom, and they really do
		//get older and older) is to just take the bottom post's post date!!! i.e., comment this if().
		//if(theNewPost.datePosted < theRetThing.oldestPost)
			theRetThing.oldestPost = theNewPost.datePosted;
		
		theNewPost.htmlObj = allPostCardwraps[cwInd];
		
		let getUIDNickRet = getUIDAndNickFromCardwrap(theNewPost.htmlObj);
		//we need the poster's UID and nickname to continue... give up on this post if we can't get them.
		if(getUIDNickRet === null)
			continue;
		theNewPost.authorID = getUIDNickRet.accountID;
		theNewPost.authorName = getUIDNickRet.accountName;

		//NOTDO need some machinery for saving just the reblog, or else a reblogged x10000 post 
		//NOTDO that gets deleted can cause 10000 deleted posts to get stored.
		//NOTDO ON THE OTHER HAND. the reblogger might have some actual interesting text they add; it's not
		//NOTDO like it's just a repost and nothing more. in that case, having the reblogged post replicated
		//NOTDO everywhere is actually only ~2x overhead... so, maybe just don't care about this.
		
		//if this post is a reblog, get the reblogged post
		let reblogCandidate = getFirstElementByClassAttribute(theNewPost.htmlObj, "WB_expand", ["node-type"], ["feed_list_forwardContent"]);
		if(reblogCandidate !== null)
			theNewPost.reblog = parseReblog(reblogCandidate, theNewPost.htmlObj);
		if(typeof theNewPost.reblog !== "undefined")
			theNewPost.isReblog = true;
		else
			theNewPost.isReblog = false;

		//extract the post's text
		theNewPost.text = extractPostText(getFirstElementByClassAttribute(
								theNewPost.htmlObj, "WB_text", ["node-type"], ["feed_list_content"]));
		thePosts.push(theNewPost);
	}
	
	theRetThing.postsPresent = thePosts;
	return theRetThing;
}


//parses a weibo account page, e.g. weibo.com/dealmoon, and returns (without doing the fancy infinite scrolling): 
//{oldestPost (msse), accountName, accountID, postsPresent (array of post structs)}
//documentObject is optional; defaults to the 'document' global
function parseCurPageWeiboAccount(documentObject)
{
	if(typeof documentObject === "undefined")
		documentObject = document;
	
	let allPostCardwraps = getAllPostCardwraps(documentObject);
	//console.log("DEBUG how many cardwraps? "+allPostCardwraps.length);
	
	//NOTE I was worried that this btn_bed focusLink might only appear when you aren't logged in... but it is there when logged in also, hooray!
	//<div class=\"btn_bed W_fl\" node-type=\"focusLink\" action-data=\"uid=5648997355&fnick=OOPSWASCHINESEBUTIMESSEDITUP25&f=1\">
	let theRawUIDString = getFirstElementByClassAttribute(documentObject, "btn_bed", ["node-type"], ["focusLink"]).getAttribute("action-data");
	let halfUIDStr = theRawUIDString.substr(theRawUIDString.indexOf("uid=")+4);
	let parsedAccountID = parseInt(halfUIDStr.substr(0, halfUIDStr.indexOf("&")), 10);
	
	//class=\"username\">OOPSWASCHINESEBUTIMESSEDITUP25<\/span>
	let parsedAccountName = getFirstElementByClassAttribute(documentObject, "username", [], []).textContent;

	return parseCurPageWeiboAccount_haveCardwrapsNickUID(allPostCardwraps, parsedAccountName, parsedAccountID);
}






function parseCurPageWeiboAccount_haveCardwrapsNickUID(theCardwraps, pageNickname, pageUID)
{
	//parse the page: get all of the posts as far back as we can see (back to the dynamic forever-load thing at the bottom).
	let thePosts = [];
	
	let theRetThing = {};
	theRetThing.accountName = pageNickname;
	theRetThing.accountID = pageUID;
	theRetThing.oldestPost = MSSE_DATE_MAX;
	
	for(let cwInd = 0; cwInd < theCardwraps.length; cwInd++)
	{
		let theNewPost = {};
		theNewPost.datePosted = timeFromAltText( //NOTE: there is guaranteed to be a time element; getAllPostCardwraps() only returns real posts
								getLastElementByTagAttribute(theCardwraps[cwInd], "a", ["node-type"], ["feed_list_item_date"]).getAttribute("title"));

		theNewPost.dateDeleted = MSSE_DATE_MAX; //"never"
		
		//NOTE / sort of HACK: it's expected that as we go down the page, the posts get older. However, there can be a pinned/hot 
		//post at the top, which will be older than everything else... and we DON'T want to include that in our calculation of 
		//oldest post present. so, it turns out /the right approach (assuming we really do have them ordered top to bottom, and 
		//they really do get older and older) is to just take the bottom post's post date!!! i.e., comment this if().
		//if(theNewPost.datePosted < theRetThing.oldestPost)
			theRetThing.oldestPost = theNewPost.datePosted;
		
		theNewPost.htmlObj = theCardwraps[cwInd];
		theNewPost.authorID = theRetThing.accountID;
		theNewPost.authorName = theRetThing.accountName;

		//if this post is a reblog, get the reblogged post
		let reblogCandidate = getFirstElementByClassAttribute(theNewPost.htmlObj, "WB_expand", ["node-type"], ["feed_list_forwardContent"]);
		if(reblogCandidate !== null)
			theNewPost.reblog = parseReblog(reblogCandidate, theNewPost.htmlObj);
		if(typeof theNewPost.reblog !== "undefined")
			theNewPost.isReblog = true;
		else
			theNewPost.isReblog = false;
		
		//extract the post's text
		theNewPost.text = extractPostText(getFirstElementByClassAttribute(
								theNewPost.htmlObj, "WB_text", ["node-type"], ["feed_list_content"]));
		thePosts.push(theNewPost);
	}

	theRetThing.postsPresent = thePosts;
	return theRetThing;
}

function extractPostText(feedListContentDOM)
{
	if(feedListContentDOM === null)
		return "";

	//feedListContent is a bit more than the body of the post: it's everything
	//that might be in the post box, including the "pin" or "hot" tag. If we
	//just ask for feedListContent.textContent, it would include the word "pin"
	//if it was a pinned post. So: take the textContent of each of feedListContent's
	//children, EXCEPT the first non-whitespace-only one if it is not a text node.
	let extractedText = "";
	let stillOnFirst = true;
	for(let flInd=0; flInd<feedListContentDOM.childNodes.length; flInd++)
	{
		let curTextContent = stripWhitespaceFromPost(feedListContentDOM.childNodes[flInd].textContent);
		if(stillOnFirst && feedListContentDOM.childNodes[flInd].nodeName !== "#text")
			stillOnFirst = false;
		else if(!stillOnFirst || curTextContent !== "")
		{
			extractedText += curTextContent;
			stillOnFirst = false;
		}
	}
	return stripWhitespaceFromPost(extractedText);
}

//NOT set union, just overwrite: or else they can never unfollow.
function addFollowedUIDsToStorage(UIDsToAdd)
{
	if(typeof UIDsToAdd === "undefined" || typeof UIDsToAdd.length === "undefined")// || UIDsToAdd.length === 0)
		return;
	
	//chrome.storage.local.get("ghostpostmyfolloweduids", function(result)
	//{
	//	let existingUIDs = emptyArrayOr(result["ghostpostmyfolloweduids"]);
	//	let finalObj = {};
	//	finalObj["ghostpostmyfolloweduids"] = setUnion(UIDsToAdd, existingUIDs, function(a,b){return a-b;});
	//	chrome.storage.local.set(finalObj);
	//});
	let finalObj = {};
	finalObj["ghostpostmyfolloweduids"] = UIDsToAdd;
	chrome.storage.local.set(finalObj);
}

//Makes an XMLHTTPR for the "my followed accounts" page, and parses that page to extract 
//the UIDs of the users that this user follows. Adds all found UIDs to storage's list of followed.
function getAndParseFollowed(theXHRURL, doneCallback, alreadyFoundUIDs)
{
	if(typeof alreadyFoundUIDs === "undefined")
		alreadyFoundUIDs = [];
	if(typeof doneCallback === "undefined")
		doneCallback = function(dummydums){return;};
	
	let xhrFollow = new XMLHttpRequest();
	xhrFollow.onload = function()
	{
		//Extract UIDs from each of the <li>s on the page
		//<li class="member_li S_bg1" node-type="user_item" action-type="user_item" action-data="uid=1656831930&profile_image_url=http://tp3.sinaimg.cn/1656831930/50/5685345368/0&gid=0&gname=OOPSWASCHINESEBUTIMESSEDITUP&screen_name=OOPSWASCHINESEBUTIMESSEDITUP&sex=f">		
		//while there is a next "member_li S_bg1"
			//get a length 200 substr starting from that "member_li S_bg1"
			//if the substr doesn't have "user_item", "action-data", and "uid="
				//continue 
			//skip forward to action-data=
			//skip forward to uid=
			//set curUID := [after the = until the next &]
			//stringToParse = after the &
		let foundUIDs = [];
		let curCharInd = this.responseText.indexOf("member_li S_bg1");
		while(curCharInd >= 0)
		{
			let curStringChunk = this.responseText.substring(curCharInd, curCharInd+200);
			curCharInd++; //(advance position so the next responseText.indexOf() doesn't land on the same substr we were just on!)
				
			if(curStringChunk.indexOf("user_item") < 0 || curStringChunk.indexOf("action-data") < 0 || curStringChunk.indexOf("uid=") < 0)
				continue;
			
			curStringChunk = curStringChunk.substring(curStringChunk.indexOf("action-data"));
			curStringChunk = curStringChunk.substring(curStringChunk.indexOf("uid=")+4, curStringChunk.indexOf("&"));
			foundUIDs.push(parseInt(curStringChunk, 10));
			
			curCharInd = this.responseText.indexOf("member_li S_bg1", curCharInd);
		}
		
		alreadyFoundUIDs.push.apply(alreadyFoundUIDs, foundUIDs);
		
		
		//get next page, and do the processing there too
		//when there is a next page:
		//<a bpfilter=\"page\" class=\"page next S_txt1 S_line1\" href=\"\/p\/1005055123456789\/myfollow?t=1&pids=Pl_Official_RelationMyfollow__108&cfs=&Pl_Official_RelationMyfollow__108_page=2#Pl_Official_RelationMyfollow__108\"><span>Next<\/span><\/a>
		//when there is no next page:
		//<a class=\"page next S_txt1 S_line1 page_dis\"><span>Next<\/span><\/a>
		let nextLinkStart = this.responseText.indexOf("page next S_txt1 S_line1");
		if(nextLinkStart < 0)
		{
			//nothing that looks like the link was found... should not happen. in this case, just store whatever UIDs we've found so far and give up.
			addFollowedUIDsToStorage(alreadyFoundUIDs);
			doneCallback(alreadyFoundUIDs);
			return;
		}
		
		//get something that looks like "page next S_txt1 S_line1\" href=\"\/p\/1005055123456789\/myfollow?t=1&pids=Pl_Official_Rela...
		//						OR like "page next S_txt1 S_line1 page_dis\"><span>Next<\/span><\/a>
		let nextPageLink = this.responseText.substring(nextLinkStart, nextLinkStart+1000);
		//...and de-backslash-escape it.
		nextPageLink = nextPageLink.replace(/\\"/g, '"');
		nextPageLink = nextPageLink.replace(/\\\//g, '/');
		nextPageLink = nextPageLink.replace(/\\\\/g, '\\');
		//now we have page next S_txt1 S_line1" href="/p/1005055123456789/myfollow?t=1&pids=Pl_Official_Rela...
		//			OR page next S_txt1 S_line1 page_dis"><span>Next</span></a>
		
		//nextPageLink currently starts inside the class="" thing. skip to after the closing ":
		nextPageLink = nextPageLink.substring(nextPageLink.indexOf('"')+1);
		
		//Get the href attribute's value. This function knows to skip over "stuffstuff\"morestuff\\\"finalstuff\"", and to give up if it finds the real >.
		nextPageLink = findHrefInTag(nextPageLink);
		if(nextPageLink === "")
		{
			//Nothing that looks like the link was found: this is probably the last page.
			//Store whatever UIDs we've found so far and give up.
			addFollowedUIDsToStorage(alreadyFoundUIDs);
			doneCallback(alreadyFoundUIDs);
			return;
		}
		else
		{
			//TOODO HACK... if chrome suspends the event page we're in, this won't get run. 
			//Google says to use alarms instead of setTimeout, but there doesn't seem to 
			//be a convenient way to pass arguments with alarms... 
			//so, let's just keep within what I hope is "safe time" (3s)
			//WORST CASE SCENARIO: do this in a background page, not event page
			setTimeout(getAndParseFollowed, 1*1000 + Math.floor(Math.random() * 2000), nextPageLink, doneCallback, alreadyFoundUIDs);
		}
	};
	
	//we should define onerror so that if we successfully parsed previous pages, but this one fails, 
	//we can still write what we previously found into storage.
	//(THAT WAS FOR THE SET UNION VERSION!)
	//xhrFollow.onerror = function()
	//{
	//	addFollowedUIDsToStorage(alreadyFoundUIDs);
	//};
	
	xhrFollow.open("GET", theXHRURL);
	xhrFollow.responseType = "text";//document";
	xhrFollow.send();
}


//doneCallback(uid, nickname)
function loadOrParseOwnUIDNickname(doneCallback)
{
	chrome.storage.local.get(["ghostpostmyownuid", "ghostpostmyownnick"], function(result){
	if(typeof result["ghostpostmyownuid"] !== "undefined" && result["ghostpostmyownuid"] > 0 &&
											typeof result["ghostpostmyownnick"] !== "undefined")
		doneCallback(result["ghostpostmyownuid"], result["ghostpostmyownnick"]);
	else
	{
		let xhrUID = new XMLHttpRequest();
		xhrUID.onload = function()
		{
			//$CONFIG['uid']='123456789';
			let uidString = extractConfigVal(this.responseText, "uid");
			if(typeof uidString === "undefined")
			{
				doneCallback(WEIBO_NONEXISTANT_ID, "");
				return;
			}
			
			let ownUID = parseInt(uidString, 10);
			if(isNaN(ownUID))
			{
				doneCallback(WEIBO_NONEXISTANT_ID, "");
				return;
			}
			
			let ownNick = extractConfigVal(this.responseText, "nick");
			
			let finalObj = {};
			finalObj["ghostpostmyownuid"] = ownUID;
			finalObj["ghostpostmyownnick"] = ownNick;
			chrome.storage.local.set(finalObj);
			doneCallback(ownUID, ownNick);
		};
		
		xhrUID.open("GET", "http://weibo.com/");
		xhrUID.responseType = "text";//document";
		xhrUID.send();
	}
});}

function reportFollowedToServer(followedList)
{
	if(typeof followedList === "undefined")
		return;
	
	let followedAlreadyReported = [];
	
	chrome.storage.local.get("gpFollowedsLastReportedToServer", function(followedRes){
	
	if(typeof followedRes["gpFollowedsLastReportedToServer"] !== "undefined")
		followedAlreadyReported = followedRes["gpFollowedsLastReportedToServer"];
	
	followedList.sort(function(a,b){return a-b;});
	followedAlreadyReported.sort(function(a,b){return a-b;});
	
	//Don't bother reporting if there is nothing new to report.
	let anyChangeFound = false;
	if(followedList.length === followedAlreadyReported.length)
		for(let flInd = 0; flInd < followedList.length; flInd++)
			if(followedList[flInd] !== followedAlreadyReported[flInd])
				anyChangeFound = true;
	if(!anyChangeFound)
		return;
	
	loadOrParseOwnUIDNickname(function(ourWeiboID, ourNickname){
	
	chrome.storage.local.get("gpOwnGPpassword", function(getResult){
	let ourPassword = "";
	if(typeof getResult["gpOwnGPpassword"] !== "undefined")
		ourPassword = getResult["gpOwnGPpassword"];
	
	let queryParams = "wid="+encodeURIComponent(ourWeiboID)+"&pw="+encodeURIComponent(ourPassword);
	queryParams += "&followed=[";
	for(let flInd = 0; flInd < followedList.length; flInd++)
	{
		if(flInd != 0)
			queryParams += ", ";
		queryParams += followedList[flInd];
	}
	queryParams += "]";
	
	let xhr = new XMLHttpRequest();
	xhr.open("GET", CENTRAL_SERVER_URL+"/myfollowed?"+queryParams, true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function() 
	{
		if (xhr.readyState == 4)
		{
			if(xhr.status === 200)
			{
				let finalObject = {};
				finalObject["gpFollowedsLastReportedToServer"] = followedList;
				chrome.storage.local.set(finalObject);
			}
			else
			{
				//alert("DEBUG GhostPost reportFollowedToServer XML HTTP request error: "+xhr.statusText);
				xhr.abort();
			}
		}
	};
	xhr.timeout = 12000;
	xhr.ontimeout = function () { xhr.abort(); };
	xhr.send();
});});});}

//doneCallback(ourUID, ourNickname, ourFollowed)
function loadOrParseOwnUIDAndFollowedUIDs(doneCallback)
{
	loadOrParseOwnUIDNickname(function(ourUID, ourNickname){
	chrome.storage.local.get("ghostpostmyfolloweduids", function(followedGetRes){
	let ourFollowed = [];
	if(typeof followedGetRes["ghostpostmyfolloweduids"] !== "undefined")
		ourFollowed = followedGetRes["ghostpostmyfolloweduids"];
	if(ourFollowed.length === 0 && ourUID !== WEIBO_NONEXISTANT_ID)
	{
		let theXHRURL = "http://weibo.com/"+(ourUID).toString()+"/follow";
		getAndParseFollowed(theXHRURL, function(parsedUIDs)
		{
			reportFollowedToServer(parsedUIDs);
			//doneCallback(ourUID, ourNickname, setUnion(parsedUIDs, ourFollowed,
			//										function(a,b){return a-b;}));
			doneCallback(ourUID, ourNickname, parsedUIDs);
		});
	}
	//They might occasionally add new followed people, so let's occasionally check.
	//(LONGTERM TOODO: actually listen for the "follow this person" button click or whatever.)
	else if(Math.random() <= 0.04 && ourUID !== WEIBO_NONEXISTANT_ID)
	//else if(confirm("SHALL WE EXAMINE YOUR FOLLOWED PAGE? DEBUG DEBUG PUT BACK TO PROBABILISTIC WHEN DONE."))
	{
		//loadOrParseOwnUIDAndFollowedUIDs() is in the path of every weibo page load. 
		//the probabilistic getAndParseFollowed() we're about to do is really just to 
		//update the storage (recall that getAndParseFollowed() itself does update storage), 
		//so we shouldn't wait on it (UNLESS our list of followed is empty so far, i.e. the
		//if length===0 case above).
		
		let theXHRURL = "http://weibo.com/"+(ourUID.toString())+"/follow";
		getAndParseFollowed(theXHRURL, function(parsedUIDs){reportFollowedToServer(parsedUIDs);});
		doneCallback(ourUID, ourNickname, ourFollowed);
	}
	else
	{
		reportFollowedToServer(ourFollowed);
		doneCallback(ourUID, ourNickname, ourFollowed);
	}
});});}
