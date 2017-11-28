// Most of the code below is inspired from the Udacity Google Maps API
// course (repository: https://github.com/udacity/ud864) or from
// examples in the google maps API documentation.

var googleMaps = {
  map: null,
  infoWindow: null,
  bounds: null,
  // Callback when google maps API finish to load asynchronously
  init() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.440624, lng: -79.995888},
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      }
    });
    this.infoWindow = new google.maps.InfoWindow();
    this.bounds = new google.maps.LatLngBounds();

    // Set default location to Pittsburgh, PA, USA
    let userLocation = {lat: 40.440624, lng: -79.995888};

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      // Show message finding current location.
      $('.message').text('Finding current location... Please wait.');
      $('.message').css('display', 'inherit');
      navigator.geolocation.getCurrentPosition(function(position) {
        // Show location found message.
        $('.message').text('Location found. Finding nearby trails...');
        userLocation.lat = position.coords.latitude;
        userLocation.lng = position.coords.longitude;

        // Set map center to user location
        googleMaps.map.setCenter(userLocation);

        // Fill database with trails
        googleMaps.getNearbyTrails(userLocation);
      }, function() {
        $('.message').toggleClass('alert-info');
        $('.message').toggleClass('alert-danger');
        $('.message').text('The Geolocation service failed. Setting map to default location.');

        // Fill database with trails
        googleMaps.getNearbyTrails(userLocation);
        $('.message').toggleClass('alert-info');
        $('.message').toggleClass('alert-danger');
        $('.message').text('Finding nearby trails...');
      });
    } else {
      // Show browser doesn't support Geolocation message
      $('.message').toggleClass('alert-info');
      $('.message').toggleClass('alert-danger');
      $('.message').text('Your browser doesn\'t support geolocation. Setting map to default location.');

      // Fill database with trails
      googleMaps.getNearbyTrails(userLocation);
      $('.message').toggleClass('alert-info');
      $('.message').toggleClass('alert-danger');
      $('.message').text('Finding nearby trails...');
    }
  },
  getNearbyTrails(location) {
    getTrails(location, 'hiking');
    getTrails(location, 'mountain+biking');
  },
  toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  },
  displayOnMap(marker) {
    googleMaps.infoWindow.close();
    this.toggleBounce(marker);
    populateInfoWindow(marker);
    setTimeout(function() {
      googleMaps.toggleBounce(marker);
      googleMaps.infoWindow.open(googleMaps.map, marker);
    }, 2000);
  },
  // Add click events to markers and adjust the map boundaries to display
  // them all.
  initializeMap(markers) {
    markers.forEach(function(marker) {
      // Extend the boundaries of the map for each marker.
      googleMaps.bounds.extend(marker.position);
      marker.addListener('click', function() {
        googleMaps.displayOnMap(this);
      });
    });
    this.map.fitBounds(this.bounds);
  }
};
