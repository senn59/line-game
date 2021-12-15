const { clear } = require('console');
const express = require('express')

const port =3000 
const app = express()
const http = require("http");
const server= http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const ips = ["172.16.128.146", "localhost"];

let playing = false
let timer = null
let countdown = 2
let deathcount = 0;
let winner;

//configuration
app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"));
app.use(logger)

//routing
app.get("/", (req, res, next) => {
    res.render("index")
})
app.get('/:roomcode', (req, res, next) => {
    const roomcode = req.params.roomcode;
    res.render("index")
})
//sockets
let players = {};
let colors = {
    red: false,
    yellow: false,
    blue: false,
    green: false,
    cyan: false
}
function getColor(){
    //pick a color that isnt taken and return that color
    for ([key, val] of Object.entries(colors)){
        if (!val){
            colors[key] = true
            return key
        }
    }
}
io.on("connection", (socket) => {
    //do nothing if a game is currently in progress
    if (playing) {
        /* TO DO: send person back to lobby OR let them spectate and
        automatically join the lobby after the game or round ends*/
        console.log("game in progress");
        return;
    }
    // Reset the countdown if someone joins while the countdown is in progress
    if (timer) {
        clearInterval(timer)
        countdown = 2
    } 
    //init player object
    players[socket.id] = {
        color: getColor(),
        ready: false,
        dead: false
    }
    //send the playerinfo generated from the backend to the player that connected
    socket.emit("playerInfo", players[socket.id])
    socket.on("playerClientInfo", (msg) => {
        //get starting coords & player nickname
        players[socket.id].nickname = msg.nickname
        players[socket.id].startx = msg.startx
        players[socket.id].starty = msg.starty
        //send list of players to everyone
        io.emit("playersRefresh", players)
    })
    //handle ready player
    socket.on("ready", (msg) => {
        //change ready status
        players[socket.id].ready = msg.status
        socket.broadcast.emit("playerReady", {ready: players[socket.id].ready, socketID: socket.id})
        //reset the timer if someone changes their ready status while a countdown is in progress
        if (timer) {
            clearInterval(timer)
            countdown = 2
        }
        
        if (Object.values(players).every(val => val.ready)){
            console.log("Countdown started!")
            timer = setInterval(() => {
                io.emit("countdown", {count: countdown})
                console.log(countdown)
                countdown--
                if (countdown < 0) {
                    clearInterval(timer)
                    playing = true
                }
            }, 1000);
        }
    })
    //If a player dies update the serverside playerlist
    socket.on("dead", () => {
        players[socket.id].dead = true;
        deathcount++;
        console.log(deathcount, Object.keys(players).length)
        if (Object.keys(players).length - deathcount <= 1){
            for ([key, val] of Object.entries(players)){
                if (!val.dead) winner = key
            }
            //deathcount = 0
            console.log("Game over")
            playing = false
            io.emit("gameOver", {winner: winner})
        }
    })
    //coords handler 
    socket.on("coords", (msg) => {
        socket.broadcast.emit("coords", {socketID: socket.id, x: msg.x, y: msg.y})
    })
    //disconnect handler
    socket.on("disconnect", () => {
        socket.broadcast.emit("playerDC", {socketID: socket.id})
        colors[players[socket.id].color] = false 
        delete players[socket.id]
        io.emit("playersRefresh", players)
    })
})
//log requests
function logger(req, res, next){
    let timestamp = new Date()
    let formatted_time = `${timestamp.getHours()}:${timestamp.getMinutes()}`
    let method = req.method
    let url = req.url
    let status = res.statusCode
    let log = `[${formatted_time}] ${method}:${url} ${status}`
    console.log(log)
    next()
}
//Start app
server.listen(port, ips[1],  () => {
    console.log(`listening at http://${ips[1]}:${port}`)
})

