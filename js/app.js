/**
* @description Represents a spot/location with running trails nearby
* @constructor
* @param {Object} data - A object representing the spot.
* @param {string} data.title - The name of the spot.
* @param {string} data.description - The spot description.
* @param {Object} data.location - A google.maps.LatLngLiteral object representing the coordinates of the spot.
* @param {number} data.location.lat - The latitude in degrees.
* @param {number} data.location.lng - The longitude in degrees.
* @param {Object[]} data.trails - The trails from trailapi located at this spot.
* @param {Object[]} data.articles - The articles from Wikipedia associated to this spot.
* @param {string} data.firebaseKey - The key of the node in Firebase database corresponding to this spot.
*/
class Spot {
  constructor(data) {
    this.deleteEnabled = ko.observable(false);
    this.trails = 'trails' in data ? data.trails : null;
    this.articles = 'articles' in data ? data.articles : null;
    this.location = data.location;
    this.title = data.title;
    this.description = data.description;
    this.firebaseKey = data.firebaseKey;
  }
}

class Message {
  constructor(text, type) {
    this.text = text;
    this.type = type;
  }
}

class SpotViewModel {
  constructor() {
    this.spots = ko.observableArray([]);
    this.currentSpot = ko.observable(null);
    this.filter = ko.observable(null);

    this.messages = ko.observableArray([]);
    this.displayMessages = ko.observable(false);

    this.displayPano = ko.observable(false);

    // Set default location to Pittsburgh, PA, USA
    this.userLocation = ko.observable({ lat: 40.440624, lng: -79.995888 });
    this.searchRadius = ko.observable(60);

    // Filter trails/markers.
    this.filteredSpots = ko.computed(() => {
      let searchResults = [];

      if (this.filter() === null) {
        searchResults = this.spots();
      } else {
        this.spots().forEach(spot => {
          const marker = spot.marker;
          if (spot.title.toLowerCase().indexOf(this.filter().toLowerCase()) !== -1) {
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

    /**
    * @description Calculate distance between user and farthest running spot displayed in the map
    * @returns {number} Distance in miles
    */
    this.filteredSpotsRadius = ko.computed(() => {
      let result = 0;
      this.filteredSpots().forEach(spot => {
        const distance = googleMap.computeDistance(this.userLocation(), spot.location);
        if (distance > result) { result = distance }
      });
      return Math.round(result * 0.000621371);
    });

    this.setCurrentSpot = spot => {
      this.currentSpot(spot);
      trailAPI.getTrailInfo();
      wikipediaAPI.getArticles();
      googleMap.showInfoWindow(spot.marker);

      // Allow default behavior of "a" links (go to the #map div). Useful for
      // small devices as the map will appear below the list of trails.
      return true;
    };

    this.saveSpot = spot => {
      if (typeof spot.firebaseKey != 'undefined') {
        this.addMessage({
          messageText: 'Trail already saved.',
          messageClass: 'alert-info'
        });
      } else {
        spot['firebaseKey'] = this.saveSpotInDb(spot);
        if (typeof spot.firebaseKey != 'undefined') {
          this.addMessage({
            messageText: 'Trail has been saved.',
            messageClass: 'alert-success'
          });
          // Notify knockout that currentSpot object has been updated.
          this.currentSpot.valueHasMutated();
        } else {
          this.addMessage({
            messageText: 'Error: Trail has not been saved.',
            messageClass: 'alert-danger'
          });
        }
      }
    };

    this.deleteSpot = spot => {
      this.deleteSpotData(spot)
      // Remove spot from observable.
      this.spots.remove(spot);
      this.addMessage({
        messageText: 'Trail has been deleted.',
        messageClass: 'alert-info'
      });
    };
  }

  init() {
    if (typeof firebase != 'undefined') {
      this.initializeSpots = firebase.database().ref().once('value').then(snapshot => {
        const userLocation = snapshot.child('user').exists() ? snapshot.child('user') : null;
        const spots = snapshot.child('spots').exists() ? snapshot.child('spots') : (snapshot.child('default').exists() ? snapshot.child('default') : null);
        return {userLocation: userLocation, spots: spots}
      }).then(data => {
        if (data.userLocation !== null) { this.userLocation(data.userLocation.val()) }
        if (data.spots !== null) {
          data.spots.forEach(spot => {
            let spotData = spot.val();

            // Add reference to Firebase key for later deletion from database.
            spotData['firebaseKey'] = spot.key;

            this.spots.push(new Spot(spotData));
          });
        } else {
          // Display error message if database empty.
          this.addMessage({
            messageText: `Could not find any saved trails, click "Find Trails" to start adding trails to the map.`,
            messageClass: 'alert-warning'
          });
        }
        return this.spots();
      }).catch(error => {
        // Display error message if Firebase promise rejected.
        this.addMessage({
          messageText: 'Error: Failed to retrieve trails from database. Try reloading the page.',
          messageClass: 'alert-danger'
        });
      });;
    } else {
      this.addMessage({
        messageText: 'Error: Could not connect to the database service. Your progress will not be saved! Check your internet connection or firewall and try reloading the page.',
        messageClass: 'alert-danger'
      });
    }
  }

  addInfoToCurrentSpot(key, infoArray) {
    let currentSpot = this.currentSpot();
    currentSpot[key] = infoArray;
    // Notify subscribers that currentSpot object has been updated.
    this.currentSpot.valueHasMutated();
  }

  findSpots() {
    // Save user location in database.
    this.saveUserLocation(this.userLocation())

    // Look for trails nearby user.
    this.addMessage({
      messageText: 'Finding nearby trails... Please wait.',
      messageClass: 'alert-info'
    });
    trailAPI.findTrails(this.userLocation(), this.searchRadius());
  }

  addSpot(spotData) {
    const spot = new Spot(spotData)
    this.spots.push(spot);
    googleMap.initMarker(spot);
  }

  alreadyExist(data) {
    // Check if there is already a marker at this location.
    return this.spots().some(spot => {
      // Loop until it evaluates to true
      return googleMap.computeDistance(data.location, spot.location) < 1.0;
    });
  }

  findUserLocation() {
    if (!navigator.geolocation){
      this.addMessage({
        messageText: `Your browser doesn't support geolocation. Drag the running man icon to your location, then click "Find Trails".`,
        messageClass: 'alert-warning'
      });
    } else {
      this.addMessage({
        messageText: 'Finding current location... Please wait.',
        messageClass: 'alert-info'
      });
      navigator.geolocation.getCurrentPosition(position => {
        this.userLocation({lat: position.coords.latitude, lng: position.coords.longitude});
        this.addMessage({
          messageText: 'Location found.',
          messageClass: 'alert-info'
        });
        // Recenter the map on the user location and reposition marker.
        googleMap.userLocationMarker.setMap(null);
        googleMap.resetMapBounds([]);
        googleMap.userLocationMarker.setPosition(this.userLocation())
        googleMap.userLocationMarker.setAnimation(google.maps.Animation.DROP)
        googleMap.userLocationMarker.setMap(googleMap.map);
        this.saveUserLocation(this.userLocation())
      }, () => {
        this.addMessage({
          messageText: `The Geolocation service failed. Drag the running man icon to your location, then click "Find Trails".`,
          messageClass: 'alert-warning'
        });
      });
    }
  }

  deleteSpotData(spot) {
    // Remove marker from map.
    googleMap.deleteMarker(spot.marker);
    // Remove spot from database.
    this.deleteSpotInDb(spot.firebaseKey)
  }

  removeAllSpots() {
    while (this.spots().length) {
      this.deleteSpotData(this.spots.pop())
    }
  }

  removeDistantSpots() {
    this.spots.remove(spot => {
      const distance = googleMap.computeDistance(this.userLocation(), spot.location);
      const tooFar = (distance * 0.000621371) > this.searchRadius()
      if (tooFar) { this.deleteSpotData(spot) }
      return tooFar;
    })
  }

  addMessage(message) {
    this.messages().forEach(message => {
      // Remove previous info messages.
      if (message.messageClass == 'alert-info' || message.messageClass == 'alert-success') { this.removeMessage(message) }
    });

    this.messages.push(message);
    if (!this.displayMessages()) { this.displayMessages(true) }

    message['timeoutDone'] = new Promise(resolve => setTimeout(() => resolve(), 2000));
  }

  removeMessage(message) { message.timeoutDone.then(() => this.messages.remove(message)) }

  enableDelete(spot) { spot.deleteEnabled(true) }

  disableDelete(spot) { spot.deleteEnabled(false) }

  saveSpotInDb(spot) {
    if (typeof firebase != 'undefined') {
      // Make a copy of only the necessary info before saving.
      const data = {
        description: spot.description,
        location: spot.location,
        title: spot.title
      };
      const newRef = firebase.database().ref('spots').push(data);
      return newRef.key;
    }
  }

  deleteSpotInDb(key) {
    if (typeof firebase != 'undefined') {
      firebase.database().ref('spots/' + key).remove()
    }
  }

  saveUserLocation(data) {
    if (typeof firebase != 'undefined') {
      const editRef = firebase.database().ref('user');
      editRef.set(data);
    }
  }
}

// TODO: Update binding to account for height of filter input form.
/**
* @description
* Custom Knockout JS binding. If true and element outside of its parent div, scroll up (or down
* depending on the position) to the bound element.
* Inspired from https://www.snip2code.com/Snippet/54357/ScrollTo-binding-for-knockout
* @example
* <li data-bind="scrollTo: boolean">
*/
ko.bindingHandlers.scrollTo = {
  update: function(element, valueAccessor) {
    const valueUnwrapped = ko.unwrap(valueAccessor());
    if (valueUnwrapped == true) {
      const scrollParent = $(element).parent();
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
