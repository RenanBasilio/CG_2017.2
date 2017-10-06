// Max line size constant
var MAX_POINTS = 50

// This enum differentiates the type of object a specific mesh can be
var objType = Object.freeze({
    SCENE: 0,
    POLYGON: 1,
    PIN: 2
})

/**
 * This class handles a chain of lines and all operations regarding addition, removal
 * or manipulation of the individual vertices in one.
 */
class LineChain{
    /**
     * Initializes a chain with a single point (line from a point to itself).
     * @param {*} startx The X coordinate of the start of the chain on the THREE.js canvas.
     * @param {*} starty The Y coordinate of the start of the chain on the THREE.js canvas.
     */
    constructor(startx, starty){
        // Initialize THREE BufferGeometry
        this.geometry = new THREE.BufferGeometry();
        
        // Initialize vertice array and assign as geometry position attribute.
        this.positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
        this.positions[0] = this.positions[3] = startx;
        this.positions[1] = this.positions[4] = starty;
        this.positions[2] = this.positions[5] = 1.;
        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( this.positions, 3 ) );
        this.geometry.setDrawRange(0, 2)
        
        // Set up basic material
        this.material = new THREE.LineBasicMaterial( { color: 0x060606, linewidth: 2 } );
        
        // Set up line
        this.line = new THREE.Line( this.geometry,  this.material );
    
        this.nextIndex = 3;

        this.isClosed = false;
    }

    /**
     * Sets the next vertice on the line chain to the coordinates provided.
     * If the position matches the first vertice of the chain, sets the chain as closed.
     * @param {*} x The X coordinate on the THREE.js canvas of the vertice to be added.
     * @param {*} y The Y coordinate on the THREE.js canvas of the vertice to be added.
     */
    addVertice(x, y){
        var positions = this.line.geometry.attributes.position.array;
        // If the distance to the first vertice is less than or equal to 2.5 and more than 3 lines have been drawn
        if(computeLength(x, y, positions[0], positions[1]) <= 2.5 && this.nextIndex >= 9)
        {
            // Set point being edited to the starting point of the poligon. 
            positions[this.nextIndex] = positions[0];
            positions[this.nextIndex+1] = positions[1];
            positions[this.nextIndex+2] = positions[2];
            // Set flag to redraw geometry.
            this.line.geometry.attributes.position.needsUpdate = true;
            // Set flag that line chain is closed.
            this.isClosed = true;
        }
        // If the distance to the last vertice is greater than 2.5, add a new vertice.
        else if(computeLength(x, y, positions[this.nextIndex-3], positions[this.nextIndex-2]) > 2.5){
            // Set current vertice and next vertice to the current mouse position.
            positions[this.nextIndex] = positions[this.nextIndex+3] = x;
            positions[this.nextIndex+1] = positions[this.nextIndex+4] = y;
            positions[this.nextIndex+2] = positions[this.nextIndex+5] = 1.;
            // Update the next index.
            this.nextIndex+=3;
            // Increase the number of vertices to draw by one.
            this.line.geometry.setDrawRange(0, this.line.geometry.drawRange.count+1);
            // Set flag to redraw geometry.
            this.line.geometry.attributes.position.needsUpdate = true;
        }
    }

    /**
     * Moves the the last vertice on the chain.
     * @param {*} x The new X coordinate of the vertice on the THREE.js canvas.
     * @param {*} y The new Y coordinate of the vertice on the THREE.js canvas.
     */
    moveLastVertice(x, y){
        var positions = this.line.geometry.attributes.position.array;
        positions[this.nextIndex] = x;
        positions[this.nextIndex+1] = y;
        positions[this.nextIndex+2] = 1.;
        this.line.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Properly disposes of the objects used to build the line object.
     */
    dispose(){
        this.geometry.dispose();
        this.material.dispose();
    }
}

/**
 * Converts a closed LineChain object to a convex mesh.
 * 
 * Throws an error if the line chain is open.
 * @param {LineChain} lineChain The LineChain to convert into a mesh.
 * @return The created mesh.
 */
