var playButton = document.getElementById("play-button");
var creditsButton = document.getElementById("credits-button");
var helpButton = document.getElementById("help-button");
var backButtons = document.getElementsByClassName("back-button");
var mainMenu = document.getElementById("main-menu");
var joinRoom = document.getElementById("join-room")
var credits = document.getElementById("credits")
var help = document.getElementById("help")
var gameScreen = document.getElementById("game-screen");
var disconnectScreen = document.getElementById("disconnect");


playButton.addEventListener("click", (e)=>{
    e.preventDefault();
    mainMenu.style.display = "none"
    joinRoom.style.display = "block"
})

creditsButton.addEventListener("click", (e)=>{
    e.preventDefault();
    mainMenu.style.display = "none"
    credits.style.display = "flex"
})

helpButton.addEventListener("click", (e)=>{
    e.preventDefault();
    mainMenu.style.display = "none"
    help.style.display = "flex"
})

for (let i = 0; i < backButtons.length; i++) {
    const backButton = backButtons[i];
    backButton.addEventListener("click", (e)=>{
        e.preventDefault();
        console.log("pressed");
        mainMenu.style.display = "flex"
        joinRoom.style.display = "none"
        help.style.display = "none"
        credits.style.display = "none"
        gameScreen.style.display = "none"
        disconnectScreen.style.display = "none";
    })
}
