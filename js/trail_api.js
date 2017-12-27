class TrailAPI {
  constructor() {
    this.ajaxOptions = (location, searchRadius) => {
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

    this.findTrails = (location, searchRadius) => {
      // Ajax call to trailapi to get all trails within searchRadius (in miles) of location.
      $.ajax(this.ajaxOptions(location, searchRadius)).done(response => {

        function isTrailRunning(activity) {
          return activity.activity_type_name == 'hiking' || activity.activity_type_name == 'mountain biking';
        }

        // Initialize counters.
        let trailFoundCounter = 0;
        let trailAddedCounter = 0;

        for (const place of response.places) {
          if (place.activities.length > 0 && place.activities.some(isTrailRunning)) {
            const data = {
              title: place.name,
              description: place.description || 'no description available',
              location: {
                lat: place.lat,
                lng: place.lon
              },
              trails: null,
              articles: null
            };

            // Update counters.
            trailFoundCounter++;
            if (!spotViewModel.alreadyExist(data)) {
              spotViewModel.addSpot(data);
              trailAddedCounter++;
            }
          }
        }

        spotViewModel.addMessage({
          messageText: `${trailFoundCounter} ${pluralize('trail', trailFoundCounter)} found.
            ${trailAddedCounter} ${pluralize('trail', trailAddedCounter)} ${pluralize('was', trailAddedCounter)} added to the map.`,
          messageClass: 'alert-info'
        });
      }).fail(this.errorMessage);
    };

    this.getTrailInfo = () => {
      // ajax call to trailapi to get info about one specific location.
      $.ajax(this.ajaxOptions(spotViewModel.currentSpot().location, 0.1)).done(response => {
        let trails = []
        for (const place of response.places) {
          for (const activity of place.activities) {
            if (activity.activity_type_name == 'hiking' || activity.activity_type_name == 'mountain biking') {
              trails.push(activity)
            }
          }
        }
        spotViewModel.addInfoToCurrentSpot('trails', trails)
      }).fail(this.errorMessage);
    };

    this.errorMessage = () => {
      spotViewModel.addMessage({
        messageText: 'Error while connecting to trailapi, please check your internet connection or firewall and try again.',
        messageClass: 'alert-danger'
      });
    };
  }
}

const trailAPI = new TrailAPI()
