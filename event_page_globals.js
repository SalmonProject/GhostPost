//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================

//Event-page global variables. To be safe, these variables should be
//considered local to an invocation of an alarm - they should get filled
//at the beginning of the alarm response.
let global_ownWeiboID = WEIBO_NONEXISTANT_ID;
