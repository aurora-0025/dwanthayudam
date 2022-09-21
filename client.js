import { io } from "socket.io-client";
import "./menu";

var form = document.getElementById("form");
var input = document.getElementById("input");
var usernameInput = document.getElementById("name-input");
var roomId = document.getElementById("roomId");
var status = document.getElementById("status");
var exitButton = document.getElementById("exit");
var endButtons = document.getElementById("endButtons");
var rematchButton = document.getElementById("rematch");
var soundButton = document.getElementById("sound-button");
var soundIcon = document.getElementById("sound-icon");
var joinRoom = document.getElementById("join-room");
var gameScreen = document.getElementById("game-screen");
var disconnect = document.getElementById("disconnect");
var mainMenu = document.getElementById("main-menu");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bgm = new Audio();
bgm.src = "./assets/bgm.mp3"
bgm.loop = true;
bgm.volume = 0.1;

canvas.width = 640;
canvas.height = 480;

const socket = io.connect("http://panel.dragonacademia.tk:25568");

class People {
    constructor(game, x, y, src) {
        this.game = game;
        this.width = 778 * 0.2;
        this.height = 843 * 0.2;
        this.x = x;
        this.y = y;
        this.move = 0;
        this.pulling = false;
        this.image = new Image();
        this.image.src = src;
        this.spriteWidth = 389;
        this.spriteHeight = 281;
        this.frame = 0;
        this.action = 0;
        this.winningState = false;
        this.losingState = false;
        this.maxFrame = 1;
        this.timeSinceLastFrame = 0;
        this.frameInterval = 1000;
    }
    update(deltaTime) {
        this.x += this.move;
        this.timeSinceLastFrame += deltaTime;
        if(this.winningState == true){
            this.action = 1;
            this.maxFrame = 1;
        }
        else if(this.losingState == true){
            this.action = 2;
            this.maxFrame = 0;
            this.frame = 0;
        }
        else {
            this.action = 0;
            this.maxFrame = 1;
        }

        if (this.timeSinceLastFrame > this.frameInterval) {
            if (this.frame == 1) this.frame = 0;
            else this.frame = 1;
            if(this.maxFrame == 0) this.frame = 0;
            this.timeSinceLastFrame = 0;
        }
    }
    draw(context) {
        context.drawImage(
            this.image,
            this.frame * this.spriteWidth,
            this.action * this.spriteHeight,
            this.spriteWidth,
            this.spriteHeight,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}

class UI {
    constructor(game, x, y) {
        this.game = game;
        this.text = "";
        this.show = false;
        this.align = "center";
        this.font = "bold 30px Acme"
        this.x = x;
        this.y = y;
    }
    update() {
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            if (this.frame == 1) this.frame = 0;
            else this.frame = 1;
            this.timeSinceLastFrame = 0;
        }
    }
    draw(context) {
        if(this.show) {
            context.textAlign = "center";
            context.font = this.font;
            context.fillText(this.text, this.x, this.y);
        }
    }
}
class Rope {
    constructor(game) {
        this.game = game;
        this.width = 640;
        this.height = 480 * 0.72;
        this.x = -6 ;
        this.y = 0;
        this.move = 0;
        this.image = new Image();
        this.groundRope = new Image();
        this.image.src = "./assets/rope.png";
        this.groundRope.src = "./assets/rope_ground.png";
        this.onGround = false;
        this.spriteWidth = 1500;
        this.spriteHeight = 750;
        this.frame = 0;
        this.timeSinceLastFrame = 0;
        this.frameInterval = 300;
    }

    update(deltaTime) {
        this.x += this.move;
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            if (this.frame == 1) this.frame = 0;
            else this.frame = 1;
            this.timeSinceLastFrame = 0;
        }
    }
    draw(context) {
        context.fillStyle = "Brown";
        if(game.ready == false) this.onGround = true;
        if(this.onGround == true){
            context.drawImage(
                this.groundRope,
                this.x,
                10,
                this.game.width,
                this.game.height,
            )
        }
        else {
            context.drawImage(
            this.image,
            this.frame * this.spriteWidth,
            0,
            this.spriteWidth,
            this.spriteHeight,
            this.x,
            this.y,
            this.width,
            this.height
            )
        }
    }
}
class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.ui = new UI(this, width/2, height/2);
        this.rope = new Rope(this);
        this.peopleLeft = new People(this, 90, 180, "./assets/player1.png");
        this.peopleRight = new People(this, 400, 180, "./assets/player2.png");
        this.bg = new Image();
        this.ready = false;
        this.bg.src = "./assets/ground.png";
    }
    update(deltaTime) {
        if(this.ready) {
            this.peopleLeft.update(deltaTime);
            this.peopleRight.update(deltaTime);
            this.rope.update(deltaTime);
        }
    }
    draw(context) {
        context.drawImage(this.bg, 0, 0, this.width, this.height);
        this.rope.draw(context);
        this.peopleLeft.draw(context);
        if(this.ready) this.peopleRight.draw(context);
        this.ui.draw(context);
    }
}

