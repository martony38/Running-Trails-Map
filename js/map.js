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
      this.bounds = new google.maps.LatLngBounds();
      google.maps.event.addDomListener(window, 'resize', () => { this.map.fitBounds(this.bounds) });
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
    this.infoWindow.close();
    this.map.setCenter(marker.getPosition());
    this.toggleBounce(marker);
    setTimeout(() => {
      this.populateInfoWindow(marker.getPosition())
      this.toggleBounce(marker);
      this.infoWindow.open(this.map, marker);
    }, 2000);
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

  loadingErrorHandler() {
    spotViewModel.addMessage('An error occurred while loading Google Maps API. Please try reloading the page.', 'alert-danger');
  }

  populateInfoWindow(position) {
    let content = ''
    content +=`
        <div class="row vertical-align">
          <div class="col-md-12">
            <h2>${spotViewModel.currentSpot().title}</h2>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <p class="description text-justify">${spotViewModel.currentSpot().description}</p>
          </div>
        </div>

        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Running Trails</h3>
          </div>
          <div class="panel-body">`
    const trails = spotViewModel.currentSpot().trails
    if (trails !== null && trails.length > 0) {
      for (const trail of trails) {
        content += `
          <div class="trail-info">
            <span style="display: ${trail.activity_type_name === 'mountain biking' ? 'inline-block' : 'none' }">
              <svg class="trail-type" viewBox="0 0 24 24">
                <path fill="#000000" d="M5,20.5A3.5,3.5 0 0,1 1.5,17A3.5,3.5 0 0,1 5,13.5A3.5,3.5 0 0,1 8.5,17A3.5,3.5 0 0,1 5,20.5M5,12A5,5 0 0,0 0,17A5,5 0 0,0 5,22A5,5 0 0,0 10,17A5,5 0 0,0 5,12M14.8,10H19V8.2H15.8L13.86,4.93C13.57,4.43 13,4.1 12.4,4.1C11.93,4.1 11.5,4.29 11.2,4.6L7.5,8.29C7.19,8.6 7,9 7,9.5C7,10.13 7.33,10.66 7.85,10.97L11.2,13V18H13V11.5L10.75,9.85L13.07,7.5M19,20.5A3.5,3.5 0 0,1 15.5,17A3.5,3.5 0 0,1 19,13.5A3.5,3.5 0 0,1 22.5,17A3.5,3.5 0 0,1 19,20.5M19,12A5,5 0 0,0 14,17A5,5 0 0,0 19,22A5,5 0 0,0 24,17A5,5 0 0,0 19,12M16,4.8C17,4.8 17.8,4 17.8,3C17.8,2 17,1.2 16,1.2C15,1.2 14.2,2 14.2,3C14.2,4 15,4.8 16,4.8Z" />
              </svg>
            </span>
            <span style="display: ${trail.activity_type_name === 'hiking' ? 'inline-block' : 'none' }">
              <svg class="trail-type" viewBox="0 0 24 24">
                <path fill="#000000" d="M14.12,10H19V8.2H15.38L13.38,4.87C13.08,4.37 12.54,4.03 11.92,4.03C11.74,4.03 11.58,4.06 11.42,4.11L6,5.8V11H7.8V7.33L9.91,6.67L6,22H7.8L10.67,13.89L13,17V22H14.8V15.59L12.31,11.05L13.04,8.18M14,3.8C15,3.8 15.8,3 15.8,2C15.8,1 15,0.2 14,0.2C13,0.2 12.2,1 12.2,2C12.2,3 13,3.8 14,3.8Z" />
              </svg>
            </span>
            <span class="badge"><span class="trail-length">${trail.length}</span> miles</span>
            <span><a href="${trail.url}" class="btn btn-default btn-xs" target="_blank">More info</a></span>
          </div>
          <p class="description text-justify">${trail.description}</p>`
      }
    } else {
      content += `<p class="description text-justify">Could not find any trails near ${spotViewModel.currentSpot().title}.</p>`
    }
    content += `
          </div>
          <div class="panel-footer"><small>Copyright 2012 TrailAPI.</small></div>
        </div>

        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Related Wikipedia Articles</h3>
          </div>
          <div class="panel-body">`
    const articles = spotViewModel.currentSpot().articles
    if (articles !== null && articles.length > 0) {
      for (const article of articles) {
        content += `
          <a href="${article.url}" target="_blank" class="wikipedia-article">${article.title}</a>
          <p class="description text-justify">${article.description}</p>`
      }
    } else {
      content += `<p class="description text-justify">Looks like there are no Wikipedia articles about ${spotViewModel.currentSpot().title}.</p>`
    }
    content += `
          </div>
          <div class="panel-footer"><small>Text is available under the <a href="https://creativecommons.org/licenses/by-sa/3.0/">Creative Commons Attribution-ShareAlike License</a>; additional terms may apply. See <a href="https://wikimediafoundation.org/wiki/Terms_of_Use">Terms of Use</a> for details.</small></div>
        </div>
    </div>`

    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama({location: position, preference: 'nearest', radius: 200}, (StreetViewPanoramaData, StreetViewStatus) => {
      if (StreetViewStatus == google.maps.StreetViewStatus.OK) {
        content = `
          <div id="info-window-content" class="container-fluid">
            <div class="row">
              <div class="col-md-12">
                <div id="pano"></div>
              </div>
            </div>` + content
        this.infoWindow.setContent(content);
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
      } else {
        content = '<div id="info-window-content" class="container-fluid">' + content
        this.infoWindow.setContent(content);
      }
    });
  }
}

// Browser will throw an error if "const" or "let" are used for the googleMap
// variable assignement.
var googleMap = new GoogleMap();
