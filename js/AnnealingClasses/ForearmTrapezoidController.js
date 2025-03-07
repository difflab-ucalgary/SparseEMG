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

/*  This function is used for modelling the forearm as a 2D trapezoid. It has functions for creating
*   and rendering the Forearm polygon given the four measurements.
*
* */


var ForearmTrapezoidController = (function () {

    function updateForearmDimensionsFields(forearmTrapezoidPoints){
        var length_a = forearmTrapezoidPoints[2] - forearmTrapezoidPoints[0];
        var length_b = forearmTrapezoidPoints[4] - forearmTrapezoidPoints[6];
        var length_c = forearmTrapezoidPoints[7] - forearmTrapezoidPoints[1];
        var length_d = forearmTrapezoidPoints[5] - forearmTrapezoidPoints[3];

        document.getElementById("forearm_a").value = length_a;
        document.getElementById("forearm_b").value = length_b;
        document.getElementById("forearm_c").value = length_c;
        document.getElementById("forearm_d").value = length_d;
    }
    
    function updateForearmPolygonPointsFields(forearmTrapezoidPoints) {
        document.getElementById("top_left_x").value = forearmTrapezoidPoints[0];
        document.getElementById("top_left_y").value = forearmTrapezoidPoints[1];

        document.getElementById("top_right_x").value = forearmTrapezoidPoints[2];
        document.getElementById("top_right_y").value = forearmTrapezoidPoints[3];

        document.getElementById("bottom_right_x").value = forearmTrapezoidPoints[4];
        document.getElementById("bottom_right_y").value = forearmTrapezoidPoints[5];

        document.getElementById("bottom_left_x").value = forearmTrapezoidPoints[6];
        document.getElementById("bottom_left_y").value = forearmTrapezoidPoints[7];
    }

    function getForearmPolygonPointsAndProerties(){
        forearmTrapezoidPoints[0] = parseFloat(document.getElementById("top_left_x").value);
        forearmTrapezoidPoints[1] = parseFloat(document.getElementById("top_left_y").value) ;

        forearmTrapezoidPoints[2] = parseFloat(document.getElementById("top_right_x").value) ;
        forearmTrapezoidPoints[3] = parseFloat(document.getElementById("top_right_y").value);

        forearmTrapezoidPoints[4] = parseFloat(document.getElementById("bottom_right_x").value);
        forearmTrapezoidPoints[5] = parseFloat(document.getElementById("bottom_right_y").value);

        forearmTrapezoidPoints[6] = parseFloat(document.getElementById("bottom_left_x").value);
        forearmTrapezoidPoints[7] = parseFloat(document.getElementById("bottom_left_y").value);

        forearmProperties[0] = document.getElementById("forearm_polygon_fill_color").value;
        forearmProperties[1] = document.getElementById("forearm_polygon_outline_color").value;
        forearmProperties[2] = document.getElementById("forearm_polygon_stroke_width").value;
        forearmProperties[3] = document.getElementById("forearm_polygon_opacity").value;

        return [forearmTrapezoidPoints, forearmProperties];
    }

    function initForearmTrapezoidPoints(forearmTrapezoidPoints){
        this.g = main_canvas.group();
        forearmTrapezoidPoints[0] = 111;
        forearmTrapezoidPoints[1] = 10.54;
        forearmTrapezoidPoints[2] = 204;
        forearmTrapezoidPoints[3] = 10.54;
        forearmTrapezoidPoints[4] = 184.5;
        forearmTrapezoidPoints[5] = 270;
        forearmTrapezoidPoints[6] = 130;
        forearmTrapezoidPoints[7] = 270;

        return forearmTrapezoidPoints;
    }

    function updateForearmPolygon(pointArray, forearmProperties, main_canvas) {
        this.g.remove();
        var trapezoidPolygonProperties = getForearmPolygonPointsAndProerties();
        var trapezoidPoints = trapezoidPolygonProperties[0];
        var trapezoidProperties = trapezoidPolygonProperties[1];
        this.g = main_canvas.group();
        renderForearmPolygon(trapezoidPoints, trapezoidProperties, main_canvas);

    }
    
    function updateForearmPolygonProperties(forearmProperties) {
        document.getElementById("forearm_polygon_fill_color").value = forearmProperties[0];
        document.getElementById("forearm_polygon_outline_color").value = forearmProperties[1];
        document.getElementById("forearm_polygon_stroke_width").value = forearmProperties[2];
        document.getElementById("forearm_polygon_opacity").value = forearmProperties[3];
    }

    function renderForearmPolygon(pointArray, forearmProperties, main_canvas) {
        var trapezoid = main_canvas.polygon(pointArray[0],pointArray[1],pointArray[2],
            pointArray[3], pointArray[4], pointArray[5], pointArray[6], pointArray[7]);

        trapezoid.attr({ fill: forearmProperties[0], stroke: forearmProperties[1],
            strokeWidth:parseInt(forearmProperties[2]), opacity:forearmProperties[3] });

        this.g.append(trapezoid);

        return trapezoid;
    }


    return{
        UpdateForearmDimensionsFields: function (forearmTrapezoidPoints) {
            updateForearmDimensionsFields(forearmTrapezoidPoints);
        },

        UpdateForearmPolygonPointsFields: function (forearmTrapezoidPoints) {
            updateForearmPolygonPointsFields(forearmTrapezoidPoints);
        },
        UpdateForearmPolygonProperties: function(forearmProerties){
          updateForearmPolygonProperties(forearmProerties);
        },
        InitForearmTrapzoidPoints: function(forearmTrapezoidPoints){
            return initForearmTrapezoidPoints(forearmTrapezoidPoints);
        },
        RenderForearmPolygon: function(pointArray, forearmProperties, main_canvas){
            return renderForearmPolygon(pointArray, forearmProperties, main_canvas);
        },
        UpdateForearmPolygon: function (pointArray, forearmProperties, main_canvas) {
            updateForearmPolygon(pointArray, forearmProperties, main_canvas);
        }


    }

})();