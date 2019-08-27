const https = require("https");
const url = require("url");
const fs = require("fs");
const express = require("express");
const app = express();
const WebSocket = require("ws");
const commandLineArgs = require("command-line-args");

const optionDefinitions = [
    { name: "redirectUri", alias: "r", type: String, defaultValue: "http://localhost/callback" },
	{ name: "httpPort", type: Number, defaultValue: 80 },
	{ name: "wsPort", type: Number, defaultValue: 9090 },
    { name: "clientID", alias: "c", type: String, defaultValue: "fb87a8dcc6504073a292ae657458c3ea"},
    { name: "secretFile", alias: "s", type: String, defaultValue: "./CLIENT_SECRET" }
];
const options = commandLineArgs(optionDefinitions);

const CLIENT_ID = options.clientID;
const REDIRECT_URI = options.redirectUri;
const HTTP_PORT = options.httpPort;
const WSS_PORT = options.wsPort;

const CSFile = fs.readFileSync(options.secretFile);
const CLIENT_SECRET = CSFile.toString("utf8", 0, CSFile.length);

app.get("/login", (req, res) => {
	let scopes = "user-top-read user-read-recently-played user-library-read";
	let redirectURL = "https://accounts.spotify.com/authorize" +
					  "?client_id=" + CLIENT_ID +
					  "&response_type=code" +
					  "&redirect_uri=" + encodeURIComponent(REDIRECT_URI) +
					  "&scope=" + encodeURIComponent(scopes);
	console.log(redirectURL);
	res.redirect(redirectURL);
});

app.get("/callback", (req, res) => {
	if(req.query.error) {
		res.send(req.query.error);
	} else {
		res.sendFile(__dirname + "/public/callback");
	}

	let code = req.query.code;
});

app.use(express.static("./public", { "extensions": ["html"] }));

app.listen(HTTP_PORT, () => { console.log("Server running on port " + HTTP_PORT); });

const wss = new WebSocket.Server({ port: WSS_PORT }, () => { console.log("WebSocket server running on port " + WSS_PORT) });

wss.on("connection", (ws) => {
	ws.on("message", (msg) => {
		msg = JSON.parse(msg);
		wss.emit(msg.event, ws, msg.data);
	});
});

wss.on("callbackCode", (ws, wsData) => {
	let code = wsData.code;

	const options = {
		"hostname": "accounts.spotify.com",
		"method": "POST",
		"path": "/api/token",
		"headers": {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		"auth": CLIENT_ID + ":" + CLIENT_SECRET
	}

	const postReq = https.request(options, (res) => {
		let data = "";
		res.on("data", (d) => {
			data += d;
		});

		res.on("end", () => {
			data = JSON.parse(data);
			if(!data.error) {
				ws.spotify = data;
				getSavedTracks(ws);
			}
		});
	});

	postReq.end("grant_type=authorization_code" +
				"&code=" + code +
				"&redirect_uri=" + encodeURIComponent(REDIRECT_URI));
});

wss.on("getTop", (ws, wsData) => {
	getTop(ws, wsData.type, wsData.time_range);
});

function getTop(ws, type, time_range) {
	const options = {
		"hostname": "api.spotify.com",
		"path": "/v1/me/top/" + type + "?limit=50&time_range=" + time_range,
		"headers": {
			"Authorization": "Bearer " + ws.spotify.access_token
		}
	}
	https.get(options, (res) => {
		let data = "";
		res.on("data", (d) => {
			data += d;
		});

		res.on("end", () => {
			let wsObj;
			if(type == "tracks") {
				wsObj = {
					"event": "topTracks",
					"data": {
						"topTracks": JSON.parse(data)
					}
				}
			} else if(type == "artists") {
				wsObj = {
					"event": "topArtists",
					"data": {
						"topArtists": JSON.parse(data)
					}
				}
			}
			ws.send(JSON.stringify(wsObj));
		});
	});
}

function getSavedTracks(ws) {
	const options = {
		"hostname": "api.spotify.com",
		"path": "/v1/me/tracks?limit=50",
		"headers": {
			"Authorization": "Bearer " + ws.spotify.access_token
		}
	}
	https.get(options, (res) => {
		let data = "";
		res.on("data", (d) => {
			data += d;
		});

		res.on("end", () => {
			const spotifyData = JSON.parse(data);
			if(spotifyData.next) {
				getSavedTracksNext(spotifyData.next, ws.spotify.access_token, (results) => {
					spotifyData.items = spotifyData.items.concat(results);
					const wsObj = {
						"event": "savedTracks",
						"data": {
							"savedTracks": spotifyData
						}
					}
					ws.send(JSON.stringify(wsObj));
				});
			} else {
				const wsObj = {
					"event": "savedTracks",
					"data": {
						"savedTracks": spotifyData
					}
				}
				ws.send(JSON.stringify(wsObj));
			}
		});
	});
}

function getSavedTracksNext(next, bearer, callback) {
	const options = url.parse(next);
	options.headers = {
			"Authorization": "Bearer " + bearer
		}
	https.get(options, (res) => {
		let data = "";
		res.on("data", (d) => {
			data += d;
		});

		res.on("end", () => {
			const spotifyData = JSON.parse(data);
			if(spotifyData.next) {
				getSavedTracksNext(spotifyData.next, bearer, (results) => {
					spotifyData.items = spotifyData.items.concat(results);
					callback(spotifyData.items);
				});
			} else {
				callback(spotifyData.items);
			}
		});
	});
}

// TODO: button to switch user once logged in (just send initial redirect with show_dialog=true)
// TODO: automatically add new songs of one playlist to another playlist (e.g. pink slip -> maybe)
