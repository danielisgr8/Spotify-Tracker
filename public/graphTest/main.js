const ctx = document.getElementById("canvas").getContext("2d");

function randomDateString(prev) {
	return moment().add(((Math.random() + prev) * 100000), "seconds").format();
}

function randomNum() {
	return Math.random() * 100;
}

function randomPair(prev) {
	return {
		x: randomDateString(prev),
		y: randomNum()
	}
}

function pairArray() {
	const arr = new Array(20);
	for(let i = 0; i < arr.length; i++) {
		arr[i] = randomPair(i);
	}
	return arr;
}

const config = {
	type: "line",
	data: {
		datasets: [{
			label: "Cummulative Songs",
			data: pairArray()
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
					return "test title"
				},
				label: (tooltipItem, data) => {
					return "test label"
				}
			}
		}
	}
}

/*
const config = {
	type: "bar",
	data: {
		datasets: [{
			label: "likelihood of me doing that shit",
			backgroundColor: "rgb(255, 99, 132)",
			data: [
				100
			]
		}]
	},
	options: {
		scales: {
			xAxes: [{
				barThickness: 250
			}],
			yAxes: [{
				display: true,
				ticks: {
					min: 0,
					max: 110
				},
				scaleLabel: {
					display: true,
					labelString: "Likelihood of me doing that shit"
				}
			}]
		}
	}
}
*/

const myChart = new Chart(ctx, config);