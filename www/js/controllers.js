angular.module('app.controllers', [])
  
.controller('startADriveCtrl', function($scope) {
	var sendTextButton = document.getElementById("sendTextButton")
	var navigateButton = document.getElementById("navigateButton")
	var phoneInput = document.getElementById("phoneInput")
	var addressInput = document.getElementById("addressInput")

	if(localStorage != undefined) {
		sendTextButton.addEventListener('click', function() {
			if (localStorage.getItem("message") == undefined) {

			}
		});
		navigateButton.addEventListener('click', function() {
			window.plugins.toast.showShortBottom('hello')
		});
	}
})
   
.controller('settingsCtrl', function($scope) {
	var messageElement = document.getElementById("message")
	var codeElement = document.getElementById("compcode")
	var checkboxElement = document.getElementById("checkbox").getElementsByTagName('input')[0]
	var timeoutElement = document.getElementById("timeout")

	if(localStorage != undefined)
	{
		console.log("Local storage supported.");

		//input listeners
		messageElement.addEventListener('input', function() {
			localStorage.setItem("message", messageElement.value)
		});
		codeElement.addEventListener('input', function() {
			localStorage.setItem("compcode", codeElement.value)
		});
		checkboxElement.addEventListener('click', function() {
			localStorage.setItem("checkbox", checkboxElement.checked)
		});
		timeoutElement.addEventListener('input', function() {
			localStorage.setItem("timeout", timeoutElement.value)
		});

		//set defaults
		if (localStorage.getItem("message") == undefined) {
			localStorage.setItem("message", "Your driver is on their way! View their drive here: [link]")
		}
		if (localStorage.getItem("checkbox") == undefined) {
			localStorage.setItem("checkbox", false)
		}
		if (localStorage.getItem("compcode") == undefined) {
			localStorage.setItem("compcode", "")
		}
		if (localStorage.getItem("timeout") == undefined) {
			localStorage.setItem("timeout", "30")
		}

		messageElement.value = localStorage.getItem("message")
		codeElement.value = localStorage.getItem("compcode")
		checkboxElement.checked = localStorage.getItem("checkbox") === 'true'
		timeoutElement.value = localStorage.getItem("timeout")
	}
	else
	{
	  console.log("No local storage support");
	}
})
    