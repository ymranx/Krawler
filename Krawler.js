/**************************
	Dependencies
	## cheerio {A DOM parser for NodeJS}
	## request {Http request module}
***************************/
var $ 		= require('cheerio'),
	request = require('request'),
	hasher  = require('crypto'),
	urlLib  = require('url');
	
/************************
	Constructor Krawler
	## JS Class for the crawler
	## param : @url
************************/
var Krawler = function(url) {
	this.url = url;
	this.totalIndexed = 0;
	this.totalVisit = 0;
	this.toVisit = -1;
	/*
		repository is a hashmap which contains SHA1 hash of url as keys
		and url as value
	*/
	this.repository = {};
	/*
		visitableList maintains a list of urls to be visited.
		It gets empty when all the urls are visited
	*/
	this.visitableList = [url];
	this.onComplete = function(){};
	this.onError = function(){};
}
/*************************
	Method crawn
	## Member function to crawl
	## param : @callback : callback method for success
	##         @tovisit{optiona} : Number of page to visit (no value or -1 for visiting nth link}
*************************/
Krawler.prototype.crawl = function(callback, tovisit) {
	if(tovisit) {
		this.toVisit = Number(tovisit);
	}
	var _this = this;
	var continueVisit = true;
	/********************
	Method visitNextpage
	## It visits the next page from url taken from poping the visitable list
	## param : None
	*********************/
	function visitNextPage() {
	    var _url = _this.visitableList.pop();
		var getPage = request(_url, function(error, response, body){
			_this.totalVisit += 1;
			if(_this.toVisit>0 && _this.totalVisit >= _this.toVisit) {
				continueVisit = false;
			}
			if(error) {
				//Skip to next page if avaiable
				if(_this.visitableList.length) {
					visitNextPage();
				}
				_this.onError(error, _url);
			}else {
				parseLink(response, body, _url);
				callback({url:_url, totalIndexed:_this.totalIndexed})
			}
		});
	}
	/*************************
	Method parseLink
	## It parses the response body for extracting list of links and visit them gradually
	## param : @response : Http response
	##         @body : response body
	##         @_url : visited url
	*************************/
	function parseLink(response, body, _url) {
		if (response.statusCode === 200) {
				var links = $('a', body),
					curLink,
					shaAlgo,
					shaOfLink,
					validUrl,
					protocol;
				shaAlgo   = hasher.createHash('sha1');
				shaAlgo.update(_url);
				shaOfLink = shaAlgo.digest('hex');
				_this.repository[shaOfLink] = _url;
				_this.totalIndexed += 1 + links.length;
				for(var i=0; i<links.length; i++) {
					curLink = $(links[i]).attr('href');
					if(curLink) {
						//resolve the relative paths
						if(!(/^http\:\/\/|https\:\/\//.test(curLink))) {
							validUrl = urlLib.resolve(_url, curLink);
						}else {
							validUrl = curLink;
						}
						shaAlgo = hasher.createHash('sha1');
						shaAlgo.update(validUrl);
						shaOfLink = shaAlgo.digest('hex');
						protocol = urlLib.parse(validUrl).protocol;
						// visit only http urls ignoring others like mailto:
						if(protocol==='http:' || protocol==='https:') {
							if(!(shaOfLink in _this.repository)) {
								_this.repository[shaOfLink] = validUrl;
								_this.visitableList.push(validUrl);
							}
						}
					}
				}
				if(_this.visitableList.length && continueVisit) {
					var linkToVisit = _this.visitableList.pop();
					visitNextPage(linkToVisit);
				}else {
					_this.onComplete(_this.repository, _this.totalIndexed, _this.totalVisit);
				}
		}
		else {
		if(_this.visitableList.length && continueVisit) {
					var linkToVisit = _this.visitableList.pop();
					visitNextPage(linkToVisit);
					_this.onError("status :"+response.statusCode, _url);
				}else {
					_this.onComplete(_this.repository, _this.totalIndexed, _this.totalVisit);
				}
		}
	}
	
	visitNextPage();
}
module.exports = Krawler;
