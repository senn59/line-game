const { count } = require('console');
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
let countdown = 3
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
let colors = ["red", "green", "blue"]
io.on("connection", (socket) => {
    playerID++
    players[socket.id] = {
        playerID: playerID,
        color: "blue"
    } 
    //send playerinfo to the player that connected
    socket.emit("playerInfo", {playerID: playerID, color: players[socket.id].color})
    socket.on("startingCoords", (msg) => {
        players[socket.id].startx = msg.startx
        players[socket.id].starty = msg.starty
        console.log(players[socket.id])
        io.emit("playerList", players)
    })
    console.log(players)
    //game countdown
    if (playerID >= 2){
        //if (playing == true) return
        if (timer){
            clearInterval(timer)
            countdown = 3
        } 
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
        socket.broadcast.emit("playerDisconnection")
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

