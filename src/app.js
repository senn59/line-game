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
let colors = {
    red: {taken: false, hexcode: "#FF6464"},
    yellow: {taken: false, hexcode: "#FFFF64"},
    blue: {taken: false, hexcode: "#0066FF"},
    green: {taken: false, hexcode: "#64FF64"},
    cyan: {taken: false, hexcode: "#64FFFF"}
}
let rooms = {}
function getColor(room){
    //pick a color that isnt taken and return that color
    for ([key, val] of Object.entries(rooms[room].colors)){
        if (!val.taken){
            val.taken = true
            return val.hexcode
        }
    }
}
io.on("connection", (socket) => {
    let room;
    let player
    socket.on("createRoom", (msg) => {
        if (!rooms.hasOwnProperty(msg.code)){
            rooms[msg.code] = {
                colors: colors,
                players: {}
            }
        }
    })
    socket.on("joinRoom", (msg) => {
        if (!rooms.hasOwnProperty(msg.code)) return
        room = msg.code
        socket.join(room)
        //init player object
        rooms[room].players[socket.id] = {
            color: getColor(room),
            ready: false,
            dead: false,
            refreshed: false,
            proceeded: false
        }
        player = rooms[room]["players"][socket.id]
        //send the playerinfo generated from the backend to the player that connected
        socket.emit("playerInfo", player)
    })
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
    socket.on("playerClientInfo", (msg) => {
        //get starting coords & player nickname
        player.nickname = msg.nickname
        player.startx = msg.startx
        player.starty = msg.starty
        //send list of players to everyone
        io.to(room).emit("playersRefresh", rooms[room].players)
    })
    //game restart sockets
    socket.on("refresh", () =>{
        player.refreshed = true
        if (Object.values(rooms[room]["players"]).every(val => val.refreshed)){
            io.to(room).emit("newRound", rooms[room].players)
            Object.values(rooms[room]["players"]).forEach(player => player.refreshed = false);
        }
    }) 
    socket.on("updateStartCoords", (msg) => {
        player.startx = msg.startx
        player.starty = msg.starty
    })
    //handle ready player
    socket.on("ready", (msg) => {
        //change ready status
        player.ready = msg.status
        socket.broadcast.to(room).emit("playerReady", {ready: player.ready, socketID: socket.id})
        //reset the timer if someone changes their ready status while a countdown is in progress
        if (timer) {
            clearInterval(timer)
            countdown = 2
        }
        
        if (Object.values(rooms[room]["players"]).every(val => val.ready)){
            console.log("Countdown started!")
            timer = setInterval(() => {
                io.to(room).emit("countdown", {count: countdown})
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
        player.dead = true;
        deathcount++;
        console.log(deathcount, Object.keys(rooms[room]["players"]).length)
        if (Object.keys(rooms[room]["players"]).length - deathcount <= 1){
            for ([key, val] of Object.entries(rooms[room]["players"])){
                if (!val.dead) winner = val.nickname
            }
            deathcount = 0
            console.log("roundOver")
            playing = false
            io.to(room).emit("roundOver", {winner: winner})
        }
    })
    socket.on("proceed", () => {
        player.proceeded = true;
        if (Object.values(rooms[room]["players"]).every(player => player.proceeded)) {
            io.to(room).emit("restartGame")
            Object.values(rooms[room]["players"]).forEach(player => player.proceeded = false);
        }
    })
    //coords handler 
    socket.on("coords", (msg) => {
        socket.broadcast.to(room).emit("coords", {socketID: socket.id, x: msg.x, y: msg.y})
    })
    //disconnect handler
    socket.on("disconnect", () => {
        socket.broadcast.to(room).emit("playerDC", {socketID: socket.id})
        rooms[room]["colors"][player.color] = false
        delete rooms[room]["players"][socket.id]
        io.to(room).emit("playersRefresh", rooms[room].players) //might not be needed!!
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
server.listen(port, ips[0],  () => {
    console.log(`listening at http://${ips[0]}:${port}`)
})

