var state = Object.freeze({
    IDLE: 0,
    DRAWING: 1
});

var MAX_POINTS = 50;

var currState = state.IDLE;
var currGeometry = null;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 100);
camera.lookAt(new THREE.Vector3(0, 0, 0));

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xfafafa, 1);

document.body.appendChild(renderer.domElement);


function computeLength(x1, y1, x2, y2){
    length = Math.sqrt(Math.pow((x2-x1), 2)+Math.pow((y2-y1), 2));
    return length;
}

class LineChain{
    constructor(){
        this.geometry = new THREE.BufferGeometry();

        this.positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( this.positions, 3 ) );
        
        this.drawCount = 0;
        this.geometry.setDrawRange( 0, this.drawCount );
        
        this.material = new THREE.LineBasicMaterial( { color: 0x060606, linewidth: 2 } );
        
        this.line = new THREE.Line( this.geometry,  this.material );
        scene.add( this.line );

        this.nextIndex = 0;        
    }
    addVertice(x, y){
        var positions = this.line.geometry.attributes.position.array;
        positions[this.nextIndex++] = x;
        positions[this.nextIndex++] = y;
        positions[this.nextIndex++] = 0.;
        this.drawCount++;
        this.geometry.setDrawRange(0, this.drawCount);
        this.line.geometry.attributes.position.needsUpdate = true;
    }
} 

function getMousePosition(){
    var vector = new THREE.Vector3();
    
    vector.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5 );
    
    vector.unproject( camera );
    
    var dir = vector.sub( camera.position ).normalize();
    
    var distance = - camera.position.z / dir.z;
    
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

    console.log(pos);
    return pos;
}

var geometriesArray = [];

function onMouseDown(event)
{
    var mouse = getMousePosition();
    switch (currState) {
        case state.IDLE:
            currState = state.DRAWING;
            currGeometry = new LineChain();
            currGeometry.addVertice(mouse.x, mouse.y);
            break;
        case state.DRAWING:
            currGeometry.addVertice(mouse.x, mouse.y);
            if(currGeometry.isClosed) {currState = state.IDLE;}
            break;
        default:
            break;
    }
}
document.addEventListener( 'mousedown', onMouseDown, false ); 

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();