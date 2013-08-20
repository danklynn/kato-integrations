var util = require('util');
var request = require('request');

var KATO_USERNAME = "YOUR_KATO_USERNAME";
var KATO_PASSWORD = "YOUR_KATO_PASSWORD";
var KATO_ROOM_ID = 'YOUR_KATO_ROOM_ID';

var CAMPFIRE_ROOM_ID = 'YOUR_CAMPFIRE_ROOM_ID';
var CAMPFIRE_API_KEY = 'YOUR_CAMPFIRE_API_KEY';
var CAMPFIRE_SUBDOMAIN = 'YOUR_SUBDOMAIN_HERE';

// First, make sure we have a session cookie
request({
	method: "PUT",
	uri: 'https://api.kato.im/sessions/' + uuid(),
	json: {
		email: KATO_USERNAME,
		password: KATO_PASSWORD
	}
}, function(error, response, body) {
	var cookie = response.headers['set-cookie'][0].split(';')[0];
	if (200 == response.statusCode) {
		openWebSocket(cookie);
	}
});

function openWebSocket(cookie) {
	// requires ws patch at https://github.com/danklynn/ws
	// install locally if needed with:
	// cd /path/to/ws
	// npm install .
	// ---- then change require('ws') to require('/path/to/ws')
	var WebSocket = require('ws')
	  , ws = new WebSocket("wss://api.kato.im/ws", {
		origin: 'https://kato.im',
		cookies: cookie
	});
	ws.on('open', function() {
		ws.send(JSON.stringify({
			room_id : KATO_ROOM_ID,
			type : "hello"
		}));
		console.log("Connected.");
	});
	ws.on('message', function(msg) {
		var message = JSON.parse(msg);
		if (message.type == "text" && message.from.status != "robot") {
			postToCampfire(message.from.name, message.params.text)
		}
	});
	
}

function postToCampfire(sender, message) {
	var xml = util.format('<message><type></type><body>%s: %s</body></message>', 
		encodeXML(sender), 
		encodeXML(message));
		
	request({
		method: "POST",
		uri: "https://" + CAMPFIRE_SUBDOMAIN + ".campfirenow.com/room/" + CAMPFIRE_ROOM_ID + '/speak.xml',
		auth: {user: CAMPFIRE_API_KEY, pass: 'X'},
		headers: {"Content-Type": "text/xml"},
		body: xml
	}, function(err, response, body) {
		if (response.statusCode != 201) {
			console.log("Error! " + body);
		}
	})
}

function uuid(size) {
    var part = function (d, v) {
        return d ? part(d - 1, v) + Math.ceil((0xffffffff * Math.random())).toString(16) : v;
    }
    return part(size || 8, '');
}

function encodeXML(str) {
    return str.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;');
}
