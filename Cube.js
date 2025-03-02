class Cube {
    constructor() {
        this.type='cube';
        this.color=[1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = 0;
    }

    render() {
        var rgba = this.color;

        // pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //pass matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);


        // Front of Cube
        drawTriangle3DUV([0, 0, 0, 1, 1, 0, 1, 0, 0], [0, 0, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 0, 0, 0, 1, 0, 1, 1, 0], [0, 0, 0, 1, 1, 1]);

        //back of the Cube
        drawTriangle3DUV([0, 0, 1, 1, 1, 1, 1, 0, 1], [0, 0, 1, 1, 1, 0]); 
        drawTriangle3DUV([0, 0, 1, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);

        //shading for sides of cube
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        // Top of cube
        drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);

        //shading for bottom of cube
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        //bottom of Cube
        drawTriangle3DUV([0, 0, 0, 1, 0, 1, 0, 0, 1], [0, 0, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 0, 0, 1, 0, 0, 1, 0, 1], [0, 0, 0, 1, 1, 1]);

        //right side of Cube 
        drawTriangle3DUV([1, 0, 0, 1, 1, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1]); 
        drawTriangle3DUV([1, 0, 0, 1, 0, 1, 1, 1, 1], [0, 0, 1, 0, 1, 1]);

        //left side of Cube
        drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 1, 0], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 0, 1], [1, 0, 0, 1, 0, 0]);
    }

    efficientRender() {

        var rgba = this.color;

        // pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the position of a point to a_Position variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the color of a point to u_FragColor variable
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);


        var vert =[];
        var uv =[];
        var normals = [];
        
        // Front
        vert = vert.concat([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        vert = vert.concat([0, 0, 0, 0, 1, 0, 1, 1, 0]);
        uv = uv.concat([0, 0, 1, 1, 1, 0]);
        uv = uv.concat([0, 0, 0, 1, 1,1]);
        normals = normals.concat([0, 0, -1, 0, 0, -1, 0, 0, -1]);
        normals = normals.concat([0, 0, -1, 0, 0, -1, 0, 0, -1]);

        // Back
        vert = vert.concat([0, 0, 1, 1, 1, 1, 1, 0, 1]);
        vert = vert.concat([0, 0, 1, 0, 1, 1, 1, 1, 1]);
        uv = uv.concat([0, 0, 1, 1, 1, 0]);
        uv = uv.concat([0, 0, 0, 1, 1, 1]);
        normals = normals.concat([0, 0, 1, 0, 0, 1, 0, 0, 1]);
        normals = normals.concat([0, 0, 1, 0, 0, 1, 0, 0, 1]);

        // Top
        gl.uniform4f(u_FragColor, rgba[0] * .9, rgba[1] * .9, rgba[2] * .9, rgba[3]);
        vert = vert.concat([0, 1, 0, 1, 1, 1, 1, 1, 0]);
        vert = vert.concat([0, 1, 0, 0, 1, 1, 1, 1, 1]);
        uv = uv.concat([0, 0, 1, 1, 1, 0]);
        uv = uv.concat([0, 0, 0, 1, 1, 1]);
        normals = normals.concat([0, 1, 0, 0, 1, 0, 0, 1, 0]);
        normals = normals.concat([0, 1, 0, 0, 1, 0, 0, 1, 0]);

        // Bottom
        vert = vert.concat([0, 0, 0, 1, 0, 1, 0, 0, 1]);
        vert = vert.concat([0, 0, 0, 1, 0, 0, 1, 0, 1]);
        uv = uv.concat([0, 0, 1, 1, 1, 0]);
        uv = uv.concat([0, 0, 0, 1, 1, 1]);
        normals = normals.concat([0, -1, 0, 0, -1, 0, 0, -1, 0]);
        normals = normals.concat([0, -1, 0, 0, -1, 0, 0, -1, 0]);

        // Right
        vert = vert.concat([1, 0, 0, 1, 1, 0, 1, 1, 1]);
        vert = vert.concat([1, 0, 0, 1, 0, 1, 1, 1, 1]);
        uv = uv.concat([0, 0, 0, 1, 1, 1]);
        uv = uv.concat([0, 0, 1, 0, 1, 1]);
        normals = normals.concat([1, 0, 0, 1, 0, 0, 1, 0, 0]);
        normals = normals.concat([1, 0, 0, 1, 0, 0, 1, 0, 0]);

        // Left
        vert = vert.concat([0, 0, 0, 0, 1, 1, 0, 1, 0]);
        vert = vert.concat([0, 0, 0, 0, 1, 1, 0, 0, 1]);
        uv = uv.concat([1, 0, 0, 1, 1, 1]);
        uv = uv.concat([1, 0, 0, 1, 0, 0]);
        normals = normals.concat([-1, 0, 0, -1, 0, 0, -1, 0, 0]);
        normals = normals.concat([-1, 0, 0, -1, 0, 0, -1, 0, 0]); 

        // Draw cube
        drawTriangle3DUVNormal(vert, uv, normals); 
    }

}