function WikipediaAPI() {
  const self = this;

  self.getArticles = () => {
    // Use a timeout to disply error message if API call fail.
    const errorTimeout = setTimeout(function(){
      locationViewModel.addMessage({
        messageText: 'Error: Wikipedia Articles Could Not Be Loaded',
        messageClass: 'alert-danger'
      });
    }, 2000);

    $.ajax( {
      url: 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' + locationViewModel.currentTrail().title,
      //url: 'http://wikitravel.org/wiki/en/api.php?action=opensearch&format=json&search=' + locationViewModel.currentTrail().title,
      dataType: 'jsonp',
      success: function (data) {
        console.log(data);
        let articles = [];
        $.each(data[1], function(index, article) {
            articles.push({
              title: article,
              description: data[2][index],
              url: data[3][index]
            });
        });
        locationViewModel.addInfoToCurrentTrail('articles', articles);

        // Cancel timeout for error message.
        clearTimeout(errorTimeout);
      }
    });
  };
}

const wikipediaAPI = new WikipediaAPI();
