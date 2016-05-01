var defaultMessage = "Your driver is on their way! View their drive here: [link]";
var DISTANCE_SMS_THRESHOLD = 0.25; //in miles, distance where it'll send second SMS
var DISTANCE_END_THRESHOLD = 0.14; //in miles, distance where it'll end the session

angular.module('app.controllers', [])
  
.controller('startADriveCtrl', function($scope, $cordovaSms) {
	var button1 = document.getElementById("button1")
	var button2 = document.getElementById("button2")
	var phoneInput = document.getElementById("phoneInput")
	var addressInput = document.getElementById("addressInput")
	var clearText1 = document.getElementById("clearText1")
	var clearText2 = document.getElementById("clearText2")
	var savedAddressInput;
	var foregroundGPSWatchID;
	var activeForegroundWatcher;
	var bgLocationServices;
	var destinationCoordinates;
	var driverPhoneNumber;
	var customerPhoneNumber;
	var deviceLatitude;
	var deviceLongitude;
	var demoDestinationLat;
	var demoDestinationLng;
	var companyName;
	var sessionID;
	var firebaseDB;
	var sentSecondSMS = false;
	var lastTimeDeviceLocation;
	var demoMode = false;

	//set local storage defaults
	if (localStorage.getItem("message") == undefined) {
		localStorage.setItem("message", defaultMessage)
	}
	if (localStorage.getItem("checkbox") == undefined) {
		localStorage.setItem("checkbox", true)
	}
	if (localStorage.getItem("compcode") == undefined) {
		localStorage.setItem("compcode", "")
	}
	if (localStorage.getItem("driverPhoneNumber") == undefined) {
		localStorage.setItem("driverPhoneNumber", "");
	}
	if (localStorage.getItem("phoneNumberError") == undefined) {
		localStorage.setItem("phoneNumberError", false);
	}

  	//get phone number
  	if (device.platform == "Android") {
		window.plugins.sim.requestReadPermission();
	}
	window.plugins.sim.getSimInfo(function(jsonObject) {
		console.log("Phone number retrieved: " + jsonObject.phoneNumber);
		driverPhoneNumber = jsonObject.phoneNumber;
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
		  	lastTimeDeviceLocation = new Date().getTime();
		    var geolocation = {
		      lat: position.coords.latitude,
		      lng: position.coords.longitude
		    };
		    var circle = new google.maps.Circle({
		      center: geolocation,
		      radius: position.coords.accuracy
		    });
		    autocomplete.setBounds(circle.getBounds());
		  }, function(error) {}, {timeout: 7000});
		}
	}


	var button1DefaultClickListener = function() {
		setStateVerifyingData();
		checkDriverPhoneNumber();
	};
	var button1NavigateClickListener = function() {
		window.plugins.toast.showShortBottom('Opening maps...');
		if (device.platform == "Android") {
			if (!demoMode) {
				window.open("geo:0,0?q=" + encodeURIComponent(savedAddressInput));
			} else {
				window.open("geo:" + demoDestinationLat + "," + demoDestinationLng + "?q=" + demoDestinationLat + "," + demoDestinationLng);
			}
		} else if (device.platform = "iOS") {
			if (!demoMode) {
				window.open('maps://?q=daddr=' + encodeURIComponent(savedAddressInput));
			} else {
				window.open('maps://?q=daddr=' + demoDestinationLat + "," + demoDestinationLng);
			}
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

    function checkDriverPhoneNumber() {
    	demoMode = false;
    	//if driver wants to share phone number
    	if (localStorage.getItem("checkbox") == 'true') {
    		//if we have their phone number
    		if ((driverPhoneNumber != undefined && driverPhoneNumber != "") || 
					(localStorage.getItem("driverPhoneNumber") != undefined && localStorage.getItem("driverPhoneNumber") != "")) {
	    		checkCompanyCode();
	    	} else if (device.platform == "Android") {
	    		window.plugins.toast.showLongBottom("Error getting your phone number, try adding it in the Settings");
	    		localStorage.setItem("phoneNumberError", true);
	    		setStateReadyForDrive();
	    	} else {
	    		window.plugins.toast.showShortLong("You need to input your phone number in Settings if you want the customer to be able to call you");
	    		setStateReadyForDrive();
	    	}
    	} else {
    		checkCompanyCode();
    	}
    }

    function checkCompanyCode() {
    	if (!isInDemoMode()) {
    		console.log("Not in demo mode");
    		if (localStorage.getItem("compcode") == undefined || localStorage.getItem("compcode") == "") {
				window.plugins.toast.showShortBottom('You need to enter your company code in the Settings.');
				setStateReadyForDrive();
			} else {
				var companyCodeDB = new Firebase("https://boiling-fire-1004.firebaseio.com/company/" + localStorage.getItem("compcode").replace(/\s/g, '').toLowerCase());
				companyCodeDB.once("value", function(snapshot) {
	  				var companyExists = snapshot.exists();
	  				if (companyExists) {
	  					setStateGettingLocation();
	  					var dataObject = companyCodeDB.on("value", function(snapshot) {
	          				companyName = snapshot.val().name;
	          				console.log("Company exists with name " + companyName);
	          				if (companyName != undefined) {
								checkValuesForDrive();
	          				} else {
	          					window.plugins.toast.showShortBottom("Company name not defined, please contact MapSnap")
								setStateReadyForDrive();
	          				}
	          			});
	  				} else {
	  					window.plugins.toast.showShortBottom("That company code doesn't exists, see if you typed it correctly in the Settings")
						setStateReadyForDrive();
	  				}
	  			});
			}
    	} else {
    		console.log("In demo mode");
    		demoMode = true;
    		companyName = "DEMO MODE (Your company name here)";
    		setStateGettingLocation();
    		checkValuesForDrive();
    	}
    	
	}

	function isInDemoMode() {
		if (localStorage.getItem("compcode") == undefined || localStorage.getItem("compcode") == "") {
			return false;
		}
		return localStorage.getItem("compcode").replace(/\s/g, '').toLowerCase() == "demo";
	}

	function checkValuesForDrive() {
    	if (phoneInput.value == "" || isNaN(phoneInput.value)) {
			window.plugins.toast.showShortBottom('Enter a valid phone number in the format 1234567890')
			setStateReadyForDrive();
		} else if (addressInput.value == "" && !demoMode) {
			window.plugins.toast.showShortBottom('Enter a valid address')
			setStateReadyForDrive();
		} else {
			customerPhoneNumber = phoneInput.value;
			sessionID = Math.round(Math.random() * 1000000000);
			var firebaseURL = "https://boiling-fire-1004.firebaseio.com/mapID/" + sessionID;
			console.log("Generated session ID, firebase URL: " + firebaseURL);
			firebaseDB = new Firebase(firebaseURL);

			if (!demoMode) {
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
					            	if (needsUpdatedLocation()) {
					            		console.log("Getting new device position");
						            	navigator.geolocation.getCurrentPosition(function(location) {
						            		console.log("New device position recieved");
						            		lastTimeDeviceLocation = new Date().getTime();
						            		deviceLatitude = location.coords.latitude;
						            		deviceLongitude = location.coords.longitude;
						            		seeIfDestinationNearby()
						            	}, function(error) { 
						            		setStateReadyForDrive();
						            		window.plugins.toast.showShortBottom("Couldn't get current location");
						            	}, {timeout: 10000});
					            	} else {
					            		console.log("Using previous device position")
					            		seeIfDestinationNearby();
					            	}
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
			} else {
				if (needsUpdatedLocation()) {
            		console.log("Getting new device position - DEMO MODE");
	            	navigator.geolocation.getCurrentPosition(function(location) {
	            		console.log("New device position recieved");
	            		lastTimeDeviceLocation = new Date().getTime();
	            		deviceLatitude = location.coords.latitude;
	            		deviceLongitude = location.coords.longitude;
	            		generateDemoCoordinates();
	            	}, function(error) { 
	            		setStateReadyForDrive();
	            		window.plugins.toast.showShortBottom("Couldn't get current location");
	            	}, {timeout: 10000});
            	} else {
            		console.log("Using previous device position")
            		generateDemoCoordinates();
            	}
			}			
		}
    }

    function generateDemoCoordinates() {
    	demoDestinationLat = deviceLatitude + 0.05;
    	demoDestinationLng = deviceLongitude + 0.05;
    	seeIfDestinationNearby();
    }

    function needsUpdatedLocation() {
    	if (lastTimeDeviceLocation == undefined) {
    		return true;
    	}
    	var now = new Date().getTime();
    	var secondsPast = (now - lastTimeDeviceLocation) / 1000;
    	console.log("Seconds past: " + secondsPast + ", now: " + now + ", lastTimeDeviceLocation: " + lastTimeDeviceLocation);
    	if (secondsPast >= 60) {
    		return true;
    	}
    	return false;
    }

    function seeIfDestinationNearby() {
    	//destination is nearby
		if ((!demoMode && distance(destinationCoordinates.lat, destinationCoordinates.lng, deviceLatitude, deviceLongitude) < 300) || 
			(demoMode && distance(demoDestinationLat, demoDestinationLng, deviceLatitude, deviceLongitude) < 300)){
			console.log("Destination is nearby");
			savedAddressInput = addressInput.value
        	firebaseDB.update({currentLatitude: deviceLatitude,
        		currentLongitude: deviceLongitude,
        		companyName: companyName,
        		timeStamp: Date.now()});

        	if (!demoMode) {
        		firebaseDB.update({destinationAddress: savedAddressInput,
        			destinationLatitude: destinationCoordinates.lat, 
        			destinationLongitude: destinationCoordinates.lng});
        	} else {
        		firebaseDB.update({destinationAddress: (demoDestinationLat + "," + demoDestinationLng),
        			destinationLatitude: demoDestinationLat,
        			destinationLongitude: demoDestinationLng});
        	}

        	if (localStorage.getItem("checkbox") == "true") {
        		if (driverPhoneNumber != undefined && driverPhoneNumber != "") {
	        		firebaseDB.update({driverPhoneNumber: driverPhoneNumber});
	        	} else if (localStorage.getItem("driverPhoneNumber") != undefined && localStorage.getItem("driverPhoneNumber") != "") {
	        		firebaseDB.update({driverPhoneNumber: localStorage.getItem("driverPhoneNumber")});
	        	}
        	}
        	sendText(savedAddressInput);
		} else {	//destination is too far away
			setStateReadyForDrive();
			window.plugins.toast.showLongBottom("Destination is over 300 miles away, if the location is closer be sure to add the city and state to get the correct location.");
		}
    }

	//jsonLocation.lat and jsonLocation.lng
	function sendText(addressString) {
		setStateSendingText();
		console.log("Sending SMS...");
		if (localStorage.getItem("message") == "undefined" || localStorage.getItem("message") == "") {
			localStorage.setItem("message", defaultMessage);
		}

		$cordovaSms
			.send(customerPhoneNumber, localStorage.getItem("message").replace("[link]", "http://mapsnap.net/map.html?id=" + sessionID), smsOptions)
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
		sentSecondSMS = false;
	}

	function setStateVerifyingData() {
		button1.innerText = "Verifying data...";
		button1.removeEventListener('click', button1NavigateClickListener);
		button1.removeEventListener('click', button1DefaultClickListener);
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

	function checkDistanceThreshold(distance) {
		if (distance < DISTANCE_SMS_THRESHOLD && !sentSecondSMS) {
			console.log("Distance is within SMS range");
			sentSecondSMS = true;
			$cordovaSms
				.send(customerPhoneNumber, "Your driver is arriving soon!", smsOptions)
				.then(function() { 
					window.plugins.toast.showShortBottom("Sent an arrival text");
				}, function(error) {
					window.plugins.toast.showShortBottom("Failed to send arrival text");
			});	
		} else if (distance < DISTANCE_END_THRESHOLD) {
			console.log("Distance is within end session range");
			sessionID = null;
			stopGPSPolling();
			window.plugins.toast.showShortBottom("Arrived, ending session");
		} else {
			console.log("Distance isn't within SMS or end session ranges");
		}
	}

	function stopGPSPolling() {
		clearInterval(activeForegroundWatcher);
		bgLocationServices.stop();
		setStateReadyForDrive();
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
			var dist;
			if (!demoMode) {
				dist = distance(position.coords.latitude, position.coords.longitude, destinationCoordinates.lat, destinationCoordinates.lng);
			} else {
				dist = distance(position.coords.latitude, position.coords.longitude, demoDestinationLat, demoDestinationLng);
			}
			checkDistanceThreshold(dist);
			//window.plugins.toast.showShortBottom('Location updated in foreground');
			deviceLatitude = position.coords.latitude;
			deviceLongitude = position.coords.longitude;
			lastTimeDeviceLocation = new Date().getTime();
		}

		//////////
		//BACKGROUND GPS
		//////////

		bgLocationServices = window.plugins.backgroundLocationServices;
		bgLocationServices.configure({
			 //Both
		     desiredAccuracy: 1, // Desired Accuracy of the location updates (lower means more accurate but more battery consumption)
		     distanceFilter: 10, // (Meters) How far you must move from the last point to trigger a location update
		     debug: false, // <-- Enable to show visual indications when you receive a background location update
		     interval: 10000, // (Milliseconds) Requested Interval in between location updates.
		     //Android Only
		     notificationTitle: 'MapSnap', // customize the title of the notification
		     notificationText: 'Sharing location, tap to open', //customize the text of the notification
		     fastestInterval: 7000, // <-- (Milliseconds) Fastest interval your app / server can handle updates
		     useActivityDetection: true // Uses Activitiy detection to shut off gps when you are still (Greatly enhances Battery Life)
		});

		//Register a callback for location updates, this is where location objects will be sent in the background
		bgLocationServices.registerForLocationUpdates(function(location) {
			//console.log("We got a BG Update in registerForLocationUpdates" + JSON.stringify(location));
			console.log("We got a BG Update in registerForLocationUpdates.");
			firebaseDB.update({currentLatitude: location.latitude, currentLongitude: location.longitude});
			var dist;
			if (!demoMode) {
				dist = distance(location.latitude, location.longitudee, destinationCoordinates.lat, destinationCoordinates.lng);
			} else {
				dist = distance(location.latitude, location.longitude, demoDestinationLat, demoDestinationLng);
			}
			checkDistanceThreshold(dist);
			deviceLatitude = location.latitude;
			deviceLongitude = location.longitude;
			lastTimeDeviceLocation = new Date().getTime();
		}, function(err) {
		     console.log("Error: Didnt get an update", err);
		});

		//Register for Activity Updates (ANDROID ONLY)
		//Uses the Detected Activies API to send back an array of activities and their confidence levels
		//See here for more information: //https://developers.google.com/android/reference/com/google/android/gms/location/DetectedActivity
		bgLocationServices.registerForActivityUpdates(function(activities) {
		     // console.log("We got a BG Update in registerForActivityUpdates" + activities);
		     // firebaseDB.update({currentLatitude: location.latitude, currentLongitude: location.longitude});
		     // var dist = distance(location.latitude, location.longitude, destinationCoordinates.lat, destinationCoordinates.lng);
		     // checkDistanceThreshold();
		}, function(err) {
		     console.log("Error: Something went wrong", err);
		});

		//Start the Background Tracker. When you enter the background tracking will start, and stop when you enter the foreground.
		bgLocationServices.start();
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
		console.log("Distance: From " + lat1 + "," + lon1 + " to " + lat2 + "," + lon2 + " is " + dist);
		return dist
	}

	button2.style.display="none";
	if(localStorage != undefined) {
		button1.addEventListener('click', button1DefaultClickListener);
		button2.addEventListener('click', button2ClickListener);
	}
	clearText1.addEventListener('click', function() {
		phoneInput.value = "";
		clearText1.style.display = "none";
	});
	clearText2.addEventListener('click', function() {
		addressInput.value = "";
		clearText2.style.display = "none";
	});
	phoneInput.addEventListener('input', function() {
		if (phoneInput.value.length > 0) {
			clearText1.style.display = "block";
		} else {
			clearText1.style.display = "none";
		}
	});
	addressInput.addEventListener('input', function() {
		if (addressInput.value.length > 0) {
			clearText2.style.display = "block";
		} else {
			clearText2.style.display = "none";
		}
		var g_autocomplete = $("body > .pac-container").filter(":visible");
        g_autocomplete.bind('DOMNodeInserted DOMNodeRemoved', function(event) {
            $(".pac-item", this).addClass("needsclick");
        });
	});

	addressInput.onfocus = function() {
		autoCompleteHack();
	}


	//setup autocomplete
	var autocomplete = new google.maps.places.Autocomplete(addressInput,
      {types: ['geocode']});
	geolocate();
	autoCompleteHack();

	//hack to get clicking on autocomplete working
	function autoCompleteHack() {
		$scope.disableTap = function(){
		    container = document.getElementsByClassName('pac-container');
		    // disable ionic data tab
		    angular.element(container).attr('data-tap-disabled', 'true');
		    // leave input field if google-address-entry is selected
		    angular.element(container).on("click", function(){
		        addressInput.blur();
	    });
	  }
	}
})
   
