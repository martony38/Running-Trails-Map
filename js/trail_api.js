function getTrails(location, activity) {
  // ajax call to trailapi to get all trails within 60 miles
  $.ajax({
    "async": true,
    "crossDomain": true,
    "url": `https://trailapi-trailapi.p.mashape.com/?lat=${location.lat}&lon=${location.lng}&q[activities_activity_type_name_eq]=${activity}&radius=60`,
    "method": "GET",
    "headers": {
      "x-mashape-key": "il1HptvEQOmshz8iEZicHy0WzmPYp13U09TjsnhvtyO7URBo3N",
    }
  }).done(function(response) {
    let locations = []
    for (const trail of response.places) {
      const data = {
        title: trail.name,
        location: {
          lat: trail.lat,
          lng: trail.lon
        }
      };
      locations.push(data)
    }
    googleMaps.initializeMarkers(locations)
  }).fail(function() {
      googleMaps.initializeMarkers(defaultLocations);
  }).always(function(){
    $('.message').css('display', 'none');
  });
}

function populateInfoWindow(marker) {
  let content = ''
  // ajax call to trailapi to get content
  $.ajax({
    "async": true,
    "crossDomain": true,
    "url": `https://trailapi-trailapi.p.mashape.com/?lat=${marker.getPosition().lat()}&lon=${marker.getPosition().lng()}&radius=1`,
    "method": "GET",
    "headers": {
      "x-mashape-key": "il1HptvEQOmshz8iEZicHy0WzmPYp13U09TjsnhvtyO7URBo3N",
    }
  }).done(function(response) {
    if (response.places.length > 0) {
      for (const place of response.places) {
        const markerCoords = new google.maps.LatLng(marker.getPosition().lat(),marker.getPosition().lng())
        const placeCoords = new google.maps.LatLng(place.lat,place.lon)
        // Do not include nearby places
        if (google.maps.geometry.spherical.computeDistanceBetween(markerCoords,placeCoords) < 1.0) {
          if (place.activities.length > 0) {
            if (place.name) {
              content += '<h1>' + place.name + '</h1>';
            }
            if (place.description) {
              content += '<p class="description bg-primary text-justify">' + place.description + '</p>';
            }
            for (const activity of place.activities) {
              if (activity.activity_type_name == 'hiking' || activity.activity_type_name == 'mountain biking') {
                content += `<div class="trail-type">Trail type: ${activity.activity_type_name}</div>
                  <div class="trail-length">Trail length: ${activity.length} miles</div>
                  <p class="description bg-info text-justify">${replaceAll(activity.description, '&lt;br /&gt;<br />', '')}</p>
                  <a class="btn btn-default btn-xs" href=${activity.url} target="_blank">More info</a>`;
              }
            }
            content += '<div><small>Copyright 2012 TrailAPI.<small><div>'
          }
        }
      }
    } else {
      content = '<div class="alert alert-info" role="alert">Could not find any trails for this location</div>';
    }
  }).fail(function() {
    content = '<div class="alert alert-danger" role="alert"><strong>Error:</strong> Could not get info for this location</div>';
  }).always(function(){
    googleMaps.infoWindow.setContent('<div>' + content + '</div>')
  });
}

// function to fix at least one place description from trailapi. Taken from:
// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript?page=1&tab=votes#tab-top
function replaceAll(string, search, replacement) {
    return string.split(search).join(replacement);
}
