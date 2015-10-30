//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================


//========================================================================
//'Call' these functions by doing:
//
//let functionCallMessage = {};
//functionCallMessage.functionNameToCall = "MPIstorage_getAccountPostsBackTo";
//functionCallMessage.oldestDateUTCMSSE = 4235346547546000;
//functionCallMessage.accountID = 1234567;
//chrome.runtime.sendMessage(functionCallMessage, function(arrayOfPosts)
//{
//	do stuff with arrayOfPosts
//});
//
//
//Here are the functions that are accessible in that way:
//-----------------------------------------------------------------------
//request.functionNameToCall: MPIstorage_getAccountPostsBackTo
//request.[Arguments]: long .oldestDateUTCMSSE,
//						long .accountID
//Response callback: responseCallback(struct DeletedPost[] theStoredPosts)
//-----------------------------------------------------------------------
//.functionNameToCall: MPIstorage_updateStoredPosts
//request.[Arguments]: struct DeletedPost[] .updateIntoStorage
//Response callback: NONE
//-----------------------------------------------------------------------
//.functionNameToCall: MPIstorage_getAllStoredDeletedPostsSince
//request.[Arguments]: long .oldestDateUTCMSSE,
//						long[] .accountUIDsInterested
//Response callback: responseCallback(struct DeletedPost[] allStoredPostsSince,
//									struct DeletedPost[] storedDeletedPostsSince)
//-----------------------------------------------------------------------
//.functionNameToCall: MPIstorage_getOwnWeiboID
//request.[Arguments]: NONE
//Response callback: responseCallback(long ownWeiboID)
//-----------------------------------------------------------------------
//.functionNameToCall: MPIstorage_genericStorageSet
//request.[Arguments]: JSON .finalObject
//Response callback: responseCallback(long ownWeiboID)
//-----------------------------------------------------------------------
//.functionNameToCall: MPIstorage_getOrGenGhostPostPassword
//request.[Arguments]: NONE
//Response callback: responseCallback(string thePassword)
//========================================================================


function emptyArrayOr(theThingToCheck)
{
	if(typeof theThingToCheck === "undefined")
		return [];
	else return theThingToCheck;
}

//returns an array of our Post structs, of all posts by accountID since oldestDate that we have stored.
//NOTE to self: do NOT call this one multiple times when doing a user's home page - inefficient (n retrievals where 1 would have been enough) and wouldn't even cover all deleted posts.
function getAccountPostsBackTo(oldestDateUTCMSSE, accountID, theDoneCallback)
{
	//NOTE: if there are no posts on a page, the parser says the oldest post is from "8640000000000000" (MSSE_DATE_MAX).
	//		so, the nice clean way to handle this case: just immediately return empty if oldestDateUTCMSSE > now.
	if(Date.now() < oldestDateUTCMSSE)
	{
		theDoneCallback([]);
		return;
	}

	//if the page goes back to e.g. 2011, <now> to <date of oldest post on page> could be thousands of days... 
	//don't want to get() a huge amount of days, most of which don't even have posts from this user!
	//so, for each account, we're storing an array of MSSEs representing the days that we actually have posts from that account stored for.
	//to figure out which days to actually pull, we first get that array for that userID.
	let postMapKey = "ghostpostpostdays"+accountID.toString();
	chrome.storage.local.get(postMapKey, function(daysResult){
	if(typeof daysResult[postMapKey] === "undefined")
	{
		theDoneCallback([]);
		return;
	}
	let daysArray = daysResult[postMapKey];
	
	let floorOldestDateMSSE = stripSubDayTime(oldestDateUTCMSSE);
	let dayKeysToGet = [];
	for(let pdInd = daysArray.length - 1; pdInd >=0 && floorOldestDateMSSE <= daysArray[pdInd]; pdInd--)
	{
		let ghostpostYYYYMMDD = "ghostpost"+msseToFloorYYYYMMDD(daysArray[pdInd]);
		dayKeysToGet.push(ghostpostYYYYMMDD);
	}
	
	//We don't have ANY days for this account!
	if(dayKeysToGet.length === 0)
	{
		theDoneCallback([]);
		return;
	}

	//now that we know which days this account posted on, we know which days to ask for.
	chrome.storage.local.get(dayKeysToGet, function(results){
	if(typeof results === "undefined")
	{
		//console.log("Non-empty dayKeysToGet set got no results... hmm. dayKeysToGet: "+dayKeysToGet.toString());
		theDoneCallback([]);
		return;
	}
	
	let postsToReturn = [];
	for(let eachResult in results)
	{
		let thisResult = results[eachResult];
		if(typeof thisResult === "undefined")
			continue;
		
		for(let rInd = 0; rInd < thisResult.length; rInd++)
		{
			if(thisResult[rInd] === null)
				continue;
			
			if(thisResult[rInd].authorID === accountID && thisResult[rInd].datePosted >= oldestDateUTCMSSE)
				postsToReturn.push(thisResult[rInd]);
		}
	}
	theDoneCallback(postsToReturn);
});});}

