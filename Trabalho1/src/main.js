const NEAR_DISTANCE = 5;

/**
 * This array stores all line segments drawn by the user.
 */
var linesArray = [];
/**
 * This dictionary contains all intersections between line segments.
 * The keys are numerical and refer to the index of the intersecting lines in linesArray.
 */
var intersectsDict = {};

/**
 * This variable stores the index and region of a line detected as nearby.
 */
var lineNear = {index:-1, region:selectableRegion.NONE}
/**
 * This variable stores the index and region of a line marked as selected.
 */
var lineSelected = {index:-1, region:selectableRegion.NONE}

function setup(){
    // Initialize the WebGL canvas.
    createCanvas(800, 600, WEBGL);
}

function draw(){
    // Clear the canvas to color 235 (grayscale).
    background(235);
    fill(color(15));
    // For each line segment in the array, call its draw function.
    linesArray.forEach(function(object){object.draw();});

    fill(color(65));
    for(var key in intersectsDict){
        drawCircleGL(intersectsDict[key].x, intersectsDict[key].y, 5, 4, 16);
    }

    // Change drawing color to color 65 (grayscale).
    // Draw a circle around the mouse pointer (for debugging).
    //drawCircleGL(mouseX-(width/2), mouseY-(height/2), 50, 10, 16);
}

function mousePressed(){
    // Translate canvas coordinates to GL coordinates;
    // This is because the origin (0, 0) of the canvas is at its upper-leftmost point, while the
    // origin of the WebGL space is at its center. Therefore, to match the point clicked with the point
    // in the GL space we need to modify the coordinates.
    GLMouseX = mouseX-(width/2);
    GLMouseY = mouseY-(height/2);

    // The CTRL key is used as a modifier to override contextual commands.
    // If it is held a new line will be created regardless of the location clicked.
    if(!keyIsDown(CONTROL) && isNearLine(GLMouseX, GLMouseY)){
        lineSelected.index = lineNear.index;
        lineSelected.region = lineNear.region;
    }
    else{
        // Creates a new line segment using the position of the mouse as parameters.
        var new_line = new LineSegment2D(GLMouseX, GLMouseY, GLMouseX, GLMouseY);
        var new_intersects = [];
        // Stores the line segment in the line segment array.
        linesArray.push(new_line);
        // Sets the index of the new line as the currently selected line segment.
        lineSelected.index = linesArray.length-1;
        lineSelected.region = selectableRegion.ENDPOINT;
    }
}

function mouseDragged(){
    // Translate canvas coordinates to GL coordinates;
    GLMouseX = mouseX-(width/2);
    GLMouseY = mouseY-(height/2);

    // If a line segment is currently selected, switch on the position it is selected at.
    if (lineSelected.index !== -1){
        switch (lineSelected.region) {
            // If selected at the start point, move the start point to the mouse location.
            case selectableRegion.STARTPOINT:
                linesArray[lineSelected.index].setStartPoint(GLMouseX, GLMouseY);
                break;
            // If selected at the end point, move the end point to the mouse location.
            case selectableRegion.ENDPOINT:
                linesArray[lineSelected.index].setEndPoint(GLMouseX, GLMouseY);
                break;
            // If selected over the segment itself, translate the segment the same distance the mouse was moved.
            case selectableRegion.SEGMENT:
                linesArray[lineSelected.index].translateSegment(mouseX-pmouseX, mouseY-pmouseY);
            default:
                break;
        }
        //// Update intersections
        // Clear the intersection store of elements containing the segment being evaluated.
        var keys = Object.keys(intersectsDict);
        var keysForRemoval = keys.filter(function(value){
            return (containsSegment(value, lineSelected.index.toString()));
        }, this);
        keysForRemoval.forEach(function(element) {
            delete intersectsDict[element];
        }, this);
        // Check for intersections with other lines.
        for(var i = 0; i < linesArray.length; i++){
            if(i !== lineSelected.index) {
                var intersections = linesArray[lineSelected.index].intersects(linesArray[i]);
                // If an intersection is found, add it to the dictionary.
                if (intersections[0] == true) {
                    var key = Math.min(lineSelected.index, i).toString() + "-" + Math.max(lineSelected.index, i).toString();
                    intersectsDict[key] = intersections[1];
                }
            }
        }
    }
}

function mouseReleased(){
    if(lineSelected.index !== -1){
        lineSelected.index = -1;
        lineSelected.region = selectableRegion.NONE;
    }
}

function isNearLine(x, y){
    // Loop through the list of lines in reverse order so that a newer line will be found first.
    for(var i = linesArray.length-1; i >= 0; i--){
        // Check if the line is near the point. If a line is found, return true and set the lineNear variable to reflect the line found.
        var result = linesArray[i].isNear(x, y, NEAR_DISTANCE);
        switch (result) {
            // If the result is NONE, just break.
            case selectableRegion.NONE:
                break;
            // For any other result, a match was found, so set the globals and return true.
            default:
                lineNear.index = i;
                lineNear.region = result;
                return true;
        }
    }
    // If no match was found, return false.
    return false;
}

/**
 * This method returns whether the key provided contains the value.
 * @param {*} key The key to search for the specified value.
 * @param {*} value The value to search for in the key.
 * @return {boolean} True if the key contains the value. False otherwise.
 */
function containsSegment(key, value){
    var splitString = key.split("-");
    if (Number(splitString[0]) == value || Number(splitString[1]) == value) return true;
    else return false;
}