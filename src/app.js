const express = require('express')
const port = 3000
const app = express()
const http = require("http");
const server= http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

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
    socket.emit("playerInfo", {playerID: playerID, color: players[socket.id].color})
    console.log(players[socket.id].color)
    socket.broadcast.emit("playerConnection", playerID)
    socket.on("coords", (x, y) => {
        //console.log(x, y)
        //console.log(playerID)
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
server.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
})

