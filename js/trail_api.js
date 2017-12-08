function TrailAPI() {
  const self = this;

  self.ajaxOptions = (location, searchRadius) => {
    return {
      "async": true,
      "crossDomain": true,
      "url": `https://trailapi-trailapi.p.mashape.com/?limit=500&lat=${location.lat}&lon=${location.lng}&radius=${searchRadius}`,
      "method": "GET",
      "headers": {
        "x-mashape-key": "il1HptvEQOmshz8iEZicHy0WzmPYp13U09TjsnhvtyO7URBo3N"
      }
    };
  };

  self.findTrails = (location, searchRadius) => {
    // Ajax call to trailapi to get all trails within searchRadius (in miles) of location.
    $.ajax(self.ajaxOptions(location, searchRadius)).done(function (response) {

      function isTrailRunning(activity) {
        return activity.activity_type_name == 'hiking' || activity.activity_type_name == 'mountain biking'
      }

      for (const place of response.places) {
        if (place.activities.length > 0 && place.activities.some( activity => isTrailRunning)) {
          const data = {
            title: place.name,
            description: place.description || 'no description available',
            location: {
              lat: place.lat,
              lng: place.lon
            },
            trails: null,
          };
          locationViewModel.addTrail(data);
        }
      }

      locationViewModel.displayMessage(false);
    }).fail(function () {
      // TODO: Display error message
    });
  };

  self.getTrailInfo = (location) => {
    // ajax call to trailapi to get content
    $.ajax(self.ajaxOptions(location, 0.1)).done(function(response) {
      let trails = []
      for (const place of response.places) {
        for (const activity of place.activities) {
          if (activity.activity_type_name == 'hiking' || activity.activity_type_name == 'mountain biking') {
            trails.push(activity)
          }
        }
      }
      locationViewModel.addInfoToCurrentTrail(trails)
    }).fail(function() {
      locationViewModel.addInfoToCurrentTrail(null)
    });
  };
}

const trailAPI = new TrailAPI()

/*
  replaceAll(string, search, replacement) {
    // function to fix at least one place description from trailapi. Taken from:
    // https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript?page=1&tab=votes#tab-top
    return string.split(search).join(replacement);
  },
*/
