function Model() {
  const self = this;

  self.defaultLocations = [];

  self.init = function() {
    // Populate default locations with the data from firebase database.
    firebase.database().ref('defaultTrails').once('value').then(function(trails) {
      trails.forEach(function(trail) {
        self.defaultLocations.push(trail.val());
      });
    });
  };
}

const locationModel = new Model();
