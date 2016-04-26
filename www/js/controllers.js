var defaultMessage = "Your driver is on their way! View their drive here: [link]";
var DISTANCE_THRESSHOLD = 0.22; //in miles, distance where it'll end the session

angular.module('app.controllers', [])
  
.controller('startADriveCtrl', function($scope, $cordovaSms) {
	var button1 = document.getElementById("button1")
	var button2 = document.getElementById("button2")
	var phoneInput = document.getElementById("phoneInput")
	var addressInput = document.getElementById("addressInput")
	var savedAddressInput;
	var foregroundGPSWatchID;
	var activeForegroundWatcher;
	var bgLocationServices;
	var destinationCoordinates;
	var phoneNumber;
	var deviceLatitude;
	var deviceLongitude;
	var sessionID;
	var firebaseDB;

	//set local storage defaults
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

	//hack to get clicking on autocomplete working
	$scope.disableTap = function(){
	    container = document.getElementsByClassName('pac-container');
	    // disable ionic data tab
	    angular.element(container).attr('data-tap-disabled', 'true');
	    // leave input field if google-address-entry is selected
	    angular.element(container).on("click", function(){
	        addressInput.blur();
	    });
	  };

  	//get phone number
	window.plugins.sim.requestReadPermission();
	window.plugins.sim.getSimInfo(function(jsonObject) {
		console.log("Phone number retrieved: " + jsonObject.phoneNumber);
		phoneNumber = jsonObject.phoneNumber;
	}, function() {
		console.log("Error getting phone number");
	});

	// Bias the autocomplete object to the user's geographical location,
	// as supplied by the browser's 'navigator.geolocation' object.
	function geolocate() {
		if (navigator.geolocation) {
		  navigator.geolocation.getCurrentPosition(function(position) {
		  	deviceLatitude = position.coords.latitude;
		  	deviceLongitude = position.coords.longitude;
		    var geolocation = {
		      lat: position.coords.latitude,
		      lng: position.coords.longitude
		    };
		    var circle = new google.maps.Circle({
		      center: geolocation,
		      radius: position.coords.accuracy
		    });
		    autocomplete.setBounds(circle.getBounds());
		  }, function(error) {}, {timeout: 5000});
		}
	}


	var button1DefaultClickListener = function() {
		console.log("Send text button clicked");
		setStateGettingLocation();
		if (localStorage.getItem("compcode") == undefined || localStorage.getItem("compcode") == "") {
			window.plugins.toast.showShortBottom('You need to enter your company code in the Settings.')
			setStateReadyForDrive();
		} else if (phoneInput.value == "" || isNaN(phoneInput.value)) {
			window.plugins.toast.showShortBottom('Enter a valid phone number in the format 1234567890')
			setStateReadyForDrive();
		} else if (addressInput.value == "") {
			window.plugins.toast.showShortBottom('Enter a valid address')
			setStateReadyForDrive();
		} else {
			sessionID = Math.round(Math.random() * 10000000);
			var firebaseURL = "https://boiling-fire-1004.firebaseio.com/mapID/" + sessionID;
			console.log("Generated session ID, firebase URL: " + firebaseURL);
			firebaseDB = new Firebase(firebaseURL);
			//get address coordinates
			var xmlHttp = new XMLHttpRequest();
		    xmlHttp.onreadystatechange = function() { 
		        if (xmlHttp.readyState == 4) {
		        	if (xmlHttp.status == 200) {
		        		console.log("Address results returned");
			        	if (JSON.parse(xmlHttp.response).status == "ZERO_RESULTS") {
			            	window.plugins.toast.showShortBottom("Address not found");
			            	setStateReadyForDrive();
			            } else {
			            	destinationCoordinates = JSON.parse(xmlHttp.response).results[0].geometry.location;
			            	//destination coordinates found
				            if (destinationCoordinates.lat != "" && destinationCoordinates.lng != "") {
				            	console.log("Getting new device position");
				            	navigator.geolocation.getCurrentPosition(function(location) {
				            		console.log("New device position recieved");
				            		deviceLatitude = location.coords.latitude;
				            		deviceLongitude = location.coords.longitude;
				            		seeIfDestinationNearby()
				            	}, function(error) { 
				            		setStateReadyForDrive();
				            		window.plugins.toast.showShortBottom("Couldn't get current location");
				            	}, {timeout: 10000});
				            } else {	//destination coordinates not found
				            	setStateReadyForDrive();
			            		window.plugins.toast.showLongBottom("Couldn't find destination location");
				            }
			            }
		        	} else {
		        		window.plugins.toast.showShortBottom("Couldn't load address results");
		        		setStateReadyForDrive();
		        	}
		        } 
		    }
		    xmlHttp.open("GET", "http://maps.google.com/maps/api/geocode/json?address=" + encodeURIComponent(addressInput.value) + "&sensor=false", true); // true for asynchronous 
		    xmlHttp.send(null);
		}
	};
	var button1NavigateClickListener = function() {
		window.plugins.toast.showShortBottom('Opening maps...');
		if (device.platform = "Android") {
			window.open("geo:0,0?q=" + encodeURIComponent(savedAddressInput));
		} else if (device.platform = "iOS") {
			window.open('maps://?q=daddr='+destination);
		}
	};
	//stop drive
	var button2ClickListener = function() {
		stopGPSPolling();
	};
	var smsOptions = {
        replaceLineBreaks: false, // true to replace \n by a new line, false by default
        android: {
            // intent: 'INTENT'  // send SMS with the native android SMS messaging
            intent: '' // send SMS without open any other app
        }
    };

    function seeIfDestinationNearby() {
    	//destination is nearby
		if (distance(destinationCoordinates.lat, destinationCoordinates.lng, deviceLatitude, deviceLongitude) < 100) {
			console.log("Destination is nearby");
			savedAddressInput = addressInput.value
        	firebaseDB.update({destinationAddress: savedAddressInput, 
        		destinationLatitude: destinationCoordinates.lat, 
        		destinationLongitude: destinationCoordinates.lng,
        		currentLatitude: deviceLatitude,
        		currentLongitude: deviceLongitude,
        		timeStamp: Date.now()});
        	if (phoneNumber != undefined && localStorage.getItem("checkbox") == "true") {
        		firebaseDB.update({phoneNumber: phoneNumber});
        	}
        	sendText(savedAddressInput);
		} else {	//destination is too far away
			setStateReadyForDrive();
			window.plugins.toast.showLongBottom("Destination is over 100 miles away, if the location is closer be sure to add the city and state to get the correct location.");
		}
    }

	function stopGPSPolling() {
		clearInterval(activeForegroundWatcher);
		bgLocationServices.stop();
		setStateReadyForDrive();
	}

	//jsonLocation.lat and jsonLocation.lng
	function sendText(addressString) {
		setStateSendingText();
		console.log("Sending SMS...");
		if (localStorage.getItem("message") == "undefined") {
			localStorage.setItem("message", defaultMessage)
		}

		$cordovaSms
			.send(phoneInput.value, localStorage.getItem("message").replace("[link]", "http://mapsnap.ezizu.com/map.html?id=" + sessionID), smsOptions)
			.then(function() {
				window.plugins.toast.showShortBottom('Text message sent!');
				startGPS();
			}, function(error) {
				window.plugins.toast.showShortBottom('Error sending text message');
				setStateReadyForDrive();
			});
	}

	function setStateReadyForDrive() {
		button1.innerText = "Start Drive";
		button1.className = "button button-positive button-block";
		button1.removeEventListener('click', button1NavigateClickListener);
		button1.addEventListener('click', button1DefaultClickListener);
		button2.style.display="none";
	}

	function setStateGettingLocation() {
		button1.innerText = "Getting location...";
		button1.removeEventListener('click', button1NavigateClickListener);
		button1.removeEventListener('click', button1DefaultClickListener);
	}

	function setStateSendingText() {
		button1.innerText = "Sending text...";
		button1.removeEventListener('click', button1NavigateClickListener);
		button1.removeEventListener('click', button1DefaultClickListener);
	}

	function setStateDriveActive() {
		button1.innerText = "Navigate";
		button1.className = "button button-calm button-block";
		button2.style.display="block"
		button1.removeEventListener('click', button1DefaultClickListener);
		button1.addEventListener('click', button1NavigateClickListener);
	}

	function startGPS() {
		setStateDriveActive();

		//////////
		//FOREGROUND GPS
		//////////

		setupForegroundWatch(7000);

		// sets up the interval at the specified frequency
		function setupForegroundWatch(freq) {
		    // global var here so it can be cleared on logout (or whenever).
		    activeForegroundWatcher = setInterval(watchLocation, freq);
		}

		function onLocationError(error) {}

		// this is what gets called on the interval.
		function watchLocation() {
		    var gcp = navigator.geolocation.getCurrentPosition(
	            updateUserLocation, onLocationError, {
	                enableHighAccuracy: true,
	                timeout: 10000
	            });

		}

		function updateUserLocation(position) {
			firebaseDB.update({currentLatitude: position.coords.latitude, currentLongitude: position.coords.longitude});
			var dist = distance(position.coords.latitude, position.coords.longitude, destinationCoordinates.lat, destinationCoordinates.lng);
			if (dist < DISTANCE_THRESSHOLD) {
				endSession();
			}
			window.plugins.toast.showShortBottom('Location updated in foreground');
		}

		//////////
		//BACKGROUND GPS
		//////////

		bgLocationServices = window.plugins.backgroundLocationServices;
		bgLocationServices.configure({
			 //Both
		     desiredAccuracy: 1, // Desired Accuracy of the location updates (lower means more accurate but more battery consumption)
		     distanceFilter: 5, // (Meters) How far you must move from the last point to trigger a location update
		     debug: true, // <-- Enable to show visual indications when you receive a background location update
		     interval: 10000, // (Milliseconds) Requested Interval in between location updates.
		     //Android Only
		     notificationTitle: 'Where They At', // customize the title of the notification
		     notificationText: 'Sharing location, tap to open', //customize the text of the notification
		     fastestInterval: 7000, // <-- (Milliseconds) Fastest interval your app / server can handle updates
		     useActivityDetection: true // Uses Activitiy detection to shut off gps when you are still (Greatly enhances Battery Life)
		});

		//Register a callback for location updates, this is where location objects will be sent in the background
		bgLocationServices.registerForLocationUpdates(function(location) {
		     //console.log("We got a BG Update in registerForLocationUpdates" + JSON.stringify(location));
		     console.log("We got a BG Update in registerForLocationUpdates.");
		     firebaseDB.update({currentLatitude: location.latitude, currentLongitude: location.longitude});
		     var dist = distance(location.latitude, location.longitude, destinationCoordinates.lat, destinationCoordinates.lng);
		     if (dist < DISTANCE_THRESSHOLD) {
				endSession();
			 }
		}, function(err) {
		     console.log("Error: Didnt get an update", err);
		});

		//Register for Activity Updates (ANDROID ONLY)
		//Uses the Detected Activies API to send back an array of activities and their confidence levels
		//See here for more information: //https://developers.google.com/android/reference/com/google/android/gms/location/DetectedActivity
		bgLocationServices.registerForActivityUpdates(function(activities) {
		     console.log("We got a BG Update in registerForActivityUpdates" + activities);
		     firebaseDB.update({currentLatitude: location.latitude, currentLongitude: location.longitude});
		     var dist = distance(location.latitude, location.longitude, destinationCoordinates.lat, destinationCoordinates.lng);
		     if (dist < DISTANCE_THRESSHOLD) {
				endSession();
			 }
		}, function(err) {
		     console.log("Error: Something went wrong", err);
		});

		//Start the Background Tracker. When you enter the background tracking will start, and stop when you enter the foreground.
		bgLocationServices.start();
	}

	function endSession() {
		sessionID = null;
		stopGPSPolling();
		window.plugins.toast.showShortBottom("Sending an arrival text and stopping location sharing");
		$cordovaSms
			.send("9402935341", "Your driver is arriving soon!", smsOptions)
			.then(function() {
			}, function(error) {
			});
	}

	//distance between two coordinates in miles
	function distance(lat1, lon1, lat2, lon2) {
		var radlat1 = Math.PI * lat1/180
		var radlat2 = Math.PI * lat2/180
		var theta = lon1-lon2
		var radtheta = Math.PI * theta/180
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		dist = Math.acos(dist)
		dist = dist * 180/Math.PI
		dist = dist * 60 * 1.1515
		//window.plugins.toast.showShortBottom("From " + lat1 + "," + lon1 + " to " + lat2 + "," + lon2 + " is " + dist);
		return dist
	}


	/***********
	Actual code
	***********/
	button2.style.display="none";
	if(localStorage != undefined) {
		button1.addEventListener('click', button1DefaultClickListener);
		button2.addEventListener('click', button2ClickListener);
	}

	//setup autocomplete
	var autocomplete = new google.maps.places.Autocomplete(addressInput,
      {types: ['geocode']});
	geolocate();
})
   
.controller('settingsCtrl', function($scope) {
	var messageElement = document.getElementById("message")
	var codeElement = document.getElementById("compcode")
	var checkboxElement = document.getElementById("checkbox").getElementsByTagName('input')[0]

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

		messageElement.value = localStorage.getItem("message")
		codeElement.value = localStorage.getItem("compcode")
		checkboxElement.checked = localStorage.getItem("checkbox") === 'true'
	}
	else
	{
	  console.log("No local storage support");
	}
})
    