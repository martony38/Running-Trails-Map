function Model() {
  const self = this;

  self.init = () => {
    if (typeof firebase != 'undefined') {
      self.getTrails = firebase.database().ref('locations/').once('value').then(snapshot => {
        return snapshot.child('trails').exists() ? snapshot.child('trails') : (snapshot.child('default').exists() ? snapshot.child('default') : null);
      });
    } else {
      locationViewModel.addMessage({
        messageText: 'Error: Could not connect to the database service. Your progress will not be saved!!! Check your internet connection or firewall.',
        messageClass: 'alert-danger'
      });
    }
  };

  self.saveTrail = data => {
    if (typeof firebase != 'undefined') {
      const newRef = firebase.database().ref('locations/trails').push(data);
      return newRef.key;
    }
  };


  self.deleteTrail = key => {
    if (typeof firebase != 'undefined') {
      firebase.database().ref('locations/trails/' + key).remove()
    }
  };

}

const locationModel = new Model();
