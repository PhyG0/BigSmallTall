let b1 = b2 = b3 = 0;
function drawBigRect(c){
    let bww = 50 * 1.3;
    let bhh = 50 * 1.3;
    b1 += 0.2;
    //Draw big rect
    bigT1 += 0.3;
    bigT2 += 0.3;
    if(bigT1 > 3.14) bigT1 = 3.14 - bigT1;
    if(bigT2 > 3.14) bigT2 = 3.14 - bigT2;
    //Legs - stroke
    if(bigRect.velocity.Length() < 1){ bigT1 = 0; bigT2 = 0; }
    else{
        b1 = 0;
        if(bigT2 - bigT1 == 0){
            bigT2 += Math.PI/2;
        }
    };
    c.strokeRect(0 - bww/4, 0 - Math.sin(bigT1) * 9, 13, 30, 30);
    c.strokeRect(0 - bww/4 + 20, 0 - Math.sin(bigT2) * 9, 13, 30, 30);
    //Body
    pg.Util.RoundRect(game.Screen.Main.getContext("2d"), 0 - bww/2, 0 - bhh/2 - Math.sin(b1), bww, bhh/1.4, 20, "rgb(230, 20, 20)");
    //Legs - fill
    c.fillStyle = "rgb(230, 20, 20)";
    c.fillRect(0 - bww/4, 0 - Math.sin(bigT1) * 11, 13, 30, 30);
    c.fillRect(0 - bww/4 + 20, 0 - Math.sin(bigT2) * 11, 13, 30, 30);
    //Eyes
    c.save();
    c.beginPath();
    c.fillStyle = "black";
    if(bigEnt.props.right){
        c.ellipse(0, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0 + 20, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
    } 
    if(bigEnt.props.left){
        c.ellipse(0 - 20, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
    }
    if(!bigEnt.props.left && !bigEnt.props.right){
        c.ellipse(0 - 10, 0 - 12 - Math.sin(b1), 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0 - 10 + 20, 0 - 12 - Math.sin(b1), 7, 10, 0, 0, 2 * Math.PI);
    }
    c.closePath();
    c.fill();
    c.restore();
}

function drawSmallRect(c){
    b2 += 0.2;
    //Draw small rect
    smallT1 += 0.3;
    smallT2 += 0.3;
    if(smallT1 > 3.14) smallT1 = 3.14 - smallT1;
    if(smallT2 > 3.14) smallT2 = 3.14 - smallT2;
    //Legs - stroke
    if(smallRect.velocity.Length() < 1){ smallT1 = 0; smallT2 = 0; }
    else{
        b2 = 0;
        if(smallT2 - smallT1 == 0){
            smallT2 += Math.PI/2;
        }
    };
    c.strokeRect(0 - smallRect.width/4, 0 + 3 - Math.sin(smallT1) * 20, 13, 20);
    //Body
    pg.Util.RoundRect(game.Screen.Main.getContext("2d"), 0 - smallRect.width/2, 0 - smallRect.height/2 - Math.sin(b2), smallRect.width, smallRect.height/1.4, 10, "rgb(20, 200, 20)");
    //Legs - fill
    c.fillStyle = "rgb(20, 200, 20)";
    c.fillRect(0 - smallRect.width/4, 0 + 3 - Math.sin(smallT1) * 20, 13, 20);
    //Eyes
    c.save();
    c.beginPath();
    c.fillStyle = "black";
    if(smallEnt.props.right){
        c.ellipse(0, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0 + 20, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
    } 
    if(smallEnt.props.left){
        c.ellipse(0 - 20, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
    }
    if(!smallEnt.props.left && !smallEnt.props.right){
        c.ellipse(0 - 10, 0 - 12 - Math.sin(b2) * 1.3, 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0 - 10 + 20, 0 - 12 - Math.sin(b2) * 1.3, 7, 10, 0, 0, 2 * Math.PI);
    }
    c.closePath();
    c.fill();
    c.restore();
}

function drawTallRect(c){
    b3 += 0.2;
    tallT1 += 0.3;
    tallT2 += 0.3;
    if(tallT1 > 3.14) tallT1 = 3.14 - tallT1;
    if(tallT2 > 3.14) tallT2 = 3.14 - tallT2;
    //Legs - stroke
    if(tallRect.velocity.Length() < 1){ tallT1 = 0; tallT2 = 0; }
    else{
        b3 = 0;
        if(tallT2 - tallT1 == 0){
            tallT2 += Math.PI/2;
        }
    };
    c.strokeRect(0 - tallRect.width/4 + 2, 0 - Math.sin(tallT1) * 11, 7, 33, 30);
    c.strokeRect(0 - tallRect.width/4 + 11, 0 - Math.sin(tallT2) * 11, 7, 33, 30);
    //Body
    pg.Util.RoundRect(game.Screen.Main.getContext("2d"), 0 - tallRect.width/2, 0 - tallRect.height/2 - Math.sin(b3), tallRect.width, tallRect.height/1.4, 15, "rgb(255, 255, 50)");
    //Legs - fill
    c.fillStyle = "rgb(255, 255, 50)";
    c.fillRect(0 - tallRect.width/4 + 2, 0 - Math.sin(tallT1) * 11, 7, 33, 30);
    c.fillRect(0 - tallRect.width/4 + 11, 0 - Math.sin(tallT2) * 11, 7, 33, 30);
    //Eyes
    c.save();
    c.beginPath();
    c.fillStyle = "black";
    if(tallEnt.props.right){
        c.ellipse(0, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0 + 20, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
    } 
    if(tallEnt.props.left){
        c.ellipse(0 - 20, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0, 0 - 12, 7, 10, 0, 0, 2 * Math.PI);
    }
    if(!tallEnt.props.left && !tallEnt.props.right){
        c.ellipse(0 - 10, 0 - 12 - Math.sin(b3), 7, 10, 0, 0, 2 * Math.PI);
        c.ellipse(0 - 10 + 20, 0 - 12 - Math.sin(b3), 7, 10, 0, 0, 2 * Math.PI);
    }
    c.closePath();
    c.fill();
    c.restore();
}

class Portal{
    constructor(){
        this.circleCount = 12;
        this.circles = [];
        this.initilised = false;
        this.canvas = document.createElement("canvas");
        this.c = this.canvas.getContext("2d");
    }

    init(cp){
        if(!this.initilised){
            this.canvas.width = cp.width;
            this.canvas.height = cp.height;
            this.cp = cp;
            for(let i = 0; i < this.circleCount; i++){
                this.circles[i] = {
                    radius : i * (Math.sqrt((cp.width * cp.width) + (cp.height * cp.height)) / (this.circleCount)),
                    reserve : i * (Math.sqrt((cp.width * cp.width) + (cp.height * cp.height)) / (this.circleCount )),
                }
            }
            this.initilised = true;
        }
    }
}
let p = new Portal();
function drawPortal(c, cp){
    p.init(cp);
    p.c.strokeStyle = "purple";
    p.c.lineWidth = 5;
    p.c.clearRect(0, 0, p.c.canvas.width, p.c.canvas.height);
    p.c.fillStyle = "rgb(69, 61, 85)";
    p.c.fillRect(0, 0, p.c.canvas.width, p.c.canvas.height);
    p.circles.forEach(circ=>{
        p.c.save();
        p.c.beginPath();
        p.c.arc(p.c.canvas.width/2, p.c.canvas.height/2, circ.radius, 0, 2 * Math.PI);
        p.c.closePath();
        p.c.stroke();
        p.c.restore();
        circ.radius -= 0.1;
        if(circ.radius < 1){
            circ.radius = circ.reserve;
        }
    });
    c.drawImage(p.canvas, cp.center.x - cp.width/2, cp.center.y - cp.height/2, cp.width, cp.height);
}

function drawTriangle(c, x, y, size, angle){
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.strokeStyle = "white";
    c.fillStyle = "black";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0,-size/2);
    c.lineTo(-size/2 - size/6,size/2);
    c.lineTo(size/2 + size/6, size/2);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
}