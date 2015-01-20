var kwarler = require('./Krawler');

/***********************************************
### Testing the APIs. :)
************************************************/

var krawler =  new kwarler('http://en.wikipedia.org');

/*************************
	put +ve int to 2nd param if you want to restrict the crawler to visit only that number of pages.
	Otherwise put -ve or just simply leave as blank.
*************************/
krawler.crawl();
/*************************
	Error call back
*************************/
krawler.on('error',function(error){
	console.log('Error occured ' + error);
});
/*************************
	Completion callback
*************************/
krawler.on('complete',function(repo, totalIndexed, totalVisited){
	console.log('Total Indexed ' + totalIndexed);
	console.log('Total Visited ' + totalVisited);
});
krawler.on('crawl', function(data){
	console.log('Visiting :' + data.url);
	console.log('Total indexed :' + data.totalIndexed);
});