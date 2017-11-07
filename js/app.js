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

function ViewModel() {
  var self = this;
  self.markers = ko.observableArray([]);
  self.currentMarker = ko.observable(null);

  // Create Markers
  self.initializeMarkers = function() {
    initialLocations.forEach(function(data) {
      self.markers.push(new google.maps.Marker({
        position: data.location,
        title: data.title,
        map: googleMaps.map,
        animation: google.maps.Animation.DROP
      }));
    });
  };

  self.setCurrentMarker = function() {
    self.currentMarker(this);
    googleMaps.displaySelectedLocation(this);
  };

  self.displayMarker = function() {
    googleMaps.displaySelectedLocation(this);
  };
};

var locationViewModel = new ViewModel()

// Activate knockout.js
ko.applyBindings(locationViewModel);
