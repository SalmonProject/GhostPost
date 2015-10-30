//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================


//========================================================================
//Functions available to content scripts via message-passing:
//-----------------------------------------------------------------------
//request.functionNameToCall: MPIcomms_queryDeletedPosts
//request.[Arguments]: long[] .authorList,
//						long .oldestDate
//Response callback: responseCallback(struct DeletedPost[] theStoredPosts)
//-----------------------------------------------------------------------
//.functionNameToCall: MPIcomms_reportAllDeletedPosts
//request.[Arguments]: struct DeletedPost[] .allPosts
//Response callback: NONE
//-----------------------------------------------------------------------
//.functionNameToCall: MPIcomms_tryReportError
//request.[Arguments]: string .errorString
//Response callback: NONE
//-----------------------------------------------------------------------
//.functionNameToCall: MPIcomms_registerGhostPostStart
//request.[Arguments]: string .futurePostText
//Response callback: NONE
//-----------------------------------------------------------------------
//.functionNameToCall: MPIcomms_registerGhostPostFinish
//request.[Arguments]: NONE
//Response callback: NONE
//========================================================================



//long[] theAccounts (Weibo IDs), theCallback(long lastQueries).
//lastQueries[i] is the oldest MSSE time that we last successfullly 
//queried for the deleted posts of any of theAccounts[].
function recallLastQueryTime(theAccounts, theCallback)
{
	let keysToGet = [];
	for(let aInd = 0; aInd < theAccounts.length; aInd++)
		keysToGet.push("gpTimeLastQueriedWID"+theAccounts[aInd]);
	
	chrome.storage.local.get(keysToGet, function(getResult){
		
	let lastQueries = [];
	for(let aInd = 0; aInd < keysToGet.length; aInd++)
		if(typeof getResult[keysToGet[aInd]] !== "undefined" && getResult[keysToGet[aInd]] > 0)
			lastQueries.push(getResult[keysToGet[aInd]]);
		else
			lastQueries.push(0);
	
	let oldestLastQuery = MSSE_DATE_MAX;
	if(lastQueries.length === 0)
		oldestLastQuery = 0;
	else
		for(let lqInd = 0; lqInd < lastQueries.length; lqInd++)
			if(lastQueries[lqInd] < oldestLastQuery)
				oldestLastQuery = lastQueries[lqInd];
			
	theCallback(oldestLastQuery);
});}


