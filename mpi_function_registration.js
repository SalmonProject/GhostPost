//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================


//Example of how to call these:
//let call_verifyDeletedPost = {};
//call_verifyDeletedPost.functionNameToCall = "MPIsubtleCrypto_verifyDeletedPost";
//call_verifyDeletedPost.postToVerify = sourcePost;
//call_verifyDeletedPost.ownWeiboID = global_ownWeiboID;
//chrome.runtime.sendMessage(call_verifyDeletedPost, function(verificationSucceeded){STUFF});
//
//The arguments to verifyDeletedPost go into .argumentName members of the call_verifyDeletedPost
//object. The response callback is passed as the response callback argument to runtime.sendMessage().


//Register our accessible-to-content-scripts-via-message-passing functions
chrome.runtime.onMessage.addListener(function(request, sender, responseCallback)
{
	if(typeof request === "undefined" || typeof request.functionNameToCall === "undefined")
		return;
	
	//console.log("DEBUG MPI function called: "+request.functionNameToCall);
	
	//gp_subtle_crypto.js
	if(request.functionNameToCall === "MPIsubtleCrypto_verifyDeletedPost")
		verifyDeletedPost(request.postToVerify, request.ownWeiboID, responseCallback);
	
	else if(request.functionNameToCall === "MPIsubtleCrypto_signAllDeletedPosts")
		signAllDeletedPosts(request.allPostsToSign, request.ownWeiboID, 
							request.ownWeiboNickname, responseCallback);
	//gp_storage.js
	//========================================================================
	//request.functionNameToCall: MPIstorage_getAccountPostsBackTo
	//request.[Arguments]: long .oldestDateUTCMSSE,
	//						long .accountID
	//Response callback: responseCallback(struct DeletedPost[] theStoredPosts)
	else if(request.functionNameToCall === "MPIstorage_getAccountPostsBackTo")
		getAccountPostsBackTo(request.oldestDateUTCMSSE, request.accountID,	responseCallback);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIstorage_updateStoredPosts
	//request.[Arguments]: struct DeletedPost[] .updateIntoStorage
	//Response callback: NONE
	else if(request.functionNameToCall === "MPIstorage_updateStoredPosts")
		updateStoredPosts(request.updateIntoStorage);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIstorage_addFollowedUIDsToStorage
	//request.[Arguments]: long[] .UIDsToAdd
	//Response callback: NONE
	else if(request.functionNameToCall === "MPIstorage_addFollowedUIDsToStorage")
		addFollowedUIDsToStorage(request.UIDsToAdd);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIstorage_getAllStoredDeletedPostsSince
	//request.[Arguments]: long .oldestDateUTCMSSE,
	//						long[] .accountUIDsInterested
	//Response callback: responseCallback(struct DeletedPost[] allStoredPostsSince,
	//									struct DeletedPost[] storedDeletedPostsSince)
	else if(request.functionNameToCall === "MPIstorage_getAllStoredDeletedPostsSince")
		getAllStoredDeletedPostsSince(request.oldestDateUTCMSSE, request.accountUIDsInterested,	responseCallback);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIstorage_getOwnWeiboID
	//request.[Arguments]: NONE
	//Response callback: responseCallback(long ownWeiboID)
	else if(request.functionNameToCall === "MPIstorage_getOwnWeiboID")
		getOwnWeiboID(responseCallback);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIstorage_genericStorageSet
	//request.[Arguments]: JSON .finalObject
	//Response callback: NONE
	else if(request.functionNameToCall === "MPIstorage_genericStorageSet")
		getOwnWeiboID(request.finalObject);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIstorage_getOrGenGhostPostPassword
	//request.[Arguments]: NONE
	//Response callback: responseCallback(string thePassword)
	else if(request.functionNameToCall === "MPIstorage_getOrGenGhostPostPassword")
		getOrGenGhostPostPassword(responseCallback);
	//========================================================================
	
	
	//gp_communicate.js
	//========================================================================
	//request.functionNameToCall: MPIcomms_queryDeletedPosts
	//request.[Arguments]: long[] .authorList,
	//						long .oldestDate
	//Response callback: responseCallback(struct DeletedPost[] theStoredPosts)
	else if(request.functionNameToCall === "MPIcomms_queryDeletedPosts")
		queryDeletedPosts(request.authorList, request.oldestDate, responseCallback);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIcomms_reportAllDeletedPosts
	//request.[Arguments]: struct DeletedPost[] .allPosts
	//Response callback: NONE
	else if(request.functionNameToCall === "MPIcomms_reportAllDeletedPosts")
		reportAllDeletedPosts(request.allPosts);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIcomms_tryReportError
	//request.[Arguments]: string .errorString
	//Response callback: NONE
	else if(request.functionNameToCall === "MPIcomms_tryReportError")
		tryReportError(request.errorString);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIcomms_registerGhostPostStart
	//request.[Arguments]: string .futurePostText
	//Response callback: NONE
	else if(request.functionNameToCall === "MPIcomms_registerGhostPostStart")
		registerGhostPostStart(request.futurePostText, responseCallback);
	//-----------------------------------------------------------------------
	//.functionNameToCall: MPIcomms_registerGhostPostFinish
	//request.[Arguments]: NONE
	//Response callback: NONE
	else if(request.functionNameToCall === "MPIcomms_registerGhostPostFinish")
		registerGhostPostFinish(responseCallback);
	//========================================================================
	
	return true; //THIS IS VITAL, OR ELSE CHROME WON'T CALL YOUR CALLBACK IF IT'S INSIDE SOME ASYNC STUFF
	//see (http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent)
});