.controller('settingsCtrl', function($scope) {
	var messageElement = document.getElementById("message")
	var codeElement = document.getElementById("compcode")
	var checkboxElement = document.getElementById("checkbox").getElementsByTagName('input')[0];
	var warningText = document.getElementById("warningText");
	var phoneNumberSettingsInput = document.getElementById("phoneInputSettings");
	var phoneNumberSettingsContainer = document.getElementById("phoneInputSettingsContainer");
	var phoneNumberSettingsTitle = document.getElementById("phoneNumberSettingsTitle");
	var prevMessageInput;
	var SMS_CHAR_LIMIT = 160;
	var LINK_LENGTH = 40;
	var LINK_EMBED_LENGTH = 6; //length of "[link]"

	if(localStorage != undefined)
	{
		console.log("Local storage supported.");

		//input listeners
		messageElement.addEventListener('input', function() {
			var max_chars = SMS_CHAR_LIMIT - LINK_LENGTH + LINK_EMBED_LENGTH;
		    if(messageElement.value.length > max_chars) {
		        messageElement.value = prevMessageInput;
		    }
		    prevMessageInput = messageElement.value;
			localStorage.setItem("message", messageElement.value);
			checkToShowWarningText();
		});
		codeElement.addEventListener('input', function() {
			localStorage.setItem("compcode", codeElement.value);
		});
		checkboxElement.addEventListener('click', function() {
			localStorage.setItem("checkbox", checkboxElement.checked);
			checkShowPhoneInput();
		});
		phoneNumberSettingsInput.addEventListener('input', function() {
			localStorage.setItem("driverPhoneNumber", phoneNumberSettingsInput.value);
		});

		messageElement.value = localStorage.getItem("message")
		codeElement.value = localStorage.getItem("compcode")
		checkboxElement.checked = localStorage.getItem("checkbox") === 'true'
		checkShowPhoneInput();

		prevMessageInput = messageElement.value;
		checkToShowWarningText();
	}
	else
	{
	  console.log("No local storage support");
	}

	//code executed every time view opened, not just on creation
	$scope.$on('$ionicView.enter', function() {
		checkShowPhoneInput();
	})

	function checkToShowWarningText() {
		if (messageElement.value.indexOf("[link]") > -1) {
			warningText.style.display = "none";
		} else {
			warningText.style.display = "block";
		}
	}

	function checkShowPhoneInput() {
		if (checkboxElement.checked == true && (device.platform == "iOS" || localStorage.getItem("phoneNumberError") == 'true')) {
			phoneNumberSettingsTitle.style.display = "block";
			phoneNumberSettingsContainer.style.display = "block";
		} else {
			console.log("not showing  " + (checkboxElement.checked == true) + (device.platform == "iOS") + (localStorage.getItem("phoneNumberError") == 'true'));
			phoneNumberSettingsTitle.style.display = "none";
			phoneNumberSettingsContainer.style.display = "none";
		}
	}
})
    