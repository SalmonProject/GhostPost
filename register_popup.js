//use strict enables let, which makes variables work like REAL variables.
//(i.e. can be scoped more precisely than just "the function i'm in").
'use strict';
//========================================================================


function onStartRegButtonClick(event)
{
	event.preventDefault();
	
	let textBoxContent = document.getElementById("notyetposted").value;
	
	let call_registerGhostPostStart = {};
	call_registerGhostPostStart.functionNameToCall = "MPIcomms_registerGhostPostStart";
	call_registerGhostPostStart.futurePostText = textBoxContent;
	chrome.runtime.sendMessage(call_registerGhostPostStart, function(dummyparam){window.close();});
}

function onFinishRegButtonClick(event)
{
	event.preventDefault();
	
	let call_registerGhostPostFinish = {};
	call_registerGhostPostFinish.functionNameToCall = "MPIcomms_registerGhostPostFinish";
	chrome.runtime.sendMessage(call_registerGhostPostFinish, function(dummyparam){window.close();});
}

window.addEventListener("load", function(evt)
{
	chrome.storage.local.get(["ghostpostRegistrationPost"], function(getResults)
	{
		let regPostText = getResults["ghostpostRegistrationPost"];
		
		let startButton = document.getElementById("beginreg");
		let finishButton = document.getElementById("finishreg");
		
		if(typeof regPostText !== "undefined" && regPostText !== "" && regPostText !== "BLANK")
		{
			document.getElementById("notyetposted").value = regPostText;
			document.getElementById("notyetposted").disabled = true;
			
			startButton.disabled = true;
			finishButton.disabled = false;
			finishButton.addEventListener("click", onFinishRegButtonClick);
		}
		else
		{
			finishButton.disabled = true;
			startButton.disabled = false;
			startButton.addEventListener("click", onStartRegButtonClick);
		}
	});
});
