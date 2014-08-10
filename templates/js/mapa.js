var RADIUS_AROUND_POINTS = 2;
var DEFAULT_TRIP_STOPS = 4;

var clicks = 0;
var from;
var to;

var currentPlaylist = [];
var flightPlanCoordinates;
var explanations = [];

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
		zoom : 3,
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
			var travelTheme = $('#tripstyle').val();
			if (travelTheme == "") {
				travelTheme = "pop";
			}

			flightPlanCoordinates = getPointsInBetween(from, to, DEFAULT_TRIP_STOPS);

			var flightPath = new google.maps.Polyline({
				path : flightPlanCoordinates,
				geodesic : true,
				strokeColor : '#FF3300',
				strokeOpacity : 0.7,
				strokeWeight : 3
			});

			flightPath.setMap(map);

			// draw points
			var count = 0;
			for ( count = 1; count < flightPlanCoordinates.length - 1; count++) {
				var point = flightPlanCoordinates[count];
				drawPoint(point, map);
			}

			// get tracks
			for ( count = 0; count < flightPlanCoordinates.length; count++) {
				var point = flightPlanCoordinates[count];
				getTracks(point, RADIUS_AROUND_POINTS, travelTheme, function(pointUsed, tracks, ids) {
					var chosen = chooseTracksFromSample(tracks, ids);
					var track_index = flightPlanCoordinates.indexOf(pointUsed);
					currentPlaylist[track_index] = chosen;
					explanations[track_index] = buildTextualDetails(pointUsed, tracks, ids, chosen);
					if (currentPlaylist.length == DEFAULT_TRIP_STOPS + 2) {
						setupPlayer();
						updateDetails();
					}
				});
			}
		}
	});

	function buildTextualDetails(point, tracks, ids, chosen_id) {
		var explanation_index = flightPlanCoordinates.indexOf(point);
		if (chosen_id == null) {
			return "<span class=\"text-muted\"> Point " + (explanation_index + 1) + ": we couldn't find music in the theme around </span> " + point;
		} else {
			var artists = [];
			$.each(tracks, function(i, v) {
				var toadd = " ";
				if (i == tracks.length - 1)
					toadd += "or ";
				artists.push(toadd + v.split(" -")[0]);
			});
			var chosen_track = tracks[ids.indexOf(chosen_id)];
			return "<span class=\"text-muted\">Point " + (explanation_index + 1) + ": around </span> " + point + "<span class=\"text-muted\"> we thought of </span>" + artists + "<span class=\"text-muted\">. We chose </span>" + chosen_track;
		}
	}

	function updateDetails() {
		$("#choice_details").empty();
		$.each(explanations, function(i, v) {
			var toadd = "<li class=\"list-group-item\">" + v + "</li>";
			$("#choice_details").append(toadd);
		});
	}

	/**
	 * @param tracks List of names of tracks, X for the point in the trip.
	 * @param ids in spotify namespace
	 */
	function chooseTracksFromSample(tracks, ids) {
		var count;
		for ( count = 0; count < ids.length; count++) {
			if (currentPlaylist.indexOf(ids[count]) == -1) {
				return ids[count];
			}
		}
		return null;
	}

	function setupPlayer() {
		$.each(currentPlaylist, function(i, v) {
			if (v != null) {
				$("#playlist").attr("src", $("#playlist").attr("src") + v.split(":")[2] + ",");
			}
		});
		fadeToPlaylist();
	}

	function drawMarker(thePosition, theMap) {
		new google.maps.Marker({
			position : thePosition,
			map : theMap
		});
	}

	function drawPoint(thePosition, theMap) {
		new google.maps.Circle({
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
			return (start - end) / (size + 1);
		} else {
			return (end - start) / (size + 1);
		}
	}

	function getIncrement(start, end, increment) {
		if (start >= end) {
			return start - increment;
		} else {
			return start + increment;
		}
	}

});
