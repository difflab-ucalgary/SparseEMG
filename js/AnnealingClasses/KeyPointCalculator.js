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
KeypointCalculator Class: This class has all the functions that are required for calculating the keypoints for EMG and ECG electrode placement.
The keypoints are calculated for each of the muscles and the ECG electrodes.

*/
var KeypointCalculator = (function () {

    var keyPointSet = new Array();

    var EMG_INTERELECTRODE_DISTANCE = 25;

    var PRONATOR_QUADRATUS_DISTANCE = 25;

    var KEYPOINT_SIZE = 2;

    function calculateFlexorCapriRadialis(trapezoidPoints, s) {
        //calculate the muscle line for FCR. The line from the top left point of the trapezium to the bottom right corner.

        var muscle_line_fcr = [(trapezoidPoints[0] + trapezoidPoints[4])/2, (trapezoidPoints[1] + trapezoidPoints[5])/2];

        var keypoint, keypoint1, keypoint2;
        var keypoint1_distance, keypoint2_distance;
        var lengthOfMuscleLine = Utils.GetDistanceBetweenPoints(trapezoidPoints[0], trapezoidPoints[1], trapezoidPoints[4], trapezoidPoints[5]);
        keypoint = (Utils.GetKeyPointOnTheLine(trapezoidPoints[0], trapezoidPoints[1], trapezoidPoints[4], trapezoidPoints[5], lengthOfMuscleLine * FCR_KEYPOINT));
        keypoint1_distance = Utils.GetDistanceBetweenPoints(trapezoidPoints[0], trapezoidPoints[1], keypoint.x_point, keypoint.y_point);
        keypoint1 = (Utils.GetKeyPointOnTheLine(trapezoidPoints[0], trapezoidPoints[1], keypoint.x_point, keypoint.y_point, keypoint1_distance - Math.ceil(EMG_INTERELECTRODE_DISTANCE/2)));
        return [[keypoint1.x_point, keypoint1.y_point], [(2 * keypoint.x_point - keypoint1.x_point), (2*keypoint.y_point - keypoint1.y_point)]];

    }

    function calculateBrachioRadialis(trapezoidPoints, s){
        var mid_point = [(trapezoidPoints[2] + trapezoidPoints[4])/2, (trapezoidPoints[3] + trapezoidPoints[5])/2];
        var lengthOfMuscleLine = Utils.GetDistanceBetweenPoints(trapezoidPoints[2], trapezoidPoints[3], trapezoidPoints[4], trapezoidPoints[5]);
        var keypoint = (Utils.GetKeyPointOnTheLine(trapezoidPoints[2], trapezoidPoints[3], trapezoidPoints[4], trapezoidPoints[5], lengthOfMuscleLine * BR_KEYPOINT));
        var keypoint1_distance = Utils.GetDistanceBetweenPoints(trapezoidPoints[2], trapezoidPoints[3], keypoint.x_point, keypoint.y_point);
        var keypoint1 = (Utils.GetKeyPointOnTheLine(trapezoidPoints[2], trapezoidPoints[3], keypoint.x_point, keypoint.y_point, keypoint1_distance - Math.ceil(EMG_INTERELECTRODE_DISTANCE/2)));
        return [[keypoint1.x_point  - 5, keypoint1.y_point], [(2 * mid_point[0] - keypoint1.x_point) - 5, (2*mid_point[1] - keypoint1.y_point)]];

    }

    function calculateFelxorCarpiUlnaris(trapezoidPoints, s){
        var mid_point = [(trapezoidPoints[0] + trapezoidPoints[6])/2, (trapezoidPoints[1] + trapezoidPoints[7])/2];
        var lengthOfMuscleLine = Utils.GetDistanceBetweenPoints(trapezoidPoints[0], trapezoidPoints[1], trapezoidPoints[6], trapezoidPoints[7]);
        var keypoint;
        var keypoint1_distance;
        keypoint = (Utils.GetKeyPointOnTheLine(trapezoidPoints[0], trapezoidPoints[1], trapezoidPoints[6], trapezoidPoints[7],  lengthOfMuscleLine * FCU_KEYPOINT));
        keypoint1_distance = Utils.GetDistanceBetweenPoints(trapezoidPoints[0], trapezoidPoints[1], keypoint.x_point, keypoint.y_point);
        var keypoint1 = (Utils.GetKeyPointOnTheLine(trapezoidPoints[0], trapezoidPoints[1], keypoint.x_point, keypoint.y_point, keypoint1_distance - Math.ceil(EMG_INTERELECTRODE_DISTANCE/2)));
        return [[keypoint1.x_point  + 5, keypoint1.y_point], [(2 * keypoint.x_point - keypoint1.x_point) + 5, (2*keypoint.y_point - keypoint1.y_point)]];
    }

    function calculatePalmarLongus(trapezoidPoints, s){
        var wrist_mid_point = [(trapezoidPoints[4] + trapezoidPoints[6])/2, (trapezoidPoints[5] + trapezoidPoints[7])/2];
        var lengthOfMuscleLine = Utils.GetDistanceBetweenPoints(wrist_mid_point[0], wrist_mid_point[1], trapezoidPoints[0], trapezoidPoints[1]);
        var keypoint, keypoint1, keypoint2;
        var keypoint1_distance, keypoint2_distance;
        keypoint = (Utils.GetKeyPointOnTheLine(trapezoidPoints[0], trapezoidPoints[1], wrist_mid_point[0], wrist_mid_point[1], lengthOfMuscleLine * PL_KEYPOINT));
        keypoint1_distance = Utils.GetDistanceBetweenPoints(trapezoidPoints[0], trapezoidPoints[1], keypoint.x_point, keypoint.y_point);
        keypoint1 = (Utils.GetKeyPointOnTheLine(trapezoidPoints[0], trapezoidPoints[1], keypoint.x_point, keypoint.y_point, keypoint1_distance - Math.ceil(EMG_INTERELECTRODE_DISTANCE/2)));
        return [[keypoint1.x_point, keypoint1.y_point], [(2 * keypoint.x_point - keypoint1.x_point), (2*keypoint.y_point - keypoint1.y_point)]];
    }

    function calculatePronatorQuadratis(trapezoidPoints, s){

        var wrist_mid_point = [(trapezoidPoints[4] + trapezoidPoints[6])/2, (trapezoidPoints[5] + trapezoidPoints[7])/2];
        var keypoint = [wrist_mid_point[0], wrist_mid_point[1] - PRONATOR_QUADRATUS_DISTANCE];
        var keypoint1 = [(keypoint[0] - EMG_INTERELECTRODE_DISTANCE/2), keypoint[1]];
        var keypoint2 = [(keypoint[0] + EMG_INTERELECTRODE_DISTANCE/2), keypoint[1]];

        return [keypoint1, keypoint2];
        // return [[wrist_mid_point[0], wrist_mid_point[1] - (PRONATOR_QUADRATUS_DISTANCE - EMG_INTERELECTRODE_DISTANCE/2)],
        //     [wrist_mid_point[0], wrist_mid_point[1] - (PRONATOR_QUADRATUS_DISTANCE + EMG_INTERELECTRODE_DISTANCE/2)]];
    }

    /* function calculateFlexorSuperficilais(trapezoidPoints, s){

     }*/

    function calculateKeyPoints(selectedMuscles, forearmTrapezoidPoints){
        var keyPointsArray = new Array();
        var symmetricPoints = new Array();


        var j = 0;



        if(selectedMuscles[0] == true){
            symmetricPoints = calculateFlexorCapriRadialis(forearmTrapezoidPoints, s);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "emg", "FCR1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "emg", "FCR2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[1] == true){
            symmetricPoints = calculateBrachioRadialis(forearmTrapezoidPoints, s);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "emg", "BR1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "emg", "BR2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[2] == true){
            symmetricPoints = calculatePalmarLongus(forearmTrapezoidPoints, s);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "emg", "PL1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "emg", "PL2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[3] == true){
            symmetricPoints = calculatePronatorQuadratis(forearmTrapezoidPoints, s);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "emg", "PQ1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "emg", "PQ2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[4] == true){
            symmetricPoints = calculateFelxorCarpiUlnaris(forearmTrapezoidPoints, s);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "EMG", "FCU1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "EMG", "FCU2" );
            j++;
            symmetricPoints = [];
        }

        /*  if(selectedMuscles[3] == true){
              symmetricPoints = calculateFlexorSuperficilais(forearmTrapezoidPoints, s);
              keyPointsArray[j] = new KeyPoint(symmetricPoints[0].x_point, symmetricPoints[0].y_point, 2, "EMG", "FDS1" );
              j++;
              keyPointsArray[j] = new KeyPoint(symmetricPoints[1].x_point, symmetricPoints[1].y_point, 2, "EMG", "FDS2" );
              j++;
              symmetricPoints = [];
          }*/

        if(SensorControls.CalculateNumECGElectrodes() > 0){
            keyPointsArray = calculateECGKeyPoints(keyPointsArray, forearmTrapezoidPoints, s);
        }



        return keyPointsArray;
    }

    // function calculateECGKeyPoints(keyPointSet, forearmTrapezoidPoints, s) {
    //     var sizeOfKeyPointSet = keyPointSet.length;
    //     if(keyPointSet[sizeOfKeyPointSet -1].type != "ECG" ||
    //         keyPointSet[sizeOfKeyPointSet - 1].type != "ecg"){
    //         var wrist_mid_point = [(forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7])/2];
    //
    //         keyPointSet[sizeOfKeyPointSet] = new KeyPoint(wrist_mid_point[0], wrist_mid_point[1], 2, "ecg", "ecg1" );
    //     }
    //     return keyPointSet;
    // }

    function calculateECGKeyPoints(keyPointSet, forearmTrapezoidPoints) {
        var sizeOfKeyPointSet = keyPointSet.length;
        if(keyPointSet[sizeOfKeyPointSet -1].type != "ECG" ||
            keyPointSet[sizeOfKeyPointSet - 1].type != "ecg"){

            var wrist_left_corner = [forearmTrapezoidPoints[6], (forearmTrapezoidPoints[7]) ];
            keyPointSet[sizeOfKeyPointSet] = new KeyPoint(wrist_left_corner[0] + 10, wrist_left_corner[1] - 10, KEYPOINT_SIZE, "ecg", "ecg1" );
            sizeOfKeyPointSet++;

            var wrist_right_corner = [forearmTrapezoidPoints[4], (forearmTrapezoidPoints[5]) ];
            keyPointSet[sizeOfKeyPointSet] = new KeyPoint(wrist_right_corner[0] - 10, wrist_right_corner[1] - 10, KEYPOINT_SIZE, "ecg", "ecg2" );
            sizeOfKeyPointSet++;

            var forearm_left_corner = [forearmTrapezoidPoints[0], (forearmTrapezoidPoints[1]) ];
            keyPointSet[sizeOfKeyPointSet] = new KeyPoint(forearm_left_corner[0] + 10, forearm_left_corner[1] + 10, KEYPOINT_SIZE, "ecg", "ecg3" );
            sizeOfKeyPointSet++;

            var forearm_right_corner = [forearmTrapezoidPoints[2], (forearmTrapezoidPoints[3]) ];
            keyPointSet[sizeOfKeyPointSet] = new KeyPoint(forearm_right_corner[0] - 10, forearm_right_corner[1] + 10, KEYPOINT_SIZE, "ecg", "ecg4" );
            sizeOfKeyPointSet++;

            var midarm_left_corner = [(forearmTrapezoidPoints[0] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[1] + forearmTrapezoidPoints[7])/2];
            keyPointSet[sizeOfKeyPointSet] = new KeyPoint(midarm_left_corner[0] + 10, midarm_left_corner[1] - 40, KEYPOINT_SIZE, "ecg", "ecg5" );
            sizeOfKeyPointSet++;

            var midarm_right_corner = [(forearmTrapezoidPoints[2] + forearmTrapezoidPoints[4])/2, (forearmTrapezoidPoints[3] + forearmTrapezoidPoints[5])/2];
            keyPointSet[sizeOfKeyPointSet] = new KeyPoint(midarm_right_corner[0] - 10, midarm_right_corner[1] - 40, KEYPOINT_SIZE, "ecg", "ecg6" );
            sizeOfKeyPointSet++;

            // var lower_wrist = [(forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7])/2];
            // keyPointSet[sizeOfKeyPointSet] = new KeyPoint(lower_wrist[0], lower_wrist[1] - 25, KEYPOINT_SIZE, "ecg", "ecg7" );
            // sizeOfKeyPointSet++;
            //
            // var upper_arm = [forearmTrapezoidPoints[0], (forearmTrapezoidPoints[1])];;
            // keyPointSet[sizeOfKeyPointSet] = new KeyPoint(upper_arm[0] + 20, upper_arm[1] + 20, KEYPOINT_SIZE, "ecg", "ecg8" );
            // sizeOfKeyPointSet++;
        }
        return keyPointSet;
    }

    function calculateEMGKeypoints(selectedMuscles, forearmTrapezoidPoints) {
        var keyPointsArray = new Array();
        var symmetricPoints = new Array();


        var j = 0;

        if(selectedMuscles[0] == true){
            symmetricPoints = calculateFlexorCapriRadialis(forearmTrapezoidPoints);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "EMG", "FCR1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "EMG", "FCR2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[1] == true){
            symmetricPoints = calculateBrachioRadialis(forearmTrapezoidPoints);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "EMG", "BR1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "EMG", "BR2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[2] == true){
            symmetricPoints = calculatePalmarLongus(forearmTrapezoidPoints);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "EMG", "PL1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "EMG", "PL2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[3] == true){
            symmetricPoints = calculatePronatorQuadratis(forearmTrapezoidPoints);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "EMG", "PQ1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "EMG", "PQ2" );
            j++;
            symmetricPoints = [];
        }

        if(selectedMuscles[4] == true){
            symmetricPoints = calculateFelxorCarpiUlnaris(forearmTrapezoidPoints);
            keyPointsArray[j] = new KeyPoint(symmetricPoints[0][0], symmetricPoints[0][1], KEYPOINT_SIZE, "EMG", "FCU1" );
            j++;
            keyPointsArray[j] = new KeyPoint(symmetricPoints[1][0], symmetricPoints[1][1], KEYPOINT_SIZE, "EMG", "FCU2" );
            j++;
            symmetricPoints = [];
        }

        return keyPointsArray;

    }

    return{
        GetFCRKeyPoint: function (trapezoidPoints, s) {
            return calculateFlexorCapriRadialis(trapezoidPoints, s);

        },
        CalculateKeyPoints: function(selectedMuscles, forearmTrapezoidPoints, s){
            return calculateKeyPoints(selectedMuscles, forearmTrapezoidPoints, s);
        },
        CalculateEMGKeypoints: function(selectedMuscles, forearmTrapezoidPoints ){
            return calculateEMGKeypoints(selectedMuscles, forearmTrapezoidPoints);
        },
        CalculateECGKeyPoints: function (keyPointSet, forearmTrapezoidPoints) {
            return calculateECGKeyPoints(keyPointSet, forearmTrapezoidPoints);

        }
    }


})();
