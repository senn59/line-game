//const { Socket } = require("socket.io");
let playerlistDisplay = document.getElementById("connected")
//init variables
let player;
let key;
let gameDimensions = 500;
let keycodes = [37,38,39,40]
var playing; 
var socket = io();
let playerID;
let socketID;
let playerDict = {};
let playerList = []
let testx = 5
let player2_x, player2_y
let readyStatus= false
let webWorker

//ready function
const ready = () => {
    if (!player.ready){
        socket.emit("ready", {status: true})
        player.ready = true 
        console.log(player.ready)
        document.getElementById(socket.id).innerHTML = socket.id + " | READY";
        return
    }
    socket.emit("ready", {status: false})
    player.ready = false
    document.getElementById(socket.id).innerHTML = socket.id
    console.log(player.ready)
}
socket.on("playerDC", (msg) => {
    delete playerDict[msg.socketID]
    document.getElementById(msg.socketID).remove();
})
//assign playerID
socket.on("playerInfo", (msg) => {
    playerID = msg.playerID 
    player = new Line(msg.color) 
    player.update()
    socket.emit("startingCoords", {startx: player.x, starty: player.y})
    console.log("test")
    //add this player to visual playerlist
    let node = document.createElement("li");
    node.appendChild(document.createTextNode(socket.id));
    node.id = socket.id
    node.style.color = player.color
    playerlistDisplay.appendChild(node)
})
socket.on("playerList", (msg) => {
    delete msg[socket.id]
    for ([key, val] of Object.entries(msg)){
        if (key in playerDict){
            console.log(playerDict)
            if (val.ready) document.getElementById(key).innerHTML = key + " | READY"
            else document.getElementById(key).innerHTML = key
            continue
        } 
        playerDict[key] = val
        playerDict[key].line = new baseLine(playerDict[key].color)
        playerDict[key].line.updatePos(playerDict[key].startx, playerDict[key].starty)
        console.log(playerDict[key].startx, playerDict[key].starty)
        //add player to visual playerlist
        let node = document.createElement("li")
        node.appendChild(document.createTextNode(key)) 
        node.id = key
        node.style.color = playerDict[key].color
        playerlistDisplay.appendChild(node)
        //
    }
    console.log(playerDict)
})
//update player
socket.on("coords", (msg) => {
    playerDict[msg.socketID].line.updatePos(msg.x, msg.y)
})
socket.on("countdown", (msg) => {
    if (msg.count == 0) {
        startLoop()
        document.getElementById("ready_btn").style.display = "none"
    }
})
socket.on("gameOver", () => {

})
socket.on("playerConnection", (msg) => {
    console.log(`player ${msg} connected`)
})
//record keys
document.addEventListener("keydown", e => {if (keycodes.includes(e.keyCode)) key = e.keyCode});
document.addEventListener("keyup", e=>{if (e.keyCode == key) key = null});
//Player class
class baseLine {
    constructor(color){
        this.color = color
        this.dimensions =4;
        this.speed = 2;
        this.playing = true
        this.ready = false
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
    constructor(color, dimensions, speed, playing, ready){
        super(color, dimensions, speed, playing)
        this.dead = false
        this.x = this.y = this.getRandomInt(50, gameDimensions - 50);
        this.y = this.getRandomInt(50, gameDimensions - 50);
        this.angle = this.getRandomInt(5, 70) * 5
    }
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    move(){
        switch (key) {
            case 37: //left
                this.angle -= 5;
                break;
            case 39: // right
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
        if (imageData[3] == 255) return this.dead = true
        if (futurePos[0] > gameDimensions || futurePos[0] < 0) return this.dead = true
        if (futurePos[1] > gameDimensions || futurePos[1] < 0) return this.dead = true
    }
    update(){
        if (!this.dead){
            //get context and next position
            this.ctx = playField.context;
            let nextPos= this.getNextPos(this.x, this.y);
            this.x = nextPos[0];
            this.y = nextPos[1];
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
function stopLoop(params) {
    webWorker.terminate()
}
//main game loop
function gameLoop() {
    player.move()
    player.update();
}