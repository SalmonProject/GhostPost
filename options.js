
//returns a Promise of a base64 string of the SHA-256 hash of inputString
function sha256DisplayBase64(inputString)
{
	var text2uint8 = new TextEncoder();
	var uint8ArrayToHash = text2uint8.encode(inputString);
	
	return new Promise(function(resolve, reject)
	{
		window.crypto.subtle.digest({name: "SHA-256"}, uint8ArrayToHash)
		.then(function(hash)
		{
			var hashAsArray = new Uint8Array(hash);
			resolve(btoa(String.fromCharCode.apply(null, hashAsArray)));
		})
		.catch(function(e){reject(e);});
	});
}

function listPubKeys()
{
	chrome.storage.local.get("ghostpostmyfolloweduids", function(followedGetRes){
	var ourFollowed = [];
	if(typeof followedGetRes["ghostpostmyfolloweduids"] !== "undefined")
		ourFollowed = followedGetRes["ghostpostmyfolloweduids"];
	var userKeysToRetrieve = [];
	var fInd = 0;
	for(fInd = 0; fInd < ourFollowed.length; fInd++)
		userKeysToRetrieve.push("gpFriendSignKeyWeiboID"+ourFollowed[fInd]);
	
	chrome.storage.local.get(userKeysToRetrieve, function(retrievedKeys){
	chrome.storage.local.get("gpOwnSignKeyPubN", function(ownPubKey){
	
	sha256DisplayBase64((typeof ownPubKey["gpOwnSignKeyPubN"] === "undefined" ? "[not yet generated]" : ownPubKey["gpOwnSignKeyPubN"]))
	.then(function(base64hash){
	
	var ownPubKeyN = (typeof ownPubKey["gpOwnSignKeyPubN"] === "undefined" ? "[not yet generated]" : base64hash);
	
	var keyHavingFriendsUIDs = [];
	var friendHashOutputPromises = [];
	for(fInd = 0; fInd < ourFollowed.length; fInd++)
		if(typeof retrievedKeys[userKeysToRetrieve[fInd]] !== "undefined")
		{
			keyHavingFriendsUIDs.push(ourFollowed[fInd]);
			friendHashOutputPromises.push(sha256DisplayBase64(retrievedKeys[userKeysToRetrieve[fInd]]));
		}
		
	Promise.all(friendHashOutputPromises).then(function(allBase64Hashes){
	
	
	var ourList = document.createElement("ul");
	
	var listSelfItem = document.createElement("li");
	listSelfItem.textContent = "Own key: "+ownPubKeyN;
	ourList.appendChild(listSelfItem);
	
	for(hInd = 0; hInd < allBase64Hashes.length; hInd++)
	{
		var curFriendItem = document.createElement("li");
		curFriendItem.textContent = keyHavingFriendsUIDs[hInd] + ": " + allBase64Hashes[hInd];
		ourList.appendChild(curFriendItem);
	}
	
	var pubKeyDisplayer = document.getElementById('pubkeydisplay');
	pubKeyDisplayer.textContent = "These are SHA-256 hashes (displayed in base-64) of base-64 strings of RSASSA-PKCS1-v1.5 public moduli (n). That is: base64(sha256(base64(RSA_n)))";
	pubKeyDisplayer.appendChild(ourList);

});});});});});}

document.getElementById('listpubkeys').addEventListener('click', listPubKeys);


var curAllowed = false;
function handleCheckClick()
{
	curAllowed = !curAllowed;
	
	var finalObject = {};
	if(curAllowed)
		finalObject["gpAllowNonFollowedToSeeOurDeletionReports"] = "true";
	else
		finalObject["gpAllowNonFollowedToSeeOurDeletionReports"] = "false";
	chrome.storage.local.set(finalObject);
	
	document.getElementById('followlabel').textContent = curAllowed ? 
			"Users you don't follow can currently see deleted posts you report" : 
			"Users you don't follow can NOT currently see deleted posts you report";
}

document.getElementById('allownonfollow').addEventListener('click', handleCheckClick);

document.getElementById('listpubkeys').addEventListener('click', listPubKeys);

chrome.storage.local.get("gpAllowNonFollowedToSeeOurDeletionReports", function(allowedRes){
		
	if(typeof allowedRes["gpAllowNonFollowedToSeeOurDeletionReports"] === "undefined" || 
		allowedRes["gpAllowNonFollowedToSeeOurDeletionReports"] === "true")
		curAllowed = true;
		
	document.getElementById('followlabel').textContent = curAllowed ? 
			"Users you don't follow can currently see deleted posts you report" : 
			"Users you don't follow can NOT currently see deleted posts you report";
});
