//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================


//inserts all of postsToInsert into the right spots on the current page. 
//can be either the user's feed view or a specific account: we only look at the dates to decide where to insert.
function insertDeletedPosts(postsToInsert, isSpecificAccountPage)
{
	if(typeof postsToInsert === "undefined" || postsToInsert.length === 0)
		return;
	
	if(typeof isSpecificAccountPage === "undefined")
		isSpecificAccountPage = false;
	
	let allCardwraps = getAllPostCardwraps();

	let allDatedCardwraps = [];
	for(let cwInd = 0; cwInd < allCardwraps.length; cwInd++)
	{
		let newDatedCardwrap = {};
		newDatedCardwrap.post = allCardwraps[cwInd];
		newDatedCardwrap.date = timeFromAltText(
							//NOTE: there is guaranteed to be a time element; getAllPostCardwraps() only returns posts with time elements
							getLastElementByTagAttribute(allCardwraps[cwInd], "a", ["node-type"], ["feed_list_item_date"]).getAttribute("title"));
		allDatedCardwraps.push(newDatedCardwrap);
	}
	allDatedCardwraps.sort(function(a,b){return a.date - b.date;});
	
	let postGoesAfter = [];

	for(let pInd = 0; pInd < postsToInsert.length; pInd++)
	{
		let afterInd = binarySearchSuccessor(postsToInsert[pInd].datePosted, allDatedCardwraps, function(a,b)
			{return a - b.date;});

		let curPostGoesAfter = null;
		if(afterInd >= 0 && afterInd < allDatedCardwraps.length)
			curPostGoesAfter = allDatedCardwraps[afterInd].post;

		postGoesAfter.push(curPostGoesAfter);
	}

	for(let pInd = 0; pInd < postsToInsert.length; pInd++)
		insertPostAt(postGoesAfter[pInd], postsToInsert[pInd], isSpecificAccountPage);
}


//inserts insertMe into the page right after afterMe. insertMe is one of our Post structs (authorID etc), afterMe is a DOM object.
function insertPostAt(afterMe, insertMe, isSpecificAccountPage)
{
	if(typeof isSpecificAccountPage === "undefined")
		isSpecificAccountPage = false;
	
	//create the outer structure for the post's box
	let newBox = document.createElement("div");
	newBox.setAttribute("class", "WB_cardwrap WB_feed_type S_bg2");
	let newFeedDetail = document.createElement("div");
	newFeedDetail.setAttribute("class", "WB_feed_detail clearfix");
	
	//Need to show who the author of the post is, unless we're on that author's account page.
	if(!isSpecificAccountPage)
	{
		//<div class="WB_info"><a>link to user page</a></div>
		let divUserInfo = document.createElement("div");
		divUserInfo.setAttribute("class", "WB_info");
		divUserInfo.appendChild(constructUserLink(insertMe.authorID, insertMe.authorName));
		newFeedDetail.appendChild(divUserInfo);
	}
	
	//Set the post's body text
	let newTextContent = document.createElement("div");
	newTextContent.setAttribute("class", "WB_text W_f14");
	newTextContent.setAttribute("node-type", "feed_list_content");
	newTextContent.setAttribute("style", "color: #DD0000;");//font: Helvetica 12pt;border: 1px solid black;");
	newTextContent.appendChild(document.createTextNode(insertMe.text));
	newFeedDetail.appendChild(newTextContent);

	//write in a date element for when it was posted
	newFeedDetail.appendChild(constructDateElement(insertMe.datePosted));
    //write in a date element for (around) when it was deleted
	newFeedDetail.appendChild(constructDateElement(insertMe.dateDeleted, "删除不迟于: ", "DD0000"));
	
	newBox.appendChild(newFeedDetail);
	if(insertMe.isReblog)
		newBox.appendChild(constructReblog(insertMe));

	//write the post's verification status into the post's box
	printVerificationIntoPostBox(insertMe, newFeedDetail);
	
	if(afterMe === null || afterMe.parentNode === null)
	{
		//TOODO (LONGTERM) this should let it insert to a page with no posts (will contain 还没有发过微博)... need to test.
		let allCardwraps = getAllPostCardwraps();
		if(allCardwraps.length === 0)
			document.body.appendChild(newBox);
		else
			allCardwraps[0].parentNode.insertBefore(newBox, allCardwraps[0]);
	}
	else if(afterMe.nextSibling)
		afterMe.parentNode.insertBefore(newBox, afterMe.nextSibling);
	else
		afterMe.parentNode.appendChild(newBox);
}

