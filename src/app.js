const express = require('express')
const port = 3000
const app = express()
const http = require("http");
const server= http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let playerCount = 0;
//configuration
app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"));
app.use(logger)

//routing
app.get('/', (req, res, next) => {
    res.render("game")
})
//sockets
io.on("connection", (socket) => {
    playerCount++
    io.emit("playerConnection", playerCount)
    console.log("user connected")
    console.log(playerCount)
    //disconnect handler
    socket.on("disconnect", () => {
        playerCount--
        io.emit("playerConnection", playerCount)
        console.log("user disconnected");
        console.log(playerCount)
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

