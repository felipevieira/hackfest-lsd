viaji = {

	RADIUS_AROUND_POINTS : 1.75,
	DEFAULT_TRIP_STOPS : 4,
	clicks : 0,
	map : null,
	geocoder : null,
	// trip data
	from : null,
	to : null,
	flightPlanCoordinates : [],
	flightPlanNames : [],
	knownAnswers : 0,
	nameAnswers : 0,
	// playlist data
	currentPlaylist : [],
	explanations : [],
	playlistCandidates : [],

	initialize : function(canvasElement, mapOptions) {
		this.geocoder = new google.maps.Geocoder();
		this.map = new google.maps.Map(canvasElement, mapOptions);
		//this.centerMap();
		google.maps.event.addListener(this.map, 'click', $.proxy(this.gotMapClick, this));
	},

	getRadiusArountPoints : function() {
		return this.RADIUS_AROUND_POINTS;
	},

	gotMapClick : function(event) {
		if (this.clicks == 0) {
			this.from = event.latLng;
			this.drawMarker(this.from, this.map, "A");
		} else if (this.clicks == 1) {
			this.to = event.latLng;
			this.drawMarker(this.to, this.map, "B");
		}
		this.clicks++;

		if (this.clicks == 2) {
			this.updateTrip();
		}
	},

	updateTrip : function() {
		var travelTheme = $('#tripstyle').val();
		if (travelTheme == "") {
			travelTheme = "pop";
		}

		this.flightPlanCoordinates = this.getPointsInBetween(this.from, this.to, this.DEFAULT_TRIP_STOPS);

		// draw line
		this.drawFlightPathLine(this.flightPlanCoordinates);

		// draw points
		var count = 0;
		for ( count = 0; count < this.flightPlanCoordinates.length; count++) {
			var point = this.flightPlanCoordinates[count];
			this.drawPoint(point, this.map);
		}

		// get tracks
		$("#tracks-status").text("fetching music");
		var totalTripStops = this.DEFAULT_TRIP_STOPS + 2;
		this.currentPlaylist = Array(totalTripStops);
		this.explanations = Array(totalTripStops);
		this.knownAnswers = 0;
		var failureCallback = function(jqXHR, textStatus, errorThrown, pointUsed) {
			console.log(textStatus);
			this.knownAnswers++;
			var track_index = this.flightPlanCoordinates.indexOf(pointUsed);
			this.explanations[track_index] = this.buildTextualDetails(pointUsed);
			if (this.knownAnswers == totalTripStops) {
				this.chooseTracks();
				this.setupPlayer();
				this.updateDetails();
			}
		};

		for ( count = 0; count < this.flightPlanCoordinates.length; count++) {
			var point = this.flightPlanCoordinates[count];
			viajisearch.getTracks(point, this.getRadiusArountPoints(), travelTheme, $.proxy(function(pointUsed, tracks) {
				var track_index = this.flightPlanCoordinates.indexOf(pointUsed);
				this.playlistCandidates[track_index] = tracks;
				this.knownAnswers++;
				$("#tracks-status").text("got songs for " + this.knownAnswers + " of the " + totalTripStops + " stops in your trip");
				if (this.knownAnswers == totalTripStops) {
					this.chooseTracks();
					this.setupPlayer();
					this.updateDetails();
				}
			}, this), $.proxy(failureCallback, this));
		}
	},

	drawFlightPathLine : function(coordinates) {
		var lineSymbol = {
			path : 'M 0,-1 0,1',
			strokeOpacity : 0.5,
			strokeWeight : 3,
			scale : 4
		};

		new google.maps.Polyline({
			path : coordinates,
			strokeOpacity : 0,
			geodesic : true,
			strokeColor : '#FF3300',
			icons : [{
				icon : lineSymbol,
				offset : '0',
				repeat : '20px'
			}],
			map : this.map
		});

	},

	chooseTracks : function() {
		var count;
		var chosen;
		for ( count = 0; count < this.playlistCandidates.length; count++) {
			var tracks = this.playlistCandidates[count];
			chosen = this.chooseTracksFromSample(chosen, tracks, this.currentPlaylist);
			this.explanations[count] = this.buildTextualDetails(count, tracks, chosen);
			this.currentPlaylist[count] = chosen;
		}
	},

	buildTextualDetails : function(explanationIndex, tracks, chosen) {
		var point = this.flightPlanCoordinates[explanationIndex];
		if (chosen == null || chosen == undefined) {
			return "<span class=\"text-muted\"> Point " + (explanationIndex + 1) + ": we couldn't find music for the trip near </span> <span id='exp-" + explanationIndex + "'>" + point;
		} else {
			var artists = [];
			$.each(tracks, function(i, v) {
				var toadd = " ";
				if (i > 0 && i == tracks.length - 1)
					toadd += "or ";
				artists.push(toadd + v.track_name.split(" -")[0]);
			});
			var chosenTrackName = chosen.track_name;
			return "<span class=\"text-muted\">Point " + (explanationIndex + 1) + ": around </span> <span id='exp-" + explanationIndex + "'>" + point + "</span> <span class=\"text-muted\"> we thought of </span>" + artists + "<span class=\"text-muted\">. We chose </span>" + chosenTrackName;
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
	chooseTracksFromSample : function(previousChosen, tracks, allPrevious) {
		// some randomness
		if ( typeof previousChosen == "undefined") {
			tracks.sort(function() {
				return .5 - Math.random();
			});
			return tracks[0];
		}

		var count;
		var dissimilarity = Number.MAX_VALUE;
		var trackChosen;
		for ( count = 0; count < tracks.length; count++) {
			var currentTrack = tracks[count];
			var computedDissimilarity = this.computeDissimilarity(previousChosen, currentTrack);
			if (computedDissimilarity < dissimilarity && this.findTrackInAList(currentTrack, allPrevious) == -1) {
				dissimilarity = computedDissimilarity;
				trackChosen = currentTrack;
			}
		}
		return trackChosen;
	},

	findTrackInAList : function(track, tracksList) {
		var count;
		for ( count = 0; count < tracksList.length; count++) {
			var currentTrack = tracksList[count];
			if ( typeof currentTrack != "undefined" && currentTrack.track_name == track.track_name) {
				return currentTrack;
			}
		}
		return -1;
	},

	computeDissimilarity : function(track1, track2) {
		var summary1 = track1.audio_summary;
		var summary2 = track2.audio_summary;

		var metrics1 = [summary1.tempo / 180, summary1.speechiness, summary1.acousticness, summary1.instrumentalness, summary1.valence, summary1.danceability];
		var metrics2 = [summary2.tempo / 180, summary2.speechiness, summary2.acousticness, summary2.instrumentalness, summary2.valence, summary2.danceability];
		var dist = 0;
		$.each(metrics1, function(i, v) {
			var dist = dist + Math.pow(metrics1[i] - metrics2[i], 2);
		});
		return Math.sqrt(dist);
	},

	setupPlayer : function() {
		var missedPoints = 0;
		$.each(this.currentPlaylist, function(i, v) {
			if (v != null) {
				$("#playlist").attr("src", $("#playlist").attr("src") + v.id.split(":")[2] + ",");
			} else {
				missedPoints++;
			}
		});
		if (missedPoints > 0)
			$("#player-status").text("(we couldn't find songs for " + missedPoints + " out of the " + this.knownAnswers + " points in the trip)");
		navigation.fadeToPlaylist();
	},

	drawMarker : function(thePosition, theMap, letter) {
		new google.maps.Marker({
			position : thePosition,
			animation : google.maps.Animation.DROP,
			icon: "http://maps.google.com/mapfiles/marker" + letter + ".png",
			//draggable : true,
			map : theMap
		});
	},

	drawPoint : function(thePosition, theMap) {
		new google.maps.Rectangle({
			map : theMap,
			position : thePosition,
			fillColor : '#ecf0f1',
			fillOpacity : .2,
			strokeColor : '#e74c3c',
			strokeWeight : .5,
			strokeOpacity : .3,
			bounds : new google.maps.LatLngBounds(new google.maps.LatLng(thePosition.lat() - this.getRadiusArountPoints(), thePosition.lng() - this.getRadiusArountPoints()), new google.maps.LatLng(thePosition.lat() + this.getRadiusArountPoints(), thePosition.lng() + this.getRadiusArountPoints()))
		});
		
		new google.maps.Marker({
			position : thePosition,
			icon : {
				path : google.maps.SymbolPath.CIRCLE,
				fillColor : '#ecf0f1',
				fillOpacity : 0.5,
				strokeColor : '#e74c3c',
				strokeWeight : 2.5,
				strokeOpacity : .75,
				scale : 4
			},
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
		this.flightPlanNames = Array(flightCoordinates.length);
		var count = 0;
		var timer = setInterval($.proxy(function() {
			var v = flightCoordinates[count];
			this.codeLatLng(v.k, v.B, this.flightPlanNames, count);

			count++;
			if (count == flightCoordinates.length) {
				clearInterval(timer);
			}
		}, this), 500);
	},

	codeLatLng : function(lat, lng, namesArray, i) {
		var latlng = new google.maps.LatLng(lat, lng);
		this.geocoder.geocode({
			'latLng' : latlng
		}, $.proxy(function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if (results[2]) {
					this.updateNamesInTable(i, results[2].formatted_address);
				} else {
					console.log("No results found in reverse geocoding");
				}
			} else {
				console.log("Geocoder failed due to: " + status);
			}
		}, this));
	},

	updateNamesInTable : function(index, text) {
		$("#exp-" + index).text(text);
	}
};

var navigation = {
	fadeToMap : function() {
		this.goToByScroll("#route");
		$("#route").fadeTo("slow", 1);
	},

	fadeToPlaylist : function() {
		$("#playlistdiv").fadeTo("slow", 1);
		this.goToByScroll("#playlistdiv");
	},

	goToByScroll : function(id) {
		// Scroll
		$('html,body').animate({
			scrollTop : $(id).offset().top
		}, 'slow');
	},

	showHideOptions : function() {
		if ($("#options_btn").text().indexOf("+") != -1) {
			$("#options_div").show("fast");
			$("#options_btn").text("-");
		} else {
			$("#options_div").hide("fast");
			$("#options_btn").text("+");
		}
	}
};
