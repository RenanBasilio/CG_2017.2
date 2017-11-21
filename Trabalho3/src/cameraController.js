/*jshint esversion:6*/

// The key used to change rotation mode
// var SWITCH_KEY = "ControlLeft";

/**
 * Enumerates mouse buttons as present in event.which
 */
var mouseButton = Object.freeze({
    LEFT: 1,
    MIDDLE: 2,
    RIGHT: 3
});

var STATE = Object.freeze({
    NONE: -1,
    ORBIT: 0,
    ROTATE: 1,
    PAN: 2,
    DOLLY: 3
})

class CameraController {
    /**
     * Build a new camera controller.
     * @param {THREE.PerspectiveCamera} camera The camera to use for controlling
     */
    constructor(camera, scene, domElement){

        // Initialize Scope
        this.camera = camera;
        this.domElement = domElement;
        this.state = STATE.NONE;

        // Initialize mouse trackers
        this.mousePos = new THREE.Vector3();
        this.mouseLast = new THREE.Vector3();
        this.isWheelDeltaFixed = null;
        this.wheelDeltaLast = null;
        this.wheelDelta = 120;

        // Set initial defaults.
        this.focus = new THREE.Vector3();
        this.rotate = new THREE.Quaternion();
        this.orbitX = new THREE.Quaternion();
        this.orbitY = new THREE.Quaternion();
        this.pan = new THREE.Vector3();
        this.dolly = 3;

        // Add relevant event listeners
        domElement.addEventListener("mousedown", this.onMouseDown.bind(this), false);
        domElement.addEventListener("mouseup", this.onMouseUp.bind(this), false);
        domElement.addEventListener("mousemove", this.onMouseMove.bind(this), false);
        domElement.addEventListener("mousewheel", this.onMouseScroll.bind(this), false);

        // Debug
        this.axisHelper = new THREE.AxisHelper();
        scene.add(this.axisHelper);
    }

    update(){
        // Reset the camera
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0, 0);

        // Apply translations to place the camera where it should be
        this.camera.translateX(this.pan.x);
        this.camera.translateY(this.pan.y);
        this.camera.translateZ(this.pan.z);

        // Apply cummulative rotations to rotate camera around itself
        this.camera.applyQuaternion(this.orbitX);

        // Apply dolly translation to move the camera back from it's origin
        this.camera.translateZ(this.dolly);

        console.log(this.focus);
        
        //this.camera.lookAt(this.focus);

        // Update the projection matrix
        this.camera.updateProjectionMatrix();
    }

    //////////////////////////////// Camera Controls ////////////////////////////////

    dollyCamera(distance) {
        if(this.isWheelDeltaFixed !== false) this.dolly += 0.1 * distance / this.wheelDelta;
        else this.dolly += this.wheelDelta;

        //this.camera.position.setZ(this.dolly);
        //console.log(camera);

        //this.camera.updateProjectionMatrix();

        this.update();
    }

    orbitCamera(distance) {

        this.orbitX.multiply(new THREE.Quaternion().setFromAxisAngle(camera.up, Math.PI*distance.x));

        this.update();
    }

    panCamera(distance) {
        // Compute panning on Y axis based on the vertical up vector.
        console.log(this.camera);
        var yPan = new THREE.Vector3().copy(this.camera.up);
        yPan.multiplyScalar(distance.y);

        // Compute X axis for panning based on up vector and focus direction.
        var centerVector = new THREE.Vector3().subVectors(this.camera.position, this.focus).normalize();
        var horizontalAxis = new THREE.Vector3().crossVectors(this.camera.up, centerVector).normalize();

        // Compute panning on X axis based on the horizontal axis.
        var xPan = horizontalAxis.multiplyScalar(distance.x);

        // Join X and Y panning values to global cummulative vector.
        this.pan.add(xPan);
        this.pan.add(yPan);

        this.focus.add(xPan);
        this.focus.add(yPan);

        this.axisHelper.position.add(xPan);
        this.axisHelper.position.add(yPan);

        this.update();
    }

    /////////////////////////////// Mouse Position /////////////////////////////////

    /**
     * Updates the mouse position in screen space.
     * @param {*} event The event that triggered the update.
     */
    updateMousePosition(event){
        this.mouseLast.copy(this.mousePos);

        this.mousePos.x = ( ( event.clientX - 5 ) / canvasWidth ) * 2 - 1;
        this.mousePos.y = - ( ( event.clientY - 5 ) / canvasHeight ) * 2 + 1;
    }

    /**
     * Compute the distance the mouse was moved between the last two mouse updates.
     */
    getMouseDelta(){
        var delta = new THREE.Vector3();
        delta.x = this.mousePos.x - this.mouseLast.x;
        delta.y = this.mousePos.y - this.mouseLast.y;

        return delta;
    }

    /////////////////////////////// Event Handlers /////////////////////////////////

    onMouseDown(event){
        console.log("Mouse button pressed.");
        if(event.ctrlKey){
            this.state = STATE.ROTATE;
        }
        else{
            switch (event.which) {
                case mouseButton.LEFT:
                    this.state = STATE.ORBIT;
                    break;
                case mouseButton.RIGHT:
                    this.state = STATE.PAN;
                    break;
                default:
                    break;
            }
        }
    }

    onMouseUp(event){
        console.log("Mouse button released.");
        this.state = STATE.NONE;
    }

    onMouseMove(event){

        this.updateMousePosition(event);

        switch (this.state) {
            case STATE.ORBIT:
                var delta = this.getMouseDelta();
                this.orbitCamera(delta);
                break;
            case STATE.PAN:
                var delta = this.getMouseDelta();
                this.panCamera(delta);
                break;
            default:
                break;
        }

    }

    onMouseScroll(event){
        // Try to decide if the mouse scrolls analogically. If the first two scroll actions have the same
        // absolute value, then there's a good chance that it doesn't.
        if (this.isWheelDeltaFixed === null){
            if (this.wheelDeltaLast === null){
                this.wheelDeltaLast = event.wheelDelta;
            }
            else if(Math.abs(this.wheelDeltaLast) === Math.abs(this.wheelDelta)){
                this.isWheelDeltaFixed = true;
                this.mouseWheelDelta = Math.abs(event.wheelDelta)
            }
            else{
                this.isWheelDeltaFixed = false;
            }
        }

        var scrollDistance = event.wheelDelta;
        this.dollyCamera(scrollDistance);

    }
    
}

/////////////////////////////// Camera Methods /////////////////////////////////

/*
function translateCamera(distance){

    scene.translateX(distance.x);
    center.x += -distance.x;

    scene.translateY(distance.y);
    center.y += -distance.y;

    scene.translateZ(distance.z);
    center.z += -distance.z;

    centerAxis.position.set(center.x, center.y, center.z);
}

function rotateCameraAroundObject(distance){

    // Create a quaternion for horizontal rotation
    var horizontalQuaternion = new THREE.Quaternion().setFromAxisAngle(camera.up, Math.PI*distance.x);

    // Compute the axis for overhead rotation
    var centerVector = new THREE.Vector3().subVectors(camera.position, center).normalize();
    var horizontalAxis = new THREE.Vector3().crossVectors(camera.up, centerVector).normalize();

    // Create a quaternion for overhead rotation
    var verticalQuaternion = new THREE.Quaternion().setFromAxisAngle(horizontalAxis, -Math.PI*distance.y);

    // Combine the quaternions
    var quaternion = new THREE.Quaternion().multiplyQuaternions(horizontalQuaternion, verticalQuaternion);

    // Apply the quaternion to the scene
    scene.applyQuaternion(quaternion);

}
*/