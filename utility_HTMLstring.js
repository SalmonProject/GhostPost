//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================

//Strip leading and trailing whitespace, including '\n' (as in, those actual characters).
function stripWhitespaceFromPost(postText)
{
	let strippedText = postText.replace(/^(\s|\\n)*/, "");
	return strippedText.replace(/(\s|\\n)*$/, "");
}
//let stripTests = ["\\n                          oops used to be Chinese but I messed up the file encoding TV5                        ",
//	 "    yayyyy   ", "othertestrt     ", "otherERtestrt\\n     ", "otherESTtestrt     \\n",
//	 "\\n   beginTest", "\\notherbegintest", "unchangedTest"];
//	 for(let testInd=0;testInd<stripTests.length;testInd++)
//		console.log("BEFORE: <<"+stripTests[testInd]+">>\nAFTER: <<"+stripWhitespaceFromPost(stripTests[testInd])+">>");










//input string assumed to be China's +8hrs time, returns UTC ms since epoch
function timeFromAltText(altText)
{
	//2015-06-27 15:17
	return Date.parse(altText.replace(" ", "T").concat("+08:00")); //thank you China for no DST
}

function timeToAbsoluteText(utcMSSE)
{
	let dateObj = new Date(utcMSSE + 8*60*60*1000); //add 8 hours for China
	let dateYear = dateObj.getUTCFullYear();
	let dateMonth = dateObj.getUTCMonth()+1;
	let dateDate = dateObj.getUTCDate();
	let dateHour = dateObj.getUTCHours();
	let dateMin = dateObj.getUTCMinutes();
	return dateYear.toString() + "-" + ("0"+dateMonth.toString()).slice(-2) + "-" + ("0"+dateDate.toString()).slice(-2) + " " + 
			("0"+dateHour.toString()).slice(-2) + ":" + ("0"+dateMin.toString()).slice(-2);
}

//10秒前 <----	NOTE we'll skip this one since it's unlikely a post will be posted, 
//				noticed by our system, deleted, deletion noticed by our system, queried by user all in under 1 minute.
//20分钟前
//(there is no "hours ago")
//今天 02:52
//(there is no "yesterday")
//6月26日 01:28
function timeToRelativeText(msSinceEpochUTC)
{
	let nowUTC = Date.now();
	if(nowUTC - msSinceEpochUTC < 60*60*1000)
		return Math.round((nowUTC - msSinceEpochUTC)/(60*1000)).toString() + "分钟前";

	let chinaDate = new Date(nowUTC + 8*60*60*1000);
	let argChinaDate = new Date(msSinceEpochUTC + 8*60*60*1000);

	if(chinaDate.getUTCFullYear() == argChinaDate.getUTCFullYear() &&
		chinaDate.getUTCMonth() == argChinaDate.getUTCMonth() &&
		chinaDate.getUTCDate() == argChinaDate.getUTCDate())
			return "今天 "+("0"+argChinaDate.getUTCHours().toString()).slice(-2)+":"+
							("0"+argChinaDate.getUTCMinutes().toString()).slice(-2);
	else if(chinaDate.getUTCFullYear() != argChinaDate.getUTCFullYear())
		return 	argChinaDate.getUTCFullYear().toString()+"年"+
				(argChinaDate.getUTCMonth()+1).toString()+"月"+
				argChinaDate.getUTCDate().toString()+"日 "+
				("0"+argChinaDate.getUTCHours().toString()).slice(-2)+":"+
				("0"+argChinaDate.getUTCMinutes().toString()).slice(-2);
	else
		return	(argChinaDate.getUTCMonth()+1).toString()+"月"+
				argChinaDate.getUTCDate().toString()+"日 "+
				("0"+argChinaDate.getUTCHours().toString()).slice(-2)+":"+
				("0"+argChinaDate.getUTCMinutes().toString()).slice(-2);
}




//Give this function a string starting at the beginning of or inside an HTML <> tag, but not within any of its attribute strings.
//Es.g.:	OK : <a href="hello.html">link text</a>
//			OK : a href="hello.html">link text</a>
//			OK : href="hello.html">link text</a>
//			OK : class="stuff" href="hello.html">link text</a>
//			NOT OK : uff" href="hello.html">link text</a>
//			NOT OK : " href="hello.html">link text</a>
//			NOT OK : "hello.html">link text</a>
//
//It will return the contents of href="", or return "" if there is no href. (Of course, could easily generalize this to any attribute name).
function findHrefInTag(inputString)
{
	let curInString = false; //ASSUMED to be starting false! See function description!
	let hrefStartInd = -1;
	
	for(let i = 0; i < inputString.length; i++)
	{
		if(!curInString && hrefStartInd < 0 && inputString.substring(i, i+"href".length) === "href")
		{
			i = hrefStartInd = inputString.indexOf("\"", i);
			curInString = true;
			continue; //skips to char after href's starting "
		}
		if(inputString.charAt(i) === '\\')
		{
			i++;      //skip next
			continue; //two chars
		}
		if(inputString.charAt(i) === '"')
		{
			if(hrefStartInd >= 0)
				return inputString.substring(hrefStartInd, i);
			
			curInString = !curInString;
		}
		if(!curInString && inputString.charAt(i) === '>')
			return "";
	}
	
	//if we're already into href, we could try returning what we have so far... but better to have a nice safe failure.
	//if they know they might have a full-but-unterminated href thing, they can always just append a " before calling the function.
	return ""; 
}



function extractConfigVal(theString, attributeName)
{
	let searchString = "$CONFIG['"+attributeName+"']='";
	let startCharInd = theString.indexOf(searchString) + searchString.length;
	if(startCharInd < 0)
		return;
	return theString.substring(startCharInd, theString.indexOf("'", startCharInd));
}