function msseToFloorYYYYMMDD(msseDate)
{
	let dateObj = new Date(msseDate);
	return dateObj.getUTCFullYear().toString() + ("0"+((dateObj.getUTCMonth()+1).toString())).slice(-2) + ("0"+dateObj.getUTCDate().toString()).slice(-2);
}

//authorDates should be the object returned by makeNormalizedAuthorDateSet()
function insertAuthorDateSet(authorDates)
{
	//get() the current maps, add our new stuff, set().
	chrome.storage.local.get(authorDates.queryAuths, function(postMapResult){
	let finPostMapObj = {};

	for(let adInd = 0; adInd < authorDates.authorDays.length; adInd++)
	{
		let curAuthDays = emptyArrayOr(postMapResult[authorDates.authorDays[adInd].authStr]);

		finPostMapObj[authorDates.authorDays[adInd].authStr] = setUnion(curAuthDays, authorDates.authorDays[adInd].days, function(a,b){return a-b;});
	}

	chrome.storage.local.set(finPostMapObj);
});}

//returns:
//{
//	array of this named authorDays:
//	{
//		string authStr (string of the "ghostpostpostdays12345" format)
//		long[] days (MSSE, normalized so that hours=minutes=seconds=ms=0, sorted, no duplicates)
//	}
//	string[] queryAuths; (just all the authStrs combined into one array; so it can be fed directly into get())
//}
function makeNormalizedAuthorDateSet(allPosts)
{
	let retObj = {};
	retObj.authorDays = [];
	retObj.queryAuths = [];

	for(let apInd = 0; apInd < allPosts.length; apInd++)
	{
		let thisAuth = "ghostpostpostdays"+allPosts[apInd].authorID.toString();
		let thisDayMSSE = stripSubDayTime(allPosts[apInd].datePosted);
		let existingAuthInd = binarySearchSuccessor(thisAuth, retObj.queryAuths, function(a,b){if(a === b) return 0; else return (a < b) ? -1 : 1;});
		if(existingAuthInd < retObj.queryAuths.length && retObj.queryAuths[existingAuthInd] === thisAuth) //author is in there; existingAuthInd is its index
		{
			let existingDaysInd = binarySearchSuccessor(thisDayMSSE, retObj.authorDays[existingAuthInd].days, function(a,b){return a-b;});
			if(existingDaysInd < retObj.authorDays[existingAuthInd].days.length && retObj.authorDays[existingAuthInd].days[existingDaysInd] == thisDayMSSE)
				continue;
			retObj.authorDays[existingAuthInd].days.splice(existingDaysInd, 0, thisDayMSSE);
		}
		else //author isn't in there: splice it in (or at end)
		{
			retObj.queryAuths.splice(existingAuthInd, 0, thisAuth);
			retObj.authorDays.splice(existingAuthInd, 0, {});
			retObj.authorDays[existingAuthInd].authStr = thisAuth;
			retObj.authorDays[existingAuthInd].days = [thisDayMSSE];
		}
	}

	return retObj;
}

function stripSubDayTime(theMSSE)
{
	let msseAsDate = new Date(theMSSE);
	theMSSE -= 60*60*1000*msseAsDate.getUTCHours();
	theMSSE -= 60*1000*msseAsDate.getUTCMinutes();
	theMSSE -= 1000*msseAsDate.getUTCSeconds();
	theMSSE -= msseAsDate.getUTCMilliseconds();
	return theMSSE;
}

