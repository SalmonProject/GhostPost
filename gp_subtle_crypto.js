//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================


//========================================================================
//The crypto.subtle stuff only works in a background/event page, so our 
//content pages have to use the functions in here via message passing.
//'Call' these functions by doing:
//
//let functionCallMessage = {};
//functionCallMessage.functionNameToCall = "MPIsubtleCrypto_verifyDeletedPost";
//functionCallMessage.postToVerify = somePostStruct;
//functionCallMessage.someOtherArg = "yay!";
//functionCallMessage.yetAnotherArg = 123;
//chrome.runtime.sendMessage(functionCallMessage, function(verificationSucceeded, someOtherRetVal)
//{
//	console.log(verificationSucceeded);
//	alert(verificationSucceeded);
//});
//
//Here are the functions that are accessible in that way:
//-----------------------------------------------------------------------
//request.functionNameToCall: MPIsubtleCrypto_verifyDeletedPost
//request.[Arguments]: struct DeletedPost .postToVerify,
//						long .ownWeiboID
//Response callback: responseCallback(bool verificationSucceeded)
//-----------------------------------------------------------------------
//.functionNameToCall: MPIsubtleCrypto_signAllDeletedPosts
//request.[Arguments]: struct DeletedPost[] .allPostsToSign,
//						long .ownWeiboID,
//						string .ownWeiboNickname
//Response callback: responseCallback(struct DeletedPost[] postsWithSigs)
//========================================================================









//Thanks to https://github.com/diafygi/webcrypto-examples
//for nice working examples of SubtleCrypto!
//#############################
//###   RSASSA-PKCS1-v1_5   ###
//#############################
let paramRSASSAPKCS1v1_5 = 
{
	name: "RSASSA-PKCS1-v1_5",
	modulusLength: 2048,
	publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
	hash: {name: "SHA-256"},
};

//theCallback(CryptoKey privateKey, CryptoKey publicKey, string publicN)
function generateStoreAndReturnKeypair(theCallback)
{
	//exportKey
	window.crypto.subtle.generateKey(paramRSASSAPKCS1v1_5, true, ["sign", "verify"])
	.then(function(generatedKey)
	{
		window.crypto.subtle.exportKey("jwk", generatedKey.privateKey)
		.then(function(exportedPrivKey)
		{
			chrome.storage.local.set({"gpOwnSignKeyPrivD": exportedPrivKey.d, 
									"gpOwnSignKeyPrivDP": exportedPrivKey.dp, 
									"gpOwnSignKeyPrivDQ": exportedPrivKey.dq, 
									"gpOwnSignKeyPrivP": exportedPrivKey.p, 
									"gpOwnSignKeyPrivQ": exportedPrivKey.q, 
									"gpOwnSignKeyPrivQI": exportedPrivKey.qi});
		})
		.catch(function(e){
			throw ("Failed to export a private key to jwk! Reason: "+e);});
		
		window.crypto.subtle.exportKey("jwk", generatedKey.publicKey)
		.then(function(exportedPubKey)
		{
			chrome.storage.local.set({"gpOwnSignKeyPubN": exportedPubKey.n});
			theCallback(generatedKey.privateKey, generatedKey.publicKey, exportedPubKey.n);
		})
		.catch(function(e){
			throw ("Failed to export a public key to jwk! Reason: "+e);});
	})
	.catch(function(e){
		throw ("Failed to generate an RSASSA PKCS1v1.5 keypair! Reason: "+e);});
}

