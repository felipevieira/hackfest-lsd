viaji = {

	RADIUS_AROUND_POINTS : 2,
	DEFAULT_TRIP_STOPS : 4,
	clicks : 0,
	from : null,
	to : null,
	currentPlaylist : [],
	flightPlanCoordinates : [],
	flightPlanNames : [],
	explanations : [],
	knownAnswers : 0,
	geocoder : null,
	map : null,

	initialize : function(canvasElement, mapOptions) {
		this.geocoder = new google.maps.Geocoder();
		this.map = new google.maps.Map(canvasElement, mapOptions);
		this.centerMap();
		google.maps.event.addListener(this.map, 'click', $.proxy(this.gotMapClick, this));
	},

	centerMap : function() {
		var location = "Campina Grande";
		this.geocoder.geocode({
			'address' : location
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				viaji.map.setCenter(results[0].geometry.location);
			} else {
				alert("Could not find location: " + location);
			}
		});
	},

	gotMapClick : function(event) {
		console.log(this.clicks);
		if (this.clicks == 0) {
			this.from = event.latLng;
			this.drawMarker(this.from, this.map);
		} else if (this.clicks == 1) {
			this.to = event.latLng;
			this.drawMarker(this.to, this.map);
		}
		this.clicks++;

		if (this.clicks >= 2) {
			this.updateTrip();
		}
	},

	updateTrip : function() {
		var travelTheme = $('#tripstyle').val();
		if (travelTheme == "") {
			travelTheme = "pop";
		}

		this.flightPlanCoordinates = this.getPointsInBetween(this.from, this.to, this.DEFAULT_TRIP_STOPS);

		var flightPath = new google.maps.Polyline({
			path : this.flightPlanCoordinates,
			geodesic : true,
			strokeColor : '#FF3300',
			strokeOpacity : 0.7,
			strokeWeight : 3
		});

		flightPath.setMap(this.map);

		// draw points
		var count = 0;
		for ( count = 1; count < this.flightPlanCoordinates.length - 1; count++) {
			var point = this.flightPlanCoordinates[count];
			this.drawPoint(point, this.map);
		}

		// get tracks
		$("#tracks-status").text("fetching music");
		for ( count = 0; count < this.flightPlanCoordinates.length; count++) {
			var point = this.flightPlanCoordinates[count];
			var totalTripStops = this.DEFAULT_TRIP_STOPS + 2;
			viajisearch.getTracks(point, this.RADIUS_AROUND_POINTS, travelTheme, function(pointUsed, tracks, ids) {
				var chosen = viaji.chooseTracksFromSample(tracks, ids);
				var track_index = viaji.flightPlanCoordinates.indexOf(pointUsed);
				viaji.currentPlaylist[track_index] = chosen;
				viaji.explanations[track_index] = viaji.buildTextualDetails(pointUsed, tracks, ids, chosen);
				viaji.knownAnswers++;
				$("#tracks-status").text("got songs for " + viaji.knownAnswers + " of the " + totalTripStops + " stops in your trip");
				if (viaji.knownAnswers == totalTripStops) {
					viaji.setupPlayer();
					viaji.updateDetails();
				}
			});
		}
	},

	buildTextualDetails : function(point, tracks, ids, chosen_id) {
		var explanation_index = this.flightPlanCoordinates.indexOf(point);
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
	},

	updateDetails : function() {
		$("#choice_details").empty();
		$.each(this.explanations, function(i, v) {
			var toadd = "<li class=\"list-group-item\">" + v + "</li>";
			$("#choice_details").append(toadd);
		});
		this.createNamesForCoordinates(this.flightPlanCoordinates);
	},

	/**
	 * @param tracks List of names of tracks, X for the point in the trip.
	 * @param ids in spotify namespace
	 */
	chooseTracksFromSample : function(tracks, ids) {
		var count;
		for ( count = 0; count < ids.length; count++) {
			if (this.currentPlaylist.indexOf(ids[count]) == -1) {
				return ids[count];
			}
		}
		return null;
	},

	setupPlayer : function() {
		var missedPoints = 0;
		$.each(this.currentPlaylist, function(i, v) {
			if (v != null) {
				$("#playlist").attr("src", $("#playlist").attr("src") + v.split(":")[2] + ",");
			} else {
				missedPoints++;
			}
		});
		if (missedPoints > 0)
			$("#player-status").text("(we couldn't find songs for " + missedPoints + " out of the " + this.knownAnswers + " points in the trip)");
		navigation.fadeToPlaylist();
	},

	drawMarker : function(thePosition, theMap) {
		new google.maps.Marker({
			position : thePosition,
			animation : google.maps.Animation.DROP,
			draggable : true,
			map : theMap
		});
	},

	drawPoint : function(thePosition, theMap) {
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
	},

	getPointsInBetween : function(startPoint, endPoint, howManyPointsInBetween) {
		var coords = [startPoint];
		if (howManyPointsInBetween >= 1) {
			incLat = this.getIncrementSize(startPoint.lat(), endPoint.lat(), howManyPointsInBetween);
			incLng = this.getIncrementSize(startPoint.lng(), endPoint.lng(), howManyPointsInBetween);
			for ( i = 1; i <= howManyPointsInBetween; i++) {
				newLat = this.getIncrement(startPoint.lat(), endPoint.lat(), incLat * i);
				newLng = this.getIncrement(startPoint.lng(), endPoint.lng(), incLng * i);
				coords.push(new google.maps.LatLng(newLat, newLng));
			}
		}
		coords.push(endPoint);
		return coords;
	},

	getIncrementSize : function(start, end, size) {
		if (start >= end) {
			return (start - end) / (size + 1);
		} else {
			return (end - start) / (size + 1);
		}
	},

	getIncrement : function(start, end, increment) {
		if (start >= end) {
			return start - increment;
		} else {
			return start + increment;
		}
	},

	createNamesForCoordinates : function(flightCoordinates) {
		this.flightPlanNames = [];
		$.each(flightCoordinates, $.proxy(function(i, v) {
			window.setTimeout($.proxy(function() {
				this.codeLatLng(v.k, v.A, this.flightPlanNames, i);
			}, this), 1200);
		}, this));
	},

	codeLatLng : function(lat, lng, namesArray, i) {
		var latlng = new google.maps.LatLng(lat, lng);
		this.geocoder.geocode({
			'latLng' : latlng
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				console.log(results)
				if (results[3]) {
					namesArray[i] = results[3];
				} else {
					console.log("No results found in reverse geocoding");
				}
			} else {
				console.log("Geocoder failed due to: " + status);
			}
		});
	}
};

var navigation = {
	fadeToMap : function() {
		$("#route").fadeTo("slow", 1);
	},

	fadeToPlaylist : function() {
		this.goToByScroll("#playlistdiv");
		$("#playlistdiv").fadeTo("slow", 1);
	},

	goToByScroll : function(id) {
		// Scroll
		$('html,body').animate({
			scrollTop : $(id).offset().top
		}, 'slow');
	}
};