//updateStoredPosts() adds each post in toUpdate (an array of our Post struct) to storage if that post wasn't there, or "updates" it if it was.
//Here, "update" means that between the one already in storage and the one in toUpdate, the one with the older dateDeleted survives (recall that "never deleted" = max time value, 846000...).
//NOTE NOTE:	THE ABOVE MEANS THAT IF YOU ARE LOOKING TO ACTUALLY REPLACE POSTS WITH NEWER VERSIONS, LIKE FOR A USER-EDIT OR USER-DELETION, THIS FUNCTION
//				IS NOT SUITABLE; YOU NEED TO WRITE A NEW ONE!
//inserts or overwrites posts in storage from the array "toUpdate". "overwrites" if authorID, datePosted, text, isReblog, [reblog] match, i.e. comparePosts()==0.
function updateStoredPosts(toUpdate)
{
	if(typeof toUpdate === "undefined" || toUpdate.length === 0)
		return;
		
	toUpdate.sort(function(a,b){return a.datePosted - b.datePosted;});
	let keysToModify = [];
	keysToModify.push("ghostpost"+msseToFloorYYYYMMDD(toUpdate[0].datePosted));
	for(let apInd = 1; apInd < toUpdate.length; apInd++)
		if(keysToModify[keysToModify.length - 1] !== ("ghostpost"+msseToFloorYYYYMMDD(toUpdate[apInd].datePosted)))
			keysToModify.push("ghostpost"+msseToFloorYYYYMMDD(toUpdate[apInd].datePosted));

	//NOTE: We're doing two updates in parallel here, and that's fine. One is to update the post-day maps of all users represented in allPosts
	//(i.e. to add to their map any days of theirs in allPosts that weren't already marked for them). The other is to actually insert allPosts
	//under the various ghostpostYYYYMMDD keys.

	//first, add/update the actual allPosts to ghostpostYYYYMMDD keys:
	chrome.storage.local.get(keysToModify, function(result)
	{
		let apInd = 0;
		let finalObj = {};
		for(let kmInd = 0; kmInd < keysToModify.length; kmInd++)
		{
			let thatDaysPosts = emptyArrayOr(result[keysToModify[kmInd]]);

			//since each day's posts get stored under their own YYYYMMDD key, we need to take chunks of toUpdate by day.
			//fortunately, since both toUpdate and keysToModify are sorted, we can just do this:
			let thisDayUpdatedPosts = [];
			while(apInd < toUpdate.length && ("ghostpost"+msseToFloorYYYYMMDD(toUpdate[apInd].datePosted)) === keysToModify[kmInd])
			{
				thisDayUpdatedPosts.push(toUpdate[apInd]);
				//console.log("pushed for "+keysToModify[kmInd]+": "+JSON.stringify(toUpdate[apInd]));
				apInd++;
			}

			//NOTE we can be sure thatDaysPosts is already sorted here, since we always sort 
			//the entirety of each day we're going to write to just before finalizing a write.
			for(let upInd = 0; upInd < thisDayUpdatedPosts.length; upInd++)
			{
				let existingInd = binarySearch(thisDayUpdatedPosts[upInd], thatDaysPosts, comparePosts);
				if(existingInd >= 0 && thisDayUpdatedPosts[upInd].dateDeleted < thatDaysPosts[existingInd].dateDeleted)
					thatDaysPosts[existingInd] = thisDayUpdatedPosts[upInd];
				else if(existingInd < 0)
					thatDaysPosts.push(thisDayUpdatedPosts[upInd]);
			}
			
			//remember, we rely on each ghostpostYYYYMMDD having its posts sorted!
			thatDaysPosts.sort(function(a,b){return a.datePosted - b.datePosted;});
			finalObj[keysToModify[kmInd]] = thatDaysPosts;
		}

		//console.log("DEBUG: storing: "+JSON.stringify(finalObj));
		chrome.storage.local.set(finalObj);
	});

	//second, add to the post-day maps:
	//extract the authorIDs and post dates (and skip duplicates), and normalize the post dates: they should have the hours, minutes, seconds, and ms of the Date class all 0.
	let authorDates = makeNormalizedAuthorDateSet(toUpdate);
	//get() the current maps, add our new stuff, set().
	insertAuthorDateSet(authorDates);
}

