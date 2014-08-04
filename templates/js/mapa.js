var clicks = 0;
      var from;
      var to;

      $( document ).ready(function() {
        var mapOptions = {
          center: new google.maps.LatLng(-34.397, 150.644),
          zoom: 5,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);

        var geocoder = new google.maps.Geocoder();
        var location = "Campina Grande";
        geocoder.geocode( { 'address': location }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
            } else {
                alert("Could not find location: " + location);
            }
        });

        google.maps.event.addListener(map, 'click', function(event) {
          if (clicks==0) {
            from = event.latLng;
          }

          else if (clicks==1) {
            to = event.latLng;
          }

          clicks++;

          if (clicks==2) {
            var coordinates = [from, to];
            points = getPointsInBetween(coordinates[0], coordinates[1]);

            var flightPlanCoordinates = [
            points[0],
            points[1],
            points[2],
          ];

          var flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
          });

          flightPath.setMap(map);

	  getTracks(points[0].k, points[0].B, 1, "pop", function(tracks, ids) {
			console.log("Inicial");
			console.log(tracks);
		}); 	
          


	  getTracks(points[1].k, points[1].B, 1, "pop", function(tracks, ids) {
			console.log("Meio");
			console.log(tracks);
		}); 	
          

	  getTracks(points[2].k, points[2].B, 1, "pop", function(tracks, ids) {
			console.log("Fim");
			console.log(tracks);
		}); 	
          }
        });

        function getPointsInBetween(startPoint, endPoint, howManyPointsInBetween){
         midPoint = getPointInBetween(startPoint, endPoint)
         var coords = [
           startPoint, midPoint, endPoint
         ];
         return coords
        }

        function getPointInBetween(startPoint, endPoint){
          midLat = (startPoint.lat()+endPoint.lat())/2
          midLng = (startPoint.lng()+endPoint.lng())/2
          return new google.maps.LatLng(midLat, midLng)
        }
        
      });
