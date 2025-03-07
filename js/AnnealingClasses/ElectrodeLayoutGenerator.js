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

/* This class handles the electrode layout generation. It handles all the utility functions for various tasks such
*  as creating the initial random electrode layout, generating a neighbouring electrode layout, accpeting
* a neighbouring electrode lalyout, creating the baseline solution etc.
* */

const ElectrodeLayoutGenerator = (function () {

    var OVERLAP_DISTANCE_THRESHOLD = 15;

    var LOOP_COUNTER = 20000;


    var ecg_keypoints_within_path = new Array();
    var num_ecg_keypoints_within_path = 0;
    var neighbour_counter = 0;
    var newElectrodeSet;
    var changingElectrode;
    var input_shape_coords_2d;
    var forearm_trapezoid_coords;
    var shape_bbox;


    function acceptNeighbour(newElectrodeSet){
        const JSONStringObject = JSON.stringify(newElectrodeSet);
        return JSON.parse(JSONStringObject);
    }

    function calculateNumElectrodesForCombination(modalityCombination){
        let numElectrodes = 0;
        numElectrodes = numElectrodes + (2 * modalityCombination[0].length);
        if(modalityCombination[1] == 1){
            numElectrodes += 2;
        }
        if(modalityCombination[2] == 1){
            numElectrodes +=2;
        }
        return numElectrodes;

    }

    function initialize(keyPointSet, forearmTrapezoidPoints, input_shape_coords, input_shape_svg){
        const selected_muscle_groups = new Array();
        selected_muscle_groups[0] = true;
        selected_muscle_groups[1] = true;
        selected_muscle_groups[2] = true;
        selected_muscle_groups[3] = true;
        selected_muscle_groups[4] = true;
        let start_index = selected_muscle_groups.length * 2;
        keyPointSet = KeypointCalculator.CalculateEMGKeypoints(selected_muscle_groups, forearmTrapezoidPoints);
        keyPointSet = KeypointCalculator.CalculateECGKeyPoints(keyPointSet, forearmTrapezoidPoints);
        ECG_KEYPOINT_SCORES[0] = new EcgElectrodeMap(keyPointSet[start_index], keyPointSet[start_index + 1], 0.25, 4.36, ["ecg1", "ecg2"]);
        ECG_KEYPOINT_SCORES[1] = new EcgElectrodeMap(keyPointSet[start_index + 2], keyPointSet[start_index + 3], 1, 17.44, ["ecg3", "ecg4"]);
        ECG_KEYPOINT_SCORES[2] = new EcgElectrodeMap(keyPointSet[start_index + 4], keyPointSet[start_index + 5], 0.474, 8.27, ["ecg5", "ecg6"]);
       // ECG_KEYPOINT_SCORES[3] = new EcgElectrodeMap(keyPointSet[start_index + 6], keyPointSet[start_index + 7], 0.28, 36.13, ["ecg7", "ecg8"]);
        ECG_KEYPOINT_SCORES[3] = new EcgElectrodeMap(keyPointSet[start_index], keyPointSet[start_index + 5], 0.295, 5.16, ["ecg1", "ecg6"]);
       // ECG_KEYPOINT_SCORES[5] = new EcgElectrodeMap(keyPointSet[start_index], keyPointSet[start_index + 3], 0.32, 41.84, ["ecg1", "ecg4"]);
        ECG_KEYPOINT_SCORES[4] = new EcgElectrodeMap(keyPointSet[start_index + 3], keyPointSet[start_index + 4], 0.538, 9.39, ["ecg4", "ecg5"]);

        return [keyPointSet, ECG_KEYPOINT_SCORES];
    }

    function getECGKeypointsWithinPath(forearmTrapezoidPoints, ECG_KEYPOINT_SCORES, input_shape_coords, input_shape_svg, modalityCombination){

        for (var i = 0 ; i < ECG_KEYPOINT_SCORES.length; i++){
            if(Utils.IsPointInsidePolygon([ECG_KEYPOINT_SCORES[i].keypoint1.x, ECG_KEYPOINT_SCORES[i].keypoint1.y], input_shape_coords_2d)
                && Utils.IsPointInsidePolygon([ECG_KEYPOINT_SCORES[i].keypoint2.x, ECG_KEYPOINT_SCORES[i].keypoint2.y], input_shape_coords_2d)){
                num_ecg_keypoints_within_path++;
                ecg_keypoints_within_path.push(i);
            }
        }
        return ecg_keypoints_within_path;
    }

    function generateInitialRandomLayout(forearmTrapezoidPoints, electrodeSet, ECG_KEYPOINT_SCORES, input_shape_coords, input_shape_svg, modalityCombination) {

        var numElectrodes = calculateNumElectrodesForCombination(modalityCombination);
        //var ECG_KEYPOINT_SCORES = new Array();


        var forearm_trapezoid_coords = Utils.Convert1DArrayTo2D(forearmTrapezoidPoints);

        var loop_count = 0;
        var k = 0 ; var j = 0; var distance_count = 0; var area = 0;
        var shape_bbox = input_shape_svg.getBBox();
        var input_shape_coords_2d = Utils.Convert1DArrayTo2D(input_shape_coords);

        //Generate ECG electrodes
        if(modalityCombination[2] == 1){
            //find ecg keypoints within shape
            for (var i = 0 ; i < ECG_KEYPOINT_SCORES.length; i++){
                if(Utils.IsPointInsidePolygon([ECG_KEYPOINT_SCORES[i].keypoint1.x, ECG_KEYPOINT_SCORES[i].keypoint1.y], input_shape_coords_2d)
                    && Utils.IsPointInsidePolygon([ECG_KEYPOINT_SCORES[i].keypoint2.x, ECG_KEYPOINT_SCORES[i].keypoint2.y], input_shape_coords_2d)){
                    num_ecg_keypoints_within_path++;
                    ecg_keypoints_within_path.push(i);
                }
            }
            if(num_ecg_keypoints_within_path < 1){
                console.log("No ECG keypoints within path. Cannot predict ECG electrode scores.");
                swal({
                    title: "No ECG keypoints within path. Cannot predict ECG electrode scores!!",
                    text: "Please provide a valid shape with ECG Keypoints!!",
                    html: true,
                    type: "info",
                    confirmButtonText: "Generate",
                    cancelButtonText: "Cancel",
                    Generate: true,
                    customClass: 'swal-title',
                    showCancelButton: true,
                    showConfirmButton:false,
                    closeOnConfirm: false,
                    closeOnCancel: false
                });

                return electrodeSet;
            }else{
                var ecg_keypoints_index;
                if(num_ecg_keypoints_within_path >1){
                    var random_ecg_pair = Math.seededRandom(0, num_ecg_keypoints_within_path);
                    ecg_keypoints_index = ecg_keypoints_within_path[random_ecg_pair];
                }else{
                    ecg_keypoints_index = ecg_keypoints_within_path[0];
                }

                var area = Math.PI * ECG_ELECTRODE_SIZE * ECG_ELECTRODE_SIZE;

                electrodeSet[j] = new Electrode(ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint1.x , ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint1.y, ECG_ELECTRODE_SIZE, area, "ecg", "circle", ECG_KEYPOINT_SCORES[ecg_keypoints_index].electrodePair[0] );
                j++;

                electrodeSet[j] = new Electrode(ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint2.x , ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint2.y, ECG_ELECTRODE_SIZE, area, "ecg", "circle", ECG_KEYPOINT_SCORES[ecg_keypoints_index].electrodePair[1] );
                j++;
            }
        }

        //generate EMG electrodes

        var emg_keypoints_within_shape = Utils.AreAllEMGKeypointsWithinShape(input_shape_coords_2d, modalityCombination)
        if(emg_keypoints_within_shape[0]){
            area = Math.PI * EMG_ELECTRODE_SIZE * EMG_ELECTRODE_SIZE;
            for(var i = 0 ; i < emg_keypoints_within_shape[1].length; i++){
                electrodeSet[j] = new Electrode(emg_keypoints_within_shape[1][i].x , emg_keypoints_within_shape[1][i].y, EMG_ELECTRODE_SIZE, area, "emg", "circle", emg_keypoints_within_shape[1][i].id);
                j++;
            }
        }else{
            for(var i = 0 ; i <  modalityCombination[0].length; i++){
                loop_count = 0;
                //for each muscle, generate two electrodes.
                for(var m = 1 ; m < 3; m++){
                    for(var z = 0 ; z <  LOOP_COUNTER; z++){
                        loop_count++;
                        var x = Math.seededRandom(shape_bbox.x, shape_bbox.x + shape_bbox.width);
                        var y = Math.seededRandom(shape_bbox.y, shape_bbox.y + shape_bbox.height);
                        distance_count = 0;

                        if(Utils.CheckIfElectrodeCompletelyWithinShape([x, y], input_shape_coords_2d, EMG_ELECTRODE_SIZE, EMG_ELECTRODE_SIZE) &&
                            Utils.CheckIfElectrodeCompletelyWithinShape([x, y], forearm_trapezoid_coords, EMG_ELECTRODE_SIZE, EMG_ELECTRODE_SIZE)){
                            for(k = 0 ; k < electrodeSet.length; k++){
                                if(Utils.GetDistanceBetweenPoints(electrodeSet[k].x, electrodeSet[k].y, x, y) > OVERLAP_DISTANCE_THRESHOLD){
                                    distance_count++;
                                }
                            }
                            if(distance_count >= electrodeSet.length){
                                area = Math.PI * EMG_ELECTRODE_SIZE * EMG_ELECTRODE_SIZE;
                                electrodeSet[j] = new Electrode(x , y, EMG_ELECTRODE_SIZE, area, "emg", "circle", modalityCombination[0][i] + m);
                                j++;
                                break;
                            }
                        }
                    }
                }
            }
        }




        //Generate EDA electrodes
        if(modalityCombination[1] == 1){
            for(var m = 1 ; m < 3; m++){
                for(var z = 0 ; z <  LOOP_COUNTER; z++){
                    loop_count++;
                    var x = Math.seededRandom(shape_bbox.x, shape_bbox.x + shape_bbox.width);
                    var y = Math.seededRandom(shape_bbox.y, shape_bbox.y + shape_bbox.height);
                    distance_count = 0;

                    if(Utils.CheckIfElectrodeCompletelyWithinShape([x, y], input_shape_coords_2d, EDA_ELECTRODE_SIZE, EDA_ELECTRODE_SIZE) &&
                        Utils.CheckIfElectrodeCompletelyWithinShape([x, y], forearm_trapezoid_coords, EDA_ELECTRODE_SIZE, EDA_ELECTRODE_SIZE)){
                        for(k = 0 ; k < electrodeSet.length; k++){
                            if(Utils.GetDistanceBetweenPoints(electrodeSet[k].x, electrodeSet[k].y, x, y) > OVERLAP_DISTANCE_THRESHOLD){
                                distance_count++;
                            }
                        }
                        if(distance_count >= electrodeSet.length){
                            area = Math.PI * EDA_ELECTRODE_SIZE * EDA_ELECTRODE_SIZE;
                            electrodeSet[j] = new Electrode(x , y, EDA_ELECTRODE_SIZE, area, "eda", "circle", "EDA" + m);
                            j++;
                            break;
                        }
                    }
                }
            }
        }



        if(electrodeSet.length == numElectrodes){
            return electrodeSet;
        }else{
            return -1;
        }


    }

    function generateNeighbourLayout(forearmTrapezoidPoints, electrodeSet, input_shape_coords, input_shape_svg) {
        newElectrodeSet = JSON.stringify(electrodeSet);
        newElectrodeSet = JSON.parse(newElectrodeSet);

        input_shape_coords_2d = Utils.Convert1DArrayTo2D(input_shape_coords);
        shape_bbox = input_shape_svg.getBBox();
        forearm_trapezoid_coords = Utils.Convert1DArrayTo2D(forearmTrapezoidPoints);


        changingElectrode = Math.seededRandom(0, electrodeSet.length);


        neighbour_counter++;
        console.log("Neighbour Couner:" + neighbour_counter)

        area = 0; distance_count = 0; j = 0; loop_count = 0;
        if(newElectrodeSet != undefined){
            if (newElectrodeSet[changingElectrode].type == "ecg") {
                if (num_ecg_keypoints_within_path > 1) {
                    var random_ecg_pair = Math.seededRandom(0, num_ecg_keypoints_within_path - 1);
                    var ecg_keypoints_index = ecg_keypoints_within_path[random_ecg_pair];
                } else {
                    return newElectrodeSet;
                }

                var area = Math.PI * ECG_ELECTRODE_SIZE * ECG_ELECTRODE_SIZE;

                newElectrodeSet[j] = new Electrode(ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint1.x, ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint1.y, ECG_ELECTRODE_SIZE, area, "ecg", "circle", ECG_KEYPOINT_SCORES[ecg_keypoints_index].electrodePair[0]);
                j++;

                newElectrodeSet[j] = new Electrode(ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint2.x, ECG_KEYPOINT_SCORES[ecg_keypoints_index].keypoint2.y, ECG_ELECTRODE_SIZE, area, "ecg", "circle", ECG_KEYPOINT_SCORES[ecg_keypoints_index].electrodePair[1]);
                j++;
            } else if (newElectrodeSet[changingElectrode].type == "eda") {
                var loop_count = 0;

                for (z = 0; z < LOOP_COUNTER; z++) {
                    loop_count++;
                    var eda_x = Math.seededRandom(shape_bbox.x, shape_bbox.x + shape_bbox.width);
                    var eda_y = Math.seededRandom(shape_bbox.y, shape_bbox.y + shape_bbox.height);
                    distance_count = 0;

                    if (Utils.CheckIfElectrodeCompletelyWithinShape([eda_x, eda_y], input_shape_coords_2d, EDA_ELECTRODE_SIZE, EDA_ELECTRODE_SIZE) &&
                        Utils.CheckIfElectrodeCompletelyWithinShape([eda_x, eda_y], forearm_trapezoid_coords, EDA_ELECTRODE_SIZE, EDA_ELECTRODE_SIZE)) {
                        for (var n = 0; n < newElectrodeSet.length; n++) {
                            if (n != changingElectrode) {
                                if (Utils.GetDistanceBetweenPoints(newElectrodeSet[n].x, newElectrodeSet[n].y, eda_x, eda_y) > OVERLAP_DISTANCE_THRESHOLD) {
                                    distance_count++;
                                }
                            }
                        }
                        if (distance_count >= newElectrodeSet.length - 1) {
                            area = Math.PI * EDA_ELECTRODE_SIZE * EDA_ELECTRODE_SIZE;
                            newElectrodeSet[changingElectrode] = new Electrode(eda_x, eda_y, EDA_ELECTRODE_SIZE, area, "eda", "circle", newElectrodeSet[changingElectrode].id);
                            break;
                        }
                    }

                }
                if (loop_count >= LOOP_COUNTER) {
                    console.log("Could not find the space neighbouring EDA electrode..!! Returning the same electrodeSet!!");
                    //window.stop();
                    return newElectrodeSet;
                }
            }

            else if (newElectrodeSet[changingElectrode].type == "emg") {
                loop_count = 0;
                for (z = 0; z < LOOP_COUNTER; z++) {
                    loop_count++;
                    x = Math.seededRandom(shape_bbox.x, shape_bbox.x + shape_bbox.width);
                    y = Math.seededRandom(shape_bbox.y, shape_bbox.y + shape_bbox.height);
                    distance_count = 0;
                    if (Utils.CheckIfElectrodeCompletelyWithinShape([x, y], input_shape_coords_2d, EMG_ELECTRODE_SIZE, EMG_ELECTRODE_SIZE) &&
                        Utils.CheckIfElectrodeCompletelyWithinShape([x, y], forearm_trapezoid_coords, EMG_ELECTRODE_SIZE, EMG_ELECTRODE_SIZE)) {
                        for (var n = 0; n < newElectrodeSet.length; n++) {
                            if (n != changingElectrode) {
                                if (Utils.GetDistanceBetweenPoints(newElectrodeSet[n].x, newElectrodeSet[n].y, x, y) > OVERLAP_DISTANCE_THRESHOLD) {
                                    distance_count++;
                                }
                            }

                        }
                        if (distance_count >= newElectrodeSet.length - 1) {
                            area = Math.PI * EMG_ELECTRODE_SIZE * EMG_ELECTRODE_SIZE;
                            newElectrodeSet[changingElectrode] = new Electrode(x, y, EMG_ELECTRODE_SIZE, area, "emg", "circle", newElectrodeSet[changingElectrode].id);
                            break;
                        }
                    }
                }
                if (loop_count >= LOOP_COUNTER) {
                    console.log("Could not find the neighbouring EMG electrode..!! Returning the same electrodeSet!!");
                    //window.stop();
                    return newElectrodeSet;
                }
            }
            return newElectrodeSet;
        }else{
            return electrodeSet;
        }



        //console.log("Generated  Random Neighbour");

    }

    function getBaselineSolution(input_modality_combination, forearmTrapezoidPoints, keyPointSet, baselineElectrodeSet){
        var j = 0;
        var ecg_area = ECG_ELECTRODE_SIZE * ECG_ELECTRODE_SIZE * Math.PI;
        var emg_area = EMG_ELECTRODE_SIZE * EMG_ELECTRODE_SIZE * Math.PI;
        var eda_area = EDA_ELECTRODE_SIZE * EDA_ELECTRODE_SIZE * Math.PI;
        var emg_keypoint;

        if(input_modality_combination[2] == true){
            baselineElectrodeSet[j] = new Electrode(ECG_KEYPOINT_SCORES[1].keypoint1.x , ECG_KEYPOINT_SCORES[1].keypoint1.y, ECG_ELECTRODE_SIZE, ecg_area, "ecg", "circle", ECG_KEYPOINT_SCORES[1].electrodePair[0] );
            j++;

            baselineElectrodeSet[j] = new Electrode(ECG_KEYPOINT_SCORES[1].keypoint2.x , ECG_KEYPOINT_SCORES[1].keypoint2.y, ECG_ELECTRODE_SIZE, ecg_area, "ecg", "circle", ECG_KEYPOINT_SCORES[1].electrodePair[1] );
            j++;
        }

        for(var i = 0 ; i <  input_modality_combination[0].length; i++){
            for(var m = 1 ; m < 3; m++){
                emg_keypoint = keyPointSet.find(x => x.id === input_modality_combination[0][i] + m);
                baselineElectrodeSet[j] = new Electrode(emg_keypoint.x , emg_keypoint.y, EMG_ELECTRODE_SIZE, emg_area, "emg", "circle", input_modality_combination[0][i] + m);
                j++;
            }
        }

        if(input_modality_combination[1] == true){
            var wrist_mid_point = [(forearmTrapezoidPoints[4] + forearmTrapezoidPoints[6])/2, (forearmTrapezoidPoints[5] + forearmTrapezoidPoints[7])/2];
            baselineElectrodeSet[j] = new Electrode(wrist_mid_point[0] , wrist_mid_point[1] - 40, EDA_ELECTRODE_SIZE, eda_area, "eda", "circle", "EDA1");
            j++;

            baselineElectrodeSet[j] = new Electrode(wrist_mid_point[0] , wrist_mid_point[1] - 40 - 60, EDA_ELECTRODE_SIZE, eda_area, "eda", "circle", "EDA2");
            j++;

        }

        return baselineElectrodeSet;




    }




    return {
        Initialize: function (keyPointSet, forearmTrapezoidPoints, input_shape_coords, input_shape_svg) {
            return initialize(keyPointSet, forearmTrapezoidPoints, input_shape_coords, input_shape_svg);
        },


        CalculateNumElectrodesForCombination: function(modalityCombination){
            return calculateNumElectrodesForCombination(modalityCombination);
        },

        AcceptNeighbour: function(newElectrodeSet){
            return acceptNeighbour(newElectrodeSet);
        },

        GetKeypointSet: function(){
            return keyPointSet;
        },

        GenerateInitialRandomLayout: function(forearmTrapezoidPoints, electrodeSet, ECG_KEYPOINT_SCORES, input_shape_coords, input_shape_svg, modalityCombination){
            return generateInitialRandomLayout(forearmTrapezoidPoints, electrodeSet, ECG_KEYPOINT_SCORES, input_shape_coords, input_shape_svg, modalityCombination);
        },

        GetBaselineSolution: function(input_modality_combination, forearmTrapezoidPoints, keyPointSet, baselineElectrodeSet){
            return getBaselineSolution(input_modality_combination, forearmTrapezoidPoints, keyPointSet, baselineElectrodeSet);
        },

        GenerateNeighbourLayout: function (forearmTrapezoidPoints, electrodeSet, input_shape_coords, input_shape_svg) {
            return generateNeighbourLayout(forearmTrapezoidPoints, electrodeSet, input_shape_coords, input_shape_svg);
        },

        GetECGKeypointsWithinPath: function (){
            return ecg_keypoints_within_path;
        }

    };


})();