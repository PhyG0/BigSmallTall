var pg = Phygo.Init();
//Game - Initilisation
var game = pg.Game({
    width : 600,
    height : 750,
    Mainscene : {
        camera_options:{
            worldWidth : 700,
            worldHeight : 750,
            zoom : 1,
            lockCamera : false,
        },
        boundry : true
    }
});

var UiScene = pg.Scene({
    camera_options:{
        worldWidth : 600,
        worldHeight : 500,
        zoom : 1,
        lockCamera : false,
        c : game.Screen.Main.getContext("2d")
    },
    boundry : false
});
game.AddScene("ui", UiScene);
UiScene.Camera.LookAt(UiScene.CENTER);
game.CurrentScene = "ui";

game.Start();
game.Screen.Main.style.touchAction = "none";

class ImagePreloader{
    constructor(data){
        this.data = {};
        this.promises = [];
        this.total = data.length;
        this.load = 0;
        for(let i = 0; i < data.length; i++){
            let entries = Object.entries(Object.entries(data[i])[0][1])[0];
            let isImage = false;
            if(entries[1].split(".png").length > 1 || entries[1].split(".jpeg").length > 1){
                isImage = true;
            }
            if(isImage){
                let image = new Image();
                image.src = entries[1];
                let a = new Promise((res, rej)=>{
                    image.onload = () =>{
                        this.data[entries[0]] = image;
                        this.load++;
                        res(image);
                    };
                });
            }else{
                let audio = new Audio(entries[1]);
                let a = new Promise((res, rej)=>{
                    audio.addEventListener("canplaythrough", ()=>{
                        this.data[entries[0]] = audio;
                        this.load++;
                        res(audio);
                    });
                });
                this.promises.push(a);
            }
        }
    }

    getLoad(){
        return this.load;
    }

    loaded(){
        let allPromisesResloved = Promise.all(this.promises);
        return allPromisesResloved;
    }
}
function LoadedData(imagePreloader){
    let p = new Promise((res, rej)=>{
        imagePreloader.loaded().then(()=>{
            res(imagePreloader.data);
        });
    });
    return p;
}

var imageManager = new ImagePreloader([
    [{ "box" : "https://github.com/PhyG0/BigSmallTall/raw/main/box.png" }],
    [{ "key" : "https://github.com/PhyG0/BigSmallTall/raw/main/key.png" }],
    [{ "door" : "https://github.com/PhyG0/BigSmallTall/raw/main/door.jpeg" }],
    [{ "bg" : "https://github.com/PhyG0/BigSmallTall/raw/main/bg.mp3" }],
    [{ "open" : "https://github.com/PhyG0/BigSmallTall/raw/main/doorOpen.wav" }],
    [{ "pick" : "https://github.com/PhyG0/BigSmallTall/raw/main/pickKey.wav" }],
    [{ "jump" : "https://github.com/PhyG0/BigSmallTall/raw/main/jump2.wav" }],
    [{ "jump2" : "https://github.com/PhyG0/BigSmallTall/raw/main/jump.wav" }],
    [{ "jump3" : "https://github.com/PhyG0/BigSmallTall/raw/main/jump3.wav" }],
    [{ "trans" : "https://github.com/PhyG0/BigSmallTall/raw/main/trans.mp3" }],
    [{ "portal" : "https://github.com/PhyG0/BigSmallTall/raw/main/portal.wav" }],
    [{ "select" : "https://github.com/PhyG0/BigSmallTall/raw/main/select.wav" }],
    [{ "btn" : "https://github.com/PhyG0/BigSmallTall/raw/main/btn.mp3" }],
]);


