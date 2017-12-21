let Spot = function(data) {
  this.deleteEnabled = ko.observable(false);
  // TODO: Maybe remove trails and articles from observableArray
  this.trails = ko.observable('trails' in data ? data.trails : null);
  this.articles = ko.observable('articles' in data ? data.articles : null);
  this.location = data.location;
  this.title = data.title;
  this.description = data.description;
  this.firebaseKey = data.firebaseKey;
};

function SpotViewModel() {
  const self = this;

  self.spots = ko.observableArray([]);
  self.currentSpot = ko.observable(null);
  self.filter = ko.observable(null);

  self.messages = ko.observableArray([]);
  self.displayMessages = ko.observable(false);

  self.displayPano = ko.observable(false);

  // Set default location to Pittsburgh, PA, USA
  self.userLocation = ko.observable({ lat: 40.440624, lng: -79.995888 });
  self.searchRadius = ko.observable(60);

  // Filter trails/markers.
  self.filteredSpots = ko.computed(() => {
    let searchResults = [];

    if (self.filter() === null) {
      searchResults = self.spots();
    } else {
      self.spots().forEach(spot => {
        const marker = spot.marker;
        if (spot.title.toLowerCase().search(self.filter().toLowerCase()) !== -1) {
          searchResults.push(spot);
          if (marker !== undefined) { marker.setMap(googleMap.map) }
        } else {
          if (marker !== undefined) { googleMap.hideMarker(marker) }
        }
      });
    }

    // Sort trails/markers alphabetically by title.
    return searchResults.sort((left, right) => {
      return left.title == right.title ? 0 : (left.title < right.title ? -1 : 1);
    });
  });

  self.filteredSpotsRadius = ko.computed(() => {
    let result = 0;
    self.filteredSpots().forEach(spot => {
      const distance = googleMap.computeDistance(self.userLocation(), spot.location);
      if (distance > result) { result = distance }
    });
    return Math.round(result * 0.000621371);
  });

  self.init = () => {
    spotModel.init();

    if (typeof spotModel.getSpots != 'undefined') {
      // Initialize observable array "trails" when Firebase promise containing
      // data is resolved.
      self.initializeSpots = spotModel.getSpots.then(data => {
        if (data.userLocation !== null) { self.userLocation(data.userLocation.val()) }
        if (data.spots !== null) {
          data.spots.forEach(spot => {
            let spotData = spot.val();

            // Add reference to Firebase key for later deletion from database.
            spotData['firebaseKey'] = spot.key;

            self.spots.push(new Spot(spotData));
          });
        } else {
          // Display error message if database empty.
          self.addMessage({
            messageText: `Could not find any saved trails, click "Find Trails" to start adding trails to the map.`,
            messageClass: 'alert-warning'
          });
        }
        return self.spots();
      }).catch(error => {
        // Display error message if Firebase promise rejected.
        self.addMessage({
          messageText: 'Error: Failed to retrieve trails from database. Try reloading the page.',
          messageClass: 'alert-danger'
        });
      });
    }
  };

  self.displayMarker = spot => {
    self.setCurrentSpot(spot);
    // Allow default behavior of "a" links (go to the #map div). Useful for
    // small devices as the map will appear below the list of trails.
    return true;
  };

  self.setCurrentSpot = spot => {
    self.currentSpot(spot);
    trailAPI.getTrailInfo();
    wikipediaAPI.getArticles();
    googleMap.showInfoWindow(spot.marker);
  };

  self.addInfoToCurrentSpot = (key, infoArray) => {
    let currentSpot = self.currentSpot();
    currentSpot[key] = infoArray;
    // Notify knockout that currentSpot object has been updated.
    self.currentSpot.valueHasMutated();
  };

  self.findSpots = () => {
    // Save user location in database.
    spotModel.saveUserLocation(self.userLocation())

    // Look for trails nearby user.
    self.addMessage({
      messageText: 'Finding nearby trails... Please wait.',
      messageClass: 'alert-info'
    });
    trailAPI.findTrails(self.userLocation(), self.searchRadius());
  };

  self.addSpot = spotData => {
    const spot = new Spot(spotData)
    self.spots.push(spot);
    googleMap.initMarker(spot);
  };

  self.alreadyExist = data => {
    // Check if there is already a marker at this location.
    return self.spots().some(spot => {
      // Loop until it evaluates to true
      return googleMap.computeDistance(data.location, spot.location) < 1.0;
    });
  };

  self.getUserLocation = () => {
    // Try HTML5 geolocation to get user location.
    return new Promise((resolve, reject) => {
      // Display status message

      if (!navigator.geolocation){
        reject('Your browser doesn\'t support geolocation.');
      }

      self.addMessage({
        messageText: 'Finding current location... Please wait.',
        messageClass: 'alert-info'
      });

      function success(position) {
        self.userLocation({lat: position.coords.latitude, lng: position.coords.longitude});
        self.addMessage({
          messageText: 'Location found.',
          messageClass: 'alert-info'
        });
        resolve();
      }

      function error() {
        reject('The Geolocation service failed.');
      }

      return navigator.geolocation.getCurrentPosition(success, error);
    });
  };

  self.findUserLocation = () => {
    self.getUserLocation().then(() => {
      // Recenter the map on the user location and reposition marker.
      googleMap.userLocationMarker.setMap(null);
      googleMap.resetMapBounds([]);
      googleMap.userLocationMarker.setPosition(self.userLocation())
      googleMap.userLocationMarker.setAnimation(google.maps.Animation.DROP)
      googleMap.userLocationMarker.setMap(googleMap.map);
    }).catch((errorMessage) => {
      spotViewModel.addMessage({
        messageText: `${errorMessage} Drag the running man icon to your location, then click "Find Trails".`,
        messageClass: 'alert-warning'
      });
    })
  };

  self.saveSpot = spot => {
    if (typeof spot.firebaseKey != 'undefined') {
      self.addMessage({
        messageText: 'Trail already saved.',
        messageClass: 'alert-info'
      });
    } else {
      spot['firebaseKey'] = spotModel.saveSpot(spot);
      if (typeof spot.firebaseKey != 'undefined') {
        self.addMessage({
          messageText: 'Trail has been saved.',
          messageClass: 'alert-success'
        });
        // Notify knockout that currentSpot object has been updated.
        self.currentSpot.valueHasMutated();
      } else {
        self.addMessage({
          messageText: 'Error: Trail has not been saved.',
          messageClass: 'alert-danger'
        });
      }
    }
  };

  self.removeAllSpots = () => {
    while (self.spots().length) {
      self.deleteSpotData(self.spots.pop())
    }
  };

  self.deleteSpot = spot => {
    self.deleteSpotData(spot)
    // Remove spot from observable.
    self.spots.remove(spot);
    self.addMessage({
      messageText: 'Trail has been deleted.',
      messageClass: 'alert-info'
    });
  };

  self.deleteSpotData = spot => {
    // Remove marker from map.
    googleMap.deleteMarker(spot.marker);
    // Remove spot from database.
    spotModel.deleteSpot(spot.firebaseKey)
  };

  self.removeDistantSpots = () => {
    self.spots.remove(spot => {
      const distance = googleMap.computeDistance(self.userLocation(), spot.location);
      const tooFar = (distance * 0.000621371) > self.searchRadius()
      if (tooFar) { self.deleteSpotData(spot) }
      return tooFar;
    })
  };

  self.addMessage = message => {
    self.messages().forEach(message => {
      // Remove previous info messages.
      if (message.messageClass == 'alert-info' || message.messageClass == 'alert-success') { self.removeMessage(message) }
    });

    self.messages.push(message);
    if (!self.displayMessages()) { self.displayMessages(true) }

    message['timeoutDone'] = new Promise(resolve => {
      setTimeout(() => { resolve() }, 2000);
    });
  };

  self.removeMessage = message => {
    message.timeoutDone.then(() => { self.messages.remove(message) });
  };

  self.enableDelete = function() {
    this.deleteEnabled(true);
  };

  self.disableDelete = function() {
    this.deleteEnabled(false);
  };
}

ko.bindingHandlers.scrollTo = {
  // Usage: data-bind="scrollTo: boolean".
  // If true and element outside of its parent div, scroll up (or down
  // depending on the position) to the bound element.
  // Inspired from https://www.snip2code.com/Snippet/54357/ScrollTo-binding-for-knockout
  update: function(element, valueAccessor) {
    const valueUnwrapped = ko.unwrap(valueAccessor());
    if (valueUnwrapped == true) {
      const scrollParent = $(element).closest("div");
      const elementTop = $(element).position().top + scrollParent.scrollTop();
      const elementBottom = elementTop + $(element).outerHeight();
      if (scrollParent.scrollTop() > elementTop) {
        scrollParent.scrollTop(elementTop);
      }
      else if (elementBottom > scrollParent.scrollTop() + scrollParent.height()) {
        scrollParent.scrollTop(elementBottom - scrollParent.height());
      }
    }
  }
};

const spotViewModel = new SpotViewModel();

// Activate knockout.js
ko.applyBindings(spotViewModel);

spotViewModel.init();
