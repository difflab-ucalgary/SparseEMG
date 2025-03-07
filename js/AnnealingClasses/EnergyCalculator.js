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


/* This class handles the energy function calculation of the energy function. It has all the functions that
*  calculate the energy functions of EMG, EDA and ECG modalities.
* */


var EnergyCalculator = (function () {

    var BRACHIORADIALIS_MUSCLE_WIDTH = 10; //width of brachioradilais muscle is on an average 2cm. (Flaps and Reconstructive Surgery E-Book - Fu-Chan Wei, Samir Mardini)
    var PALMARLONGUS_MUSCLE_WIDTH = 10;
    var FLEXORCARPIULNARIS_MUSCLE_WIDTH = 10;
    var PRONATOR_QUADRATUS_LENGTH = 60; // average length of pronator quadratus muscle is ~6cm
    var PRONATOR_QUADRATUS_WIDTH = 30;

 //   var FCU_IZ_ZONE_START = 0.4;  //innervation zone starts at 40% of the muscle line
   // var FCU_IZ_ZONE_END = 0.52; //innervation zone ends at 40% of the muscle line

    /*Taking a conservative approach here to have the electrode on the muscle belly.
        average width of pronator quadratus is ~3.5cm.  Citation: (V. Créteur, A. Madani, J.-L. Brasseur,
        Pronator quadratus imaging,
        Diagnostic and Interventional Imaging,
        Volume 93, Issue 1,
        2012,
        Pages 22-29)*/

    var OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE = 25;  // setting hte inter-electrode emg distance as 2.5cm i.e ~ 1 inch.
    var MAX_EMG_INTER_ELECTRODE_DISTANCE = 60;
    var DISTANCE_TO_INNERVATION_ZONE_THRESHOLD = 5;
    var br_score;
    var MIN_REQUIRED_ECG_SNR = 17.44; // normalizing this with respect to the peak value


    var LayoutEnergy = new Array();

    LayoutEnergy.BrScore = -1;
    LayoutEnergy.FCRScore = -1;
    LayoutEnergy.PLScore = -1;
    LayoutEnergy.PQScore = -1;
    LayoutEnergy.FCUScore = -1;
    LayoutEnergy.EDAScore = -1;
    LayoutEnergy.ECGScore = -1;
    LayoutEnergy.EMGScore = 0;
    LayoutEnergy.AreaScore = -1;



    function EMG_angle_cost_function(angle){
        if(angle > 60){
            return 1;
        }else{
            return ((0.0035 * angle) + (0.00011 * angle * angle)) / 0.606;  // divide by 0.606 because the angle range is from 0-60, hence mapping all angles from 0 t0 60 in the range 0 to 1
        }
    }

    function EMG_inter_electrode_distance_cost_function(electrode_distance){
        //the closest curve fit equation is : -0.0125612 + 0.05865171*x -(0.000741382 *x^2)
        var ied_score = 1- (-0.0125612 + (0.05865171*electrode_distance) - (0.000741382 * electrode_distance * electrode_distance));
        if(ied_score > 1)
            return 1
        else
            return ied_score ;
    }

    function calculateFCUScore(electrode1, electrode2, forearmTrapezoidPoints, main_canvas) {
        var electrode_angle;
        var electrode_distance;
        var angle_score, distance_score;
        var fcu_score;

        var length_of_muscle_line = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7]);


        var innervation_point1 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7], length_of_muscle_line * FCU_IZ_ZONE_START);

        var innervation_point2 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7], length_of_muscle_line * FCU_IZ_ZONE_END);

        // var innervation_line = main_canvas.line(innervation_point1.x_point, innervation_point1.y_point, innervation_point2.x_point, innervation_point2.y_point);
        // innervation_line.attr({opacity:0.5, strokewidth:1, stroke:"#ff0045"});

        var electrode1_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
            forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7]);

        var electrode2_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
            forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7]);

        // console.log(electrode1_distance_from_muscle_line);
        // console.log(electrode2_distance_from_muscle_line);

        if( (electrode1_distance_from_muscle_line > FLEXORCARPIULNARIS_MUSCLE_WIDTH) && (electrode2_distance_from_muscle_line > FLEXORCARPIULNARIS_MUSCLE_WIDTH)){
            angle_score = 1;
            distance_score =1;
            fcu_score = 1;
            return [angle_score, distance_score, fcu_score];
        }else {
            var distance_to_innervation_zone1 = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);
            // console.log(distance_to_innervation_zone1);

            var distance_to_innervation_zone2 = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);

            //  console.log(distance_to_innervation_zone2);

            if ((distance_to_innervation_zone1 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD) && (distance_to_innervation_zone2 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD)) {
                electrode_angle = Utils.GetAngleBetweenVectors(electrode1.x, electrode1.y, electrode2.x, electrode2.y,
                    forearmTrapezoidPoints[0] + 5, forearmTrapezoidPoints[1],
                    forearmTrapezoidPoints[6] + 5, forearmTrapezoidPoints[7]);
                electrode_angle = electrode_angle * 180 / Math.PI; // convert to degrees
                if(electrode_angle > 90){
                    electrode_angle = 180 - electrode_angle;
                }
                //  console.log(electrode_angle);

                //electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
                electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y) ;
                //  console.log(electrode_distance);

                angle_score = EMG_angle_cost_function(electrode_angle);

                if(angle_score >= 1){
                    angle_score = 1;
                    distance_score =1;
                    fcu_score = 1;
                    return [angle_score, distance_score, fcu_score];
                }

                if (electrode_distance < OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) {
                    distance_score = EMG_inter_electrode_distance_cost_function(electrode_distance);
                } else if ((electrode_distance >= OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) && (electrode_distance <= MAX_EMG_INTER_ELECTRODE_DISTANCE)) {
                    distance_score = 0;
                }else if(electrode_distance > MAX_EMG_INTER_ELECTRODE_DISTANCE){
                    distance_score = 1;
                }


                //  console.log("Angle Score:" + angle_score + "Distance score:" + distance_score);

                fcu_score = (angle_score + distance_score) / 2;
                // console.log("FCR Muscle score:" + fcr_score);

            } else {
                angle_score = 1;
                distance_score =1;
                fcu_score = 1;
                return [angle_score, distance_score, fcu_score];
            }
        }
        // console.log(fcr_score);
        return [angle_score, distance_score, fcu_score];


    }
    function calculatePQScore(electrode1,electrode2, forearmTrapezoidPoints, main_canvas) {
        var electrode_angle;
        var electrode_distance;
        var angle_score, distance_score;
        var pq_score;


        var wrist_mid_point = [(forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7])/2];

        var length_of_muscle_line = Utils.GetDistanceBetweenPoints( wrist_mid_point[0], wrist_mid_point[1] - PRONATOR_QUADRATUS_LENGTH,
            wrist_mid_point[0], wrist_mid_point[1]);



        var electrode1_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
            wrist_mid_point[0], wrist_mid_point[1] - PRONATOR_QUADRATUS_LENGTH,
            wrist_mid_point[0], wrist_mid_point[1]);
        var electrode2_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
            wrist_mid_point[0], wrist_mid_point[1] - PRONATOR_QUADRATUS_LENGTH,
            wrist_mid_point[0], wrist_mid_point[1]);

        var electrode1_y = parseFloat(electrode1.y);
        var electrode2_y = parseFloat(electrode2.y);
        if( ( electrode1_y< (wrist_mid_point[1] - PRONATOR_QUADRATUS_LENGTH)) ||
            (electrode2_y < (wrist_mid_point[1] - PRONATOR_QUADRATUS_LENGTH))){
            angle_score = 1;
            distance_score =1;
            pq_score = 1;
            return [angle_score, distance_score, pq_score];
        }

        if( (electrode1_distance_from_muscle_line > PRONATOR_QUADRATUS_WIDTH) && (electrode2_distance_from_muscle_line > PRONATOR_QUADRATUS_WIDTH)){
            angle_score = 1;
            distance_score =1;
            pq_score = 1;
            return [angle_score, distance_score, pq_score];
        }else {
            // electrode_angle = Utils.GetAngleBetweenVectors(electrode1.x, electrode1.y, electrode2.x, electrode2.y,
            //     wrist_mid_point[0], wrist_mid_point[1] - PRONATOR_QUADRATUS_LENGTH,
            //     wrist_mid_point[0], wrist_mid_point[1]);
            electrode_angle = Utils.GetAngleBetweenVectors(electrode1.x, electrode1.y, electrode2.x, electrode2.y,
                keyPointSet[6].x, keyPointSet[6].y, keyPointSet[7].x, keyPointSet[7].y);

            electrode_angle = electrode_angle * 180 / Math.PI; // convert to degrees
            if(electrode_angle > 90){
                electrode_angle = 180 - electrode_angle;
            }
            angle_score = EMG_angle_cost_function(electrode_angle);

            if(angle_score >= 1){
                angle_score = 1;
                distance_score =1;
                pq_score = 1;
                return [angle_score, distance_score, pq_score];
            }

            //electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
            electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
            if (electrode_distance < OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) {
                distance_score = EMG_inter_electrode_distance_cost_function(electrode_distance);
            } else if ((electrode_distance >= OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) && (electrode_distance <= MAX_EMG_INTER_ELECTRODE_DISTANCE)) {
                distance_score = 0;
            }else if(electrode_distance > MAX_EMG_INTER_ELECTRODE_DISTANCE){
                distance_score = 1;
            }
            pq_score = (angle_score + distance_score) / 2;
            //  console.log("PL Muscle score:" + pl_score);
        }

        // console.log(pl_score);
        return [angle_score, distance_score, pq_score];

    }


    function calculatePLScore(electrode1,electrode2, forearmTrapezoidPoints, main_canvas) {
        var electrode_angle;
        var electrode_distance;
        var angle_score, distance_score;
        var pl_score;

        var wrist_mid_point = [(forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7])/2];

        var length_of_muscle_line = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1]);

        var innervation_point1 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1], length_of_muscle_line * PL_IZ_ZONE_START);

        var innervation_point2 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1], length_of_muscle_line * PL_IZ_ZONE_END);

        // var innervation_line = main_canvas.line(innervation_point1.x_point, innervation_point1.y_point, innervation_point2.x_point, innervation_point2.y_point);
        // innervation_line.attr({opacity:0.5, strokewidth:1, stroke:"#ff0045"});

        var electrode1_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
            forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1]);
        var electrode2_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
            forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            wrist_mid_point[0], wrist_mid_point[1]);
        //console.log(electrode1_distance_from_muscle_line);
        // console.log(electrode2_distance_from_muscle_line);

        if( (electrode1_distance_from_muscle_line > PALMARLONGUS_MUSCLE_WIDTH) && (electrode2_distance_from_muscle_line > PALMARLONGUS_MUSCLE_WIDTH)){
            angle_score = 1;
            distance_score =1;
            pl_score = 1;
            return [angle_score, distance_score, pl_score];
        }else {
            var distance_to_innervation_zone1 = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);
            // console.log(distance_to_innervation_zone1);

            var distance_to_innervation_zone2 = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);

            // console.log(distance_to_innervation_zone2);

            if ((distance_to_innervation_zone1 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD) && (distance_to_innervation_zone2 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD)) {
                electrode_angle = Utils.GetAngleBetweenVectors(electrode1.x, electrode1.y, electrode2.x, electrode2.y,
                    forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
                    wrist_mid_point[0], wrist_mid_point[1]);
                electrode_angle = electrode_angle * 180 / Math.PI; // convert to degrees
                if(electrode_angle > 90){
                    electrode_angle = 180 - electrode_angle;
                }
                // console.log(electrode_angle);

                //electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
                electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
                //  console.log(electrode_distance);

                angle_score = EMG_angle_cost_function(electrode_angle);
                if(angle_score >= 1){
                    angle_score = 1;
                    distance_score =1;
                    pl_score = 1;
                    return [angle_score, distance_score, pl_score];
                }

                if (electrode_distance < OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) {
                    distance_score = EMG_inter_electrode_distance_cost_function(electrode_distance);
                } else if ((electrode_distance >= OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) && (electrode_distance <= MAX_EMG_INTER_ELECTRODE_DISTANCE)) {
                    distance_score = 0;
                }else if(electrode_distance > MAX_EMG_INTER_ELECTRODE_DISTANCE){
                    distance_score = 1;
                }


                //console.log("Angle Score:" + angle_score + "Distance score:" + distance_score);

                pl_score = (angle_score + distance_score) / 2;
                //  console.log("PL Muscle score:" + pl_score);

            } else {
                angle_score = 1;
                distance_score =1;
                pl_score = 1;
                return [angle_score, distance_score, pl_score];
            }
        }
        // console.log(pl_score);
        return [angle_score, distance_score, pl_score];

    }

    function calculateFCRScore(electrode1,electrode2, forearmTrapezoidPoints, main_canvas) {
        var electrode_angle;
        var electrode_distance;
        var angle_score, distance_score;
        var fcr_score;

        var length_of_muscle_line = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5]);

        var innervation_point1 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5], length_of_muscle_line * FCR_IZ_ZONE_START);

        var innervation_point2 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5], length_of_muscle_line * FCR_IZ_ZONE_END);

        // var innervation_line = main_canvas.line(innervation_point1.x_point, innervation_point1.y_point, innervation_point2.x_point, innervation_point2.y_point);
        // innervation_line.attr({opacity:0.5, strokewidth:1, stroke:"#ff0045"});

        var electrode1_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
            forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5]);

        var electrode2_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
            forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5]);

        // console.log(electrode1_distance_from_muscle_line);
        // console.log(electrode2_distance_from_muscle_line);

        if( (electrode1_distance_from_muscle_line > BRACHIORADIALIS_MUSCLE_WIDTH) && (electrode2_distance_from_muscle_line > BRACHIORADIALIS_MUSCLE_WIDTH)){
            angle_score = 1;
            distance_score =1;
            fcr_score = 1;
            return [angle_score, distance_score, fcr_score];
        }else {
            var distance_to_innervation_zone1 = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);
            // console.log(distance_to_innervation_zone1);

            var distance_to_innervation_zone2 = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);

            //  console.log(distance_to_innervation_zone2);

            if ((distance_to_innervation_zone1 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD) && (distance_to_innervation_zone2 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD)) {
                electrode_angle = Utils.GetAngleBetweenVectors(electrode1.x, electrode1.y, electrode2.x, electrode2.y,
                    forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
                    forearmTrapezoidPoints[4], forearmTrapezoidPoints[5]);
                electrode_angle = electrode_angle * 180 / Math.PI; // convert to degrees
                if(electrode_angle > 90){
                    electrode_angle = 180 - electrode_angle;
                }
                //  console.log(electrode_angle);

                electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
                //electrode_distance = Utils.GetEMGIED(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
                //  console.log(electrode_distance);

                angle_score = EMG_angle_cost_function(electrode_angle);

                if(angle_score >= 1){
                    angle_score = 1;
                    distance_score =1;
                    fcr_score = 1;
                    return [angle_score, distance_score, fcr_score];
                }

                if (electrode_distance < OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) {
                    distance_score = EMG_inter_electrode_distance_cost_function(electrode_distance);
                } else if ((electrode_distance >= OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) && (electrode_distance <= MAX_EMG_INTER_ELECTRODE_DISTANCE)) {
                    distance_score = 0;
                }else if(electrode_distance > MAX_EMG_INTER_ELECTRODE_DISTANCE){
                    distance_score = 1;
                }


                //  console.log("Angle Score:" + angle_score + "Distance score:" + distance_score);

                fcr_score = (angle_score + distance_score) / 2;
                // console.log("FCR Muscle score:" + fcr_score);

            } else {
                angle_score = 1;
                distance_score =1;
                fcr_score = 1;
                return [angle_score, distance_score, fcr_score];
            }
        }
        // console.log(fcr_score);
        return [angle_score, distance_score, fcr_score];

    }


    function calculateBRScore(electrode1,electrode2, forearmTrapezoidPoints, main_canvas){
        var electrode_angle;
        var electrode_distance;
        var angle_score, distance_score;


        var length_of_muscle_line = Utils.GetDistanceBetweenPoints( forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3],
            forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5]);
        var innervation_point1 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5], length_of_muscle_line * BR_IZ_ZONE_START);

        var innervation_point2 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[0], forearmTrapezoidPoints[1],
            forearmTrapezoidPoints[4], forearmTrapezoidPoints[5], length_of_muscle_line * BR_IZ_ZONE_END);

        // var innervation_point1 = [forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3]];
        // var innervation_point2 = Utils.GetKeyPointOnTheLine(forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3],
        //                                                     forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5], length_of_muscle_line/3);

        // var innervation_line = main_canvas.line(innervation_point1[0], innervation_point1[1], innervation_point2.x_point, innervation_point2.y_point);
        // innervation_line.attr({opacity:0.5, strokewidth:1, stroke:"#ff0045"});

        var electrode1_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode1.x, electrode1.y,
            forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3],
            forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5]);
        var electrode2_distance_from_muscle_line = Utils.GetDistanceOfPointFromLine(electrode2.x, electrode2.y,
            forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3],
            forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5]);

        if( (electrode1_distance_from_muscle_line > BRACHIORADIALIS_MUSCLE_WIDTH) && (electrode2_distance_from_muscle_line > BRACHIORADIALIS_MUSCLE_WIDTH)){
            angle_score = 1;
            distance_score =1;
            br_score = 1;
            return [angle_score, distance_score, br_score];
        }else{
            var distance_to_innervation_zone1 = Utils.GetDistanceOfPointFromLine( electrode1.x, electrode1.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);
            // console.log(distance_to_innervation_zone1);
            var distance_to_innervation_zone2 = Utils.GetDistanceOfPointFromLine( electrode2.x, electrode2.y,
                innervation_point1.x_point, innervation_point1.y_point,
                innervation_point2.x_point, innervation_point2.y_point);
            // console.log(distance_to_innervation_zone2);

            if( (distance_to_innervation_zone1 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD) && (distance_to_innervation_zone2 > DISTANCE_TO_INNERVATION_ZONE_THRESHOLD)){
                electrode_angle = Utils.GetAngleBetweenVectors( electrode1.x, electrode1.y, electrode2.x, electrode2.y,
                    forearmTrapezoidPoints[2] - 5, forearmTrapezoidPoints[3],
                    forearmTrapezoidPoints[4] - 5, forearmTrapezoidPoints[5])
                electrode_angle = electrode_angle * 180 / Math.PI; // convert to degrees
                if(electrode_angle > 90){
                    electrode_angle = 180 - electrode_angle;
                }
                //console.log(electrode_angle);

                //electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
                electrode_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
               //  console.log("BR IDE:: " + electrode_distance);

                angle_score = EMG_angle_cost_function(electrode_angle);
                if(angle_score >= 1){
                    angle_score = 1;
                    distance_score =1;
                    br_score = 1;
                    return [angle_score, distance_score, br_score];
                }

                if(electrode_distance < OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE){
                    distance_score = EMG_inter_electrode_distance_cost_function(electrode_distance);
                }else if ((electrode_distance >= OPTIMAL_EMG_INTER_ELECTRODE_DISTANCE) && (electrode_distance <= MAX_EMG_INTER_ELECTRODE_DISTANCE)){
                    distance_score = 0;
                }else if(electrode_distance > MAX_EMG_INTER_ELECTRODE_DISTANCE){
                    distance_score = 1;
                }


                // console.log("Angle Score:" +  angle_score + "Distance score:" + distance_score);

                br_score = (angle_score + distance_score) /2 ;
                // console.log("BR Muscle score:" + br_score);

            }else{
                angle_score = 1;
                distance_score =1;
                br_score = 1;
                return [angle_score, distance_score, br_score];
            }
        }
        return [angle_score, distance_score, br_score];

    }

    var RECOMMENDED_EDA_DISTANCE = 60;
    var RECOMMENDED_EDA_DISTANCE_IN_CM = RECOMMENDED_EDA_DISTANCE / 10;
    var EDA_ELECTRODE_SIZE_IN_CM = EDA_ELECTRODE_SIZE / 10;
    var Ds = 108; //Density of the sweat glands on forearm
    var Nmax =  Math.ceil( ( (Math.PI * EDA_ELECTRODE_SIZE_IN_CM * EDA_ELECTRODE_SIZE_IN_CM) + (RECOMMENDED_EDA_DISTANCE_IN_CM * 2 * EDA_ELECTRODE_SIZE_IN_CM ) ) * Ds);
    function eda_inter_electrode_distance_score(electrode_distance) {
        var eda_score;
        var electrode_distance_in_cm = electrode_distance / 10.0;
        var Ns = Math.ceil( ( (Math.PI * EDA_ELECTRODE_SIZE_IN_CM * EDA_ELECTRODE_SIZE_IN_CM) + (electrode_distance_in_cm * 2 * EDA_ELECTRODE_SIZE_IN_CM ) ) * Ds);

        if(Ns < 140){
            return 1;
        }else if(electrode_distance > RECOMMENDED_EDA_DISTANCE){
            return 1;
        }else{
            return 1 - (Ns/Nmax);
        }
    }

    function getEDAScore(electrodeSet){
        var eda_distance, eda_score;
        for(var i = 0 ; i < electrodeSet.length; i++){
            if(electrodeSet[i].type == "eda"){
                eda_distance = Utils.GetDistanceBetweenPoints(electrodeSet[i].x, electrodeSet[i].y, electrodeSet[i + 1].x, electrodeSet[i+ 1].y);
                eda_score = eda_inter_electrode_distance_score(eda_distance);
                return eda_score;
            }
        }
    }

    function calculateEDAScore(electrode1, electrode2) {
        var eda_score, eda_distance;
        eda_distance = Utils.GetDistanceBetweenPoints(electrode1.x, electrode1.y, electrode2.x, electrode2.y);
        eda_score = eda_inter_electrode_distance_score(eda_distance);
        return [eda_distance, eda_score];
    }

    function getECGSNRForPair(electrodeId1, electrodeId2){

        if((electrodeId1 == "ecg1") && (electrodeId2 =="ecg2")){
            return 4.36;
        }
        else if((electrodeId1 == "ecg3") && (electrodeId2 == "ecg4")){
            return 17.44;
        }
        else if((electrodeId1 == "ecg5") && (electrodeId2 == "ecg6")){
            return 8.27;
        }
        // else if((electrodeId1 == "ecg7") && (electrodeId2 == "ecg8")){
        //     return 36.13;
        // }
        else if((electrodeId1 == "ecg1") && (electrodeId2 == "ecg6")){
            return 5.16;
        }
        // else if((electrodeId1 == "ecg1") && (electrodeId2 == "ecg4")){
        //     return 41.84;
        // }
        else if((electrodeId1 == "ecg4") && (electrodeId2 == "ecg5")){
            return 9.39;
        }

    }

    function calculateECGScore(electrode1, electrode2) {
        var ecg_score = getECGSNRForPair(electrode1.id, electrode2.id);
        ecg_score = ecg_score / MIN_REQUIRED_ECG_SNR;
        if(ecg_score > 1){
            ecg_score = 0;
        }else{
            ecg_score = 1 - ecg_score;
            //return 1- ecg_score;
        }
        return ecg_score;
    }

    var total_layout_energy = 0 ;
    var total_emg_energy = 0;
    var selected_muscles = 0;
    var emg_selected = false;
    var eda_selected = false;
    var ecg_selected= false;
    var c = 0;

    function calculateSystemEnergy(electrodeSet, forearmTrapezoidpoints, weights, main_canvas){
        selected_muscles = 0; total_emg_energy = 0; total_layout_energy = 0;

        for(var i = 0 ; i < electrodeSet.length; i = i+2){
            if((electrodeSet[i].type == "emg") && (electrodeSet[i + 1].type == "emg")){
                //energy.type = electrodeSet[i].type;
                //energy.id = electrodeSet[i].id
                if(electrodeSet[i].id == "BR1"){
                    var BRscore = EnergyCalculator.CalculateBRScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.BrScore = BRscore;
                    //   LayoutEnergy.BrScore[2] = 1 - BRscore[2];
                    total_emg_energy +=  LayoutEnergy.BrScore[2];
                    //  console.log(LayoutEnergy.BrScore);
                }else if(electrodeSet[i].id == "FCR1"){
                    var FCRscore = EnergyCalculator.CalculateFCRScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.FCRScore = FCRscore;
                    // LayoutEnergy.FCRScore[2] = 1 - FCRscore[2];
                    total_emg_energy +=  LayoutEnergy.FCRScore[2];
                    //  console.log(LayoutEnergy.FCRScore);
                }else if(electrodeSet[i].id == "PL1"){
                    var PLscore = EnergyCalculator.CalculatePLScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.PLScore = PLscore;
                    //  LayoutEnergy.PLScore[2] = 1 - PLscore[2];
                    total_emg_energy += LayoutEnergy.PLScore[2];
                    //   console.log(LayoutEnergy.PLScore);
                }else if(electrodeSet[i].id == "PQ1"){
                    var PQscore = EnergyCalculator.CalculatePQScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.PQScore = PQscore;
                    // LayoutEnergy.PQScore[2] = 1 - PQscore[2];
                    total_emg_energy += LayoutEnergy.PQScore[2];
                    //   console.log(LayoutEnergy.PQScore);
                }else if(electrodeSet[i].id == "FCU1"){
                    var FCUscore = EnergyCalculator.CalculateFCUScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.FCUScore = FCUscore;
                    //LayoutEnergy.FCUScore[2] = 1 - FCUscore[2];
                    total_emg_energy += LayoutEnergy.FCUScore[2];
                    //  console.log(LayoutEnergy.FCUScore);
                }

            }else if((electrodeSet[i].type == "eda") && (electrodeSet[i].type == "eda")){
                LayoutEnergy.EDAScore = calculateEDAScore(electrodeSet[i], electrodeSet[i + 1]);
                eda_selected = true;
                //console.log(LayoutEnergy.EDAScore);
                total_layout_energy += weights[1] * LayoutEnergy.EDAScore[1];

            }else if((electrodeSet[i].type == "ecg") && (electrodeSet[i].type == "ecg")){
                LayoutEnergy.ECGScore = calculateECGScore(electrodeSet[i], electrodeSet[i + 1]);
                ecg_selected = true;
                //   console.log(LayoutEnergy.ECGScore);
                total_layout_energy += weights[2] * LayoutEnergy.ECGScore;
            }
        }
        var hull_points = ElectrodeLayout.GetConvexHull(electrodeSet);
        hull_points = Utils.Convert2DArrayTo1D(hull_points);
        var hull_area = Utils.GetPolygonArea(Utils.GetXCoords(hull_points), Utils.GetYCoords(hull_points), hull_points.length/2);
        // console.log("Area of Convex Hull: " + hull_area);
        if(weights[3] > 0){
            LayoutEnergy.AreaScore = hull_area * weights[3];
            total_layout_energy += LayoutEnergy.AreaScore;
        }
        LayoutEnergy.EMGScore = total_emg_energy / selected_muscles;
        total_layout_energy += weights[0] * (total_emg_energy / selected_muscles);
        //total_layout_energy -= 1;

        console.log(LayoutEnergy);
        return (total_layout_energy);

    }
    function calculateSystemEnergyForArea(electrodeSet, forearmTrapezoidpoints, weights, area, main_canvas){
        var total_layout_energy = 0 ;
        var total_emg_energy = 0;
        var selected_muscles = 0;
        var emg_selected = false;
        var eda_selected = false;
        var ecg_selected= false;
        var c = 0;
        var hull_points = ElectrodeLayout.GetConvexHull(electrodeSet);
        hull_points = Utils.Convert2DArrayTo1D(hull_points);
        var hull_area = Utils.GetPolygonArea(Utils.GetXCoords(hull_points), Utils.GetYCoords(hull_points), hull_points.length/2);
        var hull_area_in_cm = hull_area / 100; //convert the area into cm2
        var normalized_area_score = hull_area / BASELINE_AREA;

        // if(hull_area_in_cm > area){
        //     return 1;
        // }
        for(var i = 0 ; i < electrodeSet.length; i = i+2){
            if((electrodeSet[i].type == "emg") && (electrodeSet[i + 1].type == "emg")){
                //energy.type = electrodeSet[i].type;
                //energy.id = electrodeSet[i].id
                if(electrodeSet[i].id == "BR1"){
                    var BRscore = EnergyCalculator.CalculateBRScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.BrScore = BRscore;
                    //   LayoutEnergy.BrScore[2] = 1 - BRscore[2];
                    total_emg_energy +=  LayoutEnergy.BrScore[2];
                    //  console.log(LayoutEnergy.BrScore);
                }else if(electrodeSet[i].id == "FCR1"){
                    var FCRscore = EnergyCalculator.CalculateFCRScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.FCRScore = FCRscore;
                    // LayoutEnergy.FCRScore[2] = 1 - FCRscore[2];
                    total_emg_energy +=  LayoutEnergy.FCRScore[2];
                    //  console.log(LayoutEnergy.FCRScore);
                }else if(electrodeSet[i].id == "PL1"){
                    var PLscore = EnergyCalculator.CalculatePLScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.PLScore = PLscore;
                    //  LayoutEnergy.PLScore[2] = 1 - PLscore[2];
                    total_emg_energy += LayoutEnergy.PLScore[2];
                    //   console.log(LayoutEnergy.PLScore);
                }else if(electrodeSet[i].id == "PQ1"){
                    var PQscore = EnergyCalculator.CalculatePQScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.PQScore = PQscore;
                    // LayoutEnergy.PQScore[2] = 1 - PQscore[2];
                    total_emg_energy += LayoutEnergy.PQScore[2];
                    //   console.log(LayoutEnergy.PQScore);
                }else if(electrodeSet[i].id == "FCU1"){
                    var FCUscore = EnergyCalculator.CalculateFCUScore(electrodeSet[i], electrodeSet[i + 1], forearmTrapezoidPoints, main_canvas);
                    selected_muscles++;
                    emg_selected = true;
                    LayoutEnergy.FCUScore = FCUscore;
                    //LayoutEnergy.FCUScore[2] = 1 - FCUscore[2];
                    total_emg_energy += LayoutEnergy.FCUScore[2];
                    //  console.log(LayoutEnergy.FCUScore);
                }

            }else if((electrodeSet[i].type == "eda") && (electrodeSet[i].type == "eda")){
                LayoutEnergy.EDAScore = calculateEDAScore(electrodeSet[i], electrodeSet[i + 1]);
                eda_selected = true;
                console.log(LayoutEnergy.EDAScore);
                total_layout_energy += weights[1] * LayoutEnergy.EDAScore[1];

            }else if((electrodeSet[i].type == "ecg") && (electrodeSet[i].type == "ecg")){
                LayoutEnergy.ECGScore = calculateECGScore(electrodeSet[i], electrodeSet[i + 1]);
                ecg_selected = true;
                //   console.log(LayoutEnergy.ECGScore);
                total_layout_energy += weights[2] * LayoutEnergy.ECGScore;
            }
        }

        // console.log("Area of Convex Hull: " + hull_area);
        if(weights[3] > 0){
            //hull_area_in_cm = hull_area_in_cm/100;
            if(normalized_area_score > 1)
                normalized_area_score = 1;
            LayoutEnergy.AreaScore = normalized_area_score * weights[3];
            total_layout_energy += LayoutEnergy.AreaScore;
        }
        LayoutEnergy.EMGScore = total_emg_energy / selected_muscles;
        total_layout_energy += weights[0] * (total_emg_energy / selected_muscles);
        //total_layout_energy -= 1;


        return (total_layout_energy);

    }

    return {
        GetEDAScore: function (electrodeSet) {
            return getEDAScore(electrodeSet);
        },
        RenderMuscleLines: function (forearmTrapezoidpoints, main_canvas) {
            renderMuscleLines(forearmTrapezoidpoints, main_canvas);
        },
        CalculateBRScore: function (electrode1, electrode2, forearmTrapezoidpoints, main_canvas) {
            return calculateBRScore(electrode1, electrode2, forearmTrapezoidpoints, main_canvas);
        },
        CalculateFCRScore: function (electrode1, electrode2, forearmTrapezoidpoints, main_canvas) {
            return calculateFCRScore(electrode1, electrode2, forearmTrapezoidpoints, main_canvas);
        },
        CalculatePLScore: function (electrode1, electrode2, forearmTrapezoidpoints, main_canvas) {
            return calculatePLScore(electrode1, electrode2, forearmTrapezoidpoints, main_canvas);
        },
        CalculatePQScore: function (electrode1, electrode2, forearmTrapezoidpoints, main_canvas) {
            return calculatePQScore(electrode1, electrode2, forearmTrapezoidpoints, main_canvas);
        },
        CalculateFCUScore: function (electrode1, electrode2, forearmTrapezoidpoints, main_canvas) {
            return calculateFCUScore(electrode1, electrode2, forearmTrapezoidpoints, main_canvas);
        },
        CalculateEDAScore: function (electrode1, electrode2) {
            return calculateEDAScore(electrode1, electrode2);
        },
        CalculateECGScore: function (electrode1, electrode2) {
            return calculateECGScore(electrode1, electrode2);
        },
        GetSystemEnergy: function (electrodeSet, forearmTrapezoidpoints, weights, main_canvas) {
            return calculateSystemEnergy(electrodeSet, forearmTrapezoidpoints, weights, main_canvas);
        },
        GetSystemEnergyForArea: function (electrodeSet, forearmTrapezoidpoints, weights, main_canvas) {
            return calculateSystemEnergyForArea(electrodeSet, forearmTrapezoidpoints, weights, main_canvas);
        },
        GetLayoutEnergy: function () {
            return LayoutEnergy;
        }
    }

})();