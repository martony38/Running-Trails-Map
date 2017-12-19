function GoogleMap() {
  const self = this;

  self.map = null;
  self.mapOptions = {
    zoom: 13,
    mapTypeControl: true,
    streetViewControl: false,
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
    }
  }
  self.infoWindow = null;
  self.bounds= null;
  self.userLocationMarker = null;
  self.trailIcon = null;

  // Callback when google maps API finish to load asynchronously
  self.init = () => {

    self.mapOptions['center'] = spotViewModel.userLocation();

    self.map = new google.maps.Map(document.getElementById('map'), self.mapOptions);

    self.trailIcon = {
      path: 'M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z',
      fillColor: '#000000',
      fillOpacity: .6,
      anchor: new google.maps.Point(12,25),
      strokeWeight: 0,
      scale: 1.5
    }

    //self.map.addListener('center_changed', spotViewModel.setUserLocation);

    self.infoWindow = new google.maps.InfoWindow();
    self.infoWindow.setContent(document.getElementById('info-window-content'));
    self.infoWindow.addListener('closeclick', self.saveInfoWindow);
    self.bounds = new google.maps.LatLngBounds();
    if (typeof spotViewModel.initializeSpots != 'undefined') {
      spotViewModel.initializeSpots.then(self.initializeMarkers).then(() => {
        spotViewModel.filteredSpots.subscribe(self.resetZoom);
        spotViewModel.filter.valueHasMutated();
      });
    }
  };

/*
  self.initializeMarkers_old = () => {
    const trails = spotViewModel.trails();
    if (trails.length > 0) {
      // If a list of trails already exist and was successfully retrieved
      // from the Firebase database, initialize corresponding markers on
      // the map.
      for (const trail of trails) { self.initMarker(trail) };
    } else {
      // If no trails can be found, get user location and search for trails
      // using the TrailAPI.
      spotViewModel.getUserLocation().then(() => {
        self.map.setCenter(spotViewModel.userLocation());
        spotViewModel.findTrails();
      }).catch((errorMessage) => {
        spotViewModel.addMessage({
          messageText: `${errorMessage} Drag the running man icon to your location, then click "Find Trails Near Me"`,
          messageClass: 'alert-warning'
        });
      })
    }
  };
*/

  self.initializeMarkers = () => {
    // Add a marker to the user location.
    const userIcon = {
      path: 'M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z',
      fillColor: '#000000',
      fillOpacity: .6,
      anchor: new google.maps.Point(12,25),
      strokeWeight: 0,
      scale: 1.5
    }
    self.userLocationMarker = new google.maps.Marker({
      position: spotViewModel.userLocation(),
      title: 'Your location',
      map: self.map,
      animation: google.maps.Animation.DROP,
      draggable: true,
      //label: 'test',
      icon: userIcon
    });

    // Update user location when marker is dragged across the map.
    self.userLocationMarker.addListener('position_changed', () => {
      spotViewModel.userLocation(self.userLocationMarker.getPosition().toJSON())
    });

    // Add markers to the trail locations.
    for (const spot of spotViewModel.spots()) { self.initMarker(spot) };
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
    setTimeout(() => {
      self.getPanorama(marker.getPosition())
      self.toggleBounce(marker);
      self.infoWindow.open(self.map, marker);
    }, 2000);
  };

  self.getPanorama = position => {
    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama({location: position, preference: 'nearest', radius: 200}, function(StreetViewPanoramaData, StreetViewStatus) {
      if (StreetViewStatus == google.maps.StreetViewStatus.OK) {
        const panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), {
            position: StreetViewPanoramaData.location.latLng,
            //visible: true,
            pov: {
              heading: 0,
              pitch: 0
            }
          });
        self.map.setStreetView(panorama);
        spotViewModel.displayPano(true)
      } else {
        spotViewModel.displayPano(false)
      }
    });
  };

  self.initMarker = spot => {
    // Add a new marker to a spot object.
    spot['marker'] = new google.maps.Marker({
      position: spot.location,
      title: spot.title,
      map: self.map,
      icon: self.trailIcon,
      animation: google.maps.Animation.DROP
    });

    // Add listener to click event on marker.
    spot.marker.addListener('click', () => { spotViewModel.setCurrentSpot(spot) });

    // Extend the boundaries of the map to include marker.
    //self.bounds.extend(trail.marker.position);
    //self.map.fitBounds(self.bounds);
  };

  self.hideMarker = marker => {
    if (marker.getPosition().equals(self.infoWindow.getPosition())) {
      self.saveInfoWindow();
      self.infoWindow.close();
    }
    marker.setMap(null);
    //self.resetZoom();
  };

  self.deleteMarker = marker => {
    self.hideMarker(marker);
    marker = null;
  }

  self.computeDistance = (from, to) => {
    const fromCoords = new google.maps.LatLng(from);
    const toCoords = new google.maps.LatLng(to);
    return google.maps.geometry.spherical.computeDistanceBetween(fromCoords, toCoords);
  };

  self.resetZoom = spotList => {
    if (spotList.length > 1) {
      self.bounds = new google.maps.LatLngBounds();
      for (const spot of spotList) {
        if ('marker' in spot && spot.marker.getMap() === googleMap.map) { self.bounds.extend(spot.marker.position) }
      }
      self.map.fitBounds(self.bounds);
    }
    else if (spotList.length == 1) {
      self.map.setZoom(15);
      if ('marker' in spotList[0]) { self.map.setCenter(spotList[0].marker.getPosition()) }
    }
    else {
      self.map.setCenter(spotViewModel.userLocation());
    }
  };
};

// Browser will throw an error if "const" or "let" are used for the googleMap
// variable assignement.
var googleMap = new GoogleMap();
