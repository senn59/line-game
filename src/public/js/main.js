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
//Player class
class Line {
    constructor(x, y){
        this.x =x;
        this.y = y;
        this.arr = [];
        this.colors = ["red", "blue", "green"];
        this.dimensions = 10
        this.speed = 2
        this.currentkey = 39;
    }
    move(){
        if (key + 2 != this.currentkey && key - 2 != this.currentkey) this.currentkey = key
        switch (this.currentkey) {
            case 37: //left
                this.x -= this.speed
                break;
            case 39: // right
                this.x += this.speed 
                break;
            case 38: //up
                this.y -= this.speed 
                break;
            case 40: //down
                this.y += this.speed
                break;
        }
        setTimeout(() => {}, 1000);
        
    }

    update(){
        let ctx = playField.context;

        ctx.fillStyle = "red";
        ctx.fillRect(this.x,this.y,this.dimensions,this.dimensions)
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
    //console.log(player.x)
}
startGame()