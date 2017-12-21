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
        messageText: 'Error: Could not connect to the database service. Your progress will not be saved! Check your internet connection or firewall and try reloading the page.',
        messageClass: 'alert-danger'
      });
    }
  };

  self.saveSpot = spot => {
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
