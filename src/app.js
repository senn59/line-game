const express = require('express')
const port =3000 
const app = express()
const http = require("http");
const server= http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const ip = "localhost";
let playerID= 0;
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
    console.log(players)
    io.emit("playerList",players);
    //send playerinfo to the player that connected
    socket.emit("playerInfo", {playerID: playerID, color: players[socket.id].color})
    console.log(players[socket.id].color)
    //signal the other players that a new connection was made
    socket.broadcast.emit("playerConnection", playerID)
    //coords hangler
    socket.on("coords", (msg) => {
        //console.log(x, y)
        //console.log(playerID)
        socket.broadcast.emit("coords", {x: msg.x, y: msg.y})
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
server.listen(port, ip , () => {
    console.log(`listening at http://${ip}:${port}`)
})

