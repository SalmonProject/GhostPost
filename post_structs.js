//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================



//"DeletedPost" conceptual struct:
//{
//	authorID: "654321",
//	authorName: "ghostpost",
//	dateDeleted: 1234454564356345,
//	datePosted: 654321584651321,
//	hasSignature: true,
//	isReblog: true,
//	reblog: {DeletedReblog},
//	signature: {PostSignature}
//	text: "hey this is a post",
//}

//"PostSignature" conceptual struct:
//{
//	carriedPubkeyN: "fj837vcv67rnmvxcg98t235fdg"
//	carryingPubkey: true
//	postSignature: base64(subtleCrypto.sign(signableFromPostStruct(parent post struct)))
//	signerID: <a weibo ID>
//	signerName: <a weibo nickname>
//}

//"DeletedReblog" conceptual struct:
//{
//	authorID: "1234567",
//	authorName: "therebloggedperson",
//	dateDeleted: 54343463435453
//	datePosted: 4352647563735,
//	text: "this is an original post!!!",
//}

//"SignablePostStruct" conceptual struct:
//{
//	authorName: "ghostpost",
//	authorID: "654321",
//	text: "hey this is a post",
//	datePosted: 654321584651321,
//	dateDeleted: 1234454564356345,
//	isReblog: true,
//	reblog: {DeletedReblog},
//}

//Alright... because we should only be signing posts from within instances of this extension,
//and ECMAscript appears to have a standard for how JSON.stringify should work (which is 
//deterministic), and Chrome implements the ECMAscript standard, this should work. Ideally,
//though, we'd like something more robust. (Worst case, though, things break and signatures
//can't be verified: you certainly can't use the potential bug to forge anything.)
function signableFromPostStruct(thePost)
{
	let thingToSign = {};
	thingToSign.authorID = thePost.authorID;
	thingToSign.authorName = thePost.authorName
	thingToSign.dateDeleted = thePost.dateDeleted
	thingToSign.datePosted = thePost.datePosted
	thingToSign.isReblog = thePost.isReblog
	thingToSign.reblog = {};
	if(thePost.isReblog)
	{
		thingToSign.reblog.authorID = thePost.reblog.authorID;
		thingToSign.reblog.authorName = thePost.reblog.authorName;
		thingToSign.reblog.dateDeleted = thePost.reblog.dateDeleted;
		thingToSign.reblog.datePosted = thePost.reblog.datePosted;
		thingToSign.reblog.text = thePost.reblog.text;
	}
	else
	{
		thingToSign.reblog.authorID = 0;
		thingToSign.reblog.authorName = "A";
		thingToSign.reblog.dateDeleted = 0;
		thingToSign.reblog.datePosted = 0;
		thingToSign.reblog.text = "X";
	}
	thingToSign.text = thePost.text;
	
	return JSON.stringify(thingToSign);
}

function comparePosts(a,b)
{
	if(a.datePosted != b.datePosted)
		return a.datePosted - b.datePosted;
	
	if(a.authorID != b.authorID)
		return a.authorID - b.authorID;
	
	if(a.text === b.text && (a.isReblog === false && b.isReblog === false || a.isReblog === true && b.isReblog === true && a.reblog.text === b.reblog.text))
		return 0;
	
	return a.text < b.text ? -1 : 1;
}

//First, prefer signed posts over unsigned posts. Second, prefer posts signed by myself over
//posts signed by others. Third, prefer posts with earlier dateDeleted.
function tiebreakPosts(a,b)
{
	if(a.hasSignature && !b.hasSignature)
		return a;
	if(b.hasSignature && !a.hasSignature)
		return b;
	
	if(a.hasSignature && b.hasSignature)
	{
		if(a.signature.signerID === global_ownWeiboID)
			return a;
		if(b.signature.signerID === global_ownWeiboID)
			return b;
	}
	
	return (a.dateDeleted <= b.dateDeleted ? a : b);
}


function stripObjectsToPostFields(allPosts)
{
	let justThePosts = [];
	for(let rdInd = 0; rdInd < allPosts.length; rdInd++)
	{
        let htmlObjStripped = {};
        htmlObjStripped.authorName = allPosts[rdInd].authorName;
        htmlObjStripped.authorID = allPosts[rdInd].authorID;
        htmlObjStripped.text = allPosts[rdInd].text;
        htmlObjStripped.datePosted = allPosts[rdInd].datePosted;
        htmlObjStripped.dateDeleted = allPosts[rdInd].dateDeleted;
        htmlObjStripped.isReblog = (typeof allPosts[rdInd].isReblog === "undefined" ? false : allPosts[rdInd].isReblog);
		if(htmlObjStripped.isReblog)
			htmlObjStripped.reblog = allPosts[rdInd].reblog;
		else
		{
			//NOTE server needs whole structure to be as it expects, even if there isn't actually a reblog
			htmlObjStripped.reblog = {};
			htmlObjStripped.reblog.datePosted = 0;
			htmlObjStripped.reblog.dateDeleted = 0;
			htmlObjStripped.reblog.text = "X";
			htmlObjStripped.reblog.authorID = 0;
			htmlObjStripped.reblog.authorName = "A";
		}
		htmlObjStripped.hasSignature = (typeof allPosts[rdInd].hasSignature === "undefined" ? false : allPosts[rdInd].hasSignature);
		if(htmlObjStripped.hasSignature)
			htmlObjStripped.signature = allPosts[rdInd].signature;
		else
		{
			//NOTE server needs whole structure to be as it expects, even if there's no signature
			htmlObjStripped.signature = {};
			htmlObjStripped.signature.carriedPubkeyN = "n";
			htmlObjStripped.signature.carryingPubkey = false;
			htmlObjStripped.signature.signerID = WEIBO_NONEXISTANT_ID;
			htmlObjStripped.signature.signerName = "n";
			htmlObjStripped.signature.postSignature = "s";
		}
		
		justThePosts.push(htmlObjStripped);
	}
	return justThePosts;
}

//for DEBUG / TEST
function textOfPosts(thePosts)
{
	let theWSRE = /\\n\s*/g;
	let wholeString = "";
	for(let i=0;i<thePosts.length;i++)
	{
		let strippedPost = thePosts[i].text.replace(theWSRE, '');
		wholeString += (strippedPost + "\n=======================\n");
	}
	return wholeString;
}
