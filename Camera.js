class Camera {
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([0, 0, 3]);
        this.at = new Vector3([0, 0, -100]);
        this.up = new Vector3([0, 1, 0]);
        this.speed = 0.2;
 
    }

    forward(move = 0) {
        let f = new Vector3;
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(this.speed + move);
        this.eye.add(f);
        this.at.add(f);
    }
 
    back(move = 0) {
        let f = new Vector3;
        f.set(this.eye);
        f.sub(this.at);
        f.normalize();
        f.mul(this.speed + move);
        this.at.add(f);
        this.eye.add(f);    
    }
 
    left() {
        let f = new Vector3;   
        f.set(this.at);
        f.sub(this.eye);
        let s = Vector3.cross(this.up, f);
        f.normalize();
        f.mul(this.speed);
        this.eye.add(s);
        this.at.add(s);
    }
 
    right() {
        let f = new Vector3;
        f.set(this.eye);
        f.sub(this.at);
        let s = Vector3.cross(this.up, f);
        f.normalize();
        f.mul(this.speed);
        this.eye.add(s);
        this.at.add(s);
    }
 
    panLeft() {
        let f = new Vector3;
        f.set(this.at);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setIdentity();
        rotationMatrix.setRotate(1, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let pear = rotationMatrix.multiplyVector3(f);
        this.at = pear.add(this.eye);
    }
 
    panRight() {
        var f = new Vector3;
        f.set(this.at);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setIdentity();
        rotationMatrix.setRotate(-1, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let pear = rotationMatrix.multiplyVector3(f);
        this.at = pear.add(this.eye);
    }
 }