//sourcePost is a DeletedPost struct, postBoxFeedDetail is a DOM div class="WB_feed_detail clearfix"
function printVerificationIntoPostBox(sourcePost, postBoxFeedDetail)
{
	if((!sourcePost.hasSignature &&(sourcePost.signature.signerID === global_ownWeiboID || 
									sourcePost.signature.signerID === CENTRAL_GP_SERVER_PLACEHOLDER_WEIBO_ID || 
									doWeFollowWeiboID(sourcePost.signature.signerID))))
	{
		postBoxFeedDetail.appendChild(constructNonLink("(Not verified)", "This post has not been verified by anyone that you trust: it could be forged.", "B4B5B6"));
		return;
	}
	
	let call_verifyDeletedPost = {};
	call_verifyDeletedPost.functionNameToCall = "MPIsubtleCrypto_verifyDeletedPost";
	call_verifyDeletedPost.postToVerify = sourcePost;
	call_verifyDeletedPost.ownWeiboID = global_ownWeiboID;
	chrome.runtime.sendMessage(call_verifyDeletedPost, function(verificationSucceeded){
	
	if(verificationSucceeded)
	{
		let verifierLink = {};
		
		if(sourcePost.signature.signerID === CENTRAL_GP_SERVER_PLACEHOLDER_WEIBO_ID)
		{
			verifierLink = constructNonLink(
							"(Reported by GhostPost central server)", 
							"This deleted post is verified to have been reported by the GhostPost central server. You can be sure this post really was posted, if you trust that we won't forge posts.",
							"009966");
		}
		else if(sourcePost.signature.signerID === global_ownWeiboID)
		{
			verifierLink = constructNonLink(
							"(Self-verified!)", 
							"This deleted post was recalled from your local storage: your own browser directly saw and recorded this post before it was deleted. This post is definitely not forged.",
							"76009A");
		}
		else
		{
			verifierLink = constructUserLink(sourcePost.signature.signerID, 
											sourcePost.signature.signerName,
											"Verified by: "+sourcePost.signature.signerName);
			verifierLink.setAttribute("style", "color: #000000;");//"color: #3366FF;");
		}
		postBoxFeedDetail.appendChild(verifierLink);
	}
	else
	{
		let verifierLink = constructNonLink(
							"VERIFICATION FAILED!",
							"Post is claimed to be verified by "+sourcePost.signature.signerName+", but it is not properly signed with their key! Post might be forged.",
							"FF860D");
		postBoxFeedDetail.appendChild(verifierLink);
	}
	});
}

function constructDateElement(mssUTCeDate, displayStringPrefix, colorHTMLHex)
{
	if(typeof displayStringPrefix === "undefined")
		displayStringPrefix = "";
	
	if(typeof colorHTMLHex === "undefined")
		colorHTMLHex = "000000";
	
	let theDateBox = document.createElement("div");
	theDateBox.setAttribute("class", "WB_from S_txt2");
	let innerDateElement = document.createElement("a");
	innerDateElement.setAttribute("class", "S_txt2");
	innerDateElement.setAttribute("title", timeToAbsoluteText(mssUTCeDate));
	innerDateElement.setAttribute("node-type", "feed_list_item_date");
	innerDateElement.setAttribute("style", "color: #"+colorHTMLHex+";");
	innerDateElement.appendChild(document.createTextNode(displayStringPrefix + timeToRelativeText(mssUTCeDate)));
    theDateBox.appendChild(innerDateElement);
	
	return theDateBox;
}

function constructNonLink(text, titleText, colorHex)
{
	let nonLink = document.createElement("a");
	nonLink.setAttribute("class", "W_f14 W_fb S_txt1");
	nonLink.setAttribute("style", "color: #"+colorHex+";");
	nonLink.setAttribute("title", titleText);
	nonLink.appendChild(document.createTextNode(text));
	
	return nonLink;
}

