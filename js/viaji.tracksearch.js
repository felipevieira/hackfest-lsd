viajisearch = {

	tracksExtraParams : {
		sort : "song_hotttnesss-desc"
	},

	/**
	 * The function to get data tracks from Echonest based on latitude, longitude and buffer size.
	 * @param {Object} point
	 * @param {Object} radius
	 * @param {Object} genre
	 * @param {Object} callback
	 */
	getTracks : function(point, radius, genre, successCallback, failureCallback) {
		var lat = point.lat();
		var lng = point.lng();
		var variation = radius;
		var min_latitude = lat - variation;
		var max_latitude = lat + variation;
		var min_longitude = lng - variation;
		var max_longitude = lng + variation;
		var request_url = "http://developer.echonest.com/api/v4/song/search?bucket=artist_location&bucket=id:spotifyv2-ZZ&bucket=tracks&bucket=audio_summary&";
		var params = {
			api_key : "NNDIE5MEWU4J2ZPJQ",
			format : "json",
			min_longitude : min_longitude,
			max_longitude : max_longitude,
			min_latitude : min_latitude,
			max_latitude : max_latitude,
			style : genre,
			results : 100
		};
		for (var attrname in this.tracksExtraParams) {
			params[attrname] = this.tracksExtraParams[attrname];
		}

		console.log(request_url + $.param(params));

		$.ajax({
			dataType : "json",
			url : request_url + $.param(params),
			success : function(response) {
				songs = response.response.songs;
				var selected_tracks = [];
				var selected_artists = [];
				$.each(songs, function(i, item) {
					if (selected_artists.indexOf(item.artist_name) == -1 && selected_tracks.length < 10 && item.tracks.length > 0) {
						selected_artists.push(item.artist_name);
						selected_tracks.push({'track_name' : item.artist_name + " - " + item.title, 'audio_summary' : item.audio_summary, 'id' : item.tracks[0].foreign_id, 'artist_location' : item.artist_location});
					}
				});
				//$.each(selected_tracks, function(i, item) {
				//	console.log(item);
				//});

				successCallback(point, selected_tracks);
			},
			error : function(jqXHR, textStatus, errorThrown){
				failureCallback(jqXHR, textStatus, errorThrown, point);
			}
		});
	},
	// radius = 2 eh o suficiente pra incluir ateh patos com CG como centro
	//getTracks(-7, -35, 2, "forró" , function(names, ids) {console.log(names); console.log(ids)});

	sortChoicesMap : {
		"trendy" : "song_hotttnesss-desc",
		"danceable" : "danceability-desc",
		":)" : "valence-desc",
		"relaxing" : "energy-asc",
		"uhuu" : "energy-desc"
	},

	/**
	 * The function to set user's choice related to music sorting.
	 * @param {Object} sortChoice - One of the following: trendy, familiar, strange
	 */
	setParamSort : function (sortChoice) {
		this.tracksExtraParams["sort"] = this.sortChoicesMap[sortChoice];
	}

};

