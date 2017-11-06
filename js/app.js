const initialLocations = [
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

var Location = function(data) {
    this.title = data.title;
    this.location = data.location;
    this.showOnMap = ko.observable(true);
};

function ViewModel() {
  var self = this;
  self.locations = ko.observableArray([]);

  initialLocations.forEach(function(locationItem) {
    self.locations.push(new Location(locationItem));
  });

  self.animateMapMarker = function() {
    toggleBounce(this.marker);
    setTimeout(toggleBounce, 2000, this.marker);
  };

  self.addMarker = function(locationItem) {
    // Create a marker for a location.
    locationItem.marker = new google.maps.Marker({
      position: locationItem.location,
      title: locationItem.title,
      map: map,
      animation: google.maps.Animation.DROP
    });
  };

  self.addMarkers = function() {
    self.locations().forEach(function(locationItem) {
      self.addMarker(locationItem);
    });
  };

};

var locationViewModel = new ViewModel()

// Activate knockout.js
ko.applyBindings(locationViewModel);