//Adds some posts that need their reports retried into storage, possibly alongside
//some existing stored need-retry posts.
function storeReportsForRetry(thePosts)
{
	if(typeof thePosts === "undefined" || typeof thePosts.length === "undefined" || thePosts.length === 0)
		return;
	
	chrome.storage.local.get("gpPendingDeletionReports", function(result){
	let existingPosts = emptyArrayOr(result["gpPendingDeletionReports"]);
	
	let finalObj = {};
	finalObj["gpPendingDeletionReports"] = setUnion(thePosts, existingPosts, comparePosts, tiebreakPosts);
	chrome.storage.local.set(finalObj);
});}

//Returns the contents of Chrome storage's gpPendingDeletionReports key. 
//***SETS gpPendingDeletionReports TO EMPTY AFTER RETRIEVING ITS CONTENTS.***
function popReportsForRetry(theDoneCallback)
{
	chrome.storage.local.get("gpPendingDeletionReports", function(results){
	let holdResults = emptyArrayOr(results["gpPendingDeletionReports"]);
	chrome.storage.local.set({"gpPendingDeletionReports": []});
	theDoneCallback(holdResults);
});}

//theCallback(haveAnswered, saidOk)
function recallWhetherQueryFromChinaOK(theCallback)
{
	chrome.storage.local.get("gpQueryingSalmonFromChinaAllowed", function(results){
		
	if(typeof results["gpQueryingSalmonFromChinaAllowed"] !== "undefined" && 
	(results["gpQueryingSalmonFromChinaAllowed"] === "yes" || results["gpQueryingSalmonFromChinaAllowed"] === "no"))
		theCallback(true, (results["gpQueryingSalmonFromChinaAllowed"] === "yes"));
	else
		theCallback(false, false);
	
});}


//doneCallback(allStoredPostsSince, storedDeletedPostsSince)
//Returns all posts (including deleted ones) in allStoredPostsSince, and all deleted posts in
//storedDeletedPostsSince, going back to but not before oldestDateUTCMSSE. (Even if a post is on
//the same day as oldestDate, so long as it is earlier, it is not returned).
//The function will give you all such posts INCLUDING BUT NOT LIMITED TO those posted by users
//in the accountUIDsInterested set. That is, either of the returned sets might include posts from
//someone you did not ask for - the accountUIDsInterested argument is only so the function can be sure
//to find all of the posts that you definitely _are_ interested in.
function getAllStoredDeletedPostsSince(oldestDateUTCMSSE, accountUIDsInterested, doneCallback)
{
	//NOTE: if there are no posts on a page, the parser says the oldest post is from "8640000000000000" (MSSE_DATE_MAX).
	//		so, the nice clean way to handle this case: just immediately return empty if oldestDateUTCMSSE > now.
	if(Date.now() < oldestDateUTCMSSE)
	{
		doneCallback([],[]);
		return;
	}
	
	//if the page goes back to e.g. 2011, <now> to <date of oldest post on page> could be thousands of days... 
	//don't want to get() a huge amount of days, most of which don't even have posts from this user!
	//so, for each account, we're storing an array of MSSEs representing the days that we actually have posts from that account stored for.
	//to figure out which days to actually pull, we first get that array for that userID.
	let postMapKeys = [];
	for(let aiInd = 0; aiInd < accountUIDsInterested.length; aiInd++)
		postMapKeys.push("ghostpostpostdays"+accountUIDsInterested[aiInd].toString());

	
	chrome.storage.local.get(postMapKeys, function(daysResult){
	
	let floorOldestDateMSSE = stripSubDayTime(oldestDateUTCMSSE);
	let allAccountDaysUnion = [];
	for(let pmInd = 0; pmInd < postMapKeys.length; pmInd++)
	{
		if(typeof daysResult[postMapKeys[pmInd]] === "undefined")
			continue;
		let curAccountMap = daysResult[postMapKeys[pmInd]];
		allAccountDaysUnion = setUnion(allAccountDaysUnion, curAccountMap, function(a,b){return a-b;});
	}
	
	//We don't have ANY days for this account!
	if(allAccountDaysUnion.length === 0)
	{
		doneCallback([],[]);
		return;
	}

	let dayKeysToGet = [];
	for(let pdInd = allAccountDaysUnion.length - 1; pdInd >=0 && floorOldestDateMSSE <= allAccountDaysUnion[pdInd]; pdInd--)
	{
		let ghostpostYYYYMMDD = "ghostpost"+msseToFloorYYYYMMDD(allAccountDaysUnion[pdInd]);
		dayKeysToGet.push(ghostpostYYYYMMDD);
	}
	
	//We don't have ANY days for this account later than the threshold floorOldestDateMSSE!
	if(dayKeysToGet.length === 0)
	{
		doneCallback([],[]);
		return;
	}

	chrome.storage.local.get(dayKeysToGet, function(results){
	if(typeof results === "undefined")
	{
		doneCallback([],[]);
		return;
	}
	
	let returnAllPosts = [];
	let returnDeletedPosts = [];
	for(let eachResult in results)
	{
		let thisResult = results[eachResult];
		if(typeof thisResult === "undefined")
			continue;
		
		for(let rInd = 0; rInd < thisResult.length; rInd++)
		{
			if(thisResult[rInd] === null)
				continue;
			
			//NOTE: only posts from authors we follow should be able to make it into storage, 
			//so don't need to bother checking if we're interested in this post's author, 
			//since we want everyone we follow.
			//However, since we have posts back to stripSubDayTime(oldestDateUTCMSSE), but are
			//only interested back to oldestDateUTCMSSE, have to check the time.
			if(thisResult[rInd].datePosted >= oldestDateUTCMSSE)
			{
				returnAllPosts.push(thisResult[rInd]);
				
				if(thisResult[rInd].dateDeleted < MSSE_DATE_MAX)
					returnDeletedPosts.push(thisResult[rInd]);
			}
		}
	}
	doneCallback(returnAllPosts, returnDeletedPosts);
});});}