function constructUserLink(userID, userNickname, userDisplayNickname)
{
	if(typeof userDisplayNickname === "undefined")
		userDisplayNickname = userNickname;
	
	// <a node-type='feed_list_originNick' class="W_fb S_txt1" nick-name="北美省钱快报" 
		//  bpfilter="page_frame" href="/u/2132734472" title="北美省钱快报" usercard="id=2132734472">
		//        @北美省钱快报    </a>
	//(userDisplayNickname is the version with the @ there, and exists so that @ can be added.) 
	
	let userLink = document.createElement("a");
	userLink.setAttribute("node-type", "feed_list_originNick");
	userLink.setAttribute("class", "W_f14 W_fb S_txt1");
	userLink.setAttribute("nick-name", userNickname);
	userLink.setAttribute("title", userNickname);
	userLink.setAttribute("href","/u/"+userID);
	userLink.setAttribute("target","_blank");
	userLink.setAttribute("bpfilter", "page_frame");
	userLink.setAttribute("usercard", "id="+userID);
	userLink.appendChild(document.createTextNode(userDisplayNickname));
	
	return userLink;
}

function constructReblog(insertMe)
{
	//<div WB_detail>
	// <div WB_text node-type feed_list_content> 
	//   (****the post text****)
	// </div>
	// <div WB_feed_expand>
	//  <div W_arrow_bor><i class=S_bg1_br>[empty but this makes the arrow thing]</i></div>
	//  <div WB_expand>
	//   <div WB_info>
	//    <a linkToReblogAuthor/> (***any verification message... probably none for reblog though***)
	//   </div>
	//   <div WB_text node-type feed_list_reason>
	//      (***the reblog text***)
	//</div></div></div></div>

	//<div class="WB_feed_expand">
	let divWBFeedExpand = document.createElement("div");
	divWBFeedExpand.setAttribute("class", "WB_feed_expand");

	//<div class="W_arrow_bor W_arrow_bor_t"></div>
	let divWArrowBorder = document.createElement("div");
	divWArrowBorder.setAttribute("class", "W_arrow_bor W_arrow_bor_t");
	let iArrowThing = document.createElement("i");
	iArrowThing.setAttribute("class", "S_bg1_br");
	divWArrowBorder.appendChild(iArrowThing);
	divWBFeedExpand.appendChild(divWArrowBorder);

	//<div class="WB_expand S_bg1" node-type="feed_list_forwardContent">
	let divWBExpand = document.createElement("div");
	divWBExpand.setAttribute("class", "WB_expand S_bg1");
	divWBExpand.setAttribute("node-type", "feed_list_forwardContent");

	//Start the reblog box off with the name of the poster being reblogged.
	//<div class="WB_info">
	let divUserInfo = document.createElement("div");
	divUserInfo.setAttribute("class", "WB_info");
	divUserInfo.appendChild(constructUserLink(insertMe.reblog.authorID,
												insertMe.reblog.authorName,
												"@"+insertMe.reblog.authorName));
	divWBExpand.appendChild(divUserInfo);

	//Next comes the post text, post date, and deletion date. Here is the container for those 3:
	//<div class="WB_text" node-type="feed_list_reason">
	let divFeedListReason = document.createElement("div");
	divFeedListReason.setAttribute("class", "WB_text");
	divFeedListReason.setAttribute("node-type", "feed_list_reason");
	divFeedListReason.setAttribute("style", "color: #DD0000;");
	
	//Fill in the reblog's post text:
	divFeedListReason.appendChild(document.createTextNode(insertMe.reblog.text));
	//Create and fill the reblogged-posts-original-post-time box...
	divFeedListReason.appendChild(constructDateElement(insertMe.reblog.datePosted));
	//...and the deletion time box.
	divFeedListReason.appendChild(constructDateElement(insertMe.reblog.dateDeleted, 
														"删除不迟于: ", "DD0000"));
	
	divWBExpand.appendChild(divFeedListReason);
	
	divWBFeedExpand.appendChild(divWBExpand);
	return divWBFeedExpand;
}



//from here: http://www.quora.com/Is-there-a-Google-Chrome-plugin-or-extension-to-load-an-entire-page-which-normally-uses-infinite-scrolling
//for loading the infinite scrolling stuff.... might work? oh i think i see... this would move the screen around on the user
//let lastScrollHeight = 0;
//function autoScroll() {
//  let sh = document.documentElement.scrollHeight;
//  if (sh != lastScrollHeight) {
//    lastScrollHeight = sh;
//    document.documentElement.scrollTop = sh;
//  }
//}
//window.setInterval(autoScroll, 100);

