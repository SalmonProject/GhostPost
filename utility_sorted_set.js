//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================

//returns index of an element with the search key, or -1 if not found
function binarySearch(searchKey, arrayToSearch, compFunc)
{
	let left = 0;
	let right = arrayToSearch.length;
	while(left <= right)
	{
		if(left === right)
			return -1;
		else if(left+1 === right)
			return compFunc(searchKey, arrayToSearch[left]) === 0 ? left : -1;
		else if(left+2 === right)
		{
			if(compFunc(searchKey, arrayToSearch[left]) === 0)
				return left;
			return compFunc(searchKey, arrayToSearch[left+1]) === 0 ? left+1 : -1;
		}
		
		let ind = left + Math.floor((right-left)/2);
		
		let res = compFunc(searchKey, arrayToSearch[ind]);
		
		if(res < 0)
			right = ind;
		else if(res === 0)
			return ind;
		else if(res > 0)
			left = ind+1;
	}
	throw "Binary search out of bounds somehow!!!";
}

//returns index of smallest element GEq search key (or array.length if none)
function binarySearchSuccessor(searchKey, arrayToSearch, CompFunc)
{
	let left = 0;
	let right = arrayToSearch.length;
	while(left<=right)
	{
		if(left === right)
			return right;
		else if(left+1 === right)
		{
			if(CompFunc(searchKey, arrayToSearch[left]) <= 0)
				return left;
			else return right;
		}
		else if(left+2 === right)
		{
			if(CompFunc(searchKey, arrayToSearch[left]) <= 0)
				return left;
			else if(CompFunc(searchKey, arrayToSearch[left+1]) <= 0)
				return left+1;
			else return right;
		}
		
		let ind = left + Math.floor((right-left)/2);
		
		let res = CompFunc(searchKey, arrayToSearch[ind]);
		
		if(res < 0)
			right = ind;
		else if(res === 0)
			return ind;
		else if(res > 0)
			left = ind+1;
	}
	throw "Binary search out of bounds somehow!!!";
}

function setDifference(fromThisA, subtractThisB, compFunc)
{
	if(typeof fromThisA === "undefined" || fromThisA.length === 0)
		return [];
	if(typeof subtractThisB === "undefined" || subtractThisB.length === 0)
		return fromThisA;

	fromThisA.sort(compFunc);
	subtractThisB.sort(compFunc);
	
	let result = [];
	
	for(let indA = 0; indA < fromThisA.length; indA++)
		if(binarySearch(fromThisA[indA], subtractThisB, compFunc) < 0)
			result.push(fromThisA[indA]);
		
	//console.log("SET A: \n"+JSON.stringify(fromThisA)+"\n\n\nMINUS SET B:\n"+JSON.stringify(subtractThisB)+"\n\n\nRESULT: \n"+JSON.stringify(result));
	
	return result;
}

function setIntersection(A, B, compFunc)
{
	if(typeof A === "undefined" || typeof B === "undefined" || A.length === 0 || B.length === 0)
		return [];

	let biggerSet = [];
	let smallerSet = [];
	if(A.length <= B.length)
	{
		smallerSet = A;
		biggerSet = B;
	}
	else
	{
		smallerSet = B;
		biggerSet = A;
	}
	
	biggerSet.sort(compFunc);
	
	let result = [];
	
	for(let indA = 0; indA < smallerSet.length; indA++)
		if(binarySearch(smallerSet[indA], biggerSet, compFunc) >= 0)
			result.push(smallerSet[indA]);
	
	return result;
}

//When the "same" object is in both sets, we take it... but, "which one"? If the compFunc
//is only based on some fields, the others might differ, and we might desire one object over
//the other. For instance, if the objects are posts, prefer one with a signature over one without.
//tieBreaker(a, b) should be a function that returns whichever of a and b it thinks is "better".
//(tieBreaker is optional.)
function setUnion(A, B, compFunc, tieBreaker)
{
	if(typeof A === "undefined" || A.length === 0)
	{
		if(typeof B === "undefined") return [];
		else return B;
	}
	if(typeof B === "undefined" || B.length === 0)
		return A;
	
	if(typeof tieBreaker === "undefined")
		tieBreaker = function(a, b){return a;};

	A.sort(compFunc);
	B.sort(compFunc);
	
	let res = [];
	
	let aInd=0;
	let bInd=0;
	while(aInd < A.length && bInd < B.length)
	{
		let compCurAandB = compFunc(A[aInd], B[bInd]);
		if(compCurAandB === 0)
		{
			res.push(tieBreaker(A[aInd], B[bInd]));
			aInd++;
			bInd++;
		}
		else if(compCurAandB < 0)
		{
			res.push(A[aInd]);
			aInd++;
		}
		else //compCurAandB > 0
		{
			res.push(B[bInd]);
			bInd++;
		}
	}
	while(bInd < B.length)
	{
		res.push(B[bInd]);
		bInd++;
	}
	while(aInd < A.length)
	{
		res.push(A[aInd]);
		aInd++;
	}
	return res;
}
