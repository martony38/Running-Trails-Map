// Most of the code below is inspired from the Udacity Google Maps API
// course (repository: https://github.com/udacity/ud864) or from
// examples in the google maps API documentation.

function GoogleMap() {
  const self = this;

  self.map = null;
  self.infoWindow = null;
  self.bounds= null;

  // Callback when google maps API finish to load asynchronously
  self.init = () => {
    self.map = new google.maps.Map(document.getElementById('map'), {
      center: locationViewModel.userLocation(),
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      }
    });
    self.map.addListener('center_changed', function() {
      locationViewModel.setUserLocation();
    });
    self.infoWindow = new google.maps.InfoWindow();
    self.infoWindow.setContent(document.getElementById('info-window-content'))
    self.infoWindow.addListener('closeclick', function() {
      self.saveInfoWindow();
    });
    self.bounds = new google.maps.LatLngBounds();
    locationViewModel.initializeTrails.then(self.initializeMarkers);
  };

  self.initializeMarkers = () => {
    const trails = locationViewModel.trails()
    if (trails.length > 0) {
      // If a list of trails already exist and was successfully retrieved
      // from the Firebase database, initialize corresponding markers on
      // the map.
      for (const trail of trails) {
        self.initMarker(trail)
      };
    } else {
      // If no trails can be found, get user location and search for trails
      // using the TrailAPI.
      locationViewModel.getUserLocation().then( () => {
        self.map.setCenter(locationViewModel.userLocation());
        locationViewModel.findTrails();
      }).catch((errorMessage) => {
        locationViewModel.addMessage({
          messageText: `${errorMessage} Center the map on your location and click "Find Trails Near Me"`,
          messageClass: 'alert-warning'
        });
        console.log(`${errorMessage} Center the map on your location and click "Find Trails Near Me"`)
      })
    }
  };

  self.saveInfoWindow = () => {
    // Save content of infowindow on the html to keep knockout functionality
    document.getElementById('info-window').appendChild(self.infoWindow.getContent());
  };

  self.toggleBounce = marker => {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  };

  self.showInfoWindow = marker => {
    self.saveInfoWindow();
    self.infoWindow.close();
    self.toggleBounce(marker);
    setTimeout(function() {
      self.toggleBounce(marker);
      self.infoWindow.open(self.map, marker);
    }, 2000);
  };

  self.populateInfoWindow = info => {
  };

  self.initMarker = trail => {
    // Add a new marker to a trail object.
    trail['marker'] = new google.maps.Marker({
      position: trail.location,
      title: trail.title,
      map: self.map,
      animation: google.maps.Animation.DROP
    });

    // Add listener to click event on marker.
    trail.marker.addListener('click', function() {
      locationViewModel.setCurrentTrail(trail);
    });

    // Extend the boundaries of the map to include marker.
    self.bounds.extend(trail.marker.position);
    self.map.fitBounds(self.bounds);
  };

  self.computeDistance = (from, to) => {
    const fromCoords = new google.maps.LatLng(from);
    const toCoords = new google.maps.LatLng(to);
    return google.maps.geometry.spherical.computeDistanceBetween(fromCoords, toCoords)
  };


};

// Browser will throw an error if "const" or "let" are used for the googleMap
// variable assignement.
var googleMap = new GoogleMap();
