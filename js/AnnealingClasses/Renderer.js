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


/* The Renderer class for rendering the electrodes, keypoints, muscle lines and all the other
*  basic feature on the SVG canvas.
* */


var Renderer = (function(){

    var renderedElectrodes = new Array();
    function drawGridWithLines(s){
        for(var i = 0; i < MAIN_CANVAS_SVG_HEIGHT; i += 10) {
            s.line(i, 0, i, MAIN_CANVAS_SVG_HEIGHT).attr({fill: "none", stroke: "gray", strokeWidth: 0.25});;
        }
        for(var j = 0; j < MAIN_CANVAS_SVG_HEIGHT; j += 10) {
            s.line(0, j, MAIN_CANVAS_SVG_HEIGHT, j).attr({fill: "none", stroke: "gray", strokeWidth: 0.25});;
        }
    }

    function renderElectrodeArray(numrows, numcolumns, electrode_size, inter_electrode_distance, s){
      for(var i = 0 ; i < numrows; i++){
        renderElectrode()
      }
    }







    function renderElectrode(electrode, s){
        var electrode_circle;
        var electrode_label;
        if(electrode.type == "emg" || electrode.type == "EMG"){
            if(electrode.shape == "circle"){
                electrode_circle = s.circle(electrode.x, electrode.y, electrode.size).attr({fill:"#6d9e31", opacity:0.75});
                electrode_label = s.text(electrode.x - electrode.size, electrode.y, electrode.id);
                electrode_label.attr({
                    'font-size':2.5
                });
            }else if(electrode.type == "square"){
                electrode_circle = s.rect(electrode.x, electrode.y, electrode.size).attr({fill:"#6d9e31", opacity:0.75});
            }
        }else if(electrode.type === "eda" || electrode.type == "EDA"){
            electrode_circle = s.circle(electrode.x, electrode.y, electrode.size).attr({fill:"#4f5b9f", opacity:0.75});
            electrode_label = s.text(electrode.x - electrode.size, electrode.y, electrode.id);
            electrode_label.attr({
                'font-size':2
            });
        }else if(electrode.type == "ecg" || electrode.type == "ECG"){
            electrode_circle = s.circle(electrode.x, electrode.y, electrode.size).attr({fill:"#ee1b44", opacity:0.75});
            electrode_label = s.text(electrode.x - electrode.size, electrode.y, electrode.id);
            electrode_label.attr({
                'font-size':2
            });
        }
        return electrode_circle;
    }

    function renderKeyPoint(keypoint, s){
        var keypoint_circle;
        if (keypoint.type == "emg" || keypoint.type == "EMG"){
            keypoint_circle = s.circle(keypoint.x, keypoint.y, keypoint.size).attr({fill:"#4f5b9f", opacity:0.75});
        }
        else if(keypoint.type =="eda" || keypoint.type == "EDA"){
            keypoint_circle = s.circle(keypoint.x, keypoint.y, keypoint.size).attr({fill:"#4f5b9f", opacity:0.75});
        }
        else if(keypoint.type =="ecg" || keypoint.type == "ECG"){
            keypoint_circle = s.circle(keypoint.x, keypoint.y, keypoint.size).attr({fill:"#ee1b44", opacity:0.75});
        }

        return keypoint_circle;
    }

    function renderAllKeyPoints(keyPointSet, s){
        var rendered_keypoint;
        for(var i = 0 ; i < keyPointSet.length; i++){
            rendered_keypoint = renderKeyPoint(keyPointSet[i], s);
            renderedKeypoints.push(rendered_keypoint);
        }
        return renderedKeypoints;
    }

    function renderAllElectrodes(electrodeSet, s){
        var rendered_electrode;
        for(var i = 0 ; i < electrodeSet.length; i++){
            rendered_electrode = renderElectrode(electrodeSet[i], s);
            renderedElectrodes.push(rendered_electrode);
        }
        return renderedElectrodes;
    }

    function renderConvexHull(coordsArray, s){
        s.polygon(coordsArray).attr({ fill: "none", stroke: "blue", strokeWidth: 0.25 });
    }

    function renderInnervationZones(forearmTrapezoidPoints, main_canvas) {
        //Render FCU Innervation zone
        var length_of_muscle_line_fcu = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7]);

        var innervation_point1_fcu = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7], length_of_muscle_line_fcu * FCU_IZ_ZONE_START);

        var innervation_point2_fcu = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7], length_of_muscle_line_fcu * FCU_IZ_ZONE_END);

        var innervation_line_fcu = main_canvas.line(innervation_point1_fcu.x_point, innervation_point1_fcu.y_point, innervation_point2_fcu.x_point, innervation_point2_fcu.y_point);
        innervation_line_fcu.attr({opacity:0.5, strokeWidth:1, stroke:"#ff0045"});

        //Render PL Innervation zone

        var wrist_mid_point = [(forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7])/2];

        var length_of_muscle_line_pl = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1]);

        var innervation_point1_pl = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1], length_of_muscle_line_pl * PL_IZ_ZONE_START);

        var innervation_point2_pl = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1], length_of_muscle_line_pl * PL_IZ_ZONE_END);

        var innervation_line_pl = main_canvas.line(innervation_point1_pl.x_point, innervation_point1_pl.y_point, innervation_point2_pl.x_point, innervation_point2_pl.y_point);
        innervation_line_pl.attr({opacity:0.5, strokeWidth:1, stroke:"#ff0045"});

        //Render FCR innervation zone

        var length_of_muscle_line_fcr = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5]);

        var innervation_point1_fcr = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5], length_of_muscle_line_fcr * FCR_IZ_ZONE_START);

        var innervation_point2_fcr = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5], length_of_muscle_line_fcr * FCR_IZ_ZONE_END);

        var innervation_line_fcr = main_canvas.line(innervation_point1_fcr.x_point, innervation_point1_fcr.y_point, innervation_point2_fcr.x_point, innervation_point2_fcr.y_point);
        innervation_line_fcr.attr({opacity:0.5, strokeWidth:1, stroke:"#ff0045"});

        //Render BR innervation zone

        var length_of_muscle_line_br = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3],
            forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5]);

        var innervation_point1_br = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[2] -  5, forearmTrapezoidPoints[3],
            forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5], length_of_muscle_line_br * BR_IZ_ZONE_START);

        var innervation_point2_br = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3],
            forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5], length_of_muscle_line_br * BR_IZ_ZONE_END);

        var innervation_line_br = main_canvas.line(innervation_point1_br.x_point, innervation_point1_br.y_point, innervation_point2_br.x_point, innervation_point2_br.y_point);
        innervation_line_br.attr({opacity:0.5, strokeWidth:1, stroke:"#ff0045"});

        return[innervation_line_fcr, innervation_line_br, innervation_line_pl, innervation_line_fcu];
    }

    function renderMuscleLines(forearmTrapezoidPoints, main_canvas) {
        var wrist_mid_point = [(forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7])/2];

        var fcr_muscle_line = main_canvas.line(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1], forearmTrapezoidPoints[4], forearmTrapezoidPoints[5]);
        fcr_muscle_line.attr({opacity:0.5, strokeWidth:1, stroke:"#616161"});

        var pl_muscle_line = main_canvas.line(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1], wrist_mid_point[0], wrist_mid_point[1]);
        pl_muscle_line.attr({opacity:0.5, strokeWidth:1, stroke:"#616161"});

        var br_muscle_line = main_canvas.line(forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3], forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5]);
        br_muscle_line.attr({opacity:0.5, strokeWidth:1, stroke:"#616161"});

        var fcu_muscle_line = main_canvas.line(forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1], forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7]);
        fcu_muscle_line.attr({opacity:0.5, strokeWidth:1, stroke:"#616161"});

        //pronator quadrtus muscle is ~6cm in length and 3.5cm in width.

        var pq_muscle_line = main_canvas.line(wrist_mid_point[0], wrist_mid_point[1], wrist_mid_point[0], wrist_mid_point[1] - 60);
        pq_muscle_line.attr({opacity:0.5, strokeWidth:1, stroke:"#616161"});

        return [fcr_muscle_line, br_muscle_line, pl_muscle_line, pq_muscle_line, fcu_muscle_line];

    }

    function renderForearmPolygon(forearmTrapezoidPoints, main_canvas){
        var forearm_trapezoid = main_canvas.polygon(forearmTrapezoidPoints[0],forearmTrapezoidPoints[1],forearmTrapezoidPoints[2],
            forearmTrapezoidPoints[3], forearmTrapezoidPoints[4], forearmTrapezoidPoints[5], forearmTrapezoidPoints[6], forearmTrapezoidPoints[7]);
        forearm_trapezoid.attr({ fill: "#D7895E", stroke: "black", opacity:0.7 });

        return forearm_trapezoid;
    }




    return{
        RenderElectrode: function(electrode, s){
            return renderElectrode(electrode, s);
        },
        RenderKeyPoint: function(keypoint, s){
            renderKeyPoint(keypoint, s);
        },
        RenderAllKeyPoints: function (keyPointSet, s) {
            return renderAllKeyPoints(keyPointSet, s);
        },
        RenderAllElectrodes: function (electrodeSet, s) {
            return renderAllElectrodes(electrodeSet, s);
        },
        RenderConvexHull: function (coordsArray, s){
            renderConvexHull(coordsArray, s);
        },
        RenderGridWithLines: function (s) {
            drawGridWithLines(s);
        },
        RenderInnervationZones: function (forearmTrapezoidPoints, main_canvas){
            return renderInnervationZones(forearmTrapezoidPoints, main_canvas);
        },
        RenderMuscleLines: function (forearmTrapezoidPoints, main_canvas) {
            return renderMuscleLines(forearmTrapezoidPoints, main_canvas)
        },
        RenderForearmPolygon: function(forearmTrapezoidPoints, main_canvas){
            return renderForearmPolygon(forearmTrapezoidPoints, main_canvas);
        }

    }


})();
