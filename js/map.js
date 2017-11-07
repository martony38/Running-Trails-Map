// Most of the code below is inspired from the Udacity Google Maps API
// course repository: https://github.com/udacity/ud864

var googleMaps = {
  map: null,
  infoWindow: null,
  // Callback when google maps API finish to load asynchronously
  init: function() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.7413549, lng: -73.9980244},
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      }
    });
    this.infoWindow = new google.maps.InfoWindow();
    locationViewModel.initializeMarkers()
    this.initializeMap(locationViewModel.markers())
  },
  render: function() {

  },
  toggleBounce: function(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    };
  },
  displaySelectedLocation: function(marker) {
    this.toggleBounce(marker);
    setTimeout(function() {
      googleMaps.toggleBounce(marker);
      googleMaps.infoWindow.open(googleMaps.map, marker);
    }, 2000);
  },
  // Add click events to markers and adjust the map boundaries to display
  // them all.
  initializeMap: function(markers) {
    var bounds = new google.maps.LatLngBounds();
    markers.forEach(function(marker) {
      // Extend the boundaries of the map for each marker.
      bounds.extend(marker.position);
      marker.addListener('click', function() {
        googleMaps.displaySelectedLocation(this)
      });
    });
    this.map.fitBounds(bounds);
  }
};
