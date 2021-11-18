//declaring variables
let player;
let key;
let gameSpeed = 1;
let fps = 20;
let gameDimensions = 550;
let keycodes = [37,38,39,40]
document.addEventListener("keydown", e => {
    if (keycodes.includes(e.keyCode)) key = e.keyCode
})
document.addEventListener("keyup", e=>{
    if (e.keyCode == key) key = null
})
//Player class
class Line {
    constructor(x, y){
        this.x =x;
        this.y = y;
        this.path = [];
        this.colors = ["red", "blue", "green"];
        this.dimensions =4 
        this.speed = 2
        this.angle = 5
        this.currentkey;
    }
    move(){
        this.currentkey = key
        switch (key) {
            case 37: //left
                this.angle -= 5
                break;
            case 39: // right
                this.angle += 5
                break;
        }
    }

    update(){
        let ctx = playField.context;
        this.x += (2*1) * Math.cos(Math.PI/180 * this.angle)
        this.y += (2*1) * Math.sin(Math.PI/180 * this.angle)
        this.path.push([this.x,this.y]);
        ctx.fillStyle = "red";
        ctx.fillRect(this.x,this.y,this.dimensions,this.dimensions)
        console.log(this.angle)
    }
}
//start game function
function startGame() {
    playField.start();
    player = new Line(110, 30) 
    player.update()
}
//init playing field
let playField = {
        canvas : document.createElement("canvas"),
        start : function() {
        this.canvas.width = 600;
        this.canvas.height = 500;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(gameLoop, 20)
    }
}
//main game loop
function gameLoop() {
    player.move(key)
    player.update();
}
startGame()