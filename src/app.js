const express = require('express')
const port = 3000
const app = express()

//configuration
app.set("view engine", "ejs")
app.use(logger)

//routing
app.get('/', (req, res, next) => {
    res.render("game")
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
app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
})