//theCallback(CryptoKey privateKey, CryptoKey publicKey, bool wasGenerated, string publicN)
function loadOrGenerateKeypair(theCallback)
{
	chrome.storage.local.get([	"gpOwnSignKeyPubN", "gpOwnSignKeyPrivD", "gpOwnSignKeyPrivDP", 
								"gpOwnSignKeyPrivDQ", "gpOwnSignKeyPrivP", "gpOwnSignKeyPrivQ", 
								"gpOwnSignKeyPrivQI"], 
	function(result)
	{
		if(typeof result["gpOwnSignKeyPubN"] === "undefined" ||
			typeof result["gpOwnSignKeyPrivD"] === "undefined" ||
			typeof result["gpOwnSignKeyPrivDP"] === "undefined" ||
			typeof result["gpOwnSignKeyPrivDQ"] === "undefined" ||
			typeof result["gpOwnSignKeyPrivP"] === "undefined" ||
			typeof result["gpOwnSignKeyPrivQ"] === "undefined" ||
			typeof result["gpOwnSignKeyPrivQI"] === "undefined")
		{
			if(typeof result["gpOwnSignKeyPubN"] === "undefined" &&
				typeof result["gpOwnSignKeyPrivD"] === "undefined" &&
				typeof result["gpOwnSignKeyPrivDP"] === "undefined" &&
				typeof result["gpOwnSignKeyPrivDQ"] === "undefined" &&
				typeof result["gpOwnSignKeyPrivP"] === "undefined" &&
				typeof result["gpOwnSignKeyPrivQ"] === "undefined" &&
				typeof result["gpOwnSignKeyPrivQI"] === "undefined")
			{
				generateStoreAndReturnKeypair(function(generatedPrivate, generatedPublic, publicN)
				{
					reportPubkeyIfNeeded(publicN);
					theCallback(generatedPrivate, generatedPublic, true, publicN);
				});
				return;
			}
			else
			{
				throw "Some but not all fields of our keypair are not in storage... this really should never happen.";
			}
		}
		
		importPubkeyFromN(result["gpOwnSignKeyPubN"])
		.then(function(importedPubKey)
		{
			//import private jwk
			window.crypto.subtle.importKey
			(
				"jwk",
				{
					kty: "RSA",
					e: "AQAB",
					d: result["gpOwnSignKeyPrivD"],
					dp: result["gpOwnSignKeyPrivDP"],
					dq: result["gpOwnSignKeyPrivDQ"],
					n: result["gpOwnSignKeyPubN"],
					p: result["gpOwnSignKeyPrivP"],
					q: result["gpOwnSignKeyPrivQ"],
					qi: result["gpOwnSignKeyPrivQI"],
					alg: "RS256",
					ext: true
				}, 
				paramRSASSAPKCS1v1_5, 
				false, //cannot be extracted
				["sign"]
			)
			.then(function(importedPrivKey)
			{
				reportPubkeyIfNeeded(result["gpOwnSignKeyPubN"]);
				theCallback(importedPrivKey, importedPubKey, false, 'n');
			})
			.catch(function(e){
				throw ("Oh no... failed to import a jwk private key. I give up! Reason: "+e);});
		});
	});
}


//returns a Promise of a string containing the key's 'n'
function fetchFriendKey(weiboIDToFetch, ownWeiboID)
{
	getGhostPostPassword(function(ourPassword){
	if(typeof ourPassword === "undefined" || ourPassword === "")
		return; //need to be a registered user to be doing this!!!
	
	return new Promise(function(resolve, reject)
	{
		let targetIDIsFollowedByUs = doWeFollowWeiboID(weiboIDToFetch);
		
		if(!targetIDIsFollowedByUs)
			reject(false);
		else checkIfDangerousQueriesOK(function(okToQuery)
		{
			if(!okToQuery)
				reject(false);
			else
			{
				let queryParams = "wid=" + encodeURIComponent(weiboIDToFetch) + "&reqwid=" + encodeURIComponent(ownWeiboID) + "&gpass=" + encodeURIComponent(ourPassword);
				let xhr = new XMLHttpRequest();
				xhr.open("GET", CENTRAL_SERVER_URL+"/pubkey?"+queryParams, true);
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.onreadystatechange = function() 
				{
					if (xhr.readyState == 4) 
					{
						if (xhr.status == 200)//success
						{
							let parsedResponse = JSON.parse(xhr.responseText);
							if(typeof parsedResponse.n === "undefined" || parsedResponse.n === "NOSUCHUSER")
								reject(false);
							else
								resolve(parsedResponse.n);
						}
						else 
							reject(false);
					}
				};
				xhr.timeout = 12000;
				xhr.ontimeout = function () { reject(false); xhr.abort(); };
				xhr.send();
			}
		});
	});});
}

//returns Promise(CryptoKey friendsPubKey, or "NO KEY" on error)
function loadFriendPubKey(friendWeiboID)
{
	chrome.storage.local.get("gpFriendSignKeyWeiboID"+friendWeiboID, 
	function(storedFriendKey)
	{
		if(typeof storedFriendKey["gpFriendSignKeyWeiboID"+friendWeiboID] === "undefined")
			return new Promise(function(resolve, reject) { reject("NO KEY"); });
		else
			return importPubkeyFromN(storedFriendKey["gpFriendSignKeyWeiboID"+friendWeiboID]);
	});
}

//pubNToStore should be the 'n' (a string) of a jwk
function storeFriendPubKey(friendWeiboID, pubNToStore)
{
	let keyToSet = "gpFriendSignKeyWeiboID"+friendWeiboID;
	chrome.storage.local.set({keyToSet: pubNToStore});
}

//Returns Promise of a CryptoKey object
function importPubkeyFromN(pubkeyN)
{
	//import public jwk
	return window.crypto.subtle.importKey
	(
		"jwk", 
		{
			kty: "RSA",
			e: "AQAB",
			n: pubkeyN,
			alg: "RS256",
			ext: true
		}, 
		paramRSASSAPKCS1v1_5, 
		false, //cannot be extracted
		["verify"]
	)
	.catch(function(e){
		throw ("Oh no... failed to import a jwk public key. I give up! Reason: "+e);});
}

