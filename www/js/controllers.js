angular.module('app.controllers', [])
  
.controller('startADriveCtrl', function($scope) {

})
   
.controller('settingsCtrl', function($scope) {
	var messageElement = document.getElementById("message")
	var codeElement = document.getElementById("compcode")
	var checkboxElement = document.getElementById("checkbox").getElementsByTagName('input')[0]

	//input listeners
	messageElement.addEventListener('input', function() {
		if (localStorage != undefined) {
			localStorage.setItem("message", messageElement.value)
		}
	});
	codeElement.addEventListener('input', function() {
		if (localStorage != undefined) {
			localStorage.setItem("compcode", codeElement.value)
		}
	});
	checkboxElement.addEventListener('click', function() {
		console.log(checkboxElement.checked)
		if (localStorage != undefined) {
			localStorage.setItem("checkbox", checkboxElement.checked)
		}
	});

	if(localStorage != undefined)
	{
		console.log("Local storage supported.");

		//set defaults
		if (localStorage.getItem("message") == undefined) {
			localStorage.setItem("message", "Your driver is on their way! View their drive here: www.exampleurl.com")
		}
		if (localStorage.getItem("checkbox") == undefined) {
			localStorage.setItem("checkbox", false)
		}
		if (localStorage.getItem("compcode") == undefined) {
			localStorage.setItem("compcode", "")
		}

		messageElement.value = localStorage.getItem("message")
		codeElement.value = localStorage.getItem("compcode")
		checkboxElement.checked = localStorage.getItem("checkbox")
		console.log(localStorage.getItem("checkbox"))
	}
	else
	{
	  console.log("No local storage support");
	}
})
    