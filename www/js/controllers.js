var defaultMessage = "Your driver is on their way! View their drive here: [link]"

angular.module('app.controllers', [])
  
.controller('startADriveCtrl', function($scope, $cordovaSms) {
	var sendTextButton = document.getElementById("sendTextButton")
	var navigateButton = document.getElementById("navigateButton")
	var phoneInput = document.getElementById("phoneInput")
	var addressInput = document.getElementById("addressInput")

	if(localStorage != undefined) {
		sendTextButton.addEventListener('click', function() {
			if (localStorage.getItem("compcode") == undefined) {
				window.plugins.toast.showShortBottom('You need to enter your company code in the Settings.')
			} else {
				if (localStorage.getItem("message") == "undefined") {
					localStorage.setItem("message", defaultMessage)
				}

				//send text message
				var options = {
		            replaceLineBreaks: false, // true to replace \n by a new line, false by default
		            android: {
		                intent: ''  // send SMS with the native android SMS messaging
		                //intent: '' // send SMS without open any other app
		            }
		        };

				$cordovaSms
					.send('9402935341', localStorage.getItem("message"), options)
					.then(function() {
						window.plugins.toast.showShortBottom('Text message sent!')
					}, function(error) {
						window.plugins.toast.showShortBottom('Error sending text message')
					});
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
			localStorage.setItem("message", defaultMessage)
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
    