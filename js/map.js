class GoogleMap {
  constructor() {
    this.map = null;
    this.mapOptions = {
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: false,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      }
    }
    this.infoWindow = null;
    this.bounds= null;
    this.userLocationMarker = null;
    this.trailIcon = null;

    // Callback when google maps API finish to load asynchronously.
    this.init = () => {
      this.mapOptions['center'] = spotViewModel.userLocation();
      this.map = new google.maps.Map(document.getElementById('map'), this.mapOptions);

      this.trailIcon = {
        path: 'M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z',
        fillColor: '#000000',
        fillOpacity: .6,
        anchor: new google.maps.Point(12,25),
        strokeWeight: 0,
        scale: 1.5
      }

      this.infoWindow = new google.maps.InfoWindow();
      this.infoWindow.setContent(document.getElementById('info-window-content'));
      this.infoWindow.addListener('closeclick', this.saveInfoWindow);
      this.bounds = new google.maps.LatLngBounds();
      if (typeof spotViewModel.initializeSpots != 'undefined') {
        spotViewModel.initializeSpots.then(this.initializeMarkers).then(() => {
          spotViewModel.filteredSpots.subscribe(this.resetMapBounds);
          spotViewModel.filter.valueHasMutated();
        });
      }
    };

    this.initializeMarkers = () => {
      // Add a marker to the user location.
      const userIcon = {
        path: 'M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z',
        fillColor: '#000000',
        fillOpacity: .6,
        anchor: new google.maps.Point(12,25),
        strokeWeight: 0,
        scale: 1.5
      }
      this.userLocationMarker = new google.maps.Marker({
        position: spotViewModel.userLocation(),
        title: 'Your location',
        map: this.map,
        animation: google.maps.Animation.DROP,
        draggable: true,
        icon: userIcon
      });

      // Update user location when marker is dragged across the map.
      this.userLocationMarker.addListener('position_changed', () => {
        spotViewModel.userLocation(this.userLocationMarker.getPosition().toJSON())
      });

      // Add markers to the trail locations.
      for (const spot of spotViewModel.spots()) { this.initMarker(spot) };
    };

    // Save content of infowindow in the html to keep knockout functionality.
    this.saveInfoWindow = () => document.getElementById('info-window').appendChild(this.infoWindow.getContent());

    this.resetMapBounds = spotList => {
      if (spotList.length > 1) {
        this.bounds = new google.maps.LatLngBounds();

        // Extend the boundaries of the map to include all markers.
        for (const spot of spotList) {
          if ('marker' in spot && spot.marker.getMap() === this.map) { this.bounds.extend(spot.marker.position) }
        }
        this.map.fitBounds(this.bounds);
      }
      else if (spotList.length == 1) {
        this.map.setZoom(15);
        if ('marker' in spotList[0]) { this.map.setCenter(spotList[0].marker.getPosition()) }
      }
      else {
        this.map.setCenter(spotViewModel.userLocation());
      }
    };
  }

  showInfoWindow(marker) {
    this.saveInfoWindow();
    this.infoWindow.close();
    this.map.setCenter(marker.getPosition());
    this.toggleBounce(marker);
    setTimeout(() => {
      this.getPanorama(marker.getPosition())
      this.toggleBounce(marker);
      this.infoWindow.open(this.map, marker);
    }, 2000);
  }

  getPanorama(position) {
    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama({location: position, preference: 'nearest', radius: 200}, (StreetViewPanoramaData, StreetViewStatus) => {
      if (StreetViewStatus == google.maps.StreetViewStatus.OK) {
        const panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), {
            position: StreetViewPanoramaData.location.latLng,
            addressControl: false,
            pov: {
              heading: 0,
              pitch: 0
            }
          });
        this.map.setStreetView(panorama);
        spotViewModel.displayPano(true)
      } else {
        /*
        spotViewModel.addMessage({
          messageText: 'StreetView not available for this location.',
          messageClass: 'alert-info'
        });
        */
        spotViewModel.displayPano(false)
      }
    });
  }

  initMarker(spot) {
    // Add a new marker to a spot object.
    spot['marker'] = new google.maps.Marker({
      position: spot.location,
      title: spot.title,
      map: this.map,
      icon: this.trailIcon,
      animation: google.maps.Animation.DROP
    });

    // Add listener to click event on marker.
    spot.marker.addListener('click', () => spotViewModel.setCurrentSpot(spot));
  }

  hideMarker(marker) {
    if (marker.getPosition().equals(this.infoWindow.getPosition())) {
      this.saveInfoWindow();
      this.infoWindow.close();
    }
    marker.setMap(null);
  }

  deleteMarker(marker) {
    this.hideMarker(marker);
    marker = null;
  }

  toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  }

  computeDistance(from, to) {
    const fromCoords = new google.maps.LatLng(from);
    const toCoords = new google.maps.LatLng(to);
    return google.maps.geometry.spherical.computeDistanceBetween(fromCoords, toCoords);
  }
}

// Browser will throw an error if "const" or "let" are used for the googleMap
// variable assignement.
var googleMap = new GoogleMap();