//Global variables
var ARROW_TIME = 100;
var CURRENT_TIME = 0;
var GRAVITY = 1300;
var ASSETS_LOADED = false;
var ASSETS = [];
var PLAYER_SIZE_FACTOR = 1.3;
var CLICKED = false;
var gradControl = [pg.Util.Random(0, 255),  pg.Util.Random(0, 255), pg.Util.Random(0, 255)]
var keys_buffer = document.createElement("canvas");
var keys_buffer_ctx = keys_buffer.getContext("2d");
var CURRENT_PORTAL, DOORS = [];
var uiat = "menu";
var levelsArray = Object.values(Levels);
let LoadingPoint = pg.Physics.Vector(2 * game.Scenes["ui"].Camera.worldWidth, 0.5 * game.Scenes["ui"].Camera.worldHeight);
//Big - player
let bigRect = pg.Physics.Rectangle(pg.Physics.Vector(227, 116), 40 * PLAYER_SIZE_FACTOR, 40 * PLAYER_SIZE_FACTOR);
var bigT1 = 0;
var bigT2 = Math.PI/2;
bigRect.acceleration.y = GRAVITY;
bigRect.bounce = 0.01;
bigRect.mass = 0.35;
bigRect.inertia = Infinity;
bigRect.friction = 0;
let bigEnt = pg.Entity({
    body : bigRect,
    name : "big",
    sprite : pg.Renderer.Custom(()=>{})
});

//Small - player
let smallRect = pg.Physics.Rectangle(pg.Physics.Vector(50, 200), 25 * PLAYER_SIZE_FACTOR, 25 * PLAYER_SIZE_FACTOR);
var smallT1 = 0;
var smallT2 = Math.PI/2;
smallRect.acceleration.y = GRAVITY;
smallRect.bounce = 0.01;
smallRect.inertia = Infinity;
smallRect.mass = 0.35;
smallRect.friction = 0;
let smallEnt = pg.Entity({
    body : smallRect,
    name : "small",
    sprite : pg.Renderer.Custom(()=>{})
});

//Tall - player
let tallRect = pg.Physics.Rectangle(pg.Physics.Vector(260, 300), 30 * PLAYER_SIZE_FACTOR, 55 * PLAYER_SIZE_FACTOR);
tallRect.mass = 0.31;
tallRect.acceleration.y = GRAVITY;
tallRect.bounce = 0.01;
var tallT1 = 0;
var tallT2 = Math.PI/2
tallRect.inertia = Infinity;
tallRect.friction = 0;
let tallEnt = pg.Entity({
    body : tallRect,
    sprite : pg.Renderer.Custom((c)=>{}),
    name : "tall",
});

var players = [bigEnt, smallEnt, tallEnt];
players.forEach(player=>{
    player.props.reachedPortal = false;
    player.props.animationTime = 100;
    player.props.angle = 0;
    player.props.scale = 1;
    player.props.keyCount = 0;
});
var selectedPlayer = 2;

//Joystick - Init - movement
let js = new pg.Ui.Joystick({
    center : pg.Physics.Vector(game.Screen.Main.width/4, game.Screen.Main.height/1.15)
});
pg.Ui.Joystick.Activate(game.Screen.Main, [js], game.Screen.Main, game.Screen.div);
//Jump button
var jumpBtn = pg.Ui.Button(game.Screen.Main.width/2, game.Screen.Main.height/1.25, 100, 100, "Jump");
var shiftBtn = pg.Ui.Button(game.Screen.Main.width/1.3, game.Screen.Main.height/1.25, 105, 100, "Switch");
var backBtn = pg.Ui.Button(game.Screen.Main.width - 80, 0, 80, 50, "Menu");
backBtn.onrelease = () =>{
    ASSETS.trans.currentTime = 0;
    ASSETS.trans.play();
    game.CurrentScene = "ui";
    uiat = "menu";
    ASSETS.btn.play();
}
var restartBtn = pg.Ui.Button(game.Screen.Main.width - 190, 0, 100, 50, "Restart");
restartBtn.onrelease = () =>{
    ASSETS.btn.play();
    LevelGenerator(game.Scenes["Main"], levelsArray[game.count], ASSETS);
    return;
}

//Menu
var menuButtons = [];
let playBtn = pg.Ui.Button(game.Scenes["ui"].Camera.worldWidth/2 - 50, 2 * game.Scenes["ui"].Camera.worldHeight - 30, 130, 50, "Play");
let Credits = pg.Ui.Button(game.Scenes["ui"].Camera.worldWidth/2 - 50, 2 * game.Scenes["ui"].Camera.worldHeight + 40, 130, 50, "Credits");
playBtn.onrelease = () =>{
    ASSETS.trans.currentTime = 0;
    ASSETS.trans.play();
    uiat = "level";
    ASSETS.btn.play();
}
Credits.onrelease = () =>{
    ASSETS.btn.play();
    ASSETS.trans.currentTime = 0;
    ASSETS.trans.play();
    uiat = "credits";
}
menuButtons.push(playBtn);
menuButtons.push(Credits);
let backCred = pg.Ui.Button(game.Scenes["ui"].Camera.worldWidth/2 - 30, -2 * game.Scenes["ui"].Camera.worldHeight, 80, 60, "BACK");
backCred.onrelease = () =>{
    ASSETS.btn.play();
    uiat = "menu";
    ASSETS.trans.currentTime = 0;
    ASSETS.trans.play();
}
menuButtons.push(backCred);


