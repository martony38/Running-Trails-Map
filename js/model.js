function Model() {
  const self = this;

  self.init = () => {
    self.getTrails = firebase.database().ref('locations/').once('value').then(snapshot => {
      return snapshot.child('trails').exists() ? snapshot.child('trails') : (snapshot.child('default').exists() ? snapshot.child('default') : null);
    }, error => { return null });
  };

  self.saveTrail = data => { firebase.database().ref('locations/trails').push(data) };
}

const locationModel = new Model();