const game = new Game(canvas.width, canvas.height);
let lastTime = 0;
let tapCounter = 0;

socket.on("update-rope", (ropePosition) => {
    let dmove = game.rope.x - ropePosition;
    game.rope.x = ropePosition;
    game.peopleLeft.x -= dmove;
    game.peopleRight.x -= dmove;
    dmove = 0;
});

socket.on("status", (stat, color) => {
    var newStat = document.createElement("p");
    newStat.style.color = color;
    newStat.appendChild(document.createTextNode(`${stat}`))
    status.appendChild(newStat);
    status.scrollTop  = status.scrollHeight
});

socket.on("winlose", (state, username, opponent) => {
    console.log(state);
    endButtons.style.display = "block";
    if (state == "win") {
        game.peopleLeft.winningState = true;
        game.peopleRight.losingState = true;
        game.rope.onGround = true;
        game.ui.show = true;
        game.ui.y = 50;
        game.ui.text =  `You Won`
    }
    if (state == "lose") {
        game.peopleLeft.losingState = true;
        game.peopleRight.winningState = true;
        game.rope.onGround = true;
        game.ui.show = true;
        game.ui.y = 50;
        game.ui.text = `You Lost, ${opponent} won`
    }
    exitButton.addEventListener("click", (ev)=>{
        ev.preventDefault();
        socket.emit("exit");
        gameScreen.style.display = "none";
        mainMenu.style.display = "flex";
    })
    rematchButton.addEventListener("click", (ev)=>{
        ev.preventDefault();
        socket.emit("rematch");
        rematchButton.style.display = "none";
    })
});

socket.on("start-rematch", ()=>{
    resetGame();
})

socket.on("clear-room", ()=>{
    resetGame();
    status.innerHTML = "";
    gameScreen.style.display = "none";
    mainMenu.style.display = "flex";
})


socket.on("player-leave", (id, reason) => {
    console.log("player left");
    resetGame()
});

socket.on("timer", (time) => {
    if(time == "The Game Will Start Soon") {
        game.ready = true;
        game.rope.onGround = false;
    }
    game.ui.text = time;
    game.ui.show = true;
    if (time == 0) {
        game.ui.text = "Start Tapping";
        setTimeout(() => {
            game.ui.text = ""
            game.ui.show = false;
        }, 1000);
    }
});
socket.on("game-start", () => {
    bgm.play();
    console.log("start audio");
    canvas.addEventListener("click", (e) => {
        e.preventDefault();
        tapCounter++;
    });
});

socket.on("fetchTap", () => {
    socket.emit("sendTap", {
        taps: tapCounter,
        ropPos: game.rope.x,
        id: socket.id,
        roomId: roomId.innerText,
    });
    tapCounter = 0;
});

socket.on("server-full", (reason) => {
    disconnect.style.display = "flex";
    disconnect.children[0].innerText = "You Got Kicked";
    disconnect.children[1].innerText = reason;
    gameScreen.style.display = "none";
})

soundButton.addEventListener("click", (e)=> {
    e.preventDefault()
    let iconName = soundIcon.getAttribute('name');
    if(iconName == "volume-mute") {
        bgm.volume = 0.1;
        soundIcon.setAttribute("name", "volume-low");
    }
    else if (iconName == "volume-low") {
        bgm.volume = 0.5;
        soundIcon.setAttribute("name", "volume-medium");
    }
    else if (iconName == "volume-medium") {
        bgm.volume = 1;
        soundIcon.setAttribute("name", "volume-high");
    }
    else if (iconName == "volume-high") {
        bgm.volume = 0;
        soundIcon.setAttribute("name", "volume-mute");
    }

}) 

form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (input.value) {
        socket.emit("room_join", input.value, usernameInput.value);
        roomId.innerText = input.value;
        input.value = "";
        joinRoom.style.display = "none";
        gameScreen.style.display = "flex";
    }
});

function resetGame() {
    game.rope.x = -6;
    game.peopleLeft.x = 90;
    game.peopleRight.x = 400;
    game.ready = false;
    game.ui.text = "waiting for new player"
    game.ui.y = game.height/2;
    game.ui.show = true;
    game.peopleLeft.winningState = false;
    game.peopleLeft.losingState = false;
    game.peopleRight.losingState = false;
    game.peopleRight.winningState = false;
    game.rope.onGround = false;
    endButtons.style.display = "none";
    rematchButton.style.display = "inline-block";
    bgm.pause();
    bgm.currentTime = 0;
}

function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(deltaTime);
    game.draw(ctx);
    requestAnimationFrame(animate);
}
animate(0);