//theCallback(bool verificationWasSuccessful)
function verifyPostStructWithKeyObj(postToVerify, keyObject, theCallback)
{
	//StringView not yet supported i guess...
	let sigToVerify = new Uint8Array(atob(postToVerify.signature.postSignature)
										.split("").map(function(c){return c.charCodeAt(0);}));
	//let sigToVerify = StringView.base64ToBytes(postToVerify.signature.postSignature);
	
	let text2uint8 = new TextEncoder();
	let uint8ArrayToVerify = text2uint8.encode(signableFromPostStruct(postToVerify));
	
	window.crypto.subtle.verify(paramRSASSAPKCS1v1_5, keyObject, 
								sigToVerify, uint8ArrayToVerify)
	.then(function(verificationResult){theCallback(verificationResult);})
	.catch(function(e){alert("PKCS1.5 verification threw exception: "+e);});
}

//theCallback(bool verificationWasSuccessful)
function verifyDeletedPost(postToVerify, ownWeiboID, theCallback)
{
	//First, if the signature is supposedly our own, make sure to retrieve the key from the special
	//"own public key" storage, rather than "userID 12345678's key" storage
	if(postToVerify.signature.signerID === ownWeiboID)
		chrome.storage.local.get("gpOwnSignKeyPubN", function(results){
			importPubkeyFromN(results["gpOwnSignKeyPubN"]).then(function(importedOwnPubkey){
				verifyPostStructWithKeyObj(postToVerify, importedOwnPubkey, theCallback);});});
	
	//If the post came with the signer's public key, use it, and put it into storage.
	else if(postToVerify.signature.carryingPubkey)
	{
		storeFriendPubKey(postToVerify.signature.signerID, postToVerify.signature.carriedPubkeyN);
		
		importPubkeyFromN(postToVerify.signature.carriedPubkeyN).then(function(importedFetchedKey){
			verifyPostStructWithKeyObj(postToVerify, importedFetchedKey, theCallback);});
	}
	else //It's not our own sig, and it didn't come with public key attached. Get from storage or server.
	{
		loadFriendPubKey(postToVerify.signature.signerID)
		.then(function(friendPubKey){
			verifyPostStructWithKeyObj(postToVerify, friendPubKey, theCallback);})
		.catch(function(e) //this friend's key is not in storage!
		{
			//... so go fetch it from the dir server.
			//(fetchFriendKey knows not to try fetching a key for an ID we don't follow).
			fetchFriendKey(postToVerify.signature.signerID, ownWeiboID).
			then(function(fetchedKeyN)
			{
				storeFriendPubKey(postToVerify.signature.signerID, fetchedKeyN);
				
				importPubkeyFromN(fetchedKeyN).then(function(importedFetchedKey){
					verifyPostStructWithKeyObj(postToVerify, importedFetchedKey, theCallback);});
			})
			.catch(function(e2){theCallback(false);});
		});
	}
}

//theCallback(struct DeletedPost[] postsWithSigs)
function signAllDeletedPosts(allPostsToSign, ownWeiboID, ownWeiboNickname, theCallback)
{
	if(	   typeof allPostsToSign === undefined
		|| typeof allPostsToSign.length === "undefined" 
		|| allPostsToSign.length === 0)
	{
		theCallback([]);
		return;
	}
	
	//First, get our signing keypair: either recall it from storage, or if there isn't one in
	//there, generate a new one (and store it). If we had to generate a new one, then piggyback
	//the public key onto the signature objects so that the central server can learn + distribute it.
	loadOrGenerateKeypair(function(ourPrivKey, ourPubKey, newlyGenerated, publicN){
	//alert("DEBUG OK KEYPAIR IS HERE. allPostsToSign.length = "+allPostsToSign.length);
	
	let text2uint8 = new TextEncoder();
	let sigPromises = [];
	for(let i=0; i<allPostsToSign.length; i++)
	{
		let uint8ArrayToSign = text2uint8.encode(signableFromPostStruct(allPostsToSign[i]));
		sigPromises.push(window.crypto.subtle.sign(paramRSASSAPKCS1v1_5, ourPrivKey, 
													uint8ArrayToSign));
	}
	
	Promise.all(sigPromises)
	.then(function(allSigs)
	{
		for(let i=0; i<allPostsToSign.length; i++)
		{
			let theSignatureObject = {};
			theSignatureObject.carryingPubkey = newlyGenerated;
			theSignatureObject.carriedPubkeyN = (newlyGenerated ? publicN : 'n');
			
			//StringView not yet supported i guess...
			//theSignatureObject.postSignature = StringView.bytesToBase64(sigAsArray);
			let sigAsArray = new Uint8Array(allSigs[i]);
			theSignatureObject.postSignature = btoa(String.fromCharCode.apply(null, sigAsArray));
			
			theSignatureObject.signerID = ownWeiboID;
			theSignatureObject.signerName = ownWeiboNickname;
			
			allPostsToSign[i].hasSignature = true;
			allPostsToSign[i].signature = theSignatureObject;
		}
		theCallback(allPostsToSign);
	})
	.catch(function(e){alert("Not all posts were signed: "+e);theCallback([]);});
		
});}