//Query the central server for deleted posts by anyone in authorList
//whose post dates were more recent than oldestDate.
//theDoneCallback(struct DeletedPost[] responsePosts (may be empty))
function queryDeletedPosts(authorList, oldestDate, theDoneCallback)
{
	oldestDate = typeof oldestDate !== "undefined" ? oldestDate : Date.now() - 7 * 24 * 60 * 60 * 1000;
	
	chrome.storage.local.get("ghostpostmyownuid", function(myUIDresult){
	if(typeof myUIDresult["ghostpostmyownuid"] === "undefined" || myUIDresult["ghostpostmyownuid"] === 0)
	{
		theDoneCallback([]);
		return;
	}
	let ownWeiboID = myUIDresult["ghostpostmyownuid"];
	
	checkIfDangerousQueriesOK(function(okToQuery){
	if(!okToQuery)
	{
		theDoneCallback([]);
		return;
	}
	
	getGhostPostPassword(function(ourPassword){
	
	//TOODO LONGTERM  get compression of these REST messages going
	
	recallLastQueryTime(authorList, function(oldestLastQuery){
	
	let queryParams = "since=" + encodeURIComponent(oldestDate) + "&wid="+ownWeiboID+"&pw="+encodeURIComponent(ourPassword);
	
	queryParams += "&interested=[";
	for(let alInd = 0; alInd < authorList.length; alInd++)
	{
		if(alInd != 0)
			queryParams += ", ";
		queryParams += authorList[alInd];
	}
	queryParams += "]";
	queryParams += "&lastquery="+oldestLastQuery;
	
	let xhr = new XMLHttpRequest();
	xhr.open("GET", CENTRAL_SERVER_URL+"/deleted?"+queryParams, true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function() 
	{
		if (xhr.readyState == 4) 
		{
			if (xhr.status == 200)//success
			{
				updateAccountsLastQuery(authorList, Date.now());
				theDoneCallback(JSON.parse(xhr.responseText));
				//NOTE: putting these received posts into storage is the job of whoever gave us theDoneCallback
			}
			else 
			{
				//alert("DEBUG GhostPost XML HTTP request error: "+xhr.statusText);
				theDoneCallback([]);
				xhr.abort();
			}
		}
	};
	xhr.timeout = 12000;
	xhr.ontimeout = function () { xhr.abort(); theDoneCallback([]); };
	xhr.send();
});});});});}



//Don't be making requests directly to CENTRAL_SERVER_URL while 
//we're on a Chinese IP address... unless the user says it's ok.
function checkIfDangerousQueriesOK(theCallback)
{
	currentlyOnChineseIP(function(yesIPIsChinese){
	if(!yesIPIsChinese)
		theCallback(true);
	else
	{
		recallWhetherQueryFromChinaOK(function(theyHaveAnswered, theySaidOk){
		let okToReport = false;
		if(!theyHaveAnswered)
		{
			okToReport = window.confirm("GhostPost needs to talk to the central GhostPost server at "+CENTRAL_SERVER_URL+". However, you appear to be on a Chinese IP address. Although the communication will be encrypted, an observer would still know that you communicated with "+CENTRAL_SERVER_URL+". Click 'Ok' to allow the report to continue, or 'Cancel' to stop it.");
			chrome.storage.local.set({"gpQueryingSalmonFromChinaAllowed": (okToReport ? "yes" : "no")});
		}
		else
			okToReport = theySaidOk;
		
		theCallback(okToReport);
	});}
});}

function reportDeletedPostsXHR(thePosts)
{
	chrome.storage.local.get("ghostpostmyownuid", function(myUIDresult){
	if(typeof myUIDresult["ghostpostmyownuid"] === "undefined" || myUIDresult["ghostpostmyownuid"] === 0)
	{
		storeReportsForRetry(thePosts);
		return;
	}
	let ownWeiboID = myUIDresult["ghostpostmyownuid"];
	
	checkIfDangerousQueriesOK(function(okToQuery){
	if(!okToQuery)
	{
		storeReportsForRetry(thePosts);
		return;
	}
	
	getGhostPostPassword(function(ourPassword){
	if(typeof ourPassword === "undefined" || ourPassword === "")
	{
		storeReportsForRetry(thePosts);
		return;
	}

	let xhr = new XMLHttpRequest();
	xhr.open("POST", CENTRAL_SERVER_URL+"/deleted", true);
	xhr.setRequestHeader("Content-Type", "application/json");

	let deleted = {};
	deleted.posts = thePosts;
	deleted.wid = ownWeiboID;
	deleted.pw = ourPassword;
	
	//console.log("POSTS TO REPORT: "+textOfPosts(thePosts));

	// Handle request state change events
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4) // If the request completed
		{
			//(Nothing to be done if successful)
			
			if(xhr.status != 200)
			{
				//DEBUG / TEST: delete this 'if' when ready
				if(confirm("DEBUG: do you want to ever retry this deletion report?"))
					storeReportsForRetry(thePosts);
				
				xhr.abort(); //we're doing our own retry logic, thanks!
			}
		}
	};
	
	xhr.timeout = 12000;
	xhr.ontimeout = function()
	{
		//DEBUG / TEST: delete this 'if' when ready
		if(confirm("DEBUG: do you want to ever retry this deletion report?"))
			storeReportsForRetry(thePosts);
		
		xhr.abort(); //we're doing our own retry logic, thanks!
	};
	
	xhr.send(JSON.stringify(deleted));
});});});}

//NOTE: One very minor weak point of doing report retries this way is that if the browser closes
//		in the middle of a report XHR (before it fails), and the server never hears that report XHR,
//		then the report is lost forever. This should be rare, and is not catastrophic.
//allPosts should come in already stripped of the DOM object field.
function reportAllDeletedPosts(allPosts)
{
	popReportsForRetry(function(reportRetries){
	let reportThesePosts = setUnion(allPosts, reportRetries, comparePosts, tiebreakPosts);
	if(reportThesePosts.length > 0)
		reportDeletedPostsXHR(reportThesePosts);
});}

function tryReportError(errorString)
{
	checkIfDangerousQueriesOK(function(okToQuery){
	if(!okToQuery)
		return;
	if(!confirm("GhostPost has crashed. Is it ok to report the crash to the GhostPost server for debugging?\n\n(Here is what will be sent):\n\n"+errorString))
		return;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", CENTRAL_SERVER_URL+"/clienterror", true);
	xhr.setRequestHeader("Content-Type", "application/json");

	let erreport = {};
	erreport.errstring = errorString;

	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4) // If the request completed
		{
			//(Nothing to be done if successful)
			if(xhr.status != 200)
				xhr.abort();
		}
	};
	
	xhr.timeout = 12000;
	xhr.ontimeout = function() { xhr.abort(); };
	xhr.send(JSON.stringify(erreport));
});}


