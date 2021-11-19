//init variables
let player;
let key;
let gameSpeed = 20;
let gameDimensions = 550;
let keycodes = [37,38,39,40]
//record keys
document.addEventListener("keydown", e => {if (keycodes.includes(e.keyCode)) key = e.keyCode});
document.addEventListener("keyup", e=>{if (e.keyCode == key) key = null});
//Player class
class Line {
    constructor(x, y){
        this.x =x;
        this.y = y;
        this.path = [];
        this.colors = ["red", "blue", "green"];
        this.dimensions =4;
        this.speed = 2;
        this.angle = 5;
        this.currentkey;
    }
    move(){
        this.currentkey = key;
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
        let newX = x +(this.speed*1) * Math.cos(Math.PI/180 * this.angle);
        let newY = y + (this.speed*1) * Math.sin(Math.PI/180 * this.angle);
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
        if (this.isDead()) clearInterval(playField.interval);
        //create the next part of the line
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(this.x,this.y,this.dimensions,this.dimensions);
    }
}
//start game function
function startGame() {
    playField.start();
    player = new Line(110, 30) 
    player.update()
    player2 = new Line(30, 250)
    player2.update()
}
function stopGame(){
    clearInterval(playField.interval);
}
//init playing field
let playField = {
        canvas : document.createElement("canvas"),
        start : function() {
        this.canvas.width = gameDimensions;
        this.canvas.height = gameDimensions;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(gameLoop, gameSpeed)
    }
}
//main game loop
function gameLoop() {
    player.move(key)
    player.update();
}
startGame()