//Generates a random 16 character alphanumeric password, stores it in chrome.storage.local
//under "gpOwnGPpassword", and returns it.
function generateAndStorePassword()
{
	let sourceChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	let thePassword = "";
	for(let i=0; i<16; i++)
		thePassword += sourceChars[Math.floor(Math.random() * sourceChars.length)];
	
	let finalObj = {};
	finalObj["gpOwnGPpassword"] = thePassword;
	chrome.storage.local.set(finalObj);
	
	return thePassword;
}

//Retrieves the GhostPost password from storage, or generates (+stores) one if it's not there.
//theCallback(string retrievedPW)
function getOrGenGhostPostPassword(theCallback)
{
	chrome.storage.local.get("gpOwnGPpassword", function(getResult){
	
	if(typeof getResult["gpOwnGPpassword"] === "undefined" || getResult["gpOwnGPpassword"] === "")
		theCallback(generateAndStorePassword());
	else
		theCallback(getResult["gpOwnGPpassword"]);
});}

function getGhostPostPassword(theCallback)
{
	chrome.storage.local.get("gpOwnGPpassword", function(getResult){
	
	if(typeof getResult["gpOwnGPpassword"] === "undefined" || getResult["gpOwnGPpassword"] === "")
		theCallback("");
	else
		theCallback(getResult["gpOwnGPpassword"]);
});}

function getOwnWeiboID(responseCallback)
{
	chrome.storage.local.get(["ghostpostmyownuid"], function(getMyIDResult)
	{
		if(typeof getMyIDResult["ghostpostmyownuid"] === "undefined" || getMyIDResult["ghostpostmyownuid"] === WEIBO_NONEXISTANT_ID)
		{
			alert("Error: GhostPost has not yet determined your Weibo ID. Please log in to Weibo and visit your Weibo home page before trying to register for GhostPost.");
			responseCallback(WEIBO_NONEXISTANT_ID);
			return;
		}
		responseCallback(getMyIDResult["ghostpostmyownuid"]);
	});
}

function genericStorageSet(finalObject)
{
	chrome.storage.local.set(finalObject);
}

//Updates the last-queried storage entries that recallAccountsLastQuery() returns.
function updateAccountsLastQuery(theAccounts, newTime)
{
	let finalObj = {};
	for(let aInd = 0; aInd < theAccounts.length; aInd++)
		finalObj["gpTimeLastQueriedWID"+theAccounts[aInd]] = newTime;
	chrome.storage.local.set(finalObj);
}