jumpBtn.onclick = () =>{
    if(players[selectedPlayer].sides.bottom.size != 0){
        if(selectedPlayer == 0) ASSETS.jump.play();
        if(selectedPlayer == 1) ASSETS.jump3.play();
        if(selectedPlayer == 2) ASSETS.jump2.play();
        players[selectedPlayer].body.velocity.y = -200 / players[selectedPlayer].body.mass;
    }
}
function shiftPlayer(){
    CURRENT_TIME = 0;
    let allShifted = true;
    for(let i = 0; i < players.length; i++){
        if(!players[i].props.reachedPortal){
            allShifted = false;
        }
    }
    if(allShifted){
        //Level finished
        players.forEach(player=>{
            player.props.reachedPortal = false;
            player.props.animationTime = 100;
            player.props.angle = 0;
            player.props.scale = 1;
            player.props.keyCount = 0;
        });
        game.count = (game.count + 1) % (levelsArray.length); 
        LevelGenerator(game.Scenes["Main"], levelsArray[game.count], ASSETS);
        return;
    }
    selectedPlayer = (selectedPlayer + 1) % (players.length);
    if(players[selectedPlayer].props.reachedPortal){
        shiftPlayer();
    }
}
shiftBtn.onclick = () =>{
    shiftPlayer();
    ASSETS.select.play();
    game.Scene.Camera.SetTarget(players[selectedPlayer]);
    //RESET CURRENT TIME
    CURRENT_TIME = 0;
}
//level maker
let lvlM = pg.Util.LevelMaker(game.Screen.Main, game.Screen.div, game.Scene.Camera);
//lvlM.startP();

