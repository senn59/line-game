//const { Socket } = require("socket.io");
let playerlistDisplay = document.getElementById("connected")
//init variables
let player;
let key;
let gameDimensions = 400;
let keycodes = [37,38,39,40]
var playing; 
var socket = io();
let socketID;
let opponents = {};
let playerList = []
let testx = 5
let player2_x, player2_y
let readyStatus= false
let webWorker

const ready = () => {
    //true false switch in order to decide the player ready status
    player.ready ? player.ready = false : player.ready = true;
    socket.emit("ready", {status: player.ready})
    console.log(player.ready)
    document.getElementById(socket.id).innerHTML = socket.id + " | " + player.ready
}

socket.on("playerDC", (msg) => {
    /*
        refresh the board when a player disconnects
        *other opponents get refreshed because of the opponentsRefresh function*
    */
    player.ctx.clearRect(0,0, gameDimensions, gameDimensions)
    player.update()
    delete opponents[msg.socketID]
    document.getElementById(msg.socketID).remove();
})
//assign playerID
socket.on("playerInfo", (msg) => {
    player = new Line(msg.color, msg.playerID);
    player.update()
    socket.emit("startingCoords", {startx: player.x, starty: player.y})
    //add this player to visual playerlist
    let node = document.createElement("li");
    node.appendChild(document.createTextNode(socket.id));
    node.id = socket.id
    node.style.color = player.color
    playerlistDisplay.appendChild(node)
})
//list of opponents that all clients recieve.
//based on this list they create new lines for the new opponents which is different for each client
socket.on("playersRefresh", (msg) => {
    delete msg[socket.id]
    for ([key, val] of Object.entries(msg)){
        // continue to the next loop if the player is already registered
        if (key in opponents) continue 
        opponents[key] = val
        opponents[key].line = new baseLine(opponents[key].color, opponents[key].playerID)
        opponents[key].line.updatePos(opponents[key].startx, opponents[key].starty)
        //add player to visual playerlist
        let node = document.createElement("li")
        node.appendChild(document.createTextNode(key)) 
        node.id = key
        node.style.color = opponents[key].color
        playerlistDisplay.appendChild(node)
    }
})
//change opponent ready status
socket.on("playerReady", (msg) => {
    opponents[msg.socketID].ready = msg.ready
    document.getElementById(key).innerHTML = key + " | " + msg.ready
})
//update the player coordinates
socket.on("coords", (msg) => {
    opponents[msg.socketID].line.updatePos(msg.x, msg.y)
})
socket.on("countdown", (msg) => {
    if (msg.count == 0) {
        startLoop()
        document.getElementById("ready_btn").style.display = "none"
        player.ready = false;
        socket.emit("ready", {status: false})
    }
})
socket.on("gameOver", (msg) => {
    stopLoop();
    document.getElementById("win_msg_cnt").style.display = "block"
    document.getElementById("win_msg_cnt").innerHTML = msg.winner
})
//record keys
document.addEventListener("keydown", e => {if (keycodes.includes(e.keyCode)) key = e.keyCode});
document.addEventListener("keyup", e=>{if (e.keyCode == key) key = null});
//Player class
class baseLine {
    constructor(color, id){
        this.color = color
        this.dimensions =4;
        this.speed = 2;
        this.playing = true
        this.ready = false
        this.id = id
    }
    updatePos(x, y){
        if (x > 0 && y > 0){
            this.ctx = playField.context;
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(x,y,this.dimensions,this.dimensions);
        }
    }
}
class Line extends baseLine {
    constructor(color, dimensions, speed, playing, ready, id){
        super(color, dimensions, speed, playing, ready, id)
        this.dead = false
        this.generatePos()
    }
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    //generate a random starting position and angle
    generatePos(){
        this.x = this.getRandomInt(50, gameDimensions - 50);
        this.y = this.getRandomInt(50, gameDimensions - 50);
        this.angle = this.getRandomInt(5, 70) * 5
    }
    move(){
        //increment or reduce angle based on which key is pressed down
        switch (key) {
            case 37: //left arrow
                this.angle -= 5;
                break;
            case 39: //right arrow
                this.angle += 5;
                break;
        }
    }
    getNextPos(x, y){
        let newX = x +this.speed * Math.cos(Math.PI/180 * this.angle);
        let newY = y + this.speed * Math.sin(Math.PI/180 * this.angle);
        return [newX, newY];
    }
    isDead(){
        //get the position it will be 2 loops ahead
        let futurePos = this.getNextPos(this.x, this.y);
        futurePos = this.getNextPos(futurePos[0], futurePos[1]);
        //get the image data of said position and check its color
        let imageData = this.ctx.getImageData(futurePos[0],futurePos[1],1,1).data;
        //check if color alpa is 255
        if (imageData[3] == 255) this.dead = true
        if (futurePos[0] > gameDimensions || futurePos[0] < 0) this.dead = true
        if (futurePos[1] > gameDimensions || futurePos[1] < 0) this.dead = true
    }
    restart(){
        this.ctx.clearRect(0, 0, gameDimensions, gameDimensions);
        this.dead = false;
        this.generatePos()
        this.update()
        socket.emit("startingCoords", {startx: player.x, starty: player.y})
    }
    update(){
        console.log(this.dead)
        if (!this.dead){
            //get context and next position
            this.ctx = playField.context;
            this.isDead()
            //create the next part of the line
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(this.x,this.y,this.dimensions,this.dimensions);
            socket.emit("coords", {x: this.x, y: this.y}); 
        } else {
            socket.emit("dead")
            stopLoop()
        }
    }
}

//init playing field
let playField = {
        canvas : document.createElement("canvas"),
        start : function() {
        this.canvas.width = gameDimensions;
        this.canvas.height = gameDimensions;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    }
}
playField.start()
playing = true;
//start game function
function stopGame(){
    playing = false
}
function startLoop(){
    webWorker = new Worker("/js/webworker.js")
    webWorker.onmessage = () => {
        if (playing) gameLoop()
    }
}
function stopLoop() {
    webWorker.terminate()
}
//main game loop
function gameLoop() {
    player.move()
    let nextPos = player.getNextPos(player.x, player.y)
    player.x = nextPos[0]
    player.y = nextPos[1]
    player.update();
}