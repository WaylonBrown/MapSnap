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
			} else if (phoneInput.value == "" || isNaN(phoneInput.value)) {
				window.plugins.toast.showShortBottom('Enter a valid phone number in the format 1234567890')
			} else {
				if (localStorage.getItem("message") == "undefined") {
					localStorage.setItem("message", defaultMessage)
				}

				//send text message
				var options = {
		            replaceLineBreaks: false, // true to replace \n by a new line, false by default
		            android: {
		                // intent: 'INTENT'  // send SMS with the native android SMS messaging
		                intent: '' // send SMS without open any other app
		            }
		        };

				$cordovaSms
					.send(phoneInput.value, localStorage.getItem("message"), options)
					.then(function() {
						window.plugins.toast.showShortBottom('Text message sent!')
					}, function(error) {
						window.plugins.toast.showShortBottom('Error sending text message')
					});

				////////
				//GET BACKGROUND POSITION
				////////
				navigator.geolocation.getCurrentPosition();

				var bgLocationServices = window.plugins.backgroundLocationServices;
				bgLocationServices.configure({
					 //Both
				     desiredAccuracy: 1, // Desired Accuracy of the location updates (lower means more accurate but more battery consumption)
				     distanceFilter: 5, // (Meters) How far you must move from the last point to trigger a location update
				     debug: true, // <-- Enable to show visual indications when you receive a background location update
				     interval: 10000, // (Milliseconds) Requested Interval in between location updates.
				     //Android Only
				     notificationTitle: 'Where They At', // customize the title of the notification
				     notificationText: 'Sharing location, tap to stop sharing', //customize the text of the notification
				     fastestInterval: 7000, // <-- (Milliseconds) Fastest interval your app / server can handle updates
				     useActivityDetection: true // Uses Activitiy detection to shut off gps when you are still (Greatly enhances Battery Life)
				});

				//Register a callback for location updates, this is where location objects will be sent in the background
				bgLocationServices.registerForLocationUpdates(function(location) {
				     //console.log("We got a BG Update in registerForLocationUpdates" + JSON.stringify(location));
				     console.log("We got a BG Update in registerForLocationUpdates" + location.latitude);
				}, function(err) {
				     console.log("Error: Didnt get an update", err);
				});

				//Register for Activity Updates (ANDROID ONLY)
				//Uses the Detected Activies API to send back an array of activities and their confidence levels
				//See here for more information: //https://developers.google.com/android/reference/com/google/android/gms/location/DetectedActivity
				bgLocationServices.registerForActivityUpdates(function(activities) {
				     console.log("We got a BG Update in registerForActivityUpdates" + activities);
				}, function(err) {
				     console.log("Error: Something went wrong", err);
				});

				//Start the Background Tracker. When you enter the background tracking will start, and stop when you enter the foreground.
				bgLocationServices.start();
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
    