const util = require('util');
const express = require('express');
var querystring = require('querystring');
const app = express();

// Includiamo la libreria "body-parser" per gestire le richieste in JSON.
const bodyparser = require('body-parser');
app.use(bodyparser.json());

// Includiamo il modulo "request" per effettuare richieste HTTP
const https = require('https');

// Webhook per Telegram
app.post('/telegram', (req, res) => {
	console.log("Richiesta: " + JSON.stringify(req.body));
	const chatid = req.body.message.chat.id;
  const text = req.body.message.text;
  const clientid = req.body.message.from.id;
	
	console.log("Utente in chat " + chatid + " ha scritto '" + text + "'");
  
  process.env.COMMAND_OR_INPUT = 1;
  
  sendText(chatid, "Messaggio ricevuto");
  
  if(text == "/start"){
    sendText(chatid, "Benvenuto nel bot. Digita il comando /help per visualizzare i possibili comandi che il bot mette a disposizione.");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 0;
    checkTokenValidity(process.env.SPOTIFY_ACCESS_TOKEN);
  }
  if(text == "/searchsongbyparameter"){
    sendText(chatid, "Digita i termini con cui eseguire la ricerca");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 1;
    checkTokenValidity(process.env.SPOTIFY_ACCESS_TOKEN);
  }
  if(text == "/getartistpagebyname"){
    sendText(chatid, "Digita il nome dell'autore");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 2;
    checkTokenValidity(process.env.SPOTIFY_ACCESS_TOKEN);
  }
  if(text == "/searchyoutubevideos"){
    sendText(chatid, "Digita i termini della ricerca");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 3;
    checkTokenValidity(process.env.SPOTIFY_ACCESS_TOKEN);
  }
  if(text == "/searchsongonspotify"){
    if(clientid == process.env.ADMIN_ID){
      sendText(chatid, "Digita i termini della ricerca");
      process.env.COMMAND_OR_INPUT = 0;
      process.env.ACTION_TO_DO = 4;
      checkTokenValidity(process.env.SPOTIFY_ACCESS_TOKEN);
    }else{
      sendText(chatid, "Funzione riservata all'utente admin.");
      process.env.COMMAND_OR_INPUT = 0;
      process.env.ACTION_TO_DO = 0;
    }
  }
  if(text == "/help"){
    process.env.ACTION_TO_DO = 5;
    process.env.COMMAND_OR_INPUT = 1;
    checkTokenValidity(process.env.SPOTIFY_ACCESS_TOKEN);
  }
  
  if(process.env.COMMAND_OR_INPUT == 1){
    if((process.env.ACTION_TO_DO == 1) || 
       (process.env.ACTION_TO_DO == 2) ||
       (process.env.ACTION_TO_DO == 3) ||
       (process.env.ACTION_TO_DO == 4) ||
       (process.env.ACTION_TO_DO == 5)){
      if(process.env.ACTION_TO_DO == 1){
        console.log("Eseguirò la richiesta getMusicByParameter con termini di ricerca '"+text+"'");
        sendRequestToPlatform(chatid, text, process.env.ACTION_TO_DO, process.env.SPOTIFY_ACCESS_TOKEN);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 2){
        console.log("Eseguirò la richiesta getArtistPageByName con termini di ricerca '"+text+"'");
        sendRequestToPlatform(chatid, text, process.env.ACTION_TO_DO, process.env.SPOTIFY_ACCESS_TOKEN);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 3){
        console.log("Eseguirò la richiesta searchYoutubeVideos con termini di ricerca '"+text+"'");
        sendRequestToPlatform(chatid, text, process.env.ACTION_TO_DO, process.env.SPOTIFY_ACCESS_TOKEN);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 4){
        console.log("Eseguirò la richiesta searchSongOnSpotify con termini di ricerca '"+text+"'");
        sendRequestToPlatform(chatid, text, process.env.ACTION_TO_DO, process.env.SPOTIFY_ACCESS_TOKEN);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 5){
        console.log("Eseguirò la richiesta del comando di help");
        sendRequestToPlatform(chatid, text, process.env.ACTION_TO_DO, process.env.SPOTIFY_ACCESS_TOKEN);
        process.env.ACTION_TO_DO = 0;
      }
    }else{
      sendText(chatid, "Comando non disponibile.");
    }
  }
	res.end();
  
});

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

function sendText(chatId, text){
  const requestBody = { 
	      chat_id: chatId,
	      text: text
  }
  
  const clientreq = https.request({
    method: 'POST',
    host: 'api.telegram.org',
    path: '/bot' + process.env.BOTTOKEN + '/sendMessage',
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log(resp.statusCode);
      return;
    }  
  });
  clientreq.write(JSON.stringify(requestBody));	
  clientreq.end(); // questa chiamata esegue la richiesta
}

function getNewAccessToken(){
  var bodyRequest = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: process.env.SPOTIFYKEYREFRESH
  });
  
  const clientreq = https.request({
    method: 'POST',
    host: 'accounts.spotify.com',
    path: '/api/token',
    headers: {
      'Content-Type':'application/x-www-form-urlencoded',
	    'Authorization':'Basic '+process.env.SPOTIFYBASE64ID
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP Spotify NewToken fallita");
      console.log(resp.statusCode);
      return;
    }
    console.log("Richiesta HTTP Spotify NewToken riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      
      const j = JSON.parse(body);
      var token = j.access_token;
      process.env.SPOTIFY_ACCESS_TOKEN = token;
      console.log("Nuovo token ottenuto.");
    });
  });
  //console.log(clientreq);
  clientreq.write(bodyRequest);
  clientreq.end(); // questa chiamata esegue la richiesta
}

function checkTokenValidity(token){
  var searchString = "prova";
  const clientreq = https.request({
    method: 'GET',
    host: 'api.spotify.com',
    path: '/v1/search?q='+searchString+'&type=track&limit=5&access_token='+token,
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      getNewAccessToken();
    }else{
      console.log("Token valido.");
      console.log(process.env.SPOTIFY_ACCESS_TOKEN);
    }
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}

function sendRequestToPlatform(chatId, text, actionToDo, token){
  var requestBody;
  var host = "piattaformacontenutimusicali.herokuapp.com";
  sendText(chatId, "Ora invio la richiesta");
  if(actionToDo == 1){
    var searchString = text;
    searchString = searchString.replace(/\s/g,"+");
    var path = "/searchiTunesSong";
    requestBody = {
	      text: searchString,
    }
  }
  if(actionToDo == 2){
    var searchString = text;
    searchString = searchString.replace(/\s/g,"+");
    var path = "/searchiTunesArtist";
    requestBody = { 
	      text: searchString,
    }
  }
  if(actionToDo == 3){
    var searchString = text;
    searchString = searchString.replace(/\s/g,"+");
    var path = "/searchYoutubeVideos";
    requestBody = { 
	      text: searchString,
    }
  }
  if(actionToDo == 4){
    var searchString = text;
    searchString = searchString.replace(/\s/g,"+");
    var path = "/searchSongOnSpotify";
    requestBody = { 
	      text: searchString,
        token: token
    }
  }
  if(actionToDo == 5){
    var path = "/help";
    requestBody = { 
	      text: "comando /help"
    }
  }
  
  const clientreq = https.request({
    method: 'POST',
    host: host,
    path: path,
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      return;
    }  
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      const j = JSON.parse(body);
      
      sendText(chatId, j);
      
    });
    
  });
  clientreq.write(JSON.stringify(requestBody));	
  clientreq.end(); // questa chiamata esegue la richiesta
}