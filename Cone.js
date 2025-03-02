class Cone {
    constructor() {
      this.type = 'cone'
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
    }
  
    render() {
  
      var rgba = this.color;
  
        // Pass the position of a point to a_Position variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the color of a point to u_FragColor variable
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
        for (var step = 0; step < 360; step += 360/10) {
            let a1 = step;
            let a2 = step + 360/10;
            let v1 = [Math.cos((a1*Math.PI)/180)*0.1, Math.sin((a1*Math.PI)/180)*0.1];
            let v2 = [Math.cos((a2*Math.PI)/180)*0.1, Math.sin((a2*Math.PI)/180)*0.1];
    
            let p1 = [0+v1[0], 0+v1[1]];
            let p2 = [0+v2[0], 0+v2[1]];
            drawTriangle3D([0,0,0,p1[0],p1[1],0.2,p2[0],p2[1],0.2]);
      }
    }
  }