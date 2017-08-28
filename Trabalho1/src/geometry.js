/**
 * This enumeration determines which region of a line segment can be selected.
 */
var selectableRegion = Object.freeze({
    NONE: 0,
    STARTPOINT: 1,
    ENDPOINT: 2,
    SEGMENT: 3
});

/**
 * This class stores a point in 2D space.
 */
class Point{
    /**
     * Initializes a Point.
     * @param {*} x The X coordinate of the point.
     * @param {*} y The Y coordinate of the point.
     */
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

/**
 * Handles the storage and drawing of 2D line segments between 2 points in a WebGL space.
 */
class LineSegment2D{
    /**
     * Initializes a Line Segment.
     * @param {*} startx The X coordinate of the first point.
     * @param {*} starty The Y coordinate of the first point.
     * @param {*} endx The X coordinate of the second point.
     * @param {*} endy The Y coordinate of the second point.
     */
    constructor(startx, starty, endx, endy){
        this.startpoint = new Point(startx, starty);
        this.endpoint = new Point(endx, endy);
        this.length = 0;
        this.incline = 0;
        this.yOffset = 0;
    }
    /**
     * This method recalculates the static parameters used to describe the segment in mathematical operations.
     * The following parameters are updated when this method is executed:
     ** length
     ** incline
     ** y-offset
     */
    calculateParameters(){
        this.length = computeLength(this.startpoint.x, this.startpoint.y, this.endpoint.x, this.endpoint.y);
        this.deltaX = this.endpoint.x-this.startpoint.x;
        this.deltaY = this.endpoint.y-this.startpoint.y;
    }
    /**
     * Changes the location of the first point of the line segment.
     * @param {*} startx The new X coordinate of the first point.
     * @param {*} starty The new Y coordinate of the first point.
     */
    setStartPoint(startx, starty){
        this.startpoint.x = startx;
        this.startpoint.y = starty;

        this.calculateParameters();
    }
    /**
     * Changes the location of the second point of the line segment.
     * @param {*} startx The new X coordinate of the second point.
     * @param {*} starty The new Y coordinate of the second point.
     */
    setEndPoint(endx, endy){
        this.endpoint.x = endx;
        this.endpoint.y = endy;

        this.calculateParameters();
    }
    /**
     * Translate both start and end points of the segment a given distance.
     * @param {*} distx The distance in the X axis which to move the segment by.
     * @param {*} disty The distance in the Y axis which to move the segment by.
     */
    translateSegment(distx, disty){
        this.startpoint.x+=distx;
        this.startpoint.y+=disty;
        this.endpoint.x+=distx;
        this.endpoint.y+=disty;

        this.calculateParameters();
    }
    /**
     * This method calculates whether the given point is within a specified distance from 
     * the line and returns the region it is closest to.
     * 
     * Endpoints are calculated first, and if a match is found then the region is returned
     * without calculating distance from the actual segment.
     * @param {number} x The x coordinate to calculate distance from.
     * @param {number} y The y coordinate to calculate distance from.
     * @param {number} maxDistance The maximum distance considered to be near the segment.
     * @return {number} The identifier of the selectableRegion considered to be nearest to the point.
     */
    isNear(x, y, maxDistance){
        // Check if inside valid region.
        if(!(x >= min(this.startpoint.x, this.endpoint.x)-maxDistance &&
            x <= max(this.startpoint.x, this.endpoint.x)+maxDistance &&
            y >= min(this.startpoint.y, this.endpoint.y)-maxDistance &&
            y <= max(this.startpoint.y, this.endpoint.y)+maxDistance)) {return selectableRegion.NONE;}

        var dist;

        // Calculate proximity to the end point.
        dist = Math.sqrt(Math.pow((this.endpoint.x-x), 2)+Math.pow((this.endpoint.y-y), 2));
        if (dist < maxDistance){return selectableRegion.ENDPOINT};

        // Calculate proximity to the start point.
        dist = Math.sqrt(Math.pow((this.startpoint.x-x), 2)+Math.pow((this.startpoint.y-y), 2));
        if (dist < maxDistance){return selectableRegion.STARTPOINT};

        // Calculate proximity to the line.
        dist = Math.abs((this.endpoint.y-this.startpoint.y)*x-(this.endpoint.x-this.startpoint.x)*y+this.endpoint.x*this.startpoint.y-this.endpoint.y*this.startpoint.x)/this.length;
        var dotP = (this.endpoint.x-this.startpoint.x)*(x-this.startpoint.x) + (this.endpoint.y-this.startpoint.y)*(y-this.startpoint.y);
        var cosT = (dotP)/(length*computeLength(this.startpoint.x, this.startpoint.y, x, y));
        if(dist < maxDistance && cosT >= 0 && Math.abs(dotP) >= Math.pow(length, 2)){return selectableRegion.SEGMENT};

        // If no points are close enough, return NONE.
        return selectableRegion.NONE;
    }
    /**
     * This method returns whether the line segments intersects the segment passed as the parameter, and if so the point where it happens.
     * @param {LineSegment2D} lineSegment The segment to verify if intersects with this one.
     * @return {[boolean, Point]} An array containing whether a point was found and, if so, the point of intersection.
     */
    intersects(lineSegment){
        var result = [false, new Point(0.0, 0.0)];
        var x31 = lineSegment.startpoint.x-this.startpoint.x;
        var y31 = lineSegment.startpoint.y-this.startpoint.y;
        var x34 = lineSegment.startpoint.x-lineSegment.endpoint.x;
        var y34 = lineSegment.startpoint.y-lineSegment.endpoint.y;
        var delta = (this.deltaX*y34)-(this.deltaY*x34);
        var dLambda1 = (x31*y34)-(x34*y31);
        var dLambda2 = (this.deltaX*y31)-(x31*this.deltaY);
        var lambda1 = dLambda1/delta;
        var lambda2 = dLambda2/delta;
        if(!( 0 <= lambda1 && lambda1 <= 1 &&
            0 <= lambda2 && lambda2 <= 1)) return result;
        else result[0] = true;
        var intersectX = ((1.0-lambda1)*this.startpoint.x)+(lambda1*this.endpoint.x);
        var intersectY = ((1.0-lambda1)*this.startpoint.y)+(lambda1*this.endpoint.y);
        result[1].x = intersectX;
        result[1].y = intersectY;
        //print("Found intersection at ("+intersectX+", "+intersectY+")");
        return result;
    }
    /**
     * Draws the line segment in the current GL context.
     */
    draw(){
        line(this.startpoint.x, this.startpoint.y, 0.0,
            this.endpoint.x, this.endpoint.y, 0.0);
    }

}

/**
 * This method computes the length of a vector given its coordinates in 2D space.
 * @param {*} x1 The x coordinate of the first point of the vector.
 * @param {*} y1 The y coordinate of the first point of the vector.
 * @param {*} x2 The x coordinate of the second point of the vector.
 * @param {*} y2 The y coordinate of the second point of the vector.
 * @return {number} The length of the vector.
 */
function computeLength(x1, y1, x2, y2){
    length = Math.sqrt(Math.pow((x2-x1), 2)+Math.pow((y2-y1), 2));
    return length;
}

/**
 * Draws a circle using a GL triangle strip.
 * 
 * The method calculates vertices using the parametric equations
 * 
 *      x = x0 + r*cosT
 *      y = y0 + r*sinT
 * 
 * in pairs that the first corresponds to a vertice in the inner circle and the other 
 * to one in the outer circle, feeding them into the rendere in succession to draw a
 * circle at the position specified.
 * @param {*} centerX The location in the X axis to draw the center of the circle.
 * @param {*} centerY The location in the Y axis to draw the center of the circle.
 * @param {*} radius  The radius of the circle.
 * @param {*} strokeWidth The distance from the inner radius to the outer radius, in pixels.
 * @param {*} resolution The resolution of the circle. This is how many pairs of vertices to calculate for rendering.
 * 
 */
function drawCircleGL(centerX, centerY, radius, strokeWidth, resolution){
    res = 360/resolution;
    innerRad = radius-(strokeWidth/2);
    outerRad = radius+(strokeWidth/2);
    beginShape(TRIANGLE_STRIP);
        for(var i = 0.0; i <= 360; i+=res)
            {
                angle = (PI*i)/180;
                vertex(centerX+innerRad*cos(angle), centerY+innerRad*sin(angle), 0.0);
                vertex(centerX+outerRad*cos(angle), centerY+outerRad*sin(angle), 0.0);
            }
    endShape();
}