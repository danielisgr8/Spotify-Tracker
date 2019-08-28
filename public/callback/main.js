/* TODO: only load data when tab is actually clicked, then keep it afterwards
		 (use init property originally set to false for each page) */
const pageHome = document.getElementById("pageHome");
const pageTop = document.getElementById("pageTop");
const pageGraph = document.getElementById("pageGraph");
const pages = [pageHome, pageTop, pageGraph];

showPage(0);

document.getElementById("header").onclick = (e) => {
	console.log(e.currentTarget);
	console.log(e.target);
	if(e.target != e.currentTarget && e.target.tagName == "TD") {
		console.log("happened");
		const index = parseInt(e.target.id.substring(2));
		showPage(index);

		e.stopPropagation();
	}
}

function showPage(pageIndex) {
	for(let i = 0; i < pages.length; i++) {
		if(i == pageIndex) {
			pages[i].style.display = "block";
		} else {
			pages[i].style.display = "none";
		}
	}
}

const topForm = document.getElementById("topForm");
topForm.onsubmit = (e) => {
	e.preventDefault();
}

const ws = new WebSocket("ws://" + window.location.hostname + /(.*)\/callback/.exec(window.location.pathname)[1]);

const wsEvents = {};
ws.on = (event, callback) => {
	wsEvents[event] = callback;
}
ws.onmessage = (e) => {
	const msg = JSON.parse(e.data);

	const event = wsEvents[msg.event];
	if(event) {
		event(msg.data);
	}
}

let callbackCode = window.location.href.match(/\?code=(.*)/)[1];
let callbackEv = {
	"event": "callbackCode",
	"data": {
		"code": callbackCode
	}
}
ws.onopen = (e) => {
	ws.send(JSON.stringify(callbackEv));

	topForm.onsubmit = (e) => {
		e.preventDefault();

		const wsEv = {
			"event": "getTop",
			"data": {
				"type": topForm.elements["type"].value,
				"time_range": topForm.elements["time_range"].value
			}
		}
		ws.send(JSON.stringify(wsEv));
	}
}

ws.on("topTracks", (data) => {
	const ol = document.getElementById("topList");
	ol.innerHTML = "";

	data.topTracks.items.forEach((track) => {
		const li = document.createElement("li");

		li.textContent = track.name + " - ";

		let i;
		for(i = 0; i < track.artists.length - 1; i++) {
			li.textContent += track.artists[i].name + ", ";
		}
		li.textContent += track.artists[i].name;

		ol.appendChild(li);
	});
});

ws.on("topArtists", (data) => {
	const ol = document.getElementById("topList");
	ol.innerHTML = "";

	data.topArtists.items.forEach((artist) => {
		const li = document.createElement("li");

		li.textContent = artist.name;

		ol.appendChild(li);
	});
});

const ctx = document.getElementById("canvas").getContext("2d");
ws.on("savedTracks", (data) => {
	let currentTrackCt = 0;
	const dataArr = [];
	const savedTracks = data.savedTracks.items;
	for(let i = savedTracks.length - 1; i >= 0; i--) {
		const savedTrack = savedTracks[i];
		dataArr.push({
			x: savedTrack.added_at,
			y: ++currentTrackCt,
			song: savedTrack.track.name
		});
	};

	const config = {
		type: "line",
		data: {
			datasets: [{
				label: "Cummulative Songs",
				data: dataArr
			}]
		},
		options: {
			title: {
				display: true,
				text: "\"My Songs\" Count Over Time"
			},
			legend: {
				display: false
			},
			scales: {
				xAxes: [{
					type: "time",
					scaleLabel: {
						display: true,
						labelString: "Date"
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: "Total Songs"
					}
				}]
			},
			tooltips: {
				callbacks: {
					title: (tooltipItem, data) => {
						const element = data.datasets[0].data[tooltipItem[0].index];
						return element.song;
					},
					label: (tooltipItem, data) => {
						const element = data.datasets[0].data[tooltipItem.index];
						return "(" + element.y + ") " + (new Date(element.x)).toDateString();
					}
				}
			}
		}
	}

	const myChart = new Chart(ctx, config);
});
