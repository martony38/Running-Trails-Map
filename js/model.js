function SpotModel() {
  const self = this;

  self.init = () => {
    if (typeof firebase != 'undefined') {
      self.getSpots = firebase.database().ref().once('value').then(snapshot => {
        const userLocation = snapshot.child('user').exists() ? snapshot.child('user') : null;
        const spots = snapshot.child('spots').exists() ? snapshot.child('spots') : (snapshot.child('default').exists() ? snapshot.child('default') : null);
        return {userLocation: userLocation, spots: spots}
      });
    } else {
      spotViewModel.addMessage({
        messageText: 'Error: Could not connect to the database service. Your progress will not be saved!!! Check your internet connection or firewall.',
        messageClass: 'alert-danger'
      });
    }
  };

  self.saveSpot = data => {
    if (typeof firebase != 'undefined') {
      const newRef = firebase.database().ref('spots').push(data);
      return newRef.key;
    }
  };


  self.deleteSpot = key => {
    if (typeof firebase != 'undefined') {
      firebase.database().ref('spots/' + key).remove()
    }
  };

  self.saveUserLocation = data => {
    if (typeof firebase != 'undefined') {
      const editRef = firebase.database().ref('user');
      editRef.set(data);
    }
  };
}

const spotModel = new SpotModel();
