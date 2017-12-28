# Running Trails App

Source code for my fifth project for the [Full Stack Web Developer Nanodegree](https://www.udacity.com/course/full-stack-web-developer-nanodegree--nd004) (FSWDN) program from Udacity.

This project is a single page web application featuring a list of nearby running trails and a map with the corresponding markers. The map can be used to search for trails which can then be saved or deleted (in a Firebase database). Additional info is displayed when clicking on the trail markers or the list items. A list with 6 default locations is shown if no trails have been saved.

## Installation

Clone or download the repository on your computer.

Install [Yarn](https://yarnpkg.com/en/docs/install).

From within the project folder, install all dependencies using `yarn install`.

Open index.html with your favorite browser.

### Optional: Use your own API keys

Create a Firebase project and add a Firebase Realtime Database by following this [guide](https://firebase.google.com/docs/database/web/start?authuser=0).

Get a free api key for [TrailAPI](http://www.trailapi.com/).

Then update the script at bottom of *index.html*:
```
<script>
  // Initialize Firebase
  const config = {
    apiKey: "<API_KEY>",
    databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
    projectId: "<PROJECT_ID>"
  };
  firebase.initializeApp(config);

  // TrailAPI key
  const trailApiKey = "<TrailAPI_API_KEY>";
</script>
```

Go to the [Google APIs Console](https://console.developers.google.com/) and create your own project. Add the [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/tutorial) to your project then replace the api key in the last script of *index.html* with your own:
```
<script async defer src="https://maps.googleapis.com/maps/api/js?libraries=geometry&key=<YOUR_API_KEY>&v=3&callback=googleMap.init"></script>
```
