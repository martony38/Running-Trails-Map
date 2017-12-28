class WikipediaAPI {
  constructor() {
    this.getArticles = () => {
      $.ajax({
        url: 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' + spotViewModel.currentSpot().title,
        dataType: 'jsonp'
      }).done(data => {
        let articles = [];
        $.each(data[1], (index, article) => {
            articles.push({
              title: article,
              description: data[2][index],
              url: data[3][index]
            });
        });
        spotViewModel.addInfoToCurrentSpot('articles', articles);
      }).fail(() => {
        // Use a timeout to disply error message if API call fail.
        spotViewModel.addMessage('Error: Wikipedia Articles Could Not Be Loaded.', 'alert-danger');
      });
    };
  }
}

const wikipediaAPI = new WikipediaAPI();
