/*
 * Copyright (c) 2020.
 *
 *  MIT License
 *
 *  Copyright (c) 2020 Aditya Nittala
 *  Affiliation: Saarland University, Germany
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *
 */

/*
* Utils Class: This class implements all the utilitarian functions such as calculating the distance between points, angle calculations,
* PIP (point-in-polygon) algorithm etc..
*/


var Utils = (function () {

    var WRIST_REGION_CUTOFF = 0.1;
    var MID_ARM_REGION_CUTOFF = 0.7;
    var UPPER_ARM_REGION_CUTOFF = 0.2;

    var ARM_LENGTH;
    var wrist_region = new Array();
    var mid_arm_region = new Array();
    var upper_arm_region = new Array();

    var forearm_trapezoid;

    Math.seed = 6;


    function _getNearestSquare(x, y, grid) {

        var x_Square = parseInt(x /10, 10);
        var y_Square = parseInt(y / 10, 10)//y / 10;
        return grid[x_Square][y_Square];

    }

    function _areaFromCoords(coordArray) {
        var x = new Array();
        x = convert2DArrayTo1D(coordArray);
        var a = 0;
        if (x.length % 2) return;
        for (var i = 0, iLen = x.length - 2; i < iLen; i += 2) {
            a += x[i] * x[i + 3] - x[i + 2] * x[i + 1];
        }
        return Math.abs(a / 2);
    }

    function polygonArea(X,  Y ,  numPoints){

        var area = 0;         // Accumulates area in the loop
        var j = numPoints-1;  // The last vertex is the 'previous' one to the first
        var product = 0, sum = 0, diff = 0;

        for (var i=0; i<numPoints; i++)
        {
            sum = parseInt(X[j]) + parseInt(X[i]);
            diff = parseInt(Y[j]) - parseInt(Y[i]);
            product = sum * diff;
            //product = (X[j]+X[i]) * (Y[j]-Y[i]);
            area = area + product ;
            j = i;  //j is previous vertex to i
        }
        return Math.abs(area/2);
    }



    function convert2DArrayTo1D(pointArray) {
        var coordArray = new Array();
        var j = 0;
        for(var i = 0 ; i < pointArray.length; i++){
            coordArray[j] = pointArray[i][0];
            coordArray[j + 1] = pointArray[i][1];
            j += 2;
        }
        return coordArray;
    }

    function convert1DArrayTo2D(pointArray){
        var coordArray = new Array();

        var j = 0 ;
        if(pointArray.length % 2 == 0){
            for(var i = 0 ; i < pointArray.length / 2; i++){
                coordArray.push([pointArray[j], pointArray[j+ 1]]);
                j = j + 2;
                //        coordArray[i][0] = pointArray[i];
                //    coordArray[i][1] = pointArray[i + 1];
            }
        }
        return coordArray;

    }

    function getDistanceBetweenPoints(x1, y1, x2, y2){
        var deltaX = Math.abs(x1 - x2);
        var deltaY = Math.abs(y1 - y2);
        var distance = Math.sqrt( (deltaX*deltaX) + (deltaY*deltaY) );
        return distance;
    }


    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    Math.seededRandom = function(max, min) {
        max = max || 1;
        min = min || 0;

        Math.seed = (Math.seed * 9301 + 49297) % 233280;
        var rnd = Math.seed / 233280.0;

        return Math.floor(min + rnd * (max - min));
    }

    function drawTrapezoid(a, b, c, d, x, y, s) {
        // var pointArray = new Array();
        // pointArray[0] = x;
        // pointArray [1] = y;
        //
        // pointArray [2] = x + a;
        // pointArray [3] = y;
        //
        // pointArray[4] = ( (Math.pow(c,2) - Math.pow(c, 2)) + (Math.pow((x + b), 2) - Math.pow(x,2)) ) / a;
        // var temp = Math.abs(Math.pow((pointArray[4] - x), 2) - Math.pow(d, 2))
        // pointArray[5] = y + Math.sqrt(temp);
        //
        // pointArray[6] = pointArray[4] + b;
        // pointArray[7] = pointArray[5];
        //
        // forearm_trapezoid = s.polygon(pointArray[0],pointArray[1],pointArray[2],
        //     pointArray[3], pointArray[6], pointArray[7], pointArray[4], pointArray[5]);
        // forearm_trapezoid.attr({ fill: "#D7895E", stroke: "black", opacity:0.7 });
        // return [ pointArray[0],pointArray[1],pointArray[2],
        //     pointArray[3], pointArray[6], pointArray[7], pointArray[4], pointArray[5]];


        var pointArray = new Array();
        pointArray[0] = x;
        pointArray [1] = y;

        pointArray [2] = x + a;
        pointArray [3] = y;

        var x_offset = x - (  ((c*c - d*d)/(2*(a-b))) - (a/2) + (b/2)) ;
        var y_offset = y + Math.sqrt( (c*c) - ( (x - x_offset) * (x - x_offset)))

        pointArray[6] = x_offset + b;
        pointArray[7] = y_offset;

        pointArray[4] = x_offset;
        pointArray[5]= y_offset;

        forearm_trapezoid = s.polygon(pointArray[0],pointArray[1],pointArray[2],
            pointArray[3], pointArray[6], pointArray[7], pointArray[4], pointArray[5]);
        forearm_trapezoid.attr({ fill: "#D7895E", stroke: "black", opacity:0.7 });
        return [ pointArray[0],pointArray[1],pointArray[2],
            pointArray[3], pointArray[6], pointArray[7], pointArray[4], pointArray[5]];



    }

    function deep_copy(src, dst){
        var i = src.length;
        while(i--){
            dst[i] = src[i];
        }
        return dst;
    }

    function getDistance(x1, y1, x2, y2){
        var deltaX = Math.abs(x1 - x2);
        var deltaY = Math.abs(y1 - y2);
        var distance = Math.sqrt( (deltaX*deltaX) + (deltaY*deltaY) );
        return distance;
    }

    function generateForearmSurface() {

        var a = parseInt(document.getElementById("forearm_a").value);
        var b= parseInt(document.getElementById("forearm_b").value);
        var c = parseInt(document.getElementById("forearm_c").value);
        var d = parseInt(document.getElementById("forearm_d").value);

        forearmTrapezoidPoints = Utils.GenerateTrapezoidPointsFromDimensions(a, b, c, d, 80, 5);
    }

    //this function computes the angle between two vectors each represented by two points. v1 = (x1, y1) - (x2, y2) and v2 = (a,b)-(c,d)
    function computeAngleBetweenTwoVectors( x1, y1, x2, y2, a,b, c, d){
        var Radian_To_Angle_Conversion = 180 / Math.PI;
        var magnitudeV1 = getDistance(x1, y1, x2, y2);
        var magnitudeV2 = getDistance(a,b, c, d);

        var deltaX = x1 - x2;
        var deltaA = a - c;

        var deltaY = y1 - y2;
        var deltaB = b - d;

        var dotProduct = (deltaX * deltaA) +  (deltaY * deltaB);

        var cosTheta = dotProduct / (magnitudeV1 * magnitudeV2);
        if(cosTheta > 1.0){
            cosTheta = 1.0;
        }else if(cosTheta < -1.0){
            cosTheta = -1.0;
        }

        return Math.acos(cosTheta);
    }

    function getXCoords(pointArray){
        var xCoords = new Array();
        for(var i = 0 ; i < pointArray.length; i = i + 2){
            xCoords.push(pointArray[i]);

        }

        return xCoords;
    }

    function getYCoords(pointArray){
        var yCoords = new Array();
        for(var i = 1 ; i < pointArray.length; i = i + 2){
            yCoords.push(pointArray[i]);

        }
        return yCoords;
    }


    //This function returns the point which lies on the line joining two points (x1, y1) and (x2, y2) and is at distance of "a" from (x1,y1)
    function getKeyPointOnTheLine(x1, y1, x2, y2, a){
        //calculate the slope

        var m = (y2 - y1)/ (x2 - x1);
        var length_of_line = getDistance(x1, y1, x2, y2);

        var x_point  = x1 + (Math.sqrt( (a * a) / (1 + (m * m) )));
        var y_point = y1 + (m * (x_point - x1));

        if( (x_point >= 320) || (y_point >= 320) ){
            x_point = x1 - (Math.sqrt( (a * a) / (1 + (m * m) )));
            y_point = y1 + (m * (x_point - x1));
        }
        if((x_point <= 0) || (y_point <= 0)){
            x_point = x1 - (Math.sqrt( (a * a) / (1 + (m * m) )));
            y_point = y1 + (m * (x_point - x1));
        }


        return {x_point, y_point};

    }

    /*
        Point Inside Polygon Algorithm. Checks if a given point is inside a polygon. Inputs are the point and the vertex set(vs) which makes the polygon
    */

    function pointInsidePolygon(point, vs) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

        var x = point[0], y = point[1];

        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    function getPointArrayFromElectrodeSet(electrodeSet){
        var j = 0 ;
        var pointArray = new Array();
        for(var i = 0 ; i < electrodeSet.len; i++){
            pointArray[j] = electrodeSet[i].x;
            pointArray[j + 1] = electrodeSet[i].y;
            j = j + 2;
        }

        return pointArray;
    }

    function get_wrist_region(forearmTrapezoidPoints){

        var arm_mid_point = [ ( (forearmTrapezoidPoints[0] + forearmTrapezoidPoints[2]) /2), ( (forearmTrapezoidPoints[1] + forearmTrapezoidPoints[3]) /2)];
        var wrist_mid_point = [ ( (forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6]) /2), ( (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7]) /2)];
        ARM_LENGTH = Utils.GetDistanceBetweenPoints(wrist_mid_point[0], wrist_mid_point[1], arm_mid_point[0], arm_mid_point[1]);


        wrist_region[0] = wrist_mid_point[0];
        wrist_region[1] = wrist_mid_point[1];
        wrist_region[2] = wrist_mid_point[0];
        wrist_region[3] = wrist_mid_point[1] - ARM_LENGTH * WRIST_REGION_CUTOFF;
    }

    function get_lower_arm_region(){

        mid_arm_region[0] = wrist_region[0];
        mid_arm_region[1] = wrist_region[3];
        mid_arm_region[2] = mid_arm_region[0];
        mid_arm_region[3] = mid_arm_region[1] - ARM_LENGTH * MID_ARM_REGION_CUTOFF;
    }

    function get_upper_arm_region() {
        upper_arm_region[0] = mid_arm_region[2];
        upper_arm_region[1] = mid_arm_region[3];
        upper_arm_region[2] = upper_arm_region[0];
        upper_arm_region[3] = upper_arm_region[1] - ARM_LENGTH * UPPER_ARM_REGION_CUTOFF;
    }

    function init_forearm_region_calculation(forearmTrapezoidPoints) {
        get_wrist_region(forearmTrapezoidPoints);
        get_lower_arm_region(forearmTrapezoidPoints);
        get_upper_arm_region(forearmTrapezoidPoints);
    }

    function getWristRegion(){
        return wrist_region;
    }

    function getMidArmRegion(){
        return mid_arm_region;
    }

    function getUpperArmRegion(){
        return upper_arm_region;
    }

    function getModalityWithLowestWeight(weights){
        var index = 0;
        var value = weights[0];
        for (var i = 1; i < weights.length; i++) {
            if (weights[i] < value) {
                value = weights[i];
                index = i;
            }
        }
        return index;
    }

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    function describeArc(x, y, radius, startAngle, endAngle) {
        var start = polarToCartesian(x, y, radius, endAngle);
        var end = polarToCartesian(x, y, radius, startAngle);

        var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
            "L", x, y,
            "L", start.x, start.y
        ].join(" ");
    }

    //Given a center point of the electrode, this function checks if the entire electrode is within a given shape
    function checkElectrodeCompletelyInsideShape([point_x, point_y], inputPath, electrodeWidth, electrodeHeight){

        if(Utils.IsPointInsidePolygon([point_x, point_y], inputPath) &&
            Utils.IsPointInsidePolygon([point_x + electrodeWidth, point_y], inputPath) &&
            Utils.IsPointInsidePolygon([ point_x - electrodeWidth, point_y], inputPath) &&
            Utils.IsPointInsidePolygon([ point_x, point_y + electrodeHeight], inputPath) &&
            Utils.IsPointInsidePolygon([ point_x, point_y - electrodeHeight], inputPath)
        ){
            return true;
        }
        return false;
    }

    // This function generates the points for a rectangle given,a center, width, and height
    function generatePointsForRectangle(x, y, width, height){
        //the points are generated in the following order: top_left, top_right, bottom_right, bottom_left
        var pointCoords = new Array();
        pointCoords[0] = x - (width /2);
        pointCoords[1] = y - (height / 2);

        pointCoords[2] = x + (width /2);
        pointCoords[3] = y - (height / 2);

        pointCoords[4] = x + (width /2);
        pointCoords[5] = y + (height / 2);

        pointCoords[6] = x - (width /2);
        pointCoords[7] = y + (height /2);

        return pointCoords;


    }

    function getElectrodesWithinShape(electrodeSet, inputPath){

      var selectedElectrodeSet = new Array();

      for( let i = 0 ; i< electrodeSet.length; i++){
          var point = [electrodeSet[i].x, electrodeSet[i].y];
          if (Utils.CheckIfElectrodeCompletelyWithinShape([point[0], point[1]],inputPath,EMG_ELECTRODE_SIZE, EMG_ELECTRODE_SIZE)){
          selectedElectrodeSet.push(electrodeSet[i]);
        }
      }

      return selectedElectrodeSet;

    }

    function findIntersectionBetweenLine(x1, y1, x2, y2, x3, y3, x4, y4) {

        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false
        }

        var denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

        // Lines are parallel
        if (denominator === 0) {
            return false
        }

        let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
        let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator


        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false
        }

        // Return a object with the x and y coordinates of the intersection
        let x = x1 + ua * (x2 - x1)
        let y = y1 + ua * (y2 - y1)

        return [x, y]

    }

    var result = [];
    var result_combinations = new Array();
    var combination_values = new Array();

    function combine(input, len, start) {
        if(len === 0) {
            //console.log( result.join(" ") ); //process here the result
            result_combinations.push(result.join(" "));
            return;
        }
        for (var i = start; i <= input.length - len; i++) {
            result[result.length - len] = input[i];
            combine(input, len-1, i+1 );
        }
    }

    function generateCombinations(inputArray, r){
        result = [];
        result_combinations = [];
        combination_values = [];
        result.length = r;

        combine( inputArray, r, 0);
        for(var i = 0 ; i < result_combinations.length; i++){
            var split_res = result_combinations[i].split(" ");
            //console.log(split_res);
            combination_values.push(split_res);

        }
        //console.log(combination_values);
        return combination_values;


    }

    //this function finds the distance of a point P(x,y) from a line segment joining two points A(x1,y1) and B(x2,y2)
    function distanceOfPointFromLine(x, y, x1, y1, x2, y2) {

        var A = x - x1;
        var B = y - y1;
        var C = x2 - x1;
        var D = y2 - y1;

        var dot = A * C + B * D;
        var len_sq = C * C + D * D;
        var param = -1;
        if (len_sq != 0) //in case of 0 length line
            param = dot / len_sq;

        var xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        var dx = x - xx;
        var dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }



    function areAllEMGKeyPointsWithinShape(input_shape_coords, modalityCombination){
        var emg_keypoints_within_shape = new Array();
        var num_keypoints_within_shape = 0;
        if(modalityCombination[0].length > 0){
            for(var i = 0 ; i < modalityCombination[0].length; i++){
                var keypoint_1 = keyPointSet.map(function(x) {return x.id; }).indexOf(modalityCombination[0][i]+"1");
                emg_keypoints_within_shape.push(keyPointSet[keypoint_1]);

                var keypoint_2 = keyPointSet.map(function(x) {return x.id; }).indexOf(modalityCombination[0][i]+"2");
                emg_keypoints_within_shape.push(keyPointSet[keypoint_2]);
            }
        }
        for(i = 0 ; i < emg_keypoints_within_shape.length; i++){
            var point = [emg_keypoints_within_shape[i].x, emg_keypoints_within_shape[i].y];
            if(Utils.CheckIfElectrodeCompletelyWithinShape([point[0], point[1]],
                input_shape_coords,EMG_ELECTRODE_SIZE, EMG_ELECTRODE_SIZE
                //emg_keypoints_within_shape[i].size, emg_keypoints_within_shape[i].size,
            )){
                num_keypoints_within_shape++;
            }
        }

        if(num_keypoints_within_shape == emg_keypoints_within_shape.length){
            return [true, emg_keypoints_within_shape];
        }else
            return [false, emg_keypoints_within_shape];

    }

    function getForearmDimensionsFromTrapezoid(forearmTrapezoidPoints){
        var a = Math.abs(forearmTrapezoidPoints[2] - forearmTrapezoidPoints[0]);
        var b = Math.abs(forearmTrapezoidPoints[6] - forearmTrapezoidPoints[4]);
        var c = Math.abs(forearmTrapezoidPoints[1] - forearmTrapezoidPoints[5]);
        var d = Math.abs(forearmTrapezoidPoints[3] - forearmTrapezoidPoints[7]);
        //var c = Utils.GetDistanceBetweenPoints(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1], forearmTrapezoidPoints[4], forearmTrapezoidPoints[5]);
       // var d = Utils.GetDistanceBetweenPoints(forearmTrapezoidPoints[2], forearmTrapezoidPoints[3], forearmTrapezoidPoints[6], forearmTrapezoidPoints[7]);

        return [a,b,c,d];
    }
    // function generateForeheadSurface(eyeBrowLength, main_canvas){
    //     //     var eyeBrow_line = main_canvas.line(160, 160, 160 + eyeBrowLength, 160);
    //     //     eyeBrow_line.attr({stroke:"#FF4447"});
    //     //
    //     // }




    return {
        GetNearestSquare: function(coordArray){

            _getNearestSquare(x, y, grid);
            return grid[parseInt(x / 10, 10)][parseInt(y /10, 10)];
        },

        GetPolarToCartesian: function(centerX, centerY, radius, angleInDegrees){
            return polarToCartesian(centerX, centerY, radius, angleInDegrees);
        },

        GetArcOfCircle: function(x, y, startAngle, endAngle){
            var circle_arc = describeArc(x, y, startAngle, endAngle);
            return circle_arc;
        },

        AreaFromCoords: function(coordArray){
            //  _areaFromCoords(coordArray);
            var areaOfPolygon = _areaFromCoords(coordArray);
            return areaOfPolygon;
        },
        GetRandomInt: function (min, max) {
            return getRandomInt(min, max);
        },
        GenerateTrapezoidPointsFromDimensions: function (a, b, c, d, x, y, s) {
            return drawTrapezoid(a, b, c, d, x, y, s);

        },

        GetForearmDimensionsFromTrapezoid: function (forearmTrapezoidPoints){
            return getForearmDimensionsFromTrapezoid(forearmTrapezoidPoints);
        },

        GetKeyPointOnTheLine: function(x1, y1, x2, y2, a){
            return getKeyPointOnTheLine(x1, y1, x2, y2, a);
        },
        IsPointInsidePolygon: function(point, vs){
            return pointInsidePolygon(point, vs);
        },
        Convert2DArrayTo1D: function (pointArray){
            return convert2DArrayTo1D(pointArray);
        },
        Convert1DArrayTo2D: function (pointArray) {
            return convert1DArrayTo2D(pointArray);

        },

        GetModalityWithLowestWeight: function(weights){
            return getModalityWithLowestWeight(weights);
        },

        Deep_Copy: function (src, dst){
            return deep_copy(src, dst);

        },
        GetAngleBetweenVectors: function (x1, y1, x2, y2, a, b, c, d) {
            return computeAngleBetweenTwoVectors(x1, y1, x2, y2, a, b, c, d);

        },
        GetDistanceBetweenPoints: function (x1, y1, x2, y2) {
            return getDistanceBetweenPoints(x1, y1, x2, y2);

        },
        GetPolygonArea: function (X, Y, numPoints) {
            return polygonArea(X, Y, numPoints);

        },
        GetXCoords: function(pointArray){
            return getXCoords(pointArray);
        },

        GetYCoords: function(pointArray){
            return getYCoords(pointArray);
        },

        GetPointArrayOfElectrodeSet: function (electrodeSet) {
            return getPointArrayFromElectrodeSet(electrodeSet);

        },

        GenerateFoerarmSurface: function () {
            return generateForearmSurface();
        },

        InitForearmRegionCalculations: function (forearmTrapezoidPoints) {
            return init_forearm_region_calculation(forearmTrapezoidPoints);
        },

        GetWristRegion: function () {
            return getWristRegion();
        },

        GetMidArmRegion: function () {
            return getMidArmRegion();
        },

        GetUpperArmRegion: function () {
            return getUpperArmRegion();
        },
        CheckIfElectrodeCompletelyWithinShape: function([point_x, point_y], inputPath, electrodeWidth, electrodeHeight){
            return checkElectrodeCompletelyInsideShape([point_x, point_y], inputPath, electrodeWidth, electrodeHeight);
        },
        GetForearmTrapezoid: function () {
            return forearm_trapezoid;

        },
        GetPointsForRectangle: function (x, y, width, height) {
            return generatePointsForRectangle(x,y, width,height);
        },

        FindIntersectionBetweenLine: function (x1, y1, x2, y2, x3, y3, x4, y4){
            return findIntersectionBetweenLine(x1, y1, x2, y2, x3, y3, x4, y4);
        },
        GenerateCombinations: function(inputArray, r){
            return generateCombinations(inputArray, r);
        },
        GetDistanceOfPointFromLine: function (x, y, x1, y1, x2, y2) {
            return distanceOfPointFromLine(x, y, x1, y1, x2, y2);

        },
        AreAllEMGKeypointsWithinShape: function (input_shape_coords, modalityCombination){
            return areAllEMGKeyPointsWithinShape(input_shape_coords, modalityCombination);
        },

        GetElectrodesWithinShape: function (electrodeSet, inputPath){
            return getElectrodesWithinShape(electrodeSet, inputPath);
        }


        // GenerateForeheadSurface: function(eyeBrowLength, main_canvas){
        //     return generateForeheadSurface(eyeBrowLength, main_canvas);
        // }




    };
})();
