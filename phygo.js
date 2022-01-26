const Phygo = (function(){
    var globalOut = {
        Physics : {},
        Renderer : {},
        Ui : {},
        Util : {},
        System : {}
    };
    class Screen {
        constructor(width = 1000, height = 1000){
            this.width = width;
            this.height = height;
            this.div = document.createElement("div");
            this.div.style.position = "absolute";
            this.div.style.top = "50%";
            this.div.style.left = "50%";
            this.Main = document.createElement("canvas");
            this.Main.style.width = "100%";
            this.Main.style.height = "100%";
            this.Main.width = width;
            this.Main.height = height;
            this.Main.style.position = "absolute";
            this.div.appendChild(this.Main);
            document.body.appendChild(this.div);
        }
        _Resize(){
            var widthToHeight = this.width / this.height;
            var newWidth = window.innerWidth;
            var newHeight = window.innerHeight;
            var newWidthToHeight = newWidth / newHeight;
            if(newWidthToHeight > widthToHeight) newWidth = newHeight * widthToHeight;
            else newHeight = newWidth / widthToHeight;
            this.div.style.width = newWidth + "px";
            this.div.style.height = newHeight + "px";
            this.div.style.marginTop = (-newHeight / 2) + "px";
            this.div.style.marginLeft = (-newWidth / 2) + "px";
        }
    }

    class Vector {
        constructor(x, y){
            this.x = x; 
            this.y = y;
        }
        Add(vector){
            return new Vector(this.x + vector.x, this.y + vector.y);
        }
        Sub(vector){
            return new Vector(this.x - vector.x, this.y - vector.y);
        }
        Scale(k){
            return new Vector(this.x * k, this.y * k);
        }
        Mult(vector){
            return new Vector(this.x * vector.x, this.y * vector.y);
        }
        Angle(){
            return Math.atan2(this.y, this.x);
        }
        Clone(){
            return new Vector(this.x, this.y);
        }
        AddScaled(vector, k){
            return new Vector(this.x + vector.x * k, this.y + vector.y * k);
        }
        Rotate(angle, center = new Vector(0, 0)){
            let x = this.x - center.x;
            let y = this.y - center.y;
            let r = [];
            r[0] = x * Math.cos(angle) - Math.sin(angle) * y;
            r[1] = x * Math.sin(angle) + Math.cos(angle) * y;
            r[0] += center.x;
            r[1] += center.y;
            return new Vector(r[0], r[1]);
        }
        Length(){
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        LengthSquared(){
            return Math.pow(this.x, 2) + Math.pow(this.y, 2);
        }
        Unit(){
            let length = this.Length();
            if(length == 0) return this;
            else return new Vector(this.x / length, this.y / length);
        }
        Perp(){
            return new Vector(this.y, -this.x);
        }

        dot(v){
            return this.x * v.x + this.y * v.y;
        }

        static AngleBetween(vector1, vector2){
            return Math.acos(Vector.Dot(vector1, vector2) / (vector1.Length() * vector2.Length()));
        }
        static Dot(vector1, vector2){
            return vector1.x * vector2.x + vector1.y * vector2.y;
        }
        static Cross(vector1, vector2){
            return vector1.x * vector2.y - vector1.y * vector2.x;
        }
        static Average(array){
            let sum = new Vector(0, 0);
            for(let i = 0; i < array.length; i++){
                sum.x += array[i].x;
                sum.y += array[i].y;
            }
            sum = sum.Scale(1 / array.length);
            return sum;
        }
    }


    class AABB {
        constructor(x, y, w, h, userData){
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.userData = userData;
            this.added = false;
        }
    
        vsAabb(aabb){
            if(Math.floor(this.x) == Math.floor(aabb.x) && Math.floor(this.y) == Math.floor(aabb.y)) return false;
            if(this.x + this.w/2 >= aabb.x - aabb.w/2 && 
               this.x - this.w/2 <= aabb.x + aabb.w/2 && 
               this.y + this.h/2 >= aabb.y - aabb.h/2 && 
               this.y - this.h/2 <= aabb.y + aabb.h/2){
                return true;
            }else{
                return false;
            }
        }
        draw(c, col = "rgba(100, 150, 100, 0.8)"){
            c.strokeStyle = col;
            c.strokeRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h);
        }
    }

    class QuadTree{
        constructor(aabb, limit){
            this.aabb = aabb;
            this.limit = limit;
            this.divided = false;
            this.data = [];
        }
    
        divide(){
            this.topLeft = new QuadTree(new AABB(this.aabb.x - this.aabb.w/4, this.aabb.y - this.aabb.h/4, this.aabb.w/2, this.aabb.h/2), this.limit);
            this.topRight = new QuadTree(new AABB(this.aabb.x + this.aabb.w/4, this.aabb.y - this.aabb.h/4, this.aabb.w/2, this.aabb.h/2), this.limit);
            this.bottomLeft = new QuadTree(new AABB(this.aabb.x - this.aabb.w/4, this.aabb.y + this.aabb.h/4, this.aabb.w/2, this.aabb.h/2), this.limit);
            this.bottomRight = new QuadTree(new AABB(this.aabb.x + this.aabb.w/4, this.aabb.y + this.aabb.h/4, this.aabb.w/2, this.aabb.h/2), this.limit);
            for(let i = 0; i < this.data.length; i++){
                this.topLeft.insert(this.data[i]);
                this.topRight.insert(this.data[i]);
                this.bottomLeft.insert(this.data[i]);
                this.bottomRight.insert(this.data[i]);
            }
            this.divided = true;
        }
    
    
        clear(){
            this.data = [];
            this.divided = false;
            this.topRight = null;
            this.topLeft = null;
            this.bottomLeft = null;
            this.bottomRight = null;
        }
    
        query(aabb, res){
            if(res == undefined){
                res = new Set();
            } 
            if(!aabb.vsAabb(this.aabb)) return;
            if(!this.divided){
                for(let i = 0; i < this.data.length; i++){
                    if(aabb.vsAabb(this.data[i])){
                        res.add(this.data[i]);
                    }
                }
            }else{
                this.topLeft.query(aabb, res);
                this.topRight.query(aabb, res);
                this.bottomLeft.query(aabb, res);
                this.bottomRight.query(aabb, res);
            }
            return res;
        }
    
        insert(aabb, _depth = 0){
            const maxRec = this.limit-1;
            if(!this.aabb.vsAabb(aabb)){
                return false;
            }
            if(this.data.length < this.limit || _depth > maxRec){
                this.data.push(aabb);
                return true;
            }else{
                if(!this.divided){
                    this.divide();
                }
                this.topLeft.insert(aabb, _depth + 1);
                this.topRight.insert(aabb, _depth + 1);
                this.bottomLeft.insert(aabb, _depth + 1);
                this.bottomRight.insert(aabb, _depth + 1);
            }
        }
    
        draw(c){
            this.aabb.draw(c);
            if(this.divided){
                this.topLeft.draw(c);
                this.topRight.draw(c);
                this.bottomLeft.draw(c);
                this.bottomRight.draw(c);
            }
        }
    }

    class Entity {
        constructor(params){
            this.width = 0;
            this.height = 0;
            this.sprite = params.sprite || undefined;
            this.body = params.body || undefined;
            this.center = params.center || this.body.center;
            this.uniqueName = params.name;
            this.props = {
                left : false,
                right : false
            };
            this.CollidingGroups = params.CollidingGroups || new Set();
            this._cbs = {};
            this.sides = {
                top : new Set(),
                bottom : new Set(),
                left : new Set(),
                right : new Set()
            }
        }
        SetSprite(sprite){
            this.sprite = sprite;
        }

        SetBody(body){
            this.body = body;
        }

        AddCollision(group, cb){
            this.CollidingGroups.add(group);
            this._cbs[group] = cb;
        }

        Neighbours(qt){
            return qt.query(new AABB(this.center.x, this.center.y, this.width, this.height));
        }

        static _GetData(group){
            let split = group.split("-");
            let type = split[0];
            let name = "";
            for(let i = 1; i < split.length; i++){
                name += split[i];
            }
            return { type : type, name : name };
        }

        _Draw(c){
            if(this.sprite){
                this.sprite._Draw(c);
            }
            if(this.body){
                if(!this.sprite){
                    this.body.Draw(c);
                }
                //c.strokeStyle = "white";
                // c.save();
                // c.strokeRect(this.center.x - this.width / 2, this.center.y - this.height / 2, this.width, this.height);
                // c.restore();
            }
        }

        _Update(dt){
            this.sides.left.clear();
            this.sides.right.clear();
            this.sides.top.clear();
            this.sides.bottom.clear();
            this.body._MomentIntegration(dt);
            if(this.body){
                this.center = this.body.center.Clone();
                this.width = this.body.boundingRect.width;
                this.height = this.body.boundingRect.height;
            }
            if(this.sprite){
                this.sprite.center = this.body.center;
                this.sprite.angle = this.body.angle;
            }
        }

    }
    var ORIGIN = new Entity({
        center : new Vector(0, 0)
    });

    class Camera{
        constructor(params){
            this.pos = params.position || new Vector(0, 0);
            this.zoom = params.zoom || 1;
            this.c = params.c;
            this.offSet = params.offSet || { x : this.c.canvas.width/2, y : this.c.canvas.height/2 };
            this.worldWidth = params.worldWidth || 1000;
            this.worldHeight = params.worldHeight || 1000;
            this.target = params.target || ORIGIN;
            this.lockCamera = params.lockCamera || false;
        }
    
        Update(){
            if(this.lockCamera){
                if(this.pos.y > 0) this.pos.y = 0;
                if(this.pos.x > 0) this.pos.x = 0;
                if(-this.pos.y + ((this.offSet.y * 2) / this.zoom) > this.worldHeight) this.pos.y = -(this.worldHeight - ((this.offSet.y * 2) / this.zoom)); 
                if(-this.pos.x + ((this.offSet.x * 2) / this.zoom) > this.worldWidth) this.pos.x = -(this.worldWidth - ((this.offSet.x * 2) / this.zoom)); 
            }
        }

        SetTarget(target){
            this.target = target;
        }

        LookAt(vector){
            let ent = new Entity({
                center : vector
            });
            this.target = ent;
        }
    
        Follow(){
            let finalX = -this.target.center.x + this.offSet.x / this.zoom;
            let finalY = -this.target.center.y + this.offSet.y / this.zoom;
            let tar = new Vector(finalX, finalY);
            let v = tar.Sub(this.pos);
            v.x *= 0.05;
            v.y *= 0.05;
            this.pos = this.pos.Add(v);
        }
    
        Start(z = 1){
            this.c.save();
            this.c.scale(this.zoom, this.zoom);
            this.c.translate(this.pos.x / z, this.pos.y / z);
        }
    
        End(){
            this.c.restore();
        }
    
        Draw(cb, z){
            this.Start(z);
            cb();
            this.End();
        }

        static CamDraw(cam, cb, z){
            cam.Start(z);
            cb();
            cam.End();
        }

    }
    function DetectPolyVsPoly(e1, e2){
        let e1SupportPoints = [];
        let e1FaceNormals = e1._GetFaceNormals();
        let e2FaceNormals = e2._GetFaceNormals();
        for(let i = 0; i < e1FaceNormals.length; i++){
            let spInfo = e2._FindSupportPoint(e1FaceNormals[i].Scale(-1), e1.vertices[i]);
            if(spInfo.sp == undefined) return [{ collide : false }];
            e1SupportPoints[i] = spInfo;
        }
        let e2SupportPoints = [];
        for(let i = 0; i < e2FaceNormals.length; i++){
            let spInfo = e1._FindSupportPoint(e2FaceNormals[i].Scale(-1), e2.vertices[i]);
            if(spInfo.sp == undefined) return [{ collide : false }];
            e2SupportPoints[i] = spInfo;
        }
        let result = e1SupportPoints.concat(e2SupportPoints);
        let max = Infinity;
        let index = null;
        for(let i = 0; i < result.length; i++){
            if(result[i].depth < max){
                max = result[i].depth;
                index = i;
            }
        }
        let v = e2.center.Sub(e1.center);
        if(Vector.Dot(v, result[index].n) > 0){
            result[index].n = result[index].n.Scale(-1);
        }
        result[index].collide = true;
        return [result[index]];
    }

    function DetectPolyVsCircle(e1, e2){
        let e1FaceNormals = e1._GetFaceNormals();
        let e1SupportPoints = [];
        for(let i = 0; i < e1FaceNormals.length; i++){
            let spInfo1 = e2._FindSupportPoint(e1FaceNormals[i].Scale(-1), e1.vertices[i]);
            if(spInfo1.sp == undefined) return [{ collide : false }];
            e1SupportPoints[i] = spInfo1;
        }
        let normal = e1.center.Sub(e2.center).Unit().Scale(-1);
        let info = e1._FindSupportPoint(normal, e2.center.Add(normal.Scale(-e2.radius)));
        if(info.sp == undefined) return [{ collide : false }];
        e1SupportPoints.push(info);
        // let info2 = e1._FindSupportPoint(normal, e2.center.Add(normal.Scale(-e2.radius)));
        // if(info2.sp == undefined) return [{ collide : false }];
        // e1SupportPoints.push(info2);
        let max = Infinity;
        let index = null;
        for(let i = 0; i < e1SupportPoints.length; i++){
            if(e1SupportPoints[i].depth < max){
                max = e1SupportPoints[i].depth;
                index = i;
            }
        }
        let v = e2.center.Sub(e1.center);
        if(Vector.Dot(v, e1SupportPoints[index].n) < 0){
            e1SupportPoints[index].n = e1SupportPoints[index].n.Scale(-1);
        }
        e1SupportPoints[index].collide = true;
        return [e1SupportPoints[index]];
    }
    function DetectCircleVsCircle(e1, e2){
        let rSum = e1.radius + e2.radius;
        let vFrom1to2 = e2.center.Sub(e1.center);
        if(vFrom1to2.LengthSquared() < Math.pow(rSum, 2)){
            let d = rSum - vFrom1to2.Length();
            let n = vFrom1to2.Unit();
            let sp = e2.center.Add(n.Scale(d));
            if(Vector.Dot(vFrom1to2, n) > 0){
                n = n.Scale(-1);
            }
            return [{
                sp : sp,
                n : n,
                depth : d, 
                collide : true
            }];
        }else{
            return [{ collide : false }];
        }
    }

    function DetectPolyVsComp(e1, e2){
        let res = [];
        for(let i = 0; i < e2.objects.length; i++){
            let detection = _Detect(e1, e2.objects[i]);
            if(detection[0].collide){
                res = res.concat(detection);
            }
        }
        return res;
    }

    function DetectCircleVsComp(e1, e2){
        let res = [];
        for(let i = 0; i < e2.objects.length; i++){
            let detection = _Detect(e1, e2.objects[i]);
            if(detection[0].collide){
                res = res.concat(detection);
            }
        }
        return res;
    }

    function DetectCompVsComp(e1, e2) {
        let res = [];
        for(let i = 0; i < e1.objects.length; i++){
            for(let j = 0; j < e2.objects.length; j++){
                let detection = _Detect(e1.objects[i], e2.objects[j]);
                if(detection[0].collide){
                    res = res.concat(detection);
                }
            }
        }
        return res;
    }

    function Detect(e1, e2){
        let detection;
        if(e1.body.type == "polygon" && e2.body.type == "polygon"){
            detection =  DetectPolyVsPoly(e1.body, e2.body);
        }
        if(e1.body.type == "polygon" && e2.body.type == "circle"){
            detection = DetectPolyVsCircle(e1.body, e2.body);
            if(detection[0].collide){
                detection[0].n = detection[0].n.Scale(-1);
            }
        }
        if(e1.body.type == "circle" && e2.body.type == "polygon"){
            detection = DetectPolyVsCircle(e2.body, e1.body);
        }
        if(e1.body.type == "circle" && e2.body.type == "circle"){
            detection = DetectCircleVsCircle(e1.body, e2.body);
        }
        if(e1.body.type == "composite" && e2.body.type == "polygon"){
            detection = DetectPolyVsComp(e2.body, e1.body);
            if(detection){
                for(let i = 0; i < detection.length; i++){
                    if(detection[i].collide){
                        detection[i].n = detection[i].n.Scale(-1);
                    }
                }
            }
        }
        if(e1.body.type == "polygon" && e2.body.type == "composite"){
            detection = DetectPolyVsComp(e1.body, e2.body);
        }
        if(e1.body.type == "circle" && e2.body.type == "composite"){
            detection = DetectCircleVsComp(e1.body, e2.body);
        }
        if(e1.body.type == "composite" && e2.body.type == "composite"){
            detection = DetectCompVsComp(e1.body, e2.body);
        }
        if(e1.body.type == "composite" && e2.body.type == "circle"){
            detection = DetectCircleVsComp(e2.body, e1.body);
            if(detection){
                for(let i = 0; i < detection.length; i++){
                    if(detection[i].collide){
                        detection[i].n = detection[i].n.Scale(-1);
                    }
                }
            }
        }
        if(detection) return detection;
        return [{ collide : false }];
    }

    function _Detect(e1, e2){
        let detection;
        if(e1.type == "polygon" && e2.type == "polygon"){
            detection =  DetectPolyVsPoly(e1, e2);
        }
        if(e1.type == "polygon" && e2.type == "circle"){
            detection = DetectPolyVsCircle(e1, e2);
            if(detection[0].collide){
                detection[0].n = detection[0].n.Scale(-1);
            }
        }
        if(e1.type == "circle" && e2.type == "polygon"){
            detection = DetectPolyVsCircle(e2, e1);
        }
        if(e1.type == "circle" && e2.type == "circle"){
            detection = DetectCircleVsCircle(e1, e2);
        }
        if(detection) return detection;
        return [{ collide : false }];
    }

    function Resolve(b1, b2, info){
        if(b1.body.mass == Infinity && b2.body.mass == Infinity) return false;
        if(info.collide){
            let d = info.depth;
            let n = info.n;
            let e1 = b1.body;
            let e2 = b2.body;
            let p = info.sp;
            const directions = {
                left: new Vector(-1, 0),
                right: new Vector(1, 0),
                top : new Vector(0, -1),
                bottom : new Vector(0, 1)
              };
            if (Vector.Dot(info.n, directions.left) >= Math.SQRT2 / 2) {
                b1.sides.right.add(b2);
                b2.sides.left.add(b1);
            } else if (Vector.Dot(info.n, directions.right) >= Math.SQRT2 / 2) {
                b1.sides.left.add(b2);
                b2.sides.right.add(b1);
            } else if (Vector.Dot(info.n, directions.top) >= Math.SQRT2 / 2) {
                b1.sides.bottom.add(b2);
                b2.sides.top.add(b1);
            } else if (Vector.Dot(info.n, directions.bottom) >= Math.SQRT2 / 2) {
                b1.sides.top.add(b2);
                b2.sides.bottom.add(b1);
            }
            if(e1.mass == Infinity && e2.mass == Infinity) return;
            let massProp;
            if(e1.mass < e2.mass){
                massProp = (e1.mass / e2.mass) * 100;
                if(b1.uniqueName == "box"){
                    if(b2.uniqueName == "small" || b2.uniqueName == "tall"){
                        e2.Translate(n.Scale(-d));   
                    }else{
                        e1.Translate(n.Scale((d - (d * (massProp / 100)))));
                        e2.Translate(n.Scale(-d * (massProp / 100)));   
                    }
                }else if(b2.uniqueName == "box"){
                    if(b1.uniqueName == "small" || b1.uniqueName == "tall"){
                        e2.Translate(n.Scale(d));   
                    }else{
                        e1.Translate(n.Scale((d - (d * (massProp / 100)))));
                        e2.Translate(n.Scale(-d * (massProp / 100)));  
                    }
                }else{
                    e1.Translate(n.Scale((d - (d * (massProp / 100)))));
                    e2.Translate(n.Scale(-d * (massProp / 100))); 
                }
            }
            if(e1.mass > e2.mass){
                massProp = (e2.mass / e1.mass) * 100;
                if(b1.uniqueName == "box"){
                    if(b2.uniqueName == "small" || b2.uniqueName == "tall"){
                        e2.Translate(n.Scale(-d));
                    }else{
                        e2.Translate(n.Scale(-(d - (d * (massProp / 100)))));
                        e1.Translate(n.Scale(d * (massProp / 100))); 
                    }
                }else if(b2.uniqueName == "box"){
                    if(b1.uniqueName == "small" || b1.uniqueName == "tall"){
                        e1.Translate(n.Scale(d));
                    }else{
                        e2.Translate(n.Scale(-(d - (d * (massProp / 100)))));
                        e1.Translate(n.Scale(d * (massProp / 100)));
                    }
                }else{
                    e2.Translate(n.Scale(-(d - (d * (massProp / 100)))));
                    e1.Translate(n.Scale(d * (massProp / 100)));
                }
            }
            if(e1.mass == e2.mass){
                e2.Translate(n.Scale(-d/2));
                e1.Translate(n.Scale(d/2));
            }
            let rA = p.Sub(e1.center);
            let rB = p.Sub(e2.center);
            let wa = e1.angularVelocity;
            let wb = e2.angularVelocity;
            let va = e1.velocity;
            let vb = e2.velocity;
            let e = Math.min(e1.bounce, e2.bounce);
            let vap = va.Add(new Vector(-wa * rA.y, wa * rA.x));
            let vbp = vb.Add(new Vector(-wb * rB.y, wb * rB.x));
            let relVel = vap.Sub(vbp);
            if(Vector.Dot(relVel, n) > 0) return false;
            let j = (-(1 + e) * Vector.Dot(relVel, n)) / (e1.inverseMass + e2.inverseMass + (Vector.Cross(rA, n) ** 2) / e1.inertia + (Vector.Cross(rB, n) ** 2) / e2.inertia);
            let jn = n.Scale(j);
            e1.angularVelocity += Vector.Cross(rA, jn.Scale(1 / e1.inertia));
            e2.angularVelocity -= Vector.Cross(rB, jn.Scale(1 / e2.inertia));
            let tangent = n.Scale(-1).Perp();
            let friction = Math.min(e1.friction, e2.friction);
            let j2 = (-(1 + e) * Vector.Dot(relVel, tangent) * friction) / (e1.inverseMass + e2.inverseMass + (Vector.Cross(rA, tangent) ** 2) / e1.inertia + (Vector.Cross(rB, tangent) ** 2) / e2.inertia);
            let jt = tangent.Scale(j2);
            e1.angularVelocity += Vector.Cross(rA, jt.Scale(1 / e1.inertia));
            e2.angularVelocity -= Vector.Cross(rB, jt.Scale(1 / e2.inertia));
            if(b1.uniqueName == "box"){
                if(b2.uniqueName == "small" || b2.uniqueName == "tall"){
                    e2.velocity = e2.velocity.Sub(jt.Scale(e2.inverseMass));
                    e2.velocity = e2.velocity.Sub(jn.Scale(e2.inverseMass));
                }else{
                    e1.velocity = e1.velocity.Add(jt.Scale(e1.inverseMass));
                    e1.velocity = e1.velocity.Add(jn.Scale(e1.inverseMass));
                    e2.velocity = e2.velocity.Sub(jt.Scale(e2.inverseMass));
                    e2.velocity = e2.velocity.Sub(jn.Scale(e2.inverseMass));
                }
            }else if(b2.uniqueName == "box"){
                if(b1.uniqueName == "small" || b1.uniqueName == "tall"){
                    e1.velocity = e1.velocity.Add(jt.Scale(e1.inverseMass));
                    e1.velocity = e1.velocity.Add(jn.Scale(e1.inverseMass));
                }else{
                    e1.velocity = e1.velocity.Add(jt.Scale(e1.inverseMass));
                    e1.velocity = e1.velocity.Add(jn.Scale(e1.inverseMass));
                    e2.velocity = e2.velocity.Sub(jt.Scale(e2.inverseMass));
                    e2.velocity = e2.velocity.Sub(jn.Scale(e2.inverseMass));
                }
            }else{
                e1.velocity = e1.velocity.Add(jt.Scale(e1.inverseMass));
                e1.velocity = e1.velocity.Add(jn.Scale(e1.inverseMass));
                e2.velocity = e2.velocity.Sub(jt.Scale(e2.inverseMass));
                e2.velocity = e2.velocity.Sub(jn.Scale(e2.inverseMass));
            }
            return true;
        }
    }

    class Scene {
        constructor(options){
            this.entities = [];
            this.Camera = new Camera(options.camera_options);
            this.CENTER = new Vector(this.Camera.worldWidth/2, this.Camera.worldHeight/2);
            this._Paused = false;
            this.Qt = new QuadTree(new AABB(this.Camera.worldWidth/2, this.Camera.worldHeight/2, this.Camera.worldWidth, this.Camera.worldHeight), 5);
            this.boundry = options.boundry || false;
            this.rc = options.relaxationCount || 1;
            this._drawQt = false;
            this.active = false;
            if(this.boundry){
                let boundries = [
                    new Rectangle(new Vector(this.Camera.worldWidth/2, 10), this.Camera.worldWidth, 20),
                    new Rectangle(new Vector(this.Camera.worldWidth/2, this.Camera.worldHeight/1.3 - 10), this.Camera.worldWidth, 20),
                    new Rectangle(new Vector(10, (this.Camera.worldHeight/1.3 - 10)/2), 20, this.Camera.worldHeight/1.3 - 10),
                    new Rectangle(new Vector(this.Camera.worldWidth - 10, (this.Camera.worldHeight/1.3 - 10)/2), 20, this.Camera.worldHeight/1.3 - 10),
                ];
                boundries.forEach(boundry=>{
                    boundry.mass = Infinity;
                    boundry.inertia = Infinity;
                    let sprite = new Paint({
                        center : boundry.center,
                        width : boundry.width,
                        height : boundry.height,
                        color : "rgb(30, 30, 30)",
                        stroke : false,
                        strokeStyle : "Red"
                    });
                    this.entities.push(new Entity({
                        center : boundry.center,
                        body : boundry,
                        name : "&&&boundry",
                        sprite : sprite
                    }));
                });
            }
        }

        Contains(name){
            let contain = false;
            for(let i = 0; i < this.entities.length; i++){
                if(this.entities[i].uniqueName == name){
                    contain = true;
                }
            }
            return contain;
        }

        GenerateBoundry(){
            this.Qt = new QuadTree(new AABB(this.Camera.worldWidth/2, this.Camera.worldHeight/2, this.Camera.worldWidth, this.Camera.worldHeight), 5);
            if(this.boundry){
                let boundries = [
                    new Rectangle(new Vector(this.Camera.worldWidth/2, 10), this.Camera.worldWidth, 20),
                    new Rectangle(new Vector(this.Camera.worldWidth/2, this.Camera.worldHeight/1.3 - 10), this.Camera.worldWidth, 20),
                    new Rectangle(new Vector(10, (this.Camera.worldHeight/1.3 - 10)/2), 20, this.Camera.worldHeight/1.3 - 10),
                    new Rectangle(new Vector(this.Camera.worldWidth - 10, (this.Camera.worldHeight/1.3 - 10)/2), 20, this.Camera.worldHeight/1.3 - 10),
                ];
                boundries.forEach(boundry=>{
                    boundry.mass = Infinity;
                    boundry.inertia = Infinity;
                    let sprite = new Paint({
                        center : boundry.center,
                        width : boundry.width,
                        height : boundry.height,
                        color : "rgb(30, 30, 30)",
                        stroke : false,
                        strokeStyle : "Red"
                    });
                    this.entities.push(new Entity({
                        center : boundry.center,
                        body : boundry,
                        name : "&&&boundry",
                        sprite : sprite
                    }));
                });
            }
        }

        AddEntity(ent){
            ent.AddCollision("r-&&&boundry");
            if(ent.uniqueName != undefined && ent.uniqueName != ""){
                this.entities.push(ent);
            }else{
                console.error("Error adding entity to scene");
            }
        }

        _Update(dt){
            this.CENTER = new Vector(this.Camera.worldWidth/2, this.Camera.worldHeight/2);
            this.Qt.clear();
            this.entities.forEach(ent=>{
                // ent._Update(dt);
                this.Qt.insert(new AABB(ent.center.x, ent.center.y, ent.width, ent.height, ent));
            });
            for(let i = 0; i < this.rc; i++){
                for(let i = 0; i < this.entities.length; i++){
                    let ent = this.entities[i];
                    ent._Update(dt);
                    let nearObjects = ent.Neighbours(this.Qt);
                    if(nearObjects){
                        nearObjects.forEach(near=>{
                            ent.CollidingGroups.forEach(group=>{
                                let data = Entity._GetData(group);
                                let type = data.type;
                                let name = data.name;
                                if(near.userData.uniqueName == name){
                                    if(type == "d"){
                                        if(type + "-" + near.userData.uniqueName == group){
                                            let collision = Detect(ent, near.userData);
                                            if(collision[0].collide){
                                                if(ent._cbs[group]){
                                                    ent._cbs[group](near.userData);
                                                }
                                            }
                                        }
                                    }
                                    if(type == "r"){
                                        if(type + "-" + near.userData.uniqueName == group){
                                            let collision = Detect(ent, near.userData);
                                            collision.forEach(col=>{
                                                if(Resolve(ent, near.userData, col)){
                                                    if(ent._cbs[group]){
                                                        ent._cbs[group](near.userData);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        });
                    }
                }
            }

            this.Camera.Follow(this.Camera.target);
            this.Camera.Update();
        }

        _Draw(c, _func){
            this.Camera.Draw(()=>{
                this.entities.forEach(ent=>{
                    ent._Draw(c);
                });
                if(this._drawQt){
                    this.Qt.draw(c);
                }
                _func(c);
            });
        }

        Play(c, dt, func){
            this._Draw(c, func);
            if(!this._Paused){
                this._Update(dt);
            }
        }

        Pause(){
            this._Paused = true;
        }

        Resume(){
            this._Paused = false;
        }
    }

    class LevelMaker{
        constructor(can, div, cam){
            this.level = { plats : [], platforms : [] };
            this.start = new Vector(0, 0);
            this.end = new Vector(0, 0);
            this.c = can.getContext("2d");
            this.can = can;
            this.div = div;
            cam.LookAt(new Vector(cam.worldWidth/2, cam.worldHeight/2));
            this.cam = cam;
            this.lineStarted = false;
        }

        startP(){
            let can = this.can;
            let div = this.div;
            can.addEventListener("pointerdown", (e)=>{
                if(this.lineStarted == false){
                    let x = e.clientX;
                    let y = e.clientY;
                    x = (x - div.getBoundingClientRect().x);
                    y = (y - div.getBoundingClientRect().y);
                    x = (x * can.width )/ div.getBoundingClientRect().width;
                    y = (y * can.height)/ div.getBoundingClientRect().height;
                    this.start.x = (-this.cam.pos.x + x);
                    this.start.y = (-this.cam.pos.y + y);
                    this.end.x = (-this.cam.pos.x + x );
                    this.end.y = (-this.cam.pos.y + y);
                    this.lineStarted = true;
                }
            });

            can.addEventListener("pointermove", (e)=>{
                if(this.lineStarted){
                    let x = e.clientX;
                    let y = e.clientY;
                    x = (x - div.getBoundingClientRect().x);
                    y = (y - div.getBoundingClientRect().y);
                    x = (x * can.width )/ div.getBoundingClientRect().width;
                    y = (y * can.height)/ div.getBoundingClientRect().height;
                    this.end.x = (-this.cam.pos.x + x);
                    this.end.y = (-this.cam.pos.y + y);
                }
            });

            can.addEventListener("pointerup", (e)=>{
                if(this.lineStarted){
                    let x = e.clientX;
                    let y = e.clientY;
                    x = (x - div.getBoundingClientRect().x);
                    y = (y - div.getBoundingClientRect().y);
                    x = (x * can.width )/ div.getBoundingClientRect().width;
                    y = (y * can.height)/ div.getBoundingClientRect().height;
                    this.end.x = (-this.cam.pos.x + x);
                    this.end.y = (-this.cam.pos.y + y);
                    let b = new Rectangle(new Vector((this.start.x + this.end.x)/2, (this.start.y + this.end.y)/2), Math.abs(this.end.x - this.start.x), Math.abs(this.end.y - this.start.y));
                    b.mass = Infinity;
                    b.inertia = Infinity;
                    this.level.platforms.push([(this.start.x + this.end.x)/2, (this.start.y + this.end.y)/2, Math.abs(this.end.x - this.start.x), Math.abs(this.end.y - this.start.y)]);
                    this.level.plats.push(b);
                    this.lineStarted = false;
                }
            });

            window.addEventListener("keydown", (e)=>{
                let key = e.key;
                if(key == "a") this.cam.target.center.x -= 10;
                if(key == "d") this.cam.target.center.x += 10;
                if(key == "w") this.cam.target.center.y -= 10;
                if(key == "s") this.cam.target.center.y += 10;

            }); 

        }

        static drawRect(x, y, w, h, c){
            c.save();
            c.fillStyle = "rgba(100, 200, 200, 0.4)";
            c.fillRect(x - w/2, y - h/2, w, h);
            c.restore();
        }

        back(){
            this.level.plats.splice(this.level.plats.length - 1, 1);
            this.level.platforms.splice(this.level.platforms.length - 1, 1);
        }

        export(){
            let textField = document.createElement("input");
            textField.style.width = "200px";
            textField.style.height = "200px";
            document.body.appendChild(textField);
            for(let i = 0; i < this.level.platforms.length; i++){
                for(let j = 0; j < this.level.platforms[i].length; j++){
                    textField.value += Math.round(this.level.platforms[i][j]) + ",";
                }
            }
        }

        show(){
            let c = this.c;
            c.save();
            c.strokeStyle = "rgba(150, 200, 100, 1)";
            c.beginPath();
            c.moveTo(this.start.x, this.start.y);
            c.lineTo(this.end.x, this.end.y);
            c.closePath();
            if(this.start.Length() != 0 && this.end.Length() != 0 && this.lineStarted){
                c.stroke();
            }
            c.restore();
            this.level.plats.forEach(plat=>{
                plat.Draw(c);
            });
            LevelMaker.drawRect((this.start.x + this.end.x)/2, (this.start.y + this.end.y)/2, Math.abs(this.end.x - this.start.x), Math.abs(this.end.y - this.start.y), c);
        }
    }

    class LevelParser{
        constructor(levelData){
            this.levelData = levelData;
        }

    static random(min, max){
        return Math.random() * (max - min) + min;
    }

    getPortal(portal, name = "portal"){
        let p;
        for(let i = 0; i < portal.length; i++){
            let pB  = new Rectangle(new Vector(portal[0], portal[1]), portal[2], portal[3]);
            pB.mass = Infinity;
            pB.inertia = Infinity;
            p = new Entity({
                name : name,
                body : pB,
                //sprite : new Custom((c)=>{})
            });
            p.width = pB.width;
            p.height = pB.height;
        }
        return p;
    }

    getKeys(keys, img){
        let keyEnts = [];
        for(let i = 0; i <= keys.length-4; i += 4){
            let pB = new Rectangle(new Vector(keys[i], keys[i + 1]), keys[i + 2], keys[i + 3]);
            pB.mass = Infinity;
            pB.inertia = Infinity;
            let sprite = new Texture({
                center : pB.center,
                width : pB.width,
                height : pB.height,
                image : img
            });
            let e = new Entity({
                name : `key-${Math.round(LevelParser.random(0, 1000000))}`,
                body : pB,
                sprite : sprite,
            });
            e.width = pB.width;
            e.height = pB.height;
            keyEnts.push(e);
        }
        return keyEnts;
    }

    getDoors(doors, img){
        let doorEnts = [];
        for(let i = 0; i <= doors.length-4; i += 4){
            let pB = new Rectangle(new Vector(doors[i], doors[i + 1]), doors[i + 2], doors[i + 3]);
            pB.mass = Infinity;
            pB.inertia = Infinity;
            let sprite = new Texture({
                center : pB.center,
                width : pB.width,
                height : pB.height,
                image : img
            });
            let e = new Entity({
                name : `door-${Math.round(LevelParser.random(0, 1000000))}`,
                body : pB,
                sprite : sprite,
            });
            e.width = pB.width;
            e.height = pB.height;
            doorEnts.push(e);
        }
        return doorEnts;
    }

    getBoxes(portal, img){
        let p = [];
        for(let i = 0; i <= portal.length-4; i += 4){
            let pB  = new Rectangle(new Vector(portal[0], portal[1]), portal[2], portal[3]);
            pB.friction = 0.8;
            pB.acceleration.y = 800;
            pB.mass = 1;
            pB.inertia = Infinity;
            let tex = new Texture({
                image : img,
                width : pB.width, 
                height : pB.height,
                center : pB.center
            });
            let e = new Entity({
                name : "box",
                center : pB.center,
                body : pB,
                sprite : tex
            });
            e.width = pB.width;
            e.height = pB.height;
            p.push(e);
        }
        return p;
    }

    getEntities(levelCover){
            let entitites = [];
            for(let i = 0; i <= this.levelData.length - 4; i += 4){
                let b = new Rectangle(new Vector(this.levelData[i], this.levelData[i + 1]), this.levelData[i + 2], this.levelData[i + 3]);
                b.mass = Infinity;
                b.inertia = Infinity;
                let sprite = new Paint({
                    center : b.center,
                    width : b.width,
                    height : b.height,
                    color : "rgb(30, 30, 30)"
                });
                let e = new Entity({
                    name : `plat-${LevelParser.random(0, 1000000)}`,
                    body : b,
                    sprite : sprite
                });
                entitites.push(e);
            }
            for(let i = 0; i <= levelCover.length - 4; i += 4){
                let b = new Rectangle(new Vector(levelCover[i], levelCover[i + 1]), levelCover[i + 2], levelCover[i + 3]);
                b.mass = Infinity;
                b.inertia = Infinity;
                let sprite = new Paint({
                    center : b.center,
                    width : b.width,
                    height : b.height,
                    color : "rgb(30, 30, 30)",
                    strokeStyle : "Red"
                });
                let e = new Entity({
                    name : `plat-${LevelParser.random(0, 1000000)}`,
                    body : b,
                    sprite : sprite
                });
                entitites.push(e);
            }
            return entitites;
    }

    }

    class Game {
        constructor(options){
            options = options || {};
            this.Screen = new Screen(options.width, options.height);
            options.Mainscene.camera_options.c = this.Screen.Main.getContext("2d");
            this.Scenes = {
                "Main" : new Scene(options.Mainscene)  
            };
            this.CurrentScene = "Main";
            this.Scene = this.Scenes[this.CurrentScene];
            this.Update = () => {};
            this.Draw = () => {};
            this.DrawLayers = () => {};
            this.DrawTopLayers = () => {};
            this._Paused = false;
            this.Layers = {
                "Top" : this.Screen
            }
            this._t0 = performance.now();
            this._t1 = 0;
            this._Dt = 0;
            this._Init();
            this._ScreenNames = [];
            this.sceneTrans = false;
            this.sceneTransName = function(){}
            this._tt = 0;
            this._ScreenNames.push("Top");
        }

        AddScene(name, scene){
            this.Scenes[name] = scene;
        }

        SceneTrans(name){
            this.sceneTrans = true;
            this.sceneTransName = name;
            this._tt = 0;
        }

        _Loop = () => {
            this._t1 = performance.now();
            this._Dt = this._t1 - this._t0;
            if(this._Dt > 18) this._Dt = 18;
            this._Dt /= 1000;
            this.Start();
            if(!this._Paused){
                this.Scene = this.Scenes[this.CurrentScene];
                for(let i = 0; i < this._ScreenNames.length; i++){
                    this.Layers[this._ScreenNames[i]]._Resize();
                }
                DrawUtil.Clear(this.Screen.Main.getContext("2d"));
                this.Scenes[this.CurrentScene].Camera.Draw(()=>{
                    this.Draw(this.Screen.Main.getContext("2d"));
                });
                this.Scenes[this.CurrentScene].Play(this.Screen.Main.getContext("2d"), this._Dt, this.DrawLayers);
                if(this.sceneTrans){
                    let c = this.Screen.Main.getContext("2d");
                    this._tt -= 0.03;
                    if(this._tt <= -Math.PI/2){
                        this.sceneTransName();
                    }
                    if(this._tt <= -Math.PI){
                        this.sceneTrans = false;
                    }
                    c.fillStyle = `rgba(0, 0, 0, ${Math.abs(Math.sin(this._tt))})`;
                    c.fillRect(0, 0, this.Screen.Main.width, this.Screen.Main.height);
                }
                this.DrawTopLayers(this.Screen.Main.getContext("2d"));
                this.Update(this._Dt, this.Scenes[this.CurrentScene]);
                this._t0 = this._t1;
            }
        }
        _CheckLayerExist(name){
            if(this.Layers[name] == undefined){
                console.error("Layer with name : " + name + " not exist.");
                return false;
            }
            return true;
        }
        AddLayer(name){
            if(this.Layers[name] !== undefined){
                console.error("Layer with name : " + name + " Already exist.");
                return;
            }
            this._ScreenNames.push(name);
            let screen = new Screen(this.Screen.width, this.Screen.height);
            this.Layers[name] = screen;
            this.Screen.div.appendChild(screen.Main);
            return screen.Main;
        }
        RemoveLayer(name){
            if(!this._CheckLayerExist(name)) return;
            this.Screen.div.removeChild(this.Layers[name].Main);
        }
        HideLayer(name){
            if(!this._CheckLayerExist(name)) return;
            this.Layers[name].Main.style.display = "none";
        }
        ShowLayer(name){
            if(!this._CheckLayerExist(name)) return;
            this.Layers[name].Main.style.display = "block";
        }
        _Init(){
            document.body.style.background = "lightgray";
            this.Screen.Main.style.border = "2px solid black";
        }
        Start(){
            this._Raf = requestAnimationFrame(this._Loop);
        }
        Pause(){
            this._Paused = true;
        }
        Resume(){
            this._Paused = false;
        }
        Stop(){
            cancelAnimationFrame(this._Raf);
        }
    }

    class DrawUtil {
        constructor(ctx){
            this.ctx = ctx;
        }

        static Clear(c){
            //c.clearRect(0, 0, c.canvas.width, c.canvas.height);
            c.save();
            c.fillStyle = "rgba(10, 20, 30, 1)";
            c.fillRect(0, 0, c.canvas.width, c.canvas.height);
            c.restore();
        }

        Line(start, end, params){
            this.ctx.save();
            params = params || { stroke : "black" };
            this.ctx.strokeStyle = params.stroke;
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.closePath();
            this.ctx.stroke();
            if(params.fill){
                this.ctx.fillStyle = params.fill;
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        Circle(center, radius, params){
            this.ctx.save();
            params = params || { stroke : "black" };
            this.ctx.strokeStyle = params.stroke;
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            this.ctx.closePath();
            if(params.fill){
                this.ctx.fillStyle = params.fill;
                this.ctx.fill();
            }
            this.ctx.restore();
        }
    }

    class Sprite {
        constructor(position){
            this.center = position;
            this.angle = 0;
        }
    }

    class Custom{
        constructor(draw, rect){
            this.Draw = draw;
        }

    _Draw(c){
        this.Draw(c, this.t, this.t2);
    }

    }

    class Paint extends Sprite{
        constructor(options){
            super(options.center);
            this.color = options.color;
            this.type = "colorFill";
            this.offSet = options.offSet || { x : 0, y : 0 };
            this.width = options.width || 100;
            this.height = options.height || 100;
            this.stroke = options.stroke || true;
            this.strokeStyle = options.strokeStyle;
        }
        _Draw(c){   
            c.save();
            c.fillStyle = this.color || "rgb(50, 200, 100)";
            c.fillRect(this.center.x - this.width/2, this.center.y - this.height/2, this.width, this.height);
            c.lineWidth = 3;
            if(this.strokeStyle != "Red"){
                c.strokeStyle = this.strokeStyle || "white";
                c.strokeRect(this.center.x - this.width/2, this.center.y - this.height/2, this.width, this.height);
            }
            c.restore();
        }
    }

    class Texture extends Sprite {
        constructor(options){
            super(options.center);
            this.image = options.image;
            this.offSet = options.offSet || { x : 0, y : 0 };
            this.width = options.width || 100;
            this.height = options.height || 100;
            this.xWidth = this.image.width;
            this.xHeight = this.image.height;
            this.angle = options.angle || 0;
            this.type = "texture";
        }

        _Draw(c){
            if(this.image){
                c.save();
                c.translate(this.center.x, this.center.y);
                c.rotate(this.angle);
                c.drawImage(this.image, 0, 0, this.xWidth, this.xHeight, this.offSet.x - this.width/2, this.offSet.y - this.height/2, this.width, this.height);
                c.restore();
            }
        }

    }

    class Body{
        constructor(center){
            this.center = center;
            this.mass = 1;
            this.inertia = 5000;
            this.vertices = [];
            this.velocity = new Vector(0, 0);
            this.acceleration = new Vector(0, 0);
            this.angularVelocity = 0;
            this.angularAcceleration = 0;
            this.angle = 0;
            this.bounce = 1;
            this.friction = 0.1;
        }

        get inverseMass(){
            if(this.mass == 0) return 0;
            else return (1 / this.mass);
        }

        _MomentIntegration(dt){
            this.velocity = this.velocity.AddScaled(this.acceleration, dt);
            this.center = this.center.AddScaled(this.velocity, dt);
            for(let i = 0; i < this.vertices.length; i++){
                this.vertices[i] = this.vertices[i].AddScaled(this.velocity, dt);
            }
            this.angularVelocity += this.angularAcceleration * dt;
            this.Rotate(this.angularVelocity * dt);
        }

        Rotate(angle, center = this.center){
            this.angle += angle;
            this.center = this.center.Rotate(angle, center);
            for(let i = 0; i < this.vertices.length; i++){
                this.vertices[i] = this.vertices[i].Rotate(angle, center);
            }
        }

        Translate(vector){
            this.center = this.center.Add(vector);
            for(let i = 0; i < this.vertices.length; i++){
                this.vertices[i] = this.vertices[i].Add(vector);
            }
        }
        _GetFaceNormals(){
            let fn = [];
            for(let i = 0; i < this.vertices.length; i++){
                fn[i] = this.vertices[(i + 1) % this.vertices.length].Sub(this.vertices[i]).Perp().Unit()
            }
            return fn;
        }

        _FindSupportPoint(n, ptOnEdge){
            let max = -Infinity;
            let index =  false;
            for(let i = 0; i < this.vertices.length; i++){
                let v = this.vertices[i].Sub(ptOnEdge);
                let proj = Vector.Dot(n, v);
                if(proj > 0 && proj > max){
                    max = proj;
                    index = i;
                }
            }
            return { sp : this.vertices[index], depth : max, n : n };
        }

        Draw(c){
            c.save();
            c.strokeStyle = "white";
            c.lineWidth = 2;
            c.beginPath();
            for(let i = 0; i < this.vertices.length; i++){
                c.moveTo(this.vertices[i].x, this.vertices[i].y);
                c.lineTo(this.vertices[(i + 1) % this.vertices.length].x, this.vertices[(i + 1) % this.vertices.length].y);
            }
            c.closePath();
            c.stroke();
            c.restore();
        }
    }

    class Rectangle extends Body{
        constructor(center, width, height){
            super(center);
            this.width = width;
            this.height = height;
            this.vertices = [
                new Vector(this.center.x - this.width/2, this.center.y - this.height/2),
                new Vector(this.center.x + this.width/2, this.center.y - this.height/2),
                new Vector(this.center.x + this.width/2, this.center.y + this.height/2),
                new Vector(this.center.x - this.width/2, this.center.y + this.height/2),
            ];
            this.boundingRect = {
                width : Math.sqrt(width * width + height * height),
                height : Math.sqrt(width * width + height * height)
            };
            this.type = "polygon";
        }
    }

    class Circle extends Body {
        constructor(center, radius){
            super(center);
            this.radius = radius;
            this.boundingRect = {
                width : 2.3 * this.radius,
                height : 2.3 * this.radius
            }
            this.type = "circle";   
        }

        _FindSupportPoint(n, ep){
            let circVerts = [];
            circVerts[0] = this.center.Add(n.Scale(this.radius));
            circVerts[1] = this.center.Add(n.Scale(-this.radius));
            let max = -Infinity;
            let index = null;
            for(let i = 0; i < circVerts.length; i++){
                let v = circVerts[i].Sub(ep);
                let proj = Vector.Dot(v, n);
                if(proj > 0 && proj > max){
                    max = proj;
                    index = i;
                }
            }   
            return { sp : circVerts[index], depth : max, n : n };
        }
    
        _FindNearestVertex(verts){
            let max = Infinity;
            let index = null;
            for(let i = 0; i < verts.length; i++){
                let v = verts[i].Sub(this.center);
                let dist = v.LengthSquared();
                if(dist < max){
                    max = dist;
                    index = i;
                }
            }
            return verts[index];
        }

        Draw(c){
            c.save();
            c.strokeStyle = "white";
            c.lineWidth = 2;
            c.beginPath();
            c.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
            c.closePath();
            c.stroke();
            c.beginPath();
            c.moveTo(this.center.x, this.center.y);
            c.lineTo(this.center.x + Math.cos(this.angle) * this.radius, this.center.y + this.radius * Math.sin(this.angle));
            c.closePath();
            c.stroke();
            c.restore();
        }
    }

    class Polygon extends Body{
        constructor(center, n, size){
            super(center);
            this.n = n;
            this.size = size;
            this.vertices = [];
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            this.type = "polygon";
            for(let i = 0; i < n; i++){
                this.vertices.push(new Vector(this.center.x + this.size * Math.cos(i * ((2 * Math.PI) / n)), this.center.y + this.size * Math.sin(i * ((2 * Math.PI) / n))));
                if(this.vertices[i].x < minX) minX = this.vertices[i].x;
                if(this.vertices[i].y < minY) minY = this.vertices[i].y;
                if(this.vertices[i].x > maxX) maxX = this.vertices[i].x;
                if(this.vertices[i].y > maxY) maxY = this.vertices[i].y;
            }
            this.boundingRect = {
                width : 2 * this.size,
                height : 2 * this.size
            }
        }
    }

    class Composite extends Body{
        constructor(objects){
            let verts = [];
            let mass = 0;
            let max = -Infinity;
            for(let i = 0; i < objects.length; i++){
                mass += objects[i].mass;
                for(let j = 0; j < objects[i].mass; j++){
                    verts.push(objects[i].center);
                }
            }
            let pos = Vector.Average(verts);
            super(pos);
            for(let i = 0; i < objects.length; i++){
                for(let j = 0; j < objects[i].vertices.length; j++){
                    let v = objects[i].vertices[j].Sub(this.center);
                    let mag = v.LengthSquared();
                    if(mag > max){
                        max = mag;
                    }
                }
            }
            this.boundingRect = {
                width : 2 * Math.sqrt(max),
                height : 2 * Math.sqrt(max)
            }
            this.objects = objects;
            this.type = "composite";
            this.mass = mass;
        }

        _MomentIntegration(dt){
            this.velocity = this.velocity.AddScaled(this.acceleration, dt);
            for(let i = 0; i < this.objects.length; i++){
                this.objects[i]._MomentIntegration(dt);
                let obj = this.objects[i];
                obj.center = obj.center.AddScaled(this.velocity, dt);
                for(let i = 0; i < obj.vertices.length; i++){
                    obj.vertices[i] = obj.vertices[i].AddScaled(this.velocity, dt);
                }
            }
            this._UpdatePos();
            this.angularVelocity += this.angularAcceleration * dt;
            for(let i = 0; i < this.objects.length; i++){
                let obj = this.objects[i];
                obj.Rotate(this.angularVelocity * dt, this.center);
            }
        }

        _UpdatePos(){
            let verts = [];
            for(let i = 0; i < this.objects.length; i++){
                for(let j = 0; j < this.objects[i].mass; j++){
                    verts.push(this.objects[i].center);
                }
            }
            this.center = Vector.Average(verts);
        }

        Translate(vec){
            for(let i = 0; i < this.objects.length; i++){
                this.objects[i].Translate(vec);
            }
            this._UpdatePos();
        }

        Rotate(angle){    
            for(let i = 0; i < this.objects.length; i++){
                let obj = this.objects[i];
                obj.Rotate(angle, this.center);
            }
        }

        Draw(c){
            c.save();
            for(let i = 0; i < this.objects.length; i++){
                this.objects[i].Draw(c);
            }
            c.fillStyle = "red";
            c.beginPath();
            c.arc(this.center.x, this.center.y, 5, 0, 2 * Math.PI);
            c.closePath();
            c.fill();
            c.restore();
        }   
    }

    class Controller{
        constructor(ent, speed, jumpVelocity){
            this.ent = ent;
            this.speed = speed || 100;
            this.jumpVelocity = jumpVelocity || this.speed;
            window.addEventListener("keydown", (e)=>{
                if(ent.sides.bottom.size > 0){
                    let key = e.key;
                    if(key == "a") ent.body.velocity.x = -this.speed;
                    if(key == "d") ent.body.velocity.x = this.speed;
                    if(key == "w") ent.body.velocity.y = -this.jumpVelocity;
                }
            }); 
            window.addEventListener("keyup", (e)=>{
                let key = e.key;
                if(key == "a") ent.body.velocity.x = 0;
                if(key == "d") ent.body.velocity.x = 0;
            });
        }
    }

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof stroke === 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.stroke();
        }

}

    class _JS_State{
        constructor(){
            this.on = false;
            this.id = null;
        }
    }
    class Joystick{
        constructor(options = {}){
            this.innerRadius = 25;
            this.outerRadius = 55;
            this.state = new _JS_State();
            this.outerCenter  = options.center || {
                x : undefined,
                y : undefined
            }
            this.innerCenter = {};
            this.innerCenter.x = options.center.x;
            this.innerCenter.y = options.center.y;
            this.__type = undefined;
            this.mainDiv = undefined;
            this.innerDiv = undefined;
            this.ctx = undefined;
            this.mainDiv = document.createElement("div");
            this.mainDiv.style.borderRadius = "50%";
            this.innerDiv = document.createElement("div");
            this.innerDiv.style.borderRadius = "50%";
            this.mainDiv.style.position = "absolute";
            this.innerDiv.style.position = "absolute";
            this.mainDiv.style.width = 2 * this.outerRadius + "px";
            this.innerDiv.style.width = 2 * this.innerRadius + "px";
            this.mainDiv.style.height = 2 * this.outerRadius + "px";
            this.innerDiv.style.height = 2 * this.innerRadius + "px";
            this.mainDiv.style.backgroundColor = "black";
            this.innerDiv.style.backgroundColor = "red";
            document.body.appendChild(this.mainDiv);
            document.body.appendChild(this.innerDiv);
            this.mainDiv.style.zIndex = -1;
            this.innerDiv.style.zIndex = -1;
            this.mainDiv.style.left = options.center.x - this.mainDiv.getBoundingClientRect().width/2 + "px";
            this.mainDiv.style.top = options.center.y - this.mainDiv.getBoundingClientRect().width/2 + "px";
            this.innerDiv.style.left = options.center.x - this.innerDiv.getBoundingClientRect().width/2 + "px";
            this.innerDiv.style.top = options.center.y - this.innerDiv.getBoundingClientRect().width/2 + "px";
        }

        Mag(){
            return Math.sqrt((this.innerCenter.x - this.outerCenter.x) * (this.innerCenter.x - this.outerCenter.x) + (this.innerCenter.y - this.outerCenter.y) * (this.innerCenter.y - this.outerCenter.y));
        }
    
        getDirX(){
            if(this.Mag() == 0) return 0;
            return (this.innerCenter.x - this.outerCenter.x) / this.Mag();
        }
    
        getDirY(){
            if(this.Mag() == 0) return 0;
            return (this.innerCenter.y - this.outerCenter.y) / this.Mag();
        }
    
        getAngle(){
            return Math.atan2(this.getDirY(), this.getDirX());
        }
    
        show(){
            if(this._type == "canvas"){
                let c  = this.ctx;
                c.save();
                if(!this.state.on) c.fillStyle = "rgba(100, 100, 100, 0.7)"; 
                else c.fillStyle = "rgba(100, 100, 100, 0.2)"; 
                c.beginPath();
                c.arc(this.outerCenter.x, this.outerCenter.y, this.outerRadius, 0, 2 * Math.PI);
                c.closePath();
                c.fill();
                c.fillStyle = "rgba(70, 12, 130, 0.3)";
                c.beginPath();
                c.arc(this.innerCenter.x, this.innerCenter.y, this.innerRadius, 0, 2 * Math.PI);
                c.closePath();
                c.fill();
                c.restore();
            }
        }
    
        dist(x, y){
            return Math.sqrt((x - this.outerCenter.x) * (x - this.outerCenter.x) + (y - this.outerCenter.y) * (y - this.outerCenter.y));
        }
    
        static distan(a, b, c, d){
            return Math.sqrt( (c - a) * (c - a) + (d - b) * (d - b));
        }
    
        follow(x, y){
            this.innerCenter.x = x;
            this.innerCenter.y = y;
        }
    
        static Activate(canvas, joysticks, can, div){
            joysticks.forEach(js=>{
                if(canvas["getContext"]){
                    js._type = "canvas";
                    js.innerDiv.style.display = "none";
                    js.mainDiv.style.display = "none";
                    js.ctx = canvas.getContext("2d");
                }else js._type = "html";
            });
            canvas.addEventListener("pointerdown", (e)=>{
                let x = e.clientX;
                let y = e.clientY;
                x = (x - div.getBoundingClientRect().x);
                y = (y - div.getBoundingClientRect().y);
                x = (x * can.width )/ div.getBoundingClientRect().width;
                y = (y * can.height)/ div.getBoundingClientRect().height;
                joysticks.forEach(js=>{
                    if(js.dist(x, y) < js.outerRadius){
                        js.state.on = true;
                        js.state.id = e.pointerId;
                        js.innerCenter.x = x;
                        js.innerCenter.y = y;
                        if(js._type == "html"){
                            js.mainDiv.style.left = js.outerCenter.x - js.mainDiv.getBoundingClientRect().width/2 + "px";
                            js.mainDiv.style.top = js.outerCenter.y - js.mainDiv.getBoundingClientRect().width/2 + "px";
                            js.innerDiv.style.left = js.innerCenter.x - js.innerDiv.getBoundingClientRect().width/2 + "px";
                            js.innerDiv.style.top = js.innerCenter.y - js.innerDiv.getBoundingClientRect().width/2 + "px";
                        }
                    }
                });
            });
            
            canvas.addEventListener("pointermove", (e)=>{
                let x = e.clientX;
                let y = e.clientY;
                x = (x - div.getBoundingClientRect().x);
                y = (y - div.getBoundingClientRect().y);
                x = (x * can.width )/ div.getBoundingClientRect().width;
                y = (y * can.height)/ div.getBoundingClientRect().height;
                joysticks.forEach(js=>{
                    if(e.pointerId == js.state.id){
                        js.innerCenter.x = x;
                        js.innerCenter.y = y;
                        if(Joystick.distan(js.innerCenter.x, js.innerCenter.y, js.outerCenter.x, js.outerCenter.y) > js.outerRadius){
                            js.innerCenter.x =  js.outerCenter.x + js.outerRadius * Math.cos(js.getAngle());
                            js.innerCenter.y = js.outerCenter.y +  js.outerRadius * Math.sin(js.getAngle());
                        }
                        if(js._type == "html"){
                            js.mainDiv.style.left = js.outerCenter.x - js.mainDiv.getBoundingClientRect().width/2 + "px";
                            js.mainDiv.style.top = js.outerCenter.y - js.mainDiv.getBoundingClientRect().width/2 + "px";
                            js.innerDiv.style.left = js.innerCenter.x - js.innerDiv.getBoundingClientRect().width/2 + "px";
                            js.innerDiv.style.top = js.innerCenter.y - js.innerDiv.getBoundingClientRect().width/2 + "px";
                        }
                    }
                });
            });
            
            canvas.addEventListener("pointerup", (e)=>{
                let x = e.clientX;
                let y = e.clientY;
                x = (x - div.getBoundingClientRect().x);
                y = (y - div.getBoundingClientRect().y);
                x = (x * can.width )/ div.getBoundingClientRect().width;
                y = (y * can.height)/ div.getBoundingClientRect().height;
                joysticks.forEach(js=>{
                    if(e.pointerId == js.state.id){
                        js.innerCenter.x = js.outerCenter.x;
                        js.innerCenter.y = js.outerCenter.y;
                        if(js._type == "html"){
                            js.mainDiv.style.left = js.outerCenter.x - js.mainDiv.getBoundingClientRect().width/2 + "px";
                            js.mainDiv.style.top = js.outerCenter.y - js.mainDiv.getBoundingClientRect().width/2 + "px";
                            js.innerDiv.style.left = js.innerCenter.x - js.innerDiv.getBoundingClientRect().width/2 + "px";
                            js.innerDiv.style.top = js.innerCenter.y - js.innerDiv.getBoundingClientRect().width/2 + "px";
                        }
                        js.state.on = false;
                        js.state.id = null;
                    }
                });
            });
            
            canvas.addEventListener("pointerleave", (e)=>{
                joysticks.forEach(js=>{
                    if(e.pointerId == js.state.id){
                        js.innerCenter.x = js.outerCenter.x;
                        js.innerCenter.y = js.outerCenter.y;
                        js.state.on = false;
                        js.state.id = null;
                    }
                });
            });
            
            canvas.addEventListener("pointercanvascel", (e)=>{
                joysticks.forEach(js=>{
                    if(e.pointerId == js.state.id){
                        js.innerCenter.x = js.outerCenter.x;
                        js.innerCenter.y = js.outerCenter.y;
                        js.state.on = false;
                        js.state.id = null;
                    }
                });
            });
        }
    
    }


    class TextImage{
        constructor(src){
            this.image = new Image();
            this.image.src = src;
        }

        getImage(){
            return this.image;
        }

    }

    class Button{
        constructor(x, y, w, h, text){
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.text = text;
            this.state = new _JS_State();
            this._stuffInit = false;
            this._isImageAva = false;
            this.image = null;
            this.onclick = function(){}
            this.onrelease = function(){}
        }

        setImageSrc(src){
            this.image = new Image();
            this.image.src = src;
            this._isImageAva = true;
        }

        setImage(img){
          this.image = img;
          this._isImageAva = true;  
        }

        show(c, can, div, cam = undefined){
            if(cam == undefined){
                cam = { pos : { x : 0, y : 0 } }
            }
            if(!this._stuffInit){
                c.canvas.addEventListener("pointerdown", (e)=>{
                    if(this.state.on == false){
                        let x = e.clientX;
                        let y = e.clientY;
                        x = (x - div.getBoundingClientRect().x);
                        y = (y - div.getBoundingClientRect().y);
                        x = (x * can.width )/ div.getBoundingClientRect().width;
                        y = (y * can.height)/ div.getBoundingClientRect().height;
                        x -= cam.pos.x;
                        y -= cam.pos.y;
                        if(x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h){
                            this.state.id = e.pointerId;
                            this.state.on = true;
                            this.onclick();
                        }
                    }
                });
                c.canvas.addEventListener("pointerup", (e)=>{
                    if(this.state.id == e.pointerId){
                        let x = e.clientX;
                        let y = e.clientY;
                        x = (x - div.getBoundingClientRect().x);
                        y = (y - div.getBoundingClientRect().y);
                        x = (x * can.width )/ div.getBoundingClientRect().width;
                        y = (y * can.height)/ div.getBoundingClientRect().height;
                        x -= cam.pos.x;
                        y -= cam.pos.y;
                        if(x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h){
                            if(this.state.on){
                                this.onrelease();
                            }
                        }
                        this.state.on = false;
                        this.state.id = null;
                    }
                });
                this._stuffInit = true;
            }
            if(!this._isImageAva){
                c.save();
                roundRect(c, this.x, this.y, this.w, this.h, 20, "rgba(0, 0, 0, 0.5)", );
                if(this.state.on) c.fillStyle = "rgba(50, 200, 250, 1)";
                else c.fillStyle = "white";
                c.font = `${(this.w + this.h)/7}px verdana`;
                c.fillText(this.text, this.x/0.98, this.y + this.h/1.7);
                c.restore();
            }else{
                c.drawImage(this.image, this.x, this.y, this.w, this.h);
            }
        }   
    }

    globalOut.Ui.Button = function(x, y, w, h, text){
        return new Button(x, y, w, h, text);
    }
    globalOut.Ui.Joystick = Joystick;
    globalOut.Ui.Controller = function(ent){
        return new Controller(ent);
    }
    globalOut.Renderer.Texture = function(options){
        return new Texture(options);
    }
    globalOut.Renderer.Custom = function(code){
        return new Custom(code);
    }
    globalOut.Renderer.Paint = function(options){
        return new Paint(options);
    }
    globalOut.Scene = function(options){
        return new Scene(options);
    }
    globalOut.Entity = function(params){
        return new Entity(params);
    }
    globalOut.Physics.Rectangle = function(center, width, height){
        return new Rectangle(center, width, height);
    }
    globalOut.Physics.Polygon = function(center, n, size){
        return new Polygon(center, n, size);
    }
    globalOut.Physics.Circle = function(center, radius){
        return new Circle(center, radius);
    }
    globalOut.Physics.Composite = function(objects){
        return new Composite(objects);
    }
    globalOut.Physics.Vector = function(x, y){
        return new Vector(x, y);
    }
    globalOut.Game = function(width, height){
        return new Game(width, height);
    }
    globalOut.Draw = function(layer){
        return new DrawUtil(layer.Main.getContext("2d"));
    }
    globalOut.Util.Random = function(min, max){
        return Math.random() * (max - min) + min;
    }

    globalOut.Util.TextImage = function(src){
        return new TextImage(src);
    }

    globalOut.Util.LevelMaker = function(canvas, div, cam){
        return new LevelMaker(canvas, div, cam);
    }

    globalOut.Util.LevelParser = function(levelData){
        return new LevelParser(levelData);
    }
    globalOut.Util.RoundRect = roundRect;

    globalOut.System.ParticleSystem = function(options){
        return new ParticleSystem(options);
    }
    globalOut.Vector = function(x, y){
        return new Vector(x, y);
    }

    var _Getter = {
        Init : function(){
            return globalOut;
        },
        Physics : function(){
            return globalOut.Physics;
        }, 
        Renderer : function(){
            return globalOut.Renderer;
        },
        Ui : function(){
            return globalOut.Ui;
        },
        Util : function(){
            return globalOut.Util;
        }
    }

    return _Getter;
}());