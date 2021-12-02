const express = require('express')

const port =3000 
const app = express()
const http = require("http");
const server= http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//initial variables
const ips = ["172.16.128.146", "localhost"];
let playerID= 0;
let playing = false
let timer = null
let countdown = 2
//configuration
app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"));
app.use(logger)

//routing
app.get('/', (req, res, next) => {
    res.render("game")
})
//sockets
let players = {};
let colors = {
    red: {taken: false, id: 1},
    green: {taken: false, id: 2},
    blue: {taken: false, id: 3},
    yellow: {taken: false, id: 4},
    cyan: {taken: false, id: 5},
}
function getColor(){
    for ([key, val] of Object.entries(colors)){
        if (!val.taken) {
            val.taken = true; 
            return [val.id, key] 
        }
    }
}
io.on("connection", (socket) => {
    playerInfo = getColor()
    playerID++
    players[socket.id] = {
        playerID: playerInfo[0],
        color: playerInfo[1],
        ready: false,
        dead: false
    }
    //send playerinfo to the player that connected
    socket.emit("playerInfo", {playerID: playerID, color: players[socket.id].color})
    //get starting coords of the player
    socket.on("startingCoords", (msg) => {
        players[socket.id].startx = msg.startx
        players[socket.id].starty = msg.starty
        //send list of players to everyone
        io.emit("playerList", players)
    })
    //handle ready player
    socket.on("ready", (msg) => {
        players[socket.id].ready = msg.status
        io.emit("playerList", players)
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
    socket.on("dead", () => {
        players[socket.id].dead = true;
        if (Object.values(players).every(val=> val.dead)){
            console.log("Game over")
            io.emit("gameOver")
        }
    })
    //signal the other players that a new connection was made
    socket.broadcast.emit("playerConnection", playerID)
    //coords handler 
    socket.on("coords", (msg) => {
        //console.log(x, y)
        //console.log(playerID)
        socket.broadcast.emit("coords", {socketID: socket.id, x: msg.x, y: msg.y})
    })
    //disconnect handler
    socket.on("disconnect", () => {
        socket.broadcast.emit("playerDC", {socketID: socket.id})
        colors[players[socket.id].color].taken = false;
        delete players[socket.id]
        playerID--
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

