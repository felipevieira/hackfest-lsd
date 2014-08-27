/**
 * Fancy scrolling.
 */
$(function() {
	$('a[href*=#]:not([href=#])').click(function() {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {

			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
			if (target.length) {
				$('html,body').animate({
					scrollTop : target.offset().top
				}, 1000);
				return false;
			}
		}
	});
});

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

	$("#route").fadeTo("fast", 0.33);
	$("#playlistdiv").fadeTo("fast", 0.33);


	var map_style = [{"featureType":"all","elementType":"all","stylers":[{"invert_lightness":true},{"saturation":10},{"lightness":30},{"gamma":0.5},{"hue":"#435158"}]}]

	var mapOptions = {
		center : new google.maps.LatLng(0, -8),
		zoom : 2,
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		styles: map_style
	};

	viaji.initialize(document.getElementById("map_canvas"), mapOptions);

	// Event handller
	$('#tripstyle').keypress(function(e) {
		if (e.which == 13) {
			navigation.fadeToMap();
		}
	});
});
