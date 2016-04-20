angular.module('app.controllers', [])
  
.controller('startADriveCtrl', function($scope) {

})
   
.controller('settingsCtrl', function($scope) {
	//input listeners
	document.getElementById("message").addEventListener('input', function() {
		if (localStorage != undefined) {
			localStorage.setItem("message", document.getElementById("message").value)
		}
	});

	if(localStorage != undefined)
	{
		if (localStorage.getItem("message") != undefined) {
			document.getElementById("message").value = localStorage.getItem("message")
		} else {
			document.getElementById("message").value = "Your driver is on their way! View their drive here: www.exampleurl.com"
		}
	}
	else
	{
	  console.log("No local storage support");
	}
})
    