const defaultLocations = [
  {
    title: 'Park Ave Penthouse',
    location: {
      lat: 40.7713024,
      lng: -73.9632393
    }
  },
  {
    title: 'Chelsea Loft',
    location: {
      lat: 40.7444883,
      lng: -73.9949465
    }
  },
  {
    title: 'Union Square Open Floor Plan',
    location: {
      lat: 40.7347062,
      lng: -73.9895759
    }
  },
  {
    title: 'East Village Hip Studio',
    location: {
      lat: 40.7281777,
      lng: -73.984377
    }
  },
  {
    title: 'TriBeCa Artsy Bachelor Pad',
    location: {
      lat: 40.7195264,
      lng: -74.0089934
    }
  },
  {
    title: 'Chinatown Homey Space',
    location: {
      lat: 40.7180628,
      lng: -73.9961237
    }
  }
];

function ViewModel() {
  const self = this;
  self.markers = ko.observableArray([]);
  self.filter = ko.observable(null);
  self.messageText = ko.observable(null);
  self.messageClass = ko.observable('alert-info alert reduced-margin');
  self.displayMessage = ko.observable(false);
  self.currentMarker = ko.observable(null);

  // Filter markers.
  self.filteredMarkers = ko.computed(function () {
    let searchResults = [];
    if (self.filter() === null) {
      searchResults = self.markers();
    } else {
      self.markers().forEach(function(marker) {
        if (marker.title.toLowerCase().search(self.filter().toLowerCase()) !== -1) {
          searchResults.push(marker);
          marker.setMap(googleMaps.map);
        } else {
          marker.setMap(null);
        }
      });
    }
    // Sort markers alphabetically by title.
    return searchResults.sort(function (left, right) {
      return left.title == right.title ? 0 : (left.title < right.title ? -1 : 1);
    });
  });

  self.alreadyExist = function(data, markerList) {
    // Check if there is already a marker at this location.
    const newCoords = new google.maps.LatLng(data.location.lat, data.location.lng);
    return markerList.some(function(marker) {
      const markerCoords = new google.maps.LatLng(marker.getPosition().lat(),marker.getPosition().lng());
      return google.maps.geometry.spherical.computeDistanceBetween(markerCoords,newCoords) < 1.0;
    });
  }

  self.addNewMarker = function(data) {
    // Add a new marker to markers observable Array.
    const newMarker = new google.maps.Marker({
      position: data.location,
      title: data.title,
      map: googleMaps.map,
      animation: google.maps.Animation.DROP
    });
    self.markers.push(newMarker);
    return newMarker;
  };

  self.addMarker = function(data) {
    // Add a marker if there is not already one at this location.
    if (self.alreadyExist(data, self.markers())) {
      return null;
    } else {
      return self.addNewMarker(data);
    }
  };

  self.displayMarker = function() {
    self.currentMarker(this);
    googleMaps.displayOnMap(this);
    // allow default behavior (go to the #map div).
    return true;
  };
}

const locationViewModel = new ViewModel();

// Activate knockout.js
ko.applyBindings(locationViewModel);

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
