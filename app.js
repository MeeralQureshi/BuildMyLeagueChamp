const cheerio = require('cheerio')
const jsonframe = require('jsonframe-cheerio')
const got = require('got');
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const {dialogflow} = require('actions-on-google');
const assistant = dialogflow({debug: true});

// Use body parser for requests
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json({type: 'application/json'}));
app.set('port', process.env.PORT || 8000);

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
    return JSON.parse(championCounters).counters;
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
    return JSON.parse(championStrengths).strengths;
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

// Assitant Intents
assistant.intent('ChampionCounter', async (conv) => {
	let champ = conv.parameters.Champion;
	let role = conv.parameters.Role;
	try {
		console.log("Getting data");
		var championCounters = await getChampionCounters(champ, role);
		let speech = "Champions that counter " + champ + " " + role + " are: ";
		for (var i = 0; i < championCounters.length; i++) {
			if(i == championCounters.length-1){
				speech = speech.slice(0, speech.length-2);
				speech += " and " + championCounters[i];
			}
			else{
				speech += championCounters[i] + ", ";
			}
		}
		conv.ask(speech);
	}
	catch(e){
		console.log("Error in getting data");
		conv.ask("There was an error. Please try again");
	}
});

assistant.intent('ChampionStrengths', async (conv) => {
	let champ = conv.parameters.Champion;
	let role = conv.parameters.Role;
	try {
		console.log("Getting data");
		var championStrengths = await getChampionStrengths(champ, role);
		let speech = "Champions that counter " + champ + " " + role + " are: ";
		for (var i = 0; i < championStrengths.length; i++) {
			if(i == championStrengths.length-1){
				speech = speech.slice(0, speech.length-2);
				speech += " and " + championStrengths[i];
			}
			else{
				speech += championStrengths[i] + ", ";
			}
		}
		conv.ask(speech);
	}
	catch(e){
		console.log("Error in getting data");
		conv.ask("There was an error. Please try again");
	}
});


// Webhook route
app.post('/webhook', assistant);

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

app.listen(app.get('port'), function () {
	console.log('Building champions on port', app.get('port'));
});