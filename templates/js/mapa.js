var clicks = 0;
var from;
var to;

var RADIUS = 2;

$(document).ready(function() {
	// if (navigator.geolocation) {
	// navigator.geolocation.getCurrentPosition(showPosition);
	// } else {
	// x.innerHTML = "Geolocation is not supported by this browser.";
	// }
	//
	// function showPosition(position) {
	// x.innerHTML = "Latitude: " + position.coords.latitude + "<br>Longitude: " + position.coords.longitude;
	// }

	var mapOptions = {
		center : new google.maps.LatLng(-34.397, 150.644),
		zoom : 5,
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	var geocoder = new google.maps.Geocoder();
	var location = "Campina Grande";
	geocoder.geocode({
		'address' : location
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
		} else {
			alert("Could not find location: " + location);
		}
	});

	google.maps.event.addListener(map, 'click', function(event) {
		if (clicks == 0) {
			from = event.latLng;
			drawMarker(from, map);
		} else if (clicks == 1) {
			to = event.latLng;
			drawMarker(to, map);
		}
		clicks++;

		if (clicks == 2) {
			var flightPlanCoordinates = getPointsInBetween(from, to, 4);

			var flightPath = new google.maps.Polyline({
				path : flightPlanCoordinates,
				geodesic : true,
				strokeColor : '#FF3300',
				strokeOpacity : 0.7,
				strokeWeight : 3
			});

			flightPath.setMap(map);

			// draw points
			for ( count = 1; count < flightPlanCoordinates.length -1; count++) {
				var point = flightPlanCoordinates[count];
				drawPoint(point, map);
			}

			// get tracks
			for ( count = 0; count < flightPlanCoordinates.length; count++) {
				var point = flightPlanCoordinates[count];
				getTracks(point.lat(), point.lng(), 1, "pop", function(tracks, ids) {
					console.log("Point " + count);
					console.log(tracks);
				});
			}
		}
	});

	function drawMarker(thePosition, theMap) {
		return new google.maps.Marker({
			position : thePosition,
			map : theMap
		});
	}

	function drawPoint(thePosition, theMap) {
		return new google.maps.Circle({
			center : thePosition,
			radius : 40000.0,
			strokeColor : '#FF3300',
			strokeOpacity : 0.2,
			fillColor : '#FF3300',
			fillOpacity : 0.7,
			strokeWeight : 1,
			map : theMap
		});
	}

	function getPointsInBetween(startPoint, endPoint, howManyPointsInBetween) {
		var coords = [startPoint];
		if (howManyPointsInBetween >= 1) {
			incLat = getIncrementSize(startPoint.lat(), endPoint.lat(), howManyPointsInBetween);
			incLng = getIncrementSize(startPoint.lng(), endPoint.lng(), howManyPointsInBetween);
			for ( i = 1; i <= howManyPointsInBetween; i++) {
				newLat = getIncrement(startPoint.lat(), endPoint.lat(), incLat * i);
				newLng = getIncrement(startPoint.lng(), endPoint.lng(), incLng * i);
				coords.push(new google.maps.LatLng(newLat, newLng));
			}
		}
		coords.push(endPoint);
		return coords;
	}

	function getIncrementSize(start, end, size) {
		if (start >= end) {
			return (start - end) / (size + 1)
		} else {
			return (end - start) / (size + 1)
		}
	}

	function getIncrement(start, end, increment) {
		if (start >= end) {
			return start - increment
		} else {
			return start + increment
		}
	}

});
