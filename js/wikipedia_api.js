function WikipediaAPI() {
  const self = this;

  self.getArticles = () => {
    // Use a timeout to disply error message if API call fail.
    const errorTimeout = setTimeout(() => {
      spotViewModel.addMessage({
        messageText: 'Error: Wikipedia Articles Could Not Be Loaded.',
        messageClass: 'alert-danger'
      });
    }, 5000);

    $.ajax({
      url: 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' + spotViewModel.currentSpot().title,
      dataType: 'jsonp',
      success(data) {
        let articles = [];
        $.each(data[1], (index, article) => {
            articles.push({
              title: article,
              description: data[2][index],
              url: data[3][index]
            });
        });
        spotViewModel.addInfoToCurrentSpot('articles', articles);

        // Cancel timeout for error message.
        clearTimeout(errorTimeout);
      }
    });
  };
}

const wikipediaAPI = new WikipediaAPI();
