

/**
 * This method computes the length of a vector given its coordinates in 2D space.
 *
 * Given two points {(x1, y1), (x2, y2)}, the distance between them is calculated according to the formula
 *
 *      l =  sqrt( (Δx)^2 + (Δy)^2 )
 * @param {*} x1 The x coordinate of the first point of the vector.
 * @param {*} y1 The y coordinate of the first point of the vector.
 * @param {*} x2 The x coordinate of the second point of the vector.
 * @param {*} y2 The y coordinate of the second point of the vector.
 * @return {number} The length of the vector.
 */
function computeLength(x1, y1, x2, y2) {
    var length = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
    return length;
}

/**
 * This method returns whether two line segments intersect, and the point where the intersection happens (if it does).
 *
 * This is computed according to the following formulas, which return a linear combination factor λ
 * of the intersection point in each of the lines.
 *
 * Given the start ( a ) and end ( b ) points of the line segments 1 and 2.
 *
 *     λ1 = (( (ax1-bx1)*(ay1-ay2) ) - ( (ax1-ax2)*(ay1-by1) )) / (( Δxb*(ax1-ax2) ) - ( Δyb*(ax1-bx1) ))
 *
 *     λ2 = (( Δxb*(ay1-by1) ) - ( Δyb*(ax1-bx1) )) / (( Δxb*(ax1-ax2) ) - ( Δyb*(ax1-bx1) ))
 *
 * If both of those are between 0 and 1, then the intersection point is between the lines.
 *
 * The point itself is produced as the linear combination of the two lines using λ, as per the following formulas.
 *
 *     x = (1-λ)*bx1 + λ*bx2
 *     y = (1-λ)*by1 + λ*by2
 *
 * @param {Number} ax1 The x coordinate of the starting point of the first line.
 * @param {Number} ay1 The y coordinate of the starting point of the first line.
 * @param {Number} ax2 The x coordinate of the end point of the first line.
 * @param {Number} ay2 The y coordinate of the end point of the first line.
 * @param {Number} bx1 The x coordinate of the starting point of the second line.
 * @param {Number} by1 The y coordinate of the starting point of the second line.
 * @param {Number} bx2 The x coordinate of the end point of the second line.
 * @param {Number} by2 The y coordinate of the end point of the second line.
 * @return {{hasIntersection: Boolean, x: Number, y: Number}} hasIntersection defines whether an intersection is present, and x and y define it's coordinates if so.
 */
function intersects(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
    // Initialize result variable.
    var result = {hasIntersection: false, x: 0.0, y: 0.0};

    // Calculate linear combination coefficients.
    var x31 = bx1 - ax1;
    var y31 = by1 - ay1;
    var x34 = bx1 - bx2;
    var y34 = by1 - by2;
    var aDeltaX = ax2 - ax1;
    var aDeltaY = ay2 - ay1;
    var delta = (aDeltaX * y34) - (aDeltaY * x34);
    var dLambda1 = (x31 * y34) - (x34 * y31);
    var dLambda2 = (aDeltaX * y31) - (x31 * aDeltaY);
    var lambda1 = dLambda1 / delta;
    var lambda2 = dLambda2 / delta;

    // console.log("Line (" + ax1 + ", " + ay1 + "), (" + ax2, ", " +ay2 + ") intersects line (" + bx1 + ", " + by1 + "), (" + bx2 + ", " + by2 + ") at " + lambda1 + ", " + lambda2);

    // If coefficients aren't valid, return the default result (false).
    if (!(0 <= lambda1 && lambda1 <= 1 &&
            0 <= lambda2 && lambda2 <= 1)) { return result; }
    // Otherwise, set hasIntersection on the result to true.
    else { result.hasIntersection = true; }

    // Calculate the x and y coordinates of the intersection point.
    var intersectX = ((1.0 - lambda1) * ax1) + (lambda1 * ax2);
    var intersectY = ((1.0 - lambda1) * ay1) + (lambda1 * ay2);

    // Assign them to the appropriate properties on the result.
    result.x = intersectX;
    result.y = intersectY;


    // Return the result.
    return result;
}