function reportPubkeyIfNeeded(ourPubkey)
{
	chrome.storage.local.get(["gpServerKnowsOurKey", "ghostpostmyownuid", "gpOwnGPpassword"], function(getResult){
	
	if(getResult["gpServerKnowsOurKey"] === "yes" || typeof getResult["ghostpostmyownuid"] === "undefined" || getResult["ghostpostmyownuid"] === 0)
		return;
	
	let ownWeiboID = getResult["ghostpostmyownuid"];
	
	checkIfDangerousQueriesOK(function(okToQuery){
	if(!okToQuery)
		return;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", CENTRAL_SERVER_URL+"/mykey", true);
	xhr.setRequestHeader("Content-Type", "application/json");

	let sendkey = {};
	sendkey.mykey = ourPubkey;
	sendkey.wid = ownWeiboID;
	sendkey.pw = getResult["gpOwnGPpassword"];

	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4 && xhr.status == 200)
		{
			let finalObj = {};
			finalObj["gpServerKnowsOurKey"] = "yes";
			chrome.storage.local.set(finalObj);
		}
	};
	
	xhr.timeout = 12000;
	xhr.ontimeout = function() { xhr.abort(); };
	xhr.send(JSON.stringify(sendkey));
});});}

function registerGhostPostStart(futurePostText, responseCallback)
{
	checkIfDangerousQueriesOK(function(okToQuery){
	
	if(!okToQuery)
	{
		alert("Registration aborted.");
		responseCallback();
		return;
	}
	
	getOwnWeiboID(function(ourWeiboID){
	getOrGenGhostPostPassword(function(ourNewPassword){
	
	if (ourWeiboID === WEIBO_NONEXISTANT_ID)
	{
		alert("Please give GhostPost a chance to determine your Weibo user ID by visiting your Weibo home page while logged in!");
		return;
	}
	
	try{
	
	let queryParams =	"pw=" + encodeURIComponent(ourNewPassword) + 
						"&wid=" + encodeURIComponent(ourWeiboID) +
						"&post=" + encodeURIComponent(futurePostText);

	let xhr = new XMLHttpRequest();
	xhr.open("GET", CENTRAL_SERVER_URL+"/startreg?"+queryParams, true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4)
		{
			if(xhr.status == 200 && xhr.responseText.indexOf("success") >=0)
			{
				let finalObject = {};
				finalObject["ghostpostRegistrationPost"] = futurePostText;
				chrome.storage.local.set(finalObject);
				
				alert("Registration started - now post the post! Once you have, click the ghost to open this popup again (it will close once you dismiss this message), and click the 'finish registration' button.");
			}
			else
				alert("Registration failed: error while contacting central server: "+xhr.responseText);
			responseCallback();
		}
	};
	
	xhr.timeout = 12000;
	xhr.ontimeout = function() { alert("Registration failed: could not contact central server."); xhr.abort(); responseCallback(); };
	xhr.send();
	
	
	}catch(exexe){alert(exexe); responseCallback();}
	
	
});});});}

function registerGhostPostFinish(responseCallback)
{
	checkIfDangerousQueriesOK(function(okToQuery){
	
	if(!okToQuery)
	{
		alert("User did not permit registration-finish message.");
		responseCallback();
		return;
	}
	
	loadOrParseOwnUIDNickname(function(ourWeiboID, ourNickname){
	getGhostPostPassword(function(ourNewPassword){
	
	let queryParams =	"pw=" + encodeURIComponent(ourNewPassword) + 
						"&wid=" + encodeURIComponent(ourWeiboID) + 
						"&nick=" + encodeURIComponent(ourNickname);

	let xhr = new XMLHttpRequest();
	xhr.open("GET", CENTRAL_SERVER_URL+"/finishreg?"+queryParams, true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4)
		{
			if(xhr.status == 200 && xhr.responseText.indexOf("success") >=0)
			{
				alert("Registration finished! You are now registered.");
				let finalObject = {};
				finalObject["ghostpostRegistrationSucceeded"] = true;
				chrome.storage.local.set(finalObject);
				chrome.storage.local.remove("ghostpostRegistrationPost");
			}
			else
				alert("Registration failed: "+xhr.responseText);
			responseCallback();
		}
	};
	
	xhr.timeout = 12000;
	xhr.ontimeout = function() { alert("Registration failed - could not contact central server."); xhr.abort(); responseCallback(); };
	xhr.send();
});});});}
