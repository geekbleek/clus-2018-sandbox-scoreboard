# clus-2018-sandbox-scoreboard
Repo for Sandbox Scoreboard at CLUS 2018

To use:

1. Clone this repo
2. run ```npm install``` from the root directory
3. run ```node dashboard.js```
4. Visit dashboard at http://localhost:3003
5. Profit

Current broker is pointing to mqtt.cisco.com.  

To test:

The dashboard starts in an un-initialized state.  It needs to receive a reset (message body doesn't matter here):

mosquitto_pub -h mqtt.cisco.com -p 1883 -t sandbox/weight/control -m '{"reset": true}'  

Now the dashboard is ready to listen for events/weight updates:

mosquitto_pub -h mqtt.cisco.com -p 1883 -t sandbox/weight/updates -m '{"player":2,"weight":10}' 

Note: Message body for weight updates can be "weight" or "Weight" to accomodate both types of messages seen on the broker.

Once a player reached 100, the game will announce the winner, and stop updating the UI with player updates.

The demo proctor could then leave the final score/winner on the screen until the next game (animation/sound will stop after 10s).
Or they can hit the reset button to clear the screen.

To start a new game, reset button must be pushed twice - once to clear the scores/end the winning animation & sound, and a second time to start the game.  This allows flexibility on how the proctor would like to run games.  I.e. reset after a finished game, and start the game once everyone is ready, or leave the game displaying last winner, and reset once everyone is ready, and then start the game.

Dashboard is configured for 1920x1080 resolution.
