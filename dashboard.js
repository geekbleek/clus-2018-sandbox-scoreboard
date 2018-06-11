const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// const play = require('play');
app.use('/', express.static(path.join(__dirname, 'public')));


const mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.cisco.com'); //128.107.70.30 for mqtt.cisco.com
// var winningTimeout = 10 //number of seconds to flash winner

var gameOn = false;
var isWinner = false;
var teamScores = [0,0,0] //array of current scores/weights - first is team 1, 2nd is team 2, 3rd is team 3 etc.

client.on('connect', function () {
    console.log('Connected to mqtt broker')
	client.subscribe(['sandbox/weight/#']);
	//client.publish('presence', 'Hello mqtt')
});

client.on('message', function (topic, rawMessage) {
	// message is Buffer, parse to JSON
	try {
		var message = JSON.parse(rawMessage);
	} catch(e) {
		console.error('Invalid JSON in MQTT Message'); // error in the above string (in this case, yes)!
		console.error(e);
	}

	if (message) {	
		processMQTT();
	}

	function processMQTT() {
		if (topic == 'sandbox/weight/updates') {
			processScore(message);
		}
		else if (topic == 'sandbox/weight/control') {
			resetGame();
		}
	}
});

function resetGame() {
	console.log('Reset received');
	// if game is currently running - set all scores to zero & stop game.
	if (gameOn === true) {
		//flip game state
		gameOn = !gameOn;
		isWinner = false;

		//reset scores to zero - init = true because not true score update
		teamScores.forEach((score, player) => {
			var init = true;
			var sound = false;
			updateScore(player + 1,0, init, sound)
		});

		//Set default title & turn off winning animation if playing
		io.emit('uiUpdate', "DevNet Sandbox Challenge", false);

	}

	// if game is not currently running, start game & set to
	else if (gameOn === false) {
		//flip game state
		gameOn = !gameOn;

		//start timer
		io.emit('startClock', gameOn);

		//set title
		io.emit('uiUpdate', "Game On!");

	}

	
}

function processScore(message) {
	// console.log(JSON.stringify(message));
	//increment score
	if (message.player <= 3) {
		var sound = true;
		if (message.Weight) {
			var weight = message.Weight;
		}
		else if (message.weight) {
			weight = message.weight
		}
		weight = weight * 3;
		updateScore(message.player, weight, null, sound)
    }
    
}

function updateScore (player, weight, init, sound) {
	//if gameOn is true, or init is true (for intialization & resets) - update scores and pass to UI
	if ((gameOn || init) && isWinner === false) {
		//set topic to scoreUpdate1, scoreUpdate2 etc.
		var socketTopic = 'scoreUpdate' + player
		//0 based array of scores
		var slot = player - 1

		//normalize weight
		weight = normalizeWeight(weight);

		//Update score
		if (teamScores[slot] == weight){
			// console.log('Same weight - not passing update to socket')
		}
		else {
			teamScores[slot] = weight
			io.emit(socketTopic, teamScores[slot], sound);
			console.log(`Player ${player} score updated to: ${weight}.`)
			// console.log(teamScores)
			if (weight >= 10) {
				//Stop game
				isWinner = true;
				//Update UI
				console.log(`Player ${player} won the game!`)
				io.emit('uiUpdate', `Player ${player} wins!`, true);
				
			}
		}
	}

}

function normalizeWeight(weight){
	normalizedWeight = Math.round(weight/10)
	if (normalizedWeight > 10) {
		normalizedWeight = 10
	}
	return normalizedWeight;
}

server.listen(3003, function(err){
	if(!err)
		console.log('Web server started.  Dashboard available at http://localhost:3003');
});

// app.use('/', express.static(path.join(__dirname, 'public')));
// sampleJSON = {
// 	"whatever":"value",
// 	"foo":"bar",
// 	"numerical":2
// }

io.on('connection', function (socket) {
    console.log('Socket.io connectioned opened');
	socket.on('event_name', (data) => {
		onEvent(data);
	})

	//Set gameOn to false when new UI connection happens
	gameOn = false;
	isWinner = false;

	//Set default title & turn off winning animation if playing
	io.emit('uiUpdate', "DevNet Sandbox Challenge", false);

	teamScores.forEach((score, player) => {
		var init = true;
		var sound = false;
		updateScore(player + 1, 50, init, sound)
	});

	// socket.emit('onUpdate', 5, 5, 5);
	setTimeout(() => {
		// socket.emit('onUpdate', 0, 0, 0);
		teamScores.forEach((score, player) => {
			var init = true;
			var sound = false;
			updateScore(player +1, 0, init, sound)
		});
	}, 2000);
});

function onEvent(data) {
	console.log(data)
}    