function getNickname() {
    //extract value from input
    const nickname = document.getElementById("nickname").value;
    //remove the prompt since it is no longer needed
    document.getElementById("nickname_cnt").style.display = "none"
    createRoom()
}
function createRoom(){
    //generate random ~6 character code 
    const codeLength = 6
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i=0;i < codeLength; i++){
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    //send create room command with room code to backend

    //join the room you just created
    joinRoom(code)
}
function joinRoom(code){
    //change url to /roomcode
    window.history.pushState("", "", `/${code}`) 
    //load game.js
    let gameScript = document.createElement("script")
    gameScript.src = "/js/game.js"
    //delete lobby options
    gameScript.onload = () => document.getElementById("lobby_options").style.display = "none"
    document.body.appendChild(gameScript)
}

function proceed() {
    //clear the timer if the function is called before the timer ends
    clearInterval(continueTimer);
    //hide the winner screen
    document.getElementById("win_msg_cnt").style.display = "none"
    //show last winner
    document.getElementById("last_winner").style.display = "block"
    document.getElementById("winner").innerHTML = winner
    //tell the server you proceeded
    socket.emit("proceed")
}
//TO DO: change window title based on what page your are on