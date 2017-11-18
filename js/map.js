// Most of the code below is inspired from the Udacity Google Maps API
// course (repository: https://github.com/udacity/ud864) or taken from
// examples in the google maps API documentation.

var googleMaps = {
  map: null,
  infoWindow: null,
  bounds: null,
  // Callback when google maps API finish to load asynchronously
  init: function() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.440624, lng: -79.995888},
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      }
    });
    this.infoWindow = new google.maps.InfoWindow();
    this.bounds = new google.maps.LatLngBounds();

    // Set default location to Pittsburgh, PA, USA
    var userLocation = {lat: 40.440624, lng: -79.995888};

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      // Show message finding current location.
      $('.message').text('Finding current location... Please wait.');
      $('.message').css('display', 'inherit');
      navigator.geolocation.getCurrentPosition(function(position) {
        // Show location found message.
        $('.message').text('Location found. Finding nearby trails...')
        userLocation.lat = position.coords.latitude;
        userLocation.lng = position.coords.longitude;

        // Set map center to user location
        googleMaps.map.setCenter(userLocation);

        // Fill database with trails
        googleMaps.getNearbyTrails(userLocation);
      }, function() {
        $('.message').toggleClass('alert-info')
        $('.message').toggleClass('alert-danger')
        $('.message').text('The Geolocation service failed. Setting map to default location.')

        // Fill database with trails
        googleMaps.getNearbyTrails(userLocation);
        $('.message').toggleClass('alert-info')
        $('.message').toggleClass('alert-danger')
        $('.message').text('Finding nearby trails...')
      });
    } else {
      // Show browser doesn't support Geolocation message
      $('.message').toggleClass('alert-info')
      $('.message').toggleClass('alert-danger')
      $('.message').text('Your browser doesn\'t support geolocation. Setting map to default location.');

      // Fill database with trails
      googleMaps.getNearbyTrails(userLocation);
      $('.message').toggleClass('alert-info')
      $('.message').toggleClass('alert-danger')
      $('.message').text('Finding nearby trails...')
    };
  },
  getNearbyTrails: function(location){
    getTrails(location, 'hiking');
    getTrails(location, 'mountain+biking');
  },
  render: function() {

  },
  toggleBounce: function(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    };
  },
  displayOnMap: function(marker) {
    googleMaps.infoWindow.close()
    this.toggleBounce(marker);
    populateInfoWindow(marker);
    setTimeout(function() {
      googleMaps.toggleBounce(marker);
      googleMaps.infoWindow.open(googleMaps.map, marker);
    }, 2000);
  },
  // Add click events to markers and adjust the map boundaries to display
  // them all.
  initializeMap: function(markers) {
    markers.forEach(function(marker) {
      // Extend the boundaries of the map for each marker.
      googleMaps.bounds.extend(marker.position);
      marker.addListener('click', function() {
        googleMaps.displayOnMap(this)
      });
    });
    this.map.fitBounds(this.bounds);
  }
};

function getTrails(location, activity) {
  $.ajax({
    "async": true,
    "crossDomain": true,
    "url": 'https://trailapi-trailapi.p.mashape.com/?lat=' + location.lat + '&lon=' + location.lng + '&q[activities_activity_type_name_eq]=' + activity + '&radius=60',
    "method": "GET",
    "headers": {
      "x-mashape-key": "il1HptvEQOmshz8iEZicHy0WzmPYp13U09TjsnhvtyO7URBo3N",
    }
  }).done(function(response) {
    $.each(response.places, function(index, trail) {
      var data = {
        title: trail.name,
        location: {
          lat: trail.lat,
          lng: trail.lon
        },
        description: trail.description
      };
      var marker = locationViewModel.addMarker(data);
      if (marker !== null) {
        googleMaps.bounds.extend(marker.position);
        marker.addListener('click', function() {
          googleMaps.displayOnMap(this);
        });
      }
    });
    googleMaps.map.fitBounds(googleMaps.bounds);
  }).fail(function() {
      locationViewModel.initializeMarkers();
  }).always(function(){
    $('.message').css('display', 'none');
  });
};

function populateInfoWindow(marker) {
  var content = ''
  // ajax call to trailapi to get content
  $.ajax({
    "async": true,
    "crossDomain": true,
    "url": 'https://trailapi-trailapi.p.mashape.com/?lat=' + marker.getPosition().lat() + '&lon=' + marker.getPosition().lng() + '&radius=1',
    "method": "GET",
    "headers": {
      "x-mashape-key": "il1HptvEQOmshz8iEZicHy0WzmPYp13U09TjsnhvtyO7URBo3N",
    }
  }).done(function(response) {
    $.each(response.places, function(index, place) {
      console.log(place);
      var markerCoords = new google.maps.LatLng(marker.getPosition().lat(),marker.getPosition().lng())
      var placeCoords = new google.maps.LatLng(place.lat,place.lon)
      // Do not include nearby places
      if (google.maps.geometry.spherical.computeDistanceBetween(markerCoords,placeCoords) < 1.0) {
        if (place.activities.length > 0) {
          if (place.name) {
            content += '<h1>' + place.name + '</h1>';
          };
          if (place.description) {
            content += '<p class="description bg-primary text-justify">' + place.description + '</p>';
          };
          $.each(place.activities, function(index, activity) {
            console.log(activity);
            if (activity.activity_type_name == 'hiking' || activity.activity_type_name == 'mountain biking') {
              content += '<div class="trail-type">Trail type: ' + activity.activity_type_name + '</div>'
              content += '<div class="trail-length">Trail length: ' + activity.length + ' miles</div>'
              content += '<p class="description bg-info text-justify">' + replaceAll(activity.description, '&lt;br /&gt;<br />', '') + '</p>';
              content += '<a class="btn btn-default btn-xs" href=' + activity.url + '>More info</a>';
            };
          });
          content += '<div><small>Copyright 2012 TrailAPI.<small><div>'
        };
      };
    });
  }).fail(function() {
    content += '<div class="alert alert-danger" role="alert"><strong>Error:</strong> Could not get info for this location</div>';
  }).always(function(){
    googleMaps.infoWindow.setContent('<div>' + content + '</div>')
  });
};

// function to fix at least one place description from trailapi. Taken from:
// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript?page=1&tab=votes#tab-top
replaceAll = function(string, search, replacement) {
    return string.split(search).join(replacement);
};