function LevelGenerator(scene, level, data){
    game.SceneTrans(()=>{
    keys_buffer_ctx.drawImage(ASSETS.key, 0, 0, 50, 30);
    players.forEach(player=>{
        player.props.reachedPortal = false;
        player.props.animationTime = 100;
        player.props.angle = 0;
        player.props.scale = 1;
        player.props.keyCount = 0;
        player.props.played = false;
    });
    game.count = level.count;
    game.CurrentScene = "Main";
    scene.active = true;
    scene.entities = [];
    scene.Camera.worldWidth = level.width;
    scene.Camera.worldHeight = level.height;
    scene.GenerateBoundry();
    let bigD = pg.Physics.Vector(level.playersPosition[0], level.playersPosition[1]);
    let smallD = pg.Physics.Vector(level.playersPosition[2], level.playersPosition[3]);
    let tallD = pg.Physics.Vector(level.playersPosition[4], level.playersPosition[5]);
    bigEnt.body.Translate(bigD.Sub(bigEnt.body.center));
    smallEnt.body.Translate(smallD.Sub(smallEnt.body.center));
    tallEnt.body.Translate(tallD.Sub(tallEnt.body.center));
    scene.AddEntity(bigEnt);
    scene.AddEntity(smallEnt);
    scene.AddEntity(tallEnt);
    scene.Camera.SetTarget(players[selectedPlayer]);
    let lvlP = pg.Util.LevelParser(level.map);
    let ents = lvlP.getEntities(level.cover);
    let portal = lvlP.getPortal(level.portal, "portal2");
    let doors = lvlP.getDoors(level.doors, data.door);
    let keys = lvlP.getKeys(level.keys, data.key);
    keys.forEach(key=>{
        key.props = {};
        key.props.owned = false;
        scene.AddEntity(key);
        key.AddCollision("d-big", (e)=>{
            if(!key.props.owned){
                ASSETS.pick.currentTime = 0;
                ASSETS.pick.play();
                e.props.keyCount += 1;
                key.sprite = pg.Renderer.Custom(()=>{});
                key.props.owned = true;
            }
        });
        key.AddCollision("d-small", (e)=>{
            if(!key.props.owned){
                ASSETS.pick.currentTime = 0;
                ASSETS.pick.play();
                e.props.keyCount += 1;
                key.sprite = pg.Renderer.Custom(()=>{});
                key.props.owned = true;
            }
        });
        key.AddCollision("d-tall", (e)=>{
            if(!key.props.owned){
                ASSETS.pick.currentTime = 0;
                ASSETS.pick.play();
                e.props.keyCount += 1;
                key.sprite = pg.Renderer.Custom(()=>{});
                key.props.owned = true;
            }
        });
    });
    doors.forEach(door=>{
        DOORS.push(door);
        door.props = {};
        door.props.unlocked = false;
        door.AddCollision("r-small", (e)=>{
            if(!door.props.unlocked){
                if(e.props.keyCount > 0){
                    ASSETS.open.currentTime = 0;
                    ASSETS.open.play();
                    door.props.unlocked = true;
                    e.props.keyCount -= 1;
                }
            }
        });
        door.AddCollision("r-big", (e)=>{
            if(!door.props.unlocked){
                if(e.props.keyCount > 0){
                    ASSETS.open.currentTime = 0;
                    ASSETS.open.play();
                    door.props.unlocked = true;
                    e.props.keyCount -= 1;
                }
            }
        });
        door.AddCollision("r-tall", (e)=>{
            if(!door.props.unlocked){
                if(e.props.keyCount > 0){
                    ASSETS.open.currentTime = 0;
                    ASSETS.open.play();
                    door.props.unlocked = true;
                    e.props.keyCount -= 1;
                }
            }
        });
        scene.AddEntity(door);
    });
    scene.AddEntity(portal);
    let boxes = lvlP.getBoxes(level.boxes, data.box);
    CURRENT_PORTAL = portal;
    players.forEach(player=>{
        portal.AddCollision(`d-${player.uniqueName}`, ()=>{
            if(!player.props.played){
                ASSETS.portal.play();
                player.props.played = true;
            }
            player.props.reachedPortal = true;
        });
    });
    boxes.forEach(box=>{        
        box.AddCollision("r-big");
        box.AddCollision("r-small");
        box.AddCollision("r-tall");
        ents.forEach(ent=>{
            ent.AddCollision(`r-${box.uniqueName}`);
        });
        scene.AddEntity(box);
    });
    ents.forEach(ent=>{
        scene.AddEntity(ent);
        ent.AddCollision("r-small");
        ent.AddCollision("r-big");
        ent.AddCollision("r-tall");
    });
});
}

let uiLevels = [];


LoadedData(imageManager).then(data=>{
    if(Object.keys(data).length == imageManager.total){
        ASSETS_LOADED = true;
    }
    keys_buffer_ctx.fillStyle = "rgba(30, 40, 50, 0.6)";
    keys_buffer_ctx.fillRect(0, 0, 100, 30);

    ASSETS = data;
    for(let i = 0; i < levelsArray.length; i++){
        let btn = pg.Ui.Button(110 * i + 50, UiScene.Camera.worldHeight/2 - 100, 80, 60, `Level-${i}`);
        btn.onrelease = () =>{
            LevelGenerator(game.Scenes["Main"], levelsArray[i], data);
            ASSETS.btn.play();
        }
        uiLevels.push(btn);
    }
    let men = pg.Ui.Button(uiLevels[0].x, uiLevels[0].y - 70, 1.5 * uiLevels[0].w, uiLevels[0].h, "Menu");
    men.onrelease = () =>{
        uiat = "menu";
        ASSETS.trans.currentTime = 0;
        ASSETS.trans.play();
        ASSETS.btn.play();
    }
    uiLevels.push(men);
    ASSETS.jump3.volume = 0.8;
});

game.DrawTopLayers = (c) =>{
    //Draw controls
    if(ASSETS_LOADED){
        if(game.Scene.active){
            js.show();
            jumpBtn.show(c, game.Screen.Main, game.Screen.div);
            shiftBtn.show(c, game.Screen.Main, game.Screen.div);
            backBtn.show(c, game.Screen.Main, game.Screen.div);
            restartBtn.show(c, game.Screen.Main, game.Screen.div);
            c.drawImage(keys_buffer, 0, 0);
            c.fillStyle = "white";
            c.font = "20px Mochiy Pop P One";
            c.fillText(`x ${players[selectedPlayer].props.keyCount}`, 55, 23);
        }
    }
}