function lineChainToMesh(lineChain){
    if(!lineChain.isClosed) {throw "Failed to produce Mesh; LineChain is not closed."; }
    // Initialize a new geometry to use for the mesh
    var geometry = new THREE.Geometry();

    // Convert the position array into a vector3 array
    for(var i = 0; i < lineChain.nextIndex/3; i++)
    {
        geometry.vertices.push(new THREE.Vector3(lineChain.positions[3*i], lineChain.positions[(3*i)+1], 0.));
    }
    var holes = [];

    // Triangulate faces from the vector array and add the computed faces to the mesh geometry
    var triangles = THREE.ShapeUtils.triangulateShape(geometry.vertices, holes);
    for( var i = 0; i < triangles.length; i++ ){
        geometry.faces.push( new THREE.Face3( triangles[i][0], triangles[i][1], triangles[i][2] ));
    }

    // Compute normals
    geometry.computeFaceNormals();

    // Create the mesh using the computed geometry
    var mesh = new THREE.Mesh(geometry);
    mesh.userData = { objectType: objType.POLYGON };
    
    // Return the newly created mesh object
    return mesh;
}

/**
 * This method binds two meshes by assigning them as parent and child of a pin object.
 * @param {{x, y}} position The position of the pin.
 * @param {THREE.Mesh} parent The mesh to use as parent for the pin.
 * @param {THREE.Mesh} child The mesh to use as child to the pin.
 * @param {Number} pinRadius The radius of the circle drawn to indicate the pin. Default is 2.
 * @param {Number} pinResolution The resolution (in triangles) of the circle drawn to indicate the pin. Default is 32.
 * @return {Mesh} The pin created to bind the meshes.
 */
function pinToParent(position, parent, child, pinRadius = 2, pinResolution = 32){

    // Create circle mesh with type PIN
    var circleGeometry = new THREE.CircleBufferGeometry(pinRadius, pinResolution);
    var circleMaterial = new THREE.MeshBasicMaterial({color: 0x202020});
    var pinMesh = new THREE.Mesh(circleGeometry, circleMaterial);
    pinMesh.userData = { objectType: objType.PIN };

    // Translate pin to position and update its matrix
    pinMesh.translateX(position.x);
    pinMesh.translateY(position.y);
    pinMesh.updateMatrixWorld();

    // Bind pin to parent
    parent.add(pinMesh);
    // Bind child to pin
    pinMesh.add(child);

    // Get the inverse matrix of the pin's world matrix
    var pinInvMatrix = new THREE.Matrix4();
    pinInvMatrix.getInverse(pinMesh.matrixWorld);

    // Apply the inverse to the child to reset it's coordinate system to the pin
    child.applyMatrix(pinInvMatrix);

    // Return the pin
    return pinMesh;
}

/**
 * This method removes a pin, releasing the meshes bound by it and parenting the child back to the scene.
 * @param {THREE.Mesh} pin The pin to remove.
 * @param {THREE.Scene} scene The scene object to parent the released mesh to.
 */
function removePin(pin, scene){
    var parent = pin.parent;
    var child = pin.children[0];

    //TODO: Apply world matrix to child before removing pin
    //child.matrixWorld.applyToBufferAttribute(child.geometry.vertices);
    child.geometry.vertices.forEach(function(element) {
        element.applyMatrix4(child.matrixWorld);
    }, this);
    child.geometry.verticesNeedUpdate = true;

    parent.remove(pin);
    pin.remove(child);
    scene.add(child);
}

/**
 * This method returns whether a position is inside a given element, using ray tracing techniques.
 * @param {THREE.Mesh} element The element to verify against.
 * @param {THREE.Vector3} position The position to verify.
 * @return {Boolean} True if the position is inside the mesh. False otherwise.
 */
function isInside(element, position){
    // Initialize a variable to count the intersections
    var intersectionCount = 0;

    // For each vertice in the geometry
    for(var i = 0; i < element.geometry.vertices.length; i++){
        // Get the vertice that follows it
        var vert2Index = i+1;
        // If it would be out of range, set it back to the first vertice
        if (vert2Index >= element.geometry.vertices.length){ vert2Index = 0 };
        // Raycast from the point to infinity. If an intersection is found, add one to the counter.
        if( intersects( element.geometry.vertices[i].x, element.geometry.vertices[i].y,
                        element.geometry.vertices[vert2Index].x, element.geometry.vertices[vert2Index].y,
                        position.x, position.y,
                        window.innerWidth*2, window.innerHeight*2).hasIntersection ){intersectionCount++};
    }
    
    console.log("Intersects mesh in " + intersectionCount + "places.");
    // If intersectionCount is even, the point is outside the polygon, so return false.
    if( intersectionCount%2 === 0 ) return false;
    // Otherwise return true.
    else return true;
}