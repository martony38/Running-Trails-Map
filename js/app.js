function ViewModel() {
  const self = this;

  self.trails = ko.observableArray([]);
  self.currentTrail = ko.observable(null);
  self.filter = ko.observable(null);

  self.messages = ko.observableArray([]);
  self.displayMessages = ko.observable(false);

  // Set default location to Pittsburgh, PA, USA
  self.userLocation = ko.observable({lat: 40.440624, lng: -79.995888});
  self.searchRadius = ko.observable(60);

  // Filter trails/markers.
  self.filteredTrails = ko.computed(function () {
    let searchResults = [];
    if (self.filter() === null) {
      searchResults = self.trails();
    } else {
      self.trails().forEach(function(trail) {
        const marker = trail.marker
        if (trail.title.toLowerCase().search(self.filter().toLowerCase()) !== -1) {
          searchResults.push(trail);
          if (marker !== undefined) {marker.setMap(googleMap.map)}
        } else {
          if (marker !== undefined) {marker.setMap(null)}
        }
      });
    }
    // Sort trails/markers alphabetically by title.
    return searchResults.sort(function (left, right) {
      return left.title == right.title ? 0 : (left.title < right.title ? -1 : 1);
    });
  });

  self.filteredTrailsRadius = ko.computed(function() {
    let result = 0;
    self.filteredTrails().forEach(function(trail) {
      const distance = googleMap.computeDistance(self.userLocation(), trail.location)
      if (distance > result) {
        result = distance;
      }
    });
    return Math.round(result * 0.000621371);
  });

  self.init = function() {
    locationModel.init();

    // Initialize observable array "trails" when Firebase promise containing
    // data is resolved.
    self.initializeTrails = locationModel.getTrails.then(function(trails) {
      if (trails !== null) {
        trails.forEach(function(trail) {
          let data = trail.val();
          if (!('trails' in data)) {
            data['trails'] = null;
          }
          self.trails.push(data);
        });
      } else {
        // Display error message if database empty.
        self.addMessage({
          messageText: 'Could not find any trails in the database',
          messageClass: 'alert-warning'
        });
      }
      return self.trails();
    }).catch(function(error) {
      // Display error message if Firebase promise rejected.
      self.addMessage({
        messageText: 'Error: Failed to retrieve trails from database',
        messageClass: 'alert-danger'
      });
    });
  };

  self.displayMarker = function() {
    self.setCurrentTrail(this);
    // allow default behavior of "a" links (go to the #map div).
    return true;
  };

  self.setCurrentTrail = trail => {
    trailAPI.getTrailInfo(trail.location);
    self.currentTrail(trail);
    googleMap.showInfoWindow(trail.marker);
  }

  self.addInfoToCurrentTrail = trails => {
    let currentTrail = self.currentTrail();
    currentTrail['trails'] = trails;
    self.currentTrail(currentTrail);
  }

  self.findTrails = function () {
    self.addMessage({
      messageText: 'Finding nearby trails... Please wait.',
      messageClass: 'alert-info'
    });
    trailAPI.findTrails(self.userLocation(), self.searchRadius());
  };

  self.addTrail = function(data) {
    if (!self.alreadyExist(data, self.trails())) {
      let trail = data;
      self.trails.push(trail);
      locationModel.saveTrail(trail);
      googleMap.initMarker(trail);
    }
  };

  self.alreadyExist = function(data, trailList) {
    // Check if there is already a marker at this location.
    return trailList.some(function(trail) {
      // Loop until it evaluates to true
      return googleMap.computeDistance(data.location, trail.location) < 1.0;
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

  self.setUserLocation = () => {
    const center = googleMap.map.getCenter()
    self.userLocation({lat: center.lat(), lng: center.lng()})
  };

  self.clearTrails = () => {
    while (self.trails().length) {
      let marker = self.trails.pop().marker;
      marker.setMap(null);
      marker = null;
    }
    googleMap.bounds = new google.maps.LatLngBounds();
  }

  self.addMessage = (message) => {

    self.messages().forEach(function(message) {
      // remove previous info messages
      if (message.messageClass == 'alert-info') {
        self.removeMessage(message);
      }
    });

    self.messages.push(message);
    if (!self.displayMessages()) {
      self.displayMessages(true)
    }

    message['timeoutDone'] = new Promise((resolve) => {
      setTimeout(function() {
        resolve();
      }, 2000);
    });

  }

  self.removeMessage = (message) => {
    message.timeoutDone.then(() => {self.messages.remove(message)});
  }


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

const locationViewModel = new ViewModel();

// Activate knockout.js
ko.applyBindings(locationViewModel);

locationViewModel.init();
