//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================



//==========================STORAGE=======================================
//==========================STORAGE=======================================
//==========================STORAGE=======================================

let UNITTEST_VAR_weiboID1 = 5312;
let UNITTEST_VAR_weiboID2 = 5312999;
let UNITTEST_VAR_weiboID_adder = 12345;
let UNITTEST_VAR_weiboID_adder2 = 6789;
let UNITTEST_VAR_weiboName1 = "fivethreeonetwo";
let UNITTEST_VAR_weiboName2 = "fivethreeonetwoNINENINENINE";
let UNITTEST_VAR_weiboName_adder = "willaddposts";
let UNITTEST_VAR_weiboName_adder2 = "alsoaddsposts";

function runStorageUnitTests()
{
	let keyMapTestVals = {};
	let gppd1 = "ghostpostpostdays"+UNITTEST_VAR_weiboID1.toString();
	let gppd2 = "ghostpostpostdays"+UNITTEST_VAR_weiboID2.toString();
	//1239942400 = 04/17/2009 @ 4:26am (UTC)
	keyMapTestVals[gppd1] = [stripSubDayTime(1239942400000)];
	//1329942400 = 02/22/2012 @ 8:26pm (UTC)
	//1339942400 = 06/17/2012 @ 2:13pm (UTC)
	keyMapTestVals[gppd2] = [stripSubDayTime(1329942400000), stripSubDayTime(1339942400000)];
	chrome.storage.local.set(keyMapTestVals, function()
	{
	
	
	
	let posts20090417 = [];
	let posts20120222 = [];
	let posts20120617 = [];
	//do a bunch of post construction that we would like to be able to collapse when looking at this code
	{
		//build posts for 2009/4/17
		let pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID1;
		pushingPost.authorName = UNITTEST_VAR_weiboName1;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1239942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2009/04/17 AT 4:26am BY 5312";
		posts20090417.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID1;
		pushingPost.authorName = UNITTEST_VAR_weiboName1;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1239948400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2009/04/17 AT 6:06am BY 5312";
		posts20090417.push(pushingPost);
		
		
		//build posts for 2012/2/22
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID2;
		pushingPost.authorName = UNITTEST_VAR_weiboName2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY 5312999";
		posts20120222.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID2;
		pushingPost.authorName = UNITTEST_VAR_weiboName2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329946400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AROUND 9pm BY 5312999";
		posts20120222.push(pushingPost);
		
		
		//build posts for 2012/6/17
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID2;
		pushingPost.authorName = UNITTEST_VAR_weiboName2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1339942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/06/17 AT 2:13pm BY 5312999";
		posts20120617.push(pushingPost);
	}
	
	
	let postTestVals = {};
	postTestVals["ghostpost20090417"] = posts20090417;
	postTestVals["ghostpost20120222"] = posts20120222;
	postTestVals["ghostpost20120617"] = posts20120617;
	chrome.storage.local.set(postTestVals, function(){
	
	
	
	
	unittest_getAccountPostsBackTo();
	setTimeout(function()
	{
		unittest_msseToFloorYYYYMMDD();
		unittest_makeNormalizedAuthorDateSet();
		unittest_stripSubDayTime();
		unittest_updateStoredPosts();
		setTimeout(function()
		{
			unittest_getAllStoredDeletedPostsSince();
		}, 4000);
	}, 1000);
	
	});});
}

function unittest_getAccountPostsBackTo()
{
	let allTestsPassed = true;
	
	//1239742400000 = evening the day before 2009/04/17 AT 4:26am
	getAccountPostsBackTo(1239742400000, UNITTEST_VAR_weiboID2, function(returnedPosts6){
	//1240242400000 = a few days after 2009/04/17 AT 4:26am
	getAccountPostsBackTo(1240242400000, UNITTEST_VAR_weiboID2, function(returnedPosts5){
	//shortly before user 2's first post (so should get all 3)
	getAccountPostsBackTo(1329942400000 - 5*60*1000, UNITTEST_VAR_weiboID2,function(returnedPosts4){
	//shortly after user 2's first post, but before its second
	getAccountPostsBackTo(1329944400000, UNITTEST_VAR_weiboID2, function(returnedPosts3){
	//shortly after user 2's second post.
	getAccountPostsBackTo(1329946400000 + 5*60*1000, UNITTEST_VAR_weiboID2,function(returnedPosts2){
	//1380042400000 is far in the future and should get no posts.
	getAccountPostsBackTo(1380042400000, UNITTEST_VAR_weiboID2, function(returnedPosts1){
			let rp1Len = returnedPosts1.length;
			let rp2Len = returnedPosts2.length;
			let rp3Len = returnedPosts3.length;
			let rp4Len = returnedPosts4.length;
			let rp5Len = returnedPosts5.length;
			let rp6Len = returnedPosts6.length;
			if(rp1Len !== 0)
			{
				console.log("Error! getAccountPostsBackTo() tests 1 returned non-zero length post array: "+rp1Len.toString());
				allTestsPassed = false;
			}
			
			if(rp2Len !== 1)
			{
				console.log("Error! getAccountPostsBackTo() test 2 did not get one post; it got "+rp2Len.toString());
				allTestsPassed = false;
			}
			else if(returnedPosts2[0].text !== "THIS WAS POSTED ON 2012/06/17 AT 2:13pm BY 5312999")
			{
				console.log("Error! getAccountPostsBackTo() test 2's one post did not have the expected text, but rather: "+returnedPosts2[0].text);
				allTestsPassed = false;
			}
			
			if(rp3Len !== 2)
			{
				console.log("Error! getAccountPostsBackTo() test 3 did not get two posts; it got "+rp3Len.toString());
				allTestsPassed = false;
			}
			else if(returnedPosts3[0].text !== "THIS WAS POSTED ON 2012/02/22 AROUND 9pm BY 5312999" ||
				returnedPosts3[1].text !== "THIS WAS POSTED ON 2012/06/17 AT 2:13pm BY 5312999")
			{
				console.log("Error! getAccountPostsBackTo() test 3's two posts did not have the expected text, but rather: "+returnedPosts3[0].text+returnedPosts3[1].text);
				allTestsPassed = false;
			}
			
			if(rp4Len !== 3)
			{
				console.log("Error! getAccountPostsBackTo() test 4 did not get three posts; it got "+rp4Len.toString());
				allTestsPassed = false;
			}
			else if(returnedPosts4[0].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY 5312999" ||
				returnedPosts4[1].text !== "THIS WAS POSTED ON 2012/02/22 AROUND 9pm BY 5312999" ||
				returnedPosts4[2].text !== "THIS WAS POSTED ON 2012/06/17 AT 2:13pm BY 5312999")
			{
				console.log("Error! getAccountPostsBackTo() test 4's three posts did not have the expected text, but rather: "+returnedPosts4[0].text+returnedPosts4[1].text+returnedPosts4[2].text);
				allTestsPassed = false;
			}
			
			if(rp5Len !== 3)
			{
				console.log("Error! getAccountPostsBackTo() test 5 did not get three posts; it got "+rp5Len.toString());
				allTestsPassed = false;
			}
			else if(returnedPosts5[0].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY 5312999" ||
				returnedPosts5[1].text !== "THIS WAS POSTED ON 2012/02/22 AROUND 9pm BY 5312999" ||
				returnedPosts5[2].text !== "THIS WAS POSTED ON 2012/06/17 AT 2:13pm BY 5312999")
			{
				console.log("Error! getAccountPostsBackTo() test 5's three posts did not have the expected text, but rather: "+returnedPosts5[0].text+returnedPosts5[1].text+returnedPosts5[2].text);
				allTestsPassed = false;
			}
			
			if(rp6Len !== 3)
			{
				console.log("Error! getAccountPostsBackTo() test 6 did not get three posts; it got "+rp6Len.toString());
				allTestsPassed = false;
			}
			else if(returnedPosts6[0].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY 5312999" ||
				returnedPosts6[1].text !== "THIS WAS POSTED ON 2012/02/22 AROUND 9pm BY 5312999" ||
				returnedPosts6[2].text !== "THIS WAS POSTED ON 2012/06/17 AT 2:13pm BY 5312999")
			{
				console.log("Error! getAccountPostsBackTo() test 6's three posts did not have the expected text, but rather: "+returnedPosts6[0].text+returnedPosts6[1].text+returnedPosts6[2].text);
				allTestsPassed = false;
			}
			
			getAccountPostsBackTo(1080042400000, 777333555, function(shouldHaveNoPosts)
			{
				if(shouldHaveNoPosts.length !== 0)
				{
					console.log("getAccountPostsBackTo() does not return an empty array when asked for posts of a non-existent user.");
					allTestsPassed = false;
				}
				
				if(allTestsPassed)
					console.log("getAccountPostsBackTo() ok!");
				else
					console.log("getAccountPostsBackTo() FAILED!!!!!");
			});
			
	});});});});});});
}

function unittest_msseToFloorYYYYMMDD()
{
	let allTestsPassed = true;
	
	//1439942400000 = 08/19/2015, 00:00 (UTC)
	let curResult = msseToFloorYYYYMMDD(1439942400000);
	if(curResult !== "20150819")
	{
		console.log("Error! Expected msseToFloorYYYYMMDD(1439942400000) == '20150819', but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	//1440021255000 = 08/19/2015, 9:54pm (UTC)
	curResult = msseToFloorYYYYMMDD(1440021255000); 
	if(curResult !== "20150819")
	{
		console.log("Error! Expected msseToFloorYYYYMMDD(1440021255000) == '20150819', but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	//1451606400000 = first instant of new year, 2016
	curResult = msseToFloorYYYYMMDD(1451606400000); 
	if(curResult !== "20160101")
	{
		console.log("Error! Expected msseToFloorYYYYMMDD(1451606400000) == '20160101', but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	//1449882612000 = 12/12/2015 @ 1:10am (UTC)
	curResult = msseToFloorYYYYMMDD(1449882612000); 
	if(curResult !== "20151212")
	{
		console.log("Error! Expected msseToFloorYYYYMMDD(1449882612000) == '20151212', but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	if(allTestsPassed)
		console.log("msseToFloorYYYYMMDD() ok!");
	else
		console.log("msseToFloorYYYYMMDD() FAILED!!!!!");
}

function unittest_makeNormalizedAuthorDateSet()
{
	let allTestsPassed = true;
	let addSomePosts = [];
	
	let pushingPost = {};
	pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
	pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
	pushingPost.dateDeleted = MSSE_DATE_MAX;
	pushingPost.datePosted = 1329942400000;
	pushingPost.isReblog = false;
	pushingPost.reblog = {};
	pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2";
	addSomePosts.push(pushingPost);
	
	pushingPost = {};
	pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
	pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
	pushingPost.dateDeleted = MSSE_DATE_MAX;
	pushingPost.datePosted = 1239942400000;
	pushingPost.isReblog = false;
	pushingPost.reblog = {};
	pushingPost.text = "THIS WAS POSTED ON 2009/04/17 BY adder2";
	addSomePosts.push(pushingPost);
	
	pushingPost = {};
	pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
	pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
	pushingPost.dateDeleted = MSSE_DATE_MAX;
	pushingPost.datePosted = 1329941300000;
	pushingPost.isReblog = false;
	pushingPost.reblog = {};
	pushingPost.text = "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2";
	addSomePosts.push(pushingPost);

	
	pushingPost = {};
	pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
	pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
	pushingPost.dateDeleted = MSSE_DATE_MAX;
	pushingPost.datePosted = 1329942400000;
	pushingPost.isReblog = false;
	pushingPost.reblog = {};
	pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder";
	addSomePosts.push(pushingPost);
	
	pushingPost = {};
	pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
	pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
	pushingPost.dateDeleted = MSSE_DATE_MAX;
	pushingPost.datePosted = 1239942400000;
	pushingPost.isReblog = false;
	pushingPost.reblog = {};
	pushingPost.text = "THIS WAS POSTED ON 2009/04/17 BY adder";
	addSomePosts.push(pushingPost);
	
	pushingPost = {};
	pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
	pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
	pushingPost.dateDeleted = MSSE_DATE_MAX;
	pushingPost.datePosted = 1329941300000;
	pushingPost.isReblog = false;
	pushingPost.reblog = {};
	pushingPost.text = "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder";
	addSomePosts.push(pushingPost);
	
	
	let theRet = makeNormalizedAuthorDateSet(addSomePosts);
	
	if(theRet.queryAuths.length !== 2)
	{
		console.log("Error! makeNormalizedAuthorDateSet() should have returned queryAuths length 2, returned length "+theRet.queryAuths.length.toString());
		allTestsPassed = false;
	}
	if(theRet.queryAuths[0] !== ("ghostpostpostdays"+UNITTEST_VAR_weiboID_adder) || theRet.queryAuths[1] !== ("ghostpostpostdays"+UNITTEST_VAR_weiboID_adder2))
	{
		console.log("Error! makeNormalizedAuthorDateSet() should have returned queryAuths = [ghostpostpostdays"+UNITTEST_VAR_weiboID_adder+" , ghostpostpostdays"+UNITTEST_VAR_weiboID_adder2+"] but returned ["+theRet.queryAuths[0]+" , "+theRet.queryAuths[1]+"]");
		allTestsPassed = false;
	}
	if(theRet.queryAuths[0] !== theRet.authorDays[0].authStr)
	{
		console.log("Error! makeNormalizedAuthorDateSet() queryAuths[0] !== authorDays[0].authStr");
		allTestsPassed = false;
	}
	if(theRet.queryAuths[1] !== theRet.authorDays[1].authStr)
	{
		console.log("Error! makeNormalizedAuthorDateSet() queryAuths[1] !== authorDays[1].authStr");
		allTestsPassed = false;
	}
	if(theRet.authorDays[0].days.length !== 2)
	{
		console.log("Error! makeNormalizedAuthorDateSet() authorDays[0].days.length !== 2, but rather "+theRet.authorDays[0].days.length.toString());
		allTestsPassed = false;
	}
	if(theRet.authorDays[1].days.length !== 2)
	{
		console.log("Error! makeNormalizedAuthorDateSet() authorDays[1].days.length !== 2, but rather "+theRet.authorDays[1].days.length.toString());
		allTestsPassed = false;
	}
	if(!(	theRet.authorDays[0].days[0] === stripSubDayTime(1239942400000)
		&&	theRet.authorDays[0].days[1] === stripSubDayTime(1329941300000)
		&&	theRet.authorDays[1].days[0] === stripSubDayTime(1239942400000)
		&&	theRet.authorDays[1].days[1] === stripSubDayTime(1329941300000)))
	{
		console.log("Error! makeNormalizedAuthorDateSet() got a day wrong. Got "+theRet.authorDays[0].days[0]+","+theRet.authorDays[0].days[1]+","+theRet.authorDays[1].days[0]+","+theRet.authorDays[1].days[1]);
		allTestsPassed = false;
	}
	
	if(makeNormalizedAuthorDateSet([]).authorDays.length !== 0)
	{
		console.log("Error! makeNormalizedAuthorDateSet() doesn't know to give an empty reply to an empty request.");
		allTestsPassed = false;
	}
	
	if(allTestsPassed)
		console.log("makeNormalizedAuthorDateSet() ok!");
	else
		console.log("makeNormalizedAuthorDateSet() FAILED!!!!!");
}

function unittest_stripSubDayTime()
{
	let allTestsPassed = true;
	
	//1439942400000 = 08/19/2015, 00:00 (UTC)
	let curResult = stripSubDayTime(1439942400000); 
	if(curResult !== 1439942400000)
	{
		console.log("Error! Expected stripSubDayTime(1439942400000) == 1439942400000, but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	//1440021255000 = 08/19/2015, 9:54pm (UTC)
	curResult = stripSubDayTime(1440021255000); 
	if(curResult !== 1439942400000)
	{
		console.log("Error! Expected stripSubDayTime(1440021255000) == 1439942400000, but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	//1439982671000 = 08/19/2015 @ 11:11:11am (UTC)
	curResult = stripSubDayTime(1439982671000); 
	if(curResult !== 1439942400000)
	{
		console.log("Error! Expected stripSubDayTime(1439982671000) == 1439942400000, but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	//1439982660000 = 08/19/2015 @ 11:11:00am (UTC)
	curResult = stripSubDayTime(1439982660000); 
	if(curResult !== 1439942400000)
	{
		console.log("Error! Expected stripSubDayTime(1439982660000) == 1439942400000, but got "+curResult.toString());
		allTestsPassed = false;
	}
	
	if(allTestsPassed)
		console.log("stripSubDayTime() ok!");
	else
		console.log("stripSubDayTime() FAILED!!!!!");
}

var UNITTEST_VAR_unittest_updateStoredPosts_allPassed = true;
function unittest_updateStoredPosts()
{
	UNITTEST_VAR_unittest_updateStoredPosts_allPassed = true;
	let clearPostDaysMap = {};
	clearPostDaysMap["ghostpostpostdays"+UNITTEST_VAR_weiboID_adder] = [];
	clearPostDaysMap["ghostpostpostdays"+UNITTEST_VAR_weiboID_adder2] = [];
	clearPostDaysMap["ghostpostpostdays"+314159265359] = [];
	clearPostDaysMap["ghostpost20120222"] = [];
	clearPostDaysMap["ghostpost20090417"] = [];
	clearPostDaysMap["ghostpost20150821"] = [];
	clearPostDaysMap["ghostpost20150819"] = [];
	chrome.storage.local.set(clearPostDaysMap, function()
	{
		let pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2";
		
		updateStoredPosts([pushingPost]);
		console.log("Continuing updateStoredPosts() test in 500ms...");
		setTimeout(unittest_updateStoredPosts_step2, 500);
	});
}

function unittest_updateStoredPosts_step2()
{
	getAccountPostsBackTo(1111111100000, UNITTEST_VAR_weiboID_adder2, function(returnedPosts)
	{
		if(returnedPosts.length !== 1)
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding a single post with updateStoredPosts(), retrieved "+returnedPosts.length);
		}
		else if(returnedPosts[0].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2")
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding a single post with updateStoredPosts(), expected THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2, got "+returnedPosts[0].text);
		}
		
		let pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1239942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2009/04/17 BY adder2";
		
		updateStoredPosts([pushingPost]);
		console.log("Continuing updateStoredPosts() test in 500ms...");
		setTimeout(unittest_updateStoredPosts_step3, 500);
	});
}

function unittest_updateStoredPosts_step3()
{
	getAccountPostsBackTo(1111111100000, UNITTEST_VAR_weiboID_adder2, function(returnedPosts)
	{
		if(returnedPosts.length !== 2)
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding two posts with updateStoredPosts(), retrieved "+returnedPosts.length);
		}
		else if(returnedPosts[0].text !== "THIS WAS POSTED ON 2009/04/17 BY adder2" || returnedPosts[1].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2")
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding two posts with updateStoredPosts(), expected THIS WAS POSTED ON 2009/04/17 BY adder2, THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2, got "+returnedPosts[0].text+", "+returnedPosts[1].text);
		}
		
		let pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329941300000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2";
		
		updateStoredPosts([pushingPost]);
		console.log("Continuing updateStoredPosts() test in 500ms...");
		setTimeout(unittest_updateStoredPosts_step4, 500);
	});
}

function unittest_updateStoredPosts_step4()
{
	getAccountPostsBackTo(1111111100000, UNITTEST_VAR_weiboID_adder2, function(returnedPosts)
	{
		if(returnedPosts.length !== 3)
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding three posts with updateStoredPosts(), retrieved "+returnedPosts.length);
		}
		else if(returnedPosts[0].text !== "THIS WAS POSTED ON 2009/04/17 BY adder2" ||  returnedPosts[1].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2" || returnedPosts[2].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2")
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding three posts with updateStoredPosts(), expected...etc, got "+returnedPosts[0].text+", "+returnedPosts[1].text+", "+returnedPosts[2].text);
		}
		
		let pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder";
		
		updateStoredPosts([pushingPost]);
		console.log("Continuing updateStoredPosts() test in 500ms...");
		setTimeout(unittest_updateStoredPosts_step5, 500);
	});
}

function unittest_updateStoredPosts_step5()
{
	getAccountPostsBackTo(1111111100000, UNITTEST_VAR_weiboID_adder2, function(returnedPosts)
	{
		if(returnedPosts.length !== 3)
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding three posts by adder2 and one by adder with updateStoredPosts(), getting all of adder2's posts retrieved "+returnedPosts.length);
		}
		else if(returnedPosts[0].text !== "THIS WAS POSTED ON 2009/04/17 BY adder2" ||  returnedPosts[1].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2" || returnedPosts[2].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2")
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding three adder2 posts with updateStoredPosts(), and one for adder, expected...etc, got "+returnedPosts[0].text+", "+returnedPosts[1].text+", "+returnedPosts[2].text);
		}
		
		getAccountPostsBackTo(1111111100000, UNITTEST_VAR_weiboID_adder, function(returnedPosts2)
		{
			if(returnedPosts2.length !== 1)
			{
				UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
				console.log("after adding three posts by adder2 and ONE by adder with updateStoredPosts(), getting all of adder's posts retrieved "+returnedPosts2.length);
			}
			else if(returnedPosts2[0].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder")
			{
				UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
				console.log("after adding three adder2 posts with updateStoredPosts(), and ONE for adder, expected THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder, got "+returnedPosts2[0].text);
			}
			
			let pushingPost = {};
			pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
			pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
			pushingPost.dateDeleted = 1429941300000;
			pushingPost.datePosted = 1329941300000;
			pushingPost.isReblog = false;
			pushingPost.reblog = {};
			pushingPost.text = "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2";
			
			updateStoredPosts([pushingPost]);
			console.log("Continuing updateStoredPosts() test in 500ms...");
			setTimeout(unittest_updateStoredPosts_step6, 500);
		});
	});
}

function unittest_updateStoredPosts_step6()
{
	getAccountPostsBackTo(1111111100000, UNITTEST_VAR_weiboID_adder2, function(returnedPosts)
	{
		if(returnedPosts.length !== 3)
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding three posts by adder2 and one by adder with updateStoredPosts(), and updating one of adder2's as deleted, getting all of adder2's posts retrieved "+returnedPosts.length);
		}
		else if(returnedPosts[0].text !== "THIS WAS POSTED ON 2009/04/17 BY adder2" ||  returnedPosts[1].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2" || returnedPosts[2].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2")
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("after adding three adder2 posts with updateStoredPosts(), and one for adder, and updating one of adder2's as deleted, expected...etc, got "+returnedPosts[0].text+", "+returnedPosts[1].text+", "+returnedPosts[2].text);
		}
		else if(returnedPosts[1].dateDeleted !== 1429941300000)
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("updateStoredPosts() did not correctly mark an existing post as deleted! Its dateDeleted: "+returnedPosts[1].dateDeleted);
		}
		
		let multiAddPosts = [];
		let pushingPost = {};
		pushingPost.authorID = 314159265359;
		pushingPost.authorName = "pi";
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1440180592000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "A multi-add post, Aug 21 2015 (UTC)";
		multiAddPosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = 314159265359;
		pushingPost.authorName = "pi";
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1440170592000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "Earlier multi-add post, Aug 21 2015 (UTC)";
		multiAddPosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = 314159265359;
		pushingPost.authorName = "pi";
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1440000592000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "EarliEST multi-add post, Aug 19 2015 (UTC)";
		multiAddPosts.push(pushingPost);
		
		
		pushingPost = {};
		pushingPost.authorID = 7777777;
		pushingPost.authorName = "lucky";
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1430000592000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "A deleted post that will be simultaneously multi-added.";
		multiAddPosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = 7777777;
		pushingPost.authorName = "lucky";
		pushingPost.dateDeleted = 1440000592000;
		pushingPost.datePosted = 1430000592000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "A deleted post that will be simultaneously multi-added.";
		multiAddPosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = 7777777;
		pushingPost.authorName = "lucky";
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1430000592000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "A deleted post that will be simultaneously multi-added.";
		multiAddPosts.push(pushingPost);
		
		
		updateStoredPosts(multiAddPosts);
		console.log("Continuing updateStoredPosts() test in 500ms...");
		setTimeout(unittest_updateStoredPosts_step7, 500);
	});
}

function unittest_updateStoredPosts_step7()
{
	getAccountPostsBackTo(1111111100000, 314159265359, function(rpMulti)
	{
		if(rpMulti.length !== 3)
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("supposed to get 3 posts from the multi-add, but got: "+rpMulti.length);
		}
		else if(rpMulti[0].text !== "EarliEST multi-add post, Aug 19 2015 (UTC)" ||  rpMulti[1].text !== "Earlier multi-add post, Aug 21 2015 (UTC)" || rpMulti[2].text !== "A multi-add post, Aug 21 2015 (UTC)")
		{
			UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
			console.log("Error! updateStoredPosts() multi-add post text: "+rpMulti[0].text+", "+rpMulti[1].text+", "+rpMulti[2].text);
		}
		
		getAccountPostsBackTo(1111111100000, 7777777, function(shouldBeSingle)
		{
			if(shouldBeSingle.length !== 1)
			{
				UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
				console.log("simultaneous multi-add did not result in a single post, rather: "+shouldBeSingle.length);
			}
			if(shouldBeSingle[0].dateDeleted !== 1440000592000)
			{
				UNITTEST_VAR_unittest_updateStoredPosts_allPassed = false;
				console.log("simultaneous multi-add did not have dateDeleted = 1440000592000, rather: "+shouldBeSingle[0].dateDeleted);
			}
			
			if(UNITTEST_VAR_unittest_updateStoredPosts_allPassed)
				console.log("updateStoredPosts() ok!");
			else
				console.log("updateStoredPosts() FAILED!!!!!");
		});
	});
}

function unittest_getAllStoredDeletedPostsSince()
{
	console.log("Begin unittest_getAllStoredDeletedPostsSince()");
	let allTestsPassed = true;
	
	let addSomePosts = [];
	
	let pushingPost = {};
	
	//constructing a bunch of posts; make collapsible
	{
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2";
		addSomePosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1239942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2009/04/17 BY adder2";
		addSomePosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329941300000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2";
		addSomePosts.push(pushingPost);

		
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder";
		addSomePosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1239942400000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2009/04/17 BY adder";
		addSomePosts.push(pushingPost);
		
		pushingPost = {};
		pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
		pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
		pushingPost.dateDeleted = MSSE_DATE_MAX;
		pushingPost.datePosted = 1329941300000;
		pushingPost.isReblog = false;
		pushingPost.reblog = {};
		pushingPost.text = "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder";
		addSomePosts.push(pushingPost);
	}
	
	let clearPostDaysMap = {};
	clearPostDaysMap["ghostpostpostdays"+UNITTEST_VAR_weiboID_adder] = [];
	clearPostDaysMap["ghostpostpostdays"+UNITTEST_VAR_weiboID_adder2] = [];
	clearPostDaysMap["ghostpost20120222"] = [];
	clearPostDaysMap["ghostpost20090417"] = [];
	chrome.storage.local.set(clearPostDaysMap, function()
	{
		updateStoredPosts(addSomePosts);
		console.log("Continuing getAllStoredDeletedPostsSince() test in 500ms...");
		setTimeout(function()
		{
			let bothUIDs = [UNITTEST_VAR_weiboID_adder, UNITTEST_VAR_weiboID_adder2];
			//first, way in the future: should return none
			getAllStoredDeletedPostsSince(1429942400000, bothUIDs, function(allP1, allD1){
			if(allP1.length !== 0)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test1: returned more than 0 allPosts: "+allP1.length);
			}
			if(allD1.length !== 0)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test1: returned more than 0 allDeleted: "+allD1.length);
			}
			
			//way in the past, but with no accountIDs specified: still should return none
			getAllStoredDeletedPostsSince(1129942400000, [], function(allP2, allD2){
			if(allP2.length !== 0)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test2: returned more than 0 allPosts: "+allP2.length);
			}
			if(allD2.length !== 0)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test2: returned more than 0 allDeleted: "+allD2.length);
			}
			
			
			
			
			//way in the past, just one of the accounts: BECAUSE USER2 ONLY POSTED ON DAYS THAT USER1
			//POSTED ON, all 6 posts are returned.
			getAllStoredDeletedPostsSince(1129942400000, [UNITTEST_VAR_weiboID_adder], function(allP3, allD3){
			if(allP3.length !== 6)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test3: allPosts length "+allP3.length);
			}
			if(allD3.length !== 0)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test3: returned more than 0 allDeleted: "+allD3.length);
			}
			
			
			
			
			//way in the past, both accounts: should return all
			getAllStoredDeletedPostsSince(1129942400000, bothUIDs, function(allP4, allD4){
			if(allP4.length !== 6)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test4: allPosts length "+allP4.length);
			}
			else if(allP4[0].text !== "THIS WAS POSTED ON 2009/04/17 BY adder2" || 
					allP4[1].text !== "THIS WAS POSTED ON 2009/04/17 BY adder" || 
					allP4[2].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2" ||
					allP4[3].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder" ||
					allP4[4].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2" ||
					allP4[5].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test4: allPosts had wrong text: "+allP4[0].text+", "+allP4[1].text+", "+allP4[2].text+", "+allP4[3].text+", "+allP4[4].text+", "+allP4[5].text);
			}
			if(allD4.length !== 0)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test4: returned more than 0 allDeleted: "+allD4.length);
			}
			
			
			
			
			//before only the most recent post, both accounts: one post each
			getAllStoredDeletedPostsSince(1329942000000, bothUIDs, function(allP5, allD5){
			if(allP5.length !== 2)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test5: allPosts length "+allP5.length);
			}
			else if(allP5[0].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2" || 
					allP5[1].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test5: allPosts had wrong text: "+allP5[0].text+", "+allP5[1].text);
			}
			if(allD5.length !== 0)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test5: returned more than 0 allDeleted: "+allD5.length);
			}
			
			
			
			
			//after one post marked deleted, way in the past: return all (6) posts, plus that post as deleted
			pushingPost = {};
			pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
			pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
			pushingPost.dateDeleted = 1400000000000;
			pushingPost.datePosted = 1329941300000;
			pushingPost.isReblog = false;
			pushingPost.reblog = {};
			pushingPost.text = "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder";
			updateStoredPosts([pushingPost]);
			console.log("Continuing getAllStoredDeletedPostsSince() test in 500ms...");
			setTimeout(function(){
			getAllStoredDeletedPostsSince(1129942400000, bothUIDs, function(allP6, allD6){
			if(allP6.length !== 6)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test6: allPosts length "+allP6.length);
			}
			else if(allP6[0].text !== "THIS WAS POSTED ON 2009/04/17 BY adder2" || 
					allP6[1].text !== "THIS WAS POSTED ON 2009/04/17 BY adder" || 
					allP6[2].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2" ||
					allP6[3].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder" ||
					allP6[4].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2" ||
					allP6[5].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test6: allPosts had wrong text: "+allP6[0].text+", "+allP6[1].text+", "+allP6[2].text+", "+allP6[3].text+", "+allP6[4].text+", "+allP6[5].text);
			}
			if(allD6.length !== 1)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test6: allDeleted length "+allD6.length);
			}
			else if(allD6[0].dateDeleted !== 1400000000000 || allD6[0].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test6: deleted post del time "+allD6[0].dateDeleted + " and text: "+allD6[0].text);
			}
			
			
			
			
			//after other account also has a post marked deleted, way in the past: all (6) posts, plus those 2.
			pushingPost = {};
			pushingPost.authorID = UNITTEST_VAR_weiboID_adder2;
			pushingPost.authorName = UNITTEST_VAR_weiboName_adder2;
			pushingPost.dateDeleted = 1400000000000;
			pushingPost.datePosted = 1329942400000;
			pushingPost.isReblog = false;
			pushingPost.reblog = {};
			pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2";
			updateStoredPosts([pushingPost]);
			console.log("Continuing getAllStoredDeletedPostsSince() test in 500ms...");
			setTimeout(function(){
			getAllStoredDeletedPostsSince(1129942400000, bothUIDs, function(allP7, allD7){
			if(allP7.length !== 6)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test7: allPosts length "+allP7.length);
			}
			else if(allP7[0].text !== "THIS WAS POSTED ON 2009/04/17 BY adder2" || 
					allP7[1].text !== "THIS WAS POSTED ON 2009/04/17 BY adder" || 
					allP7[2].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2" ||
					allP7[3].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder" ||
					allP7[4].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2" ||
					allP7[5].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test7: allPosts had wrong text: "+allP7[0].text+", "+allP7[1].text+", "+allP7[2].text+", "+allP7[3].text+", "+allP7[4].text+", "+allP7[5].text);
			}
			if(allD7.length !== 2)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test7: allDeleted length "+allD7.length);
			}
			else if(allD7[0].dateDeleted !== 1400000000000 || allD7[0].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder"
			|| allD7[1].dateDeleted !== 1400000000000 || allD7[1].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test7: deleted post del time "+allD7[0].dateDeleted + ", "+allD7[1].dateDeleted+" and text: "+allD7[0].text+", "+allD7[1].text);
			}
			
			
			
			
			
			
			
			
			
			
			
			//a third post is marked deleted (a little bit later than the first 2 deleted ones): should get all three posts
			pushingPost = {};
			pushingPost.authorID = UNITTEST_VAR_weiboID_adder;
			pushingPost.authorName = UNITTEST_VAR_weiboName_adder;
			pushingPost.dateDeleted = 1410000000000;
			pushingPost.datePosted = 1329942400000;
			pushingPost.isReblog = false;
			pushingPost.reblog = {};
			pushingPost.text = "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder";
			updateStoredPosts([pushingPost]);
			console.log("Continuing getAllStoredDeletedPostsSince() test in 500ms...");
			setTimeout(function(){
			getAllStoredDeletedPostsSince(1300042400000, bothUIDs, function(allP8, allD8){
			if(allP8.length !== 4)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test8: allPosts length "+allP8.length);
			}
			else if(allP8[0].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder2" ||
					allP8[1].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder" ||
					allP8[2].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2" ||
					allP8[3].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test8: allPosts had wrong text: "+allP8[0].text+", "+allP8[1].text+", "+allP8[2].text+", "+allP8[3].text);
			}
			if(allD8.length !== 3)
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test8: allDeleted length "+allD8.length);
			}
			else if(allD8[0].dateDeleted !== 1400000000000 || allD8[0].text !== "THIS WAS POSTED ON 2012/02/22 EARLIER THAN 8:26pm BY adder"
			|| allD8[1].dateDeleted !== 1400000000000 || allD8[1].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder2"
			|| allD8[2].dateDeleted !== 1410000000000 || allD8[2].text !== "THIS WAS POSTED ON 2012/02/22 AT 8:26pm BY adder")
			{
				allTestsPassed = false;
				console.log("Error! getAllStoredDeletedPostsSince() test8: deleted post del time "+allD8[0].dateDeleted + ", "+allD8[1].dateDeleted+", "+allD8[2].dateDeleted+" and text: "+allD8[0].text+", "+allD8[1].text+", "+allD8[2].text);
			}
			
			if(allTestsPassed)
				console.log("getAllStoredDeletedPostsSince() ok!");
			else
				console.log("getAllStoredDeletedPostsSince() FAILED!!!!!");
			
			
			});}, 500);});}, 500);});}, 500);});});});});});
			
			
			
			
		}, 500);
	});
}

//runStorageUnitTests();