game.DrawLayers = (c) =>{
  lvlM.show(c);
}

function _oneDraw(c){
    c.save();
    c.translate(bigRect.center.x, bigRect.center.y);
    c.scale(bigEnt.props.scale, bigEnt.props.scale);
    c.rotate(bigEnt.props.angle);
    drawBigRect(c);
    c.restore();
}

function _twoDraw(c){
    c.save();
    c.translate(smallRect.center.x, smallRect.center.y);
    c.scale(smallEnt.props.scale, smallEnt.props.scale);
    c.rotate(smallEnt.props.angle);
    drawSmallRect(c);
    c.restore();
}

function _threeDraw(c){
    c.save();
    c.translate(tallRect.center.x, tallRect.center.y);
    c.scale(tallEnt.props.scale, tallEnt.props.scale);
    c.rotate(tallEnt.props.angle);
    drawTallRect(c);
    c.restore();
}

let done = false;
game.Draw = (c) =>{
    //Have to change background
    if(game.Scene.active){
        c.save();
        c.fillStyle = "rgb(50, 100, 160)";
        c.fillRect(0, 0, game.Scene.Camera.worldWidth, game.Scene.Camera.worldHeight/1.3);
        c.strokeStyle = "white";
        c.lineWidth = 3;
        c.strokeRect(0, 0, game.Scene.Camera.worldWidth, game.Scene.Camera.worldHeight/1.3);
        c.strokeRect(20, 20,game.Scene.Camera.worldWidth - 40, game.Scene.Camera.worldHeight/1.3 - 40);
        c.restore();
        c.font = "25px Mochiy Pop P One";
        //If current scene/level is First level
        if(game.CurrentScene == "Main" && game.count == 0){
            c.save();      
            c.fillStyle = "white";
            c.fillText("Joystick to move player", 100, game.Scene.Camera.worldHeight/1.8);
            c.fillText("Switch to change player", 100, game.Scene.Camera.worldHeight/1.6);
            c.fillText("Reach Portal", 100, game.Scene.Camera.worldHeight/1.45);
            c.restore();
        }
        //Draw portal
        drawPortal(c, CURRENT_PORTAL.body);
        //Draw players
        if(selectedPlayer == 0){
            _twoDraw(c);
            _threeDraw(c);
            _oneDraw(c);
        }else if(selectedPlayer == 1){
            _oneDraw(c);
            _threeDraw(c);
            _twoDraw(c);
        }else{
            _oneDraw(c);
            _twoDraw(c);
            _threeDraw(c);
        }
        //Show lil arrow on top of selected player
        if(CURRENT_TIME < ARROW_TIME){
            drawTriangle(c, players[selectedPlayer].body.center.x, players[selectedPlayer].body.center.y - players[selectedPlayer].body.height/2 - 8, 16, Math.PI);
        }
        uiLevels.forEach(btn=>{
            btn.state.on = false;
        });
    }else{
        if(ASSETS_LOADED){
            if(CLICKED){
            if(uiat == "menu"){
                LoadingPoint = pg.Physics.Vector(game.Scenes["ui"].Camera.worldWidth/2, 2 * game.Scenes["ui"].Camera.worldHeight);
            }else if(uiat == "level"){
                LoadingPoint = pg.Physics.Vector(game.Scenes["ui"].Camera.worldWidth/2, 0.5 * game.Scenes["ui"].Camera.worldHeight);
            }else if(uiat == "credits"){
                LoadingPoint = pg.Physics.Vector(game.Scenes["ui"].Camera.worldWidth/2, -2 * game.Scenes["ui"].Camera.worldHeight); 
            }
            game.Scene.Camera.LookAt(LoadingPoint);
            uiLevels.forEach(btn=>{
                btn.show(c, game.Screen.Main, game.Screen.div, UiScene.Camera);
            });
            menuButtons.forEach(btn=>{
                btn.show(c, game.Screen.Main, game.Screen.div, UiScene.Camera);
            });
            let grd = c.createLinearGradient(game.Scenes["ui"].Camera.worldWidth/2 - game.Screen.Main.width/2, -2 * game.Scenes["ui"].Camera.worldHeight - game.Screen.Main.height/2, game.Screen.Main.width, 4 * game.Screen.Main.height);
            grd.addColorStop(0.2, `rgba(${gradControl[0]}, 10, 10, 0.3)`);
            grd.addColorStop(0.4, `rgba(200, ${gradControl[1]}, 10, 0.3)`);
            grd.addColorStop(0.6, `rgba(${gradControl[2]}, 10, 10, 0.3)`);
            grd.addColorStop(0.8, `rgba(200, 10, ${gradControl[0]}, 0.3)`);
            grd.addColorStop(1, `rgba(200, 10,  ${gradControl[0]}, 0.3)`);
            c.fillStyle = grd;
            c.fillRect(game.Scenes["ui"].Camera.worldWidth/2 - game.Screen.Main.width/2, -2 * game.Scenes["ui"].Camera.worldHeight - game.Screen.Main.height/2, game.Screen.Main.width, 4 * game.Screen.Main.height);
            //Game title
            c.fillStyle = "rgb(250, 100, 100)";
            c.font = "50px Rubik Beastly";
            c.fillText("BIG", game.Scenes["ui"].Camera.worldWidth/2 - 180, 2 * game.Scenes["ui"].Camera.worldHeight - 150);
            c.fillStyle = "rgb(100, 100,250)";
            c.font = "50px Spicy Rice";
            c.fillText("SMALL", game.Scenes["ui"].Camera.worldWidth/2 - 80, 2 * game.Scenes["ui"].Camera.worldHeight - 150);
            c.fillStyle = "rgb(250, 250, 10)";
            c.font = "50px Trade Winds";
            c.fillText("TALL", game.Scenes["ui"].Camera.worldWidth/2 + 60, 2 * game.Scenes["ui"].Camera.worldHeight - 150);
            c.fillStyle = "rgb(120, 230, 200, 0.3)";
            c.font = "25px Mochiy Pop P One";
            c.fillText("~THINKING IN DIFFERENT SIZES", game.Scenes["ui"].Camera.worldWidth/2 - 240, 2 * game.Scenes["ui"].Camera.worldHeight + 250);
            c.save();
            c.fillStyle = "white";
            c.font = "25px Mochiy Pop P One";
            c.fillText("CREDITS", game.Scenes["ui"].Camera.worldWidth/2 - 60, -2 * game.Scenes["ui"].Camera.worldHeight - 200);
            //Caveat
            c.font = "20px Mochiy Pop P One";
            c.fillText("PROGRAMMING/ART : ", game.Scenes["ui"].Camera.worldWidth/2 - 230, -2 * game.Scenes["ui"].Camera.worldHeight - 150);
            c.font = "32px Caveat";
            c.fillText("Krishna.P ", game.Scenes["ui"].Camera.worldWidth/2 + 50, -2 * game.Scenes["ui"].Camera.worldHeight - 150);
            c.font = "20px Mochiy Pop P One";
            c.fillText("Original Game : ", game.Scenes["ui"].Camera.worldWidth/2 - 230, -2 * game.Scenes["ui"].Camera.worldHeight - 100);
            c.font = "32px Caveat";
            c.fillText("Big-Small-Tall ", game.Scenes["ui"].Camera.worldWidth/2, -2 * game.Scenes["ui"].Camera.worldHeight - 100);
            c.restore();
        }else{
            if(!done){
                window.addEventListener("pointerdown", ()=>{
                    CLICKED = true;
                    ASSETS.bg.play();
                    ASSETS.bg.loop = true; 
                });
                done = true;
            }
            c.fillStyle = "rgb(100, 100, 130)";
            c.font = "35px Mochiy Pop P One";
            c.fillText(`Click Anywhere`, 1.5 * game.Scenes["ui"].Camera.worldWidth + 100, game.Scenes["ui"].Camera.worldHeight/2);
        }
        }else{
            //Loading screen
            LoadingPoint = pg.Physics.Vector(2 * game.Scenes["ui"].Camera.worldWidth, 0.5 * game.Scenes["ui"].Camera.worldHeight);
            game.Scene.Camera.LookAt(LoadingPoint);
            c.save();
            c.fillStyle = "rgb(100, 100, 130)";
            c.font = "35px Mochiy Pop P One";
            c.fillText(`Loading Assets...( ${imageManager.load}/${imageManager.total} )`, 1.5 * game.Scenes["ui"].Camera.worldWidth + 50, game.Scenes["ui"].Camera.worldHeight/2);
            c.fillStyle = "green";
            c.fillRect(1.5 * game.Scenes["ui"].Camera.worldWidth + 120, game.Scenes["ui"].Camera.worldHeight/1.9, imageManager.load * (400/(imageManager.total)), 30);
            c.strokeStyle = "black";
            c.lineWidth = 3;
            c.strokeRect(1.5 * game.Scenes["ui"].Camera.worldWidth + 120, game.Scenes["ui"].Camera.worldHeight/1.9, 400, 30);
            c.restore();
            
        }
    }
}

