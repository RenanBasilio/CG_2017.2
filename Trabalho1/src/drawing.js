/**
 * Draws the line segment in the current GL context.
 * @param {LineSegment2D} segment The line segment to draw.
*/
function drawSegment(segment){
    line(segment.startpoint.x, segment.startpoint.y, 0.0,
        segment.endpoint.x, segment.endpoint.y, 0.0);
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