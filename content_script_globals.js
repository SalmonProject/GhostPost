//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================

//"Content-script-local" global variables. That is, THESE GLOBAL VARIABLES 
//GET REINITIALIZED ON EVERY PAGE LOAD. For the most part, you should 
//probably only make something global if a value is obtained for it early 
//on in every page load - such as user's own Weibo ID.

let global_ownWeiboID = WEIBO_NONEXISTANT_ID;
let global_ownWeiboNickname = "NICKNAME NOT YET FILLED";
let global_followedIDs = [];

function doWeFollowWeiboID(weiboIDToFetch)
{
	for(let i=0; i<global_followedIDs.length; i++)
		if(weiboIDToFetch === global_followedIDs[i])
			return true;
	return false;
}