game.Update = (dt) =>{
    for(let i = 0; i < gradControl.length; i++){
        gradControl[i] += dt * 20;
        if(gradControl[i] > 255) gradControl[i] = pg.Util.Random(100, 200);
    }
    if(game.Scene.active){
        if(players[selectedPlayer].props.reachedPortal && players[selectedPlayer].props.animationTime <= 0){
            shiftPlayer();
            game.Scene.Camera.SetTarget(players[selectedPlayer]);
        }
        //Update doors
        DOORS.forEach(d=>{
            if(d.props.unlocked){
                if(d.body.height > 3){
                    d.body.height -= 0.9;
                    d.sprite.xHeight -= 1;
                    d.sprite.center.y -= 0.05;
                    d.height = d.body.height;
                    d.sprite.height = d.body.height;
                    d.body.Translate(pg.Physics.Vector(0, -0.4));
                }else{
                    d.CollidingGroups.clear();
                }
                //d.body.Translate(pg.Physics.Vector(0, -0.2))
            }
        });
        //Control the selected player
        //Type - 1
        // if(js.getAngle() != 0){
        //     players[selectedPlayer].body.velocity.x += Math.cos(js.getAngle()) * 200 * dt;
        // }
        //Type - 2
        let ang = pg.Physics.Vector(js.getDirX(), js.getDirY());
        let right = pg.Physics.Vector(1, 0);
        let left = pg.Physics.Vector(-1, 0);
        if(selectedPlayer == 0) speed = 70;
        else if(selectedPlayer == 1) speed = 100;
        else speed = 80;
        if(ang.dot(right) > 0.6){
            players[selectedPlayer].body.velocity.x = speed * (1 / (players[selectedPlayer].body.mass));
            players[selectedPlayer].props.right = true;
            players[selectedPlayer].props.left = false;
        }else if(ang.dot(left) > 0.6){
            players[selectedPlayer].body.velocity.x= -speed * (1 / (players[selectedPlayer].body.mass));
            players[selectedPlayer].props.left = true;
            players[selectedPlayer].props.right = false;
        }else{
            players[selectedPlayer].props.right = false;
            players[selectedPlayer].props.left = false;
            players[selectedPlayer].body.velocity.x *= 0.9;
        }
    
        if(selectedPlayer != 0) bigEnt.body.velocity.x *= 0.9;
        if(selectedPlayer != 1) smallEnt.body.velocity.x *= 0.9;
        if(selectedPlayer != 2) tallEnt.body.velocity.x *= 0.9;
        if(js.state.on == false){
            bigEnt.body.velocity.x *= 0.9;
            smallEnt.body.velocity.x *= 0.9;
            tallEnt.body.velocity.x *= 0.9;
        }
    
        if(CURRENT_TIME < ARROW_TIME) CURRENT_TIME += dt * 100;
        players.forEach(player=>{
            if(player.props.reachedPortal){
                if(player.props.animationTime > 0){
                    let v = CURRENT_PORTAL.body.center.Sub(player.body.center).Unit().Scale(100);
                    player.body.velocity.x = v.x;
                    player.body.velocity.y = v.y;
                    player.props.animationTime--;
                    if(player.props.scale > 0) player.props.scale -= 0.01;
                    player.props.angle += 0.1;
                }
            }
        });
    }
}
