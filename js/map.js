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

    // Display status message
    locationViewModel.displayMessage(true)

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      locationViewModel.messageText('Finding current location... Please wait.');
      navigator.geolocation.getCurrentPosition(function success(position) {
        userLocation.lat = position.coords.latitude;
        userLocation.lng = position.coords.longitude;
        locationViewModel.messageText('Location found. Finding nearby trails...');
        googleMaps.map.setCenter(userLocation);
        googleMaps.getNearbyTrails(userLocation);
      }, function error() {
        googleMaps.showGeoLocErrorMsg('The Geolocation service failed.');
        googleMaps.getNearbyTrails(userLocation);
      });
    } else {
      this.showGeoLocErrorMsg('Your browser doesn\'t support geolocation.');
      this.getNearbyTrails(userLocation);
    }
  },
  showGeoLocErrorMsg(msg) {
    locationViewModel.messageClass(locationViewModel.messageClass().replace('alert-info', 'alert-danger'));
    locationViewModel.messageText(`${msg} Finding nearby trails using default location...`);
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
  initializeMarkers(locations) {
    locations.forEach(function(data) {
      const marker = locationViewModel.addMarker(data);
      if (marker !== null) {
      // Extend the boundaries of the map for each marker.
        googleMaps.bounds.extend(marker.position);
        marker.addListener('click', function() {
          locationViewModel.currentMarker(this);
          googleMaps.displayOnMap(this);
        });
      }
    });
    this.map.fitBounds(this.bounds);
  }
};
