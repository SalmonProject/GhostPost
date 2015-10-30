//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================

function getLastElementByTagAttribute(searchUnder, tagName, attributeNames, attributeValues)
{
	if(attributeNames.length != attributeValues.length)
		throw "getLastElementByTagAttribute() was called with different numbers of attribute names and values";

	let rawByTag = searchUnder.getElementsByTagName(tagName);

	if(typeof rawByTag === "undefined" || rawByTag === null || rawByTag.length === 0)
		return null;

	for(let rInd = rawByTag.length - 1; rInd >= 0; rInd--)
	{
		let matches = true;
		for(let aInd = 0; aInd < attributeNames.length; aInd++)
		{
			let ughtemp = rawByTag[rInd].getAttribute(attributeNames[aInd]);
			if(typeof ughtemp === "undefined" || ughtemp !== attributeValues[aInd])
			{
				matches = false;
				break;
			}
		}
		if(matches)
			return rawByTag[rInd];
	}

	return null;
}

function getFirstElementByTagAttribute(searchUnder, tagName, attributeNames, attributeValues)
{
	if(attributeNames.length != attributeValues.length)
		throw "getFirstElementTagAttribute() was called with different numbers of attribute names and values";

	let rawByTag = searchUnder.getElementsByTagName(tagName);

	if(typeof rawByTag === "undefined" || rawByTag === null || rawByTag.length === 0)
		return null;

	for(let rInd = 0; rInd < rawByTag.length; rInd++)
	{
		let matches = true;
		for(let aInd = 0; aInd < attributeNames.length; aInd++)
		{
			let ughtemp = rawByTag[rInd].getAttribute(attributeNames[aInd]);
			if(typeof ughtemp === "undefined" || ughtemp !== attributeValues[aInd])
			{
				matches = false;
				break;
			}
		}
		if(matches)
			return rawByTag[rInd];
	}

	return null;
}

function getAllElementsByClassAttribute(searchUnder, className, attributeNames, attributeValues)
{
	if(attributeNames.length != attributeValues.length)
		throw "getAllElementsByClassAttribute() was called with different numbers of attribute names and values";

	let rawByClass = searchUnder.getElementsByClassName(className);

	if(typeof rawByClass === "undefined" || rawByClass === null || rawByClass.length === 0)
		return [];

	let retArray = [];

	for(let rInd = 0; rInd < rawByClass.length; rInd++)
	{
		let matches = true;
		for(let aInd = 0; aInd < attributeNames.length; aInd++)
		{
			let ughtemp = rawByClass[rInd].getAttribute(attributeNames[aInd]);
			if(typeof ughtemp === "undefined" || ughtemp !== attributeValues[aInd])
			{
				matches = false;
				break;
			}
		}
		if(matches)
			retArray.push(rawByClass[rInd]);
	}

	return retArray;
}

function getFirstElementByClassAttribute(searchUnder, className, attributeNames, attributeValues)
{
	if(attributeNames.length != attributeValues.length)
		throw "getFirstElementByClassAttribute() was called with different numbers of attribute names and values";

	let rawByClass = searchUnder.getElementsByClassName(className);

	if(typeof rawByClass === "undefined" || rawByClass === null || rawByClass.length === 0)
		return null;

	for(let rInd = 0; rInd < rawByClass.length; rInd++)
	{
		let matches = true;
		for(let aInd = 0; aInd < attributeNames.length; aInd++)
		{
			let ughtemp = rawByClass[rInd].getAttribute(attributeNames[aInd]);
			if(typeof ughtemp === "undefined" || ughtemp !== attributeValues[aInd])
			{
				matches = false;
				break;
			}
		}
		if(matches)
			return rawByClass[rInd];
	}

	return null;
}
