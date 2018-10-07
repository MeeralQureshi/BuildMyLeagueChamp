const cheerio = require('cheerio')
const jsonframe = require('jsonframe-cheerio')
const got = require('got');
const express = require('express');

var app = express();

// Helper functions WAW
const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
};

async function getChampionCounters(champion, role) {
    var requestUrl = "http://na.op.gg/champion/" + champion + "/statistics/" + role;
    console.log(requestUrl);
    var html = await got(requestUrl);
    let $ = cheerio.load(html.body);
    jsonframe($);
    var frame = {
        "counters": ["tbody tr .champion-stats-header-matchup__table__champion"]
    }
    console.log("This works");
    let championCounters = $('.champion-stats-header-matchup__table--strong').scrape(frame, { string: true });
    console.log(championCounters); // Output the data in the terminal
    return championCounters;
}

async function getChampionStrengths(champion, role) {
    var requestUrl = "http://na.op.gg/champion/" + champion + "/statistics/" + role;
    console.log(requestUrl);
    var html = await got(requestUrl);
    let $ = cheerio.load(html.body);
    jsonframe($);
    var frame = {
        "strengths": ["tbody tr .champion-stats-header-matchup__table__champion"]
    }
    console.log("This works");
    let championStrengths = $('.champion-stats-header-matchup__table--weak').scrape(frame, { string: true });
    console.log(championStrengths); // Output the data in the terminal
    return championStrengths;
}

async function getChampionSumms(champion, role) {
    var requestUrl = "https://champion.gg/champion/" + champion + "/" + role;
    console.log(requestUrl);
    var html = await got(requestUrl);
    let $ = cheerio.load(html.body);

    var summonerSpells = [];
    $('.summoner-wrapper a img').each(function(index, element){
    	if(summonerSpells.length < 2){
    		summonerSpells.push($(element).attr('tooltip'));
    	}
    });
    console.log(summonerSpells);
    return summonerSpells;
}

async function getChampionStart(champion, role) {
    var requestUrl = "https://champion.gg/champion/" + champion + "/" + role;
    console.log(requestUrl);
    var html = await got(requestUrl);
    let $ = cheerio.load(html.body);

    var championStart = [];
    $('.col-xs-12.col-sm-12.col-md-5 .build-wrapper a').each(function(index, element){
    	if(championStart.length < 2){
    		var item = $(element).attr('href').slice($(element).attr('href').lastIndexOf("/") + 1, $(element).attr('href').length);
    		var item = item.replace('\\', '');
    		championStart.push(item);
    	}
    });
    console.log(championStart);
    return championStart;
}

async function getChampionBuild(champion, role) {
    var requestUrl = "https://champion.gg/champion/" + champion + "/" + role;
    console.log(requestUrl);
    var html = await got(requestUrl);
    let $ = cheerio.load(html.body);

    var championBuild = [];
    $('.col-xs-12.col-sm-12.col-md-7 .build-wrapper a').each(function(index, element){
    	if(championBuild.length < 6){
    		var item = $(element).attr('href').slice($(element).attr('href').lastIndexOf("/") + 1, $(element).attr('href').length);
    		var item = item.replace('\\', '');
    		championBuild.push(item);
    	}
    });
    console.log(championBuild);
    return championBuild;
}

// Routes
app.post('/championCounters', asyncMiddleware(async (req, res, next) => {
	// if champion and role exist in request
	var speech = "Sorry, that isn't a valid champion and role combination.";
	if(req.body.result.parameters && req.body.result.parameters.Champion && req.body.result.parameters.Role){
		var championCounters = await getChampionCounters(req.body.result.parameters.Champion, req.body.result.parameters.Role);
		speech = "Champions that counter " + req.body.result.parameters.Champion + " " + req.body.result.parameters.Role + " are: ";
		for (var i = 0; i < championBuild.length; i++) {
			if(i == championBuild.length-1){
				speech = speech.slice(0, speech.length-2);
				speech += " and " + championCounters[i];
			}
			else{
				speech += championCounters[i] + ", ";
			}
		}
	}
    return res.json({
    speech: speech,
    displayText: speech,
    source: "BuildMyLeagueChamp"
  });
}));

app.get('/championStrengths', asyncMiddleware(async (req, res, next) => {
    var championStrengths = await getChampionStrengths("ahri", "middle");
    res.send(championStrengths);
}));

app.get('/championSumms', asyncMiddleware(async (req, res, next) => {
    var championSumms = await getChampionSumms("ahri", "middle");
    res.send(championSumms);
}));

app.get('/championStart', asyncMiddleware(async (req, res, next) => {
    var championStart = await getChampionStart("ahri", "middle");
    res.send(championStart);
}));

app.get('/championBuild', asyncMiddleware(async (req, res, next) => {
    var championBuild = await getChampionBuild("ahri", "middle");
    res.send(championBuild);
}));

app.listen(process.env.PORT || 8000, function() {
    console.log('Building Champs...');
});