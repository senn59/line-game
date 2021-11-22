//const { Socket } = require("socket.io");

//init variables
let player;
let key;
let gameDimensions = 550;
let keycodes = [37,38,39,40]
var playing; 
var socket = io();
let playerID;
//assign playerID
socket.on("playerInfo", (msg) => {
    playerID = msg.playerID 
    console.log(socket.id)
    console.log(msg)
    player = new Line(msg.color) 
    player.update()
})
socket.on("playerConnection", (msg) => {
    console.log(`player ${msg} connected`)
})
//record keys
document.addEventListener("keydown", e => {if (keycodes.includes(e.keyCode)) key = e.keyCode});
document.addEventListener("keyup", e=>{if (e.keyCode == key) key = null});
//Player class
class Line {
    constructor(color){
        this.x = this.y = this.getRandomInt(30, gameDimensions - 30);
        this.y = this.getRandomInt(30, gameDimensions - 30);
        this.path = [];
        this.color = color
        this.dimensions =4;
        this.speed = 2;
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
        if (imageData[3] == 255) return true 
        if (futurePos[0] > gameDimensions || futurePos[1] > gameDimensions) return true 
        return false
    }
    update(){
        //get context and next position
        this.ctx = playField.context;
        let nextPos= this.getNextPos(this.x, this.y);
        this.x = nextPos[0];
        this.y = nextPos[1];
        //check if the line is dead and stop the loop if so
        if (this.isDead()) playing = false; 
        //create the next part of the line
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.x,this.y,this.dimensions,this.dimensions);
        socket.emit("coords", {playerID: playerID, x: this.x, y: this.y}); 
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
    let w = new Worker("/js/webworker.js")
    w.onmessage = () => {
        if (playing) gameLoop()
    }
}
//main game loop
function gameLoop() {
    player.move()
    player.update();
}
//startLoop()