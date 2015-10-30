//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================


function chooseUserToVisit(followedUIDs, theCallback)
{
	if(followedUIDs.length === 0)
		return WEIBO_NONEXISTANT_ID;
	else
	{
		//TOODO LONGTERM: uniform random is probably not bad (people get monitored
		//				proportional to their followers), but ideally we would also
		//				take into account post frequency, and even better, deletion
		//				frequency. In implementation terms, though, that would be a
		//				LOT more effort.
		return followedUIDs[Math.floor(Math.random() * followedUIDs.length)];
	}
}

//theCallback(thePageRetStuff), where thePageRetStuff has .postsPresent, .accountID, 
//								.accountName, and .oldestPost
function scrapeAccountPageBehindScenes(weiboIDToScrape, theCallback)
{
	let resultDoc = document.implementation.createHTMLDocument("");
	let resultDocNewHTML = resultDoc.createElement("html");
	//console.log("DEBUG jQuery load(): "+"http://weibo.com/u/"+weiboIDToScrape);
	$(resultDocNewHTML).load("http://weibo.com/u/"+weiboIDToScrape, 
	function(responseText, textStatus, theJQXHR)
	{
		let cwsNickUID = cardwrapsUIDNicknameFromScriptHTML(responseText);
		theCallback(parseCurPageWeiboAccount_haveCardwrapsNickUID(cwsNickUID.cardwraps, cwsNickUID.weiboNick, cwsNickUID.weiboID));
	});
}

function reportAllownonfollowedIfNeeded()
{
	loadOrParseOwnUIDNickname(function(ourWeiboID, ourNickname){
	getGhostPostPassword(function(ourNewPassword){
	
	chrome.storage.local.get(["gpAllowNonFollowedLastReported", "gpAllowNonFollowedToSeeOurDeletionReports"], function(getRes){
		
	if(typeof getRes["gpAllowNonFollowedLastReported"] === "undefined" || typeof getRes["gpAllowNonFollowedToSeeOurDeletionReports"] === "undefined")
	{
		let finalObject = {};
		finalObject["gpAllowNonFollowedLastReported"] = "true";
		finalObject["gpAllowNonFollowedToSeeOurDeletionReports"] = "true";
		chrome.storage.local.set(finalObject);
	}
	else if(getRes["gpAllowNonFollowedLastReported"] !== getRes["gpAllowNonFollowedToSeeOurDeletionReports"])
	{
		let reportedVal = "";
		if(getRes["gpAllowNonFollowedToSeeOurDeletionReports"] === "true")
			reportedVal = "true";
		else
			reportedVal = "false";
		
		let queryParams = "allow="+reportedVal+"&wid="+encodeURIComponent(ourWeiboID)+"&pw="+encodeURIComponent(ourNewPassword);

		let xhr = new XMLHttpRequest();
		xhr.open("GET", CENTRAL_SERVER_URL+"/allownonfollowed?"+queryParams, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function()
		{
			if (xhr.readyState == 4 && xhr.status == 200)
			{
				let finalObject = {};
				finalObject["gpAllowNonFollowedLastReported"] = reportedVal;
				finalObject["gpAllowNonFollowedToSeeOurDeletionReports"] = reportedVal;
				chrome.storage.local.set(finalObject);
			}
		};
		
		xhr.timeout = 12000;
		xhr.ontimeout = function() { xhr.abort(); };
		xhr.send();
	}
});});});}

chrome.alarms.onAlarm.addListener(function( alarm )
{
	if(alarm.name !== "GhostPostCheckWeibo")
		return;
	
	reportAllownonfollowedIfNeeded();
	let randomWait = Math.random() * 8 + 2;
	//alert("DEBUG got an alarm " + alarm.name + "setting GhostPostCheckWeibo for "+randomWait+" minutes.");
	
	chrome.alarms.create("GhostPostCheckWeibo", {delayInMinutes: randomWait});
	
	loadOrParseOwnUIDAndFollowedUIDs(function(ourUID, ourNickname, followedUIDs){
	global_ownWeiboID = ourUID;
	if(ourUID === WEIBO_NONEXISTANT_ID)
		return; //don't alert("need to log into weibo") since this is the background; would be super annoying!
	
	let UIDToQuery = chooseUserToVisit(followedUIDs);
	if(UIDToQuery === WEIBO_NONEXISTANT_ID)
		return;
	
	scrapeAccountPageBehindScenes(UIDToQuery, function(thePageRetStuff){
	let postsPresent = thePageRetStuff.postsPresent;
	let curPageAccountID = thePageRetStuff.accountID;
	let curPageAccountName = thePageRetStuff.accountName;
	
	if(curPageAccountID === WEIBO_NONEXISTANT_ID)
		return;
	
	getAccountPostsBackTo(thePageRetStuff.oldestPost, curPageAccountID, function(storedPosts){
	let postsPresentStripped = stripObjectsToPostFields(postsPresent);
	
	let allDeterminedDeleted = setDifference(storedPosts, postsPresentStripped, comparePosts);
	let localNewDeleted = [];
	let alreadySignedDeleted = [];
	
	//anything missing from the page, remember for later that, regardless of the other 
	//attributes we're about to discuss, it's a deleted post. (with <now> for dateDeleted.)
	let batchDeletedTime = Date.now();
	for(let adInd = 0; adInd < allDeterminedDeleted.length; adInd++)
	{
		if(allDeterminedDeleted[adInd].dateDeleted == MSSE_DATE_MAX)
		{
			allDeterminedDeleted[adInd].dateDeleted = batchDeletedTime;
			if(allDeterminedDeleted[adInd].isReblog)
				allDeterminedDeleted[adInd].reblog.dateDeleted = batchDeletedTime;
		}
		
		//We must ONLY sign posts that were ACTUALLY observed by us. I.e.: if we query 
		//the server and get some deleted posts from others, they go into storage. 
		//Then, the next time we visit the page, they come out of storage, alongside posts
		//we observed+stored in there ourself. Those self-stored posts we want to sign if they
		//have been deleted, but we do NOT want to sign other people's posts! 
		//So, need to distinguish which posts in storage came from us. We will be going by
		//"posts that go to/from the server are always signed, so not signed ==> generated by ourself."
		if(allDeterminedDeleted[adInd].hasSignature)
			alreadySignedDeleted.push(allDeterminedDeleted[adInd]);
		else
			localNewDeleted.push(allDeterminedDeleted[adInd]);
	}
	
	//NOTE can't do message sending from an event page, I guess? 
	//Well, that's fine, that just means we get to directly call functions.
	signAllDeletedPosts(localNewDeleted, ourUID, ourNickname, function(signedLocallyDeterminedDeleted){
	
	//Unlike the live-page handling, we won't query the server for deleted posts here.
	//However, we might want to do the query when email communication is added,
	//since we'll need to be pre-querying the deleted posts as much as possible 
	//(can't do it on the fly at page-load time with email latencies).
	
	reportAllDeletedPosts(signedLocallyDeterminedDeleted);
	updateStoredPosts(	setUnion(postsPresentStripped, 
						setUnion(alreadySignedDeleted,signedLocallyDeterminedDeleted, comparePosts,tiebreakPosts),comparePosts,tiebreakPosts));
});});});});});

//DEBUG chrome.alarms.create("GhostPostCheckWeibo", {delayInMinutes: 0.1});
chrome.alarms.create("GhostPostCheckWeibo", {delayInMinutes: Math.random() * 10 + 2});
