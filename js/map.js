var map;

// Callback when google maps API finish to load asynchronously
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    mapTypeControl: true,
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
    }
  });
  locationViewModel.initializeMarkers()
  showLocations(locationViewModel.markers())
};

function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
};

// This function will loop through the markers array and display them all.
function showLocations(markers) {
  var bounds = new google.maps.LatLngBounds();
  markers.forEach(function(marker) {
    // Extend the boundaries of the map for each marker.
    bounds.extend(marker.position);
  });
  map.fitBounds(bounds);
};
