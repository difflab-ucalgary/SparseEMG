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
    Class: Simulated Annealing Optimizer (SA_Optimizer).
    This function handles the optimization of the layout.
*/

var SA_Optimizer = (function () {

    var coolingFactor            = 0.0,
        stabilizingFactor        = 0.0,
        freezingTemperature      = 0.0,
        currentSystemEnergy      = 0.0,
        currentSystemTemperature = 0.0,
        currentStabilizer        = 0.0,


        generateNewSolution      = null,
        generateNeighbor         = null,
        acceptNeighbor           = null;
    var currentElectrodeSet = new Array();
    var startingElectrodeSet = new Array();
    var newElectrodeLayout;
    var hull_points = new Array(), hull_area;
    var lowestElectrodeSet = new Array();
    var lowestEnergy;
    var startingStep = true;
    var totalSolutions = 0;
    var acceptedSolutions = 0;

    var min_emg_quality = 0.1, min_eda_quality = 0.1, min_ecg_quality = 0.8;
    var current_layout_energy;

    var emg_lower_bound, eda_lower_bound, ecg_lower_bound;
    function _init (options, electrodeSet, forearmTrapezoidPoints, weights, main_canvas) {
        coolingFactor            = options.coolingFactor;
        stabilizingFactor        = options.stabilizingFactor;
        freezingTemperature      = options.freezingTemperature;
        generateNewSolution      = options.generateNewSolution;
        generateNeighbor         = options.generateNeighbor;
        acceptNeighbor           = options.acceptNeighbor;

        currentSystemEnergy      = EnergyCalculator.GetSystemEnergyForArea(electrodeSet, forearmTrapezoidPoints, weights, main_canvas);
        currentSystemTemperature = options.initialTemperature;
        currentStabilizer        = options.initialStabilizer;

        emg_lower_bound = Math.max(0 , (1 - parseFloat(document.getElementById("emg_lower_bound").value)/100) - 0.00);
        eda_lower_bound = Math.max(0, (1 - parseFloat(document.getElementById("eda_lower_bound").value)/100) - 0.00);
        ecg_lower_bound = Math.max( 0, (1 - parseFloat(document.getElementById("ecg_lower_bound").value)/100) - 0.00);
    }

    function _probabilityFunction (temperature, delta) {
        if (delta < 0) {
            return true;
        }

        var C = Math.exp(-(delta * 1000) / temperature);
        var R = Math.random();

        if (R < C) {
            return true;
        }

        return false;
    }

    var penalized_emg_score = 0;
    var penalized_eda_score = 0;
    var penalized_ecg_score = 0;

    function optimizeLayout_weight_based(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas){
        currentElectrodeSet = ElectrodeLayout.AcceptNeighbour(electrodeSet);


        if(startingStep == true){
            lowestEnergy = currentSystemEnergy;
            startingStep = false;
        }

        while(currentSystemTemperature > coolingFactor){
            if (currentSystemTemperature > freezingTemperature){
                for (var i = 0; i < currentStabilizer; i++){
                    totalSolutions++;

                    newElectrodeLayout = ElectrodeLayoutGenerator.GenerateNeighbourLayout(forearmTrapezoidpoints, currentElectrodeSet, input_shape_coords, input_shape_svg);
                    var newEnergy = EnergyCalculator.GetSystemEnergyForArea(newElectrodeLayout, forearmTrapezoidPoints, weights, main_canvas);

                    if(newEnergy < lowestEnergy){
                        lowestEnergy = newEnergy;
                        lowestElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        acceptedSolutions++;
                    }

                    var energyDelta = newEnergy - currentSystemEnergy;

                    if (_probabilityFunction(currentSystemTemperature, energyDelta)) {
                        currentElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        currentSystemEnergy = newEnergy;
                        acceptedSolutions++;
                    }
                }
                currentSystemTemperature = currentSystemTemperature - coolingFactor;
                currentStabilizer = currentStabilizer * stabilizingFactor;
                }
            }
        currentSystemTemperature = freezingTemperature;
        console.log("Total Solutions:" + totalSolutions);
        console.log("Accepted Solutions:" + acceptedSolutions);
        console.log("Acceptance Ration:" + acceptedSolutions/totalSolutions);




        if(acceptedSolutions == 0){
            swal({
                title: "No Solution found with the given Constraints!!",
                text: "Please adjust the constraints for minimum quality!!",
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
        }
        return lowestElectrodeSet;
    }

    function optimizeLayout_lb_based(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas){
        weights[0] = 0.33; weights[1] = 0.33; weights[2] = 0.33;

        currentElectrodeSet = ElectrodeLayout.AcceptNeighbour(electrodeSet);


        if(startingStep == true){
            //lowestEnergy = currentSystemEnergy;
            startingElectrodeSet = currentElectrodeSet;
            startingStep = false;

            current_layout_energy= EnergyCalculator.GetLayoutEnergy();
            lowestEnergy = current_layout_energy.AreaScore;
            if(current_layout_energy.EDAScore[1] > eda_lower_bound){
                penalized_eda_score = 1 * (Math.exp(Math.max(current_layout_energy.EDAScore[1] - eda_lower_bound, 0)) - 1);
                lowestEnergy += penalized_eda_score;
            }

            if(current_layout_energy.EMGScore > emg_lower_bound){
                penalized_emg_score = 1 * (Math.exp(Math.max(current_layout_energy.EMGScore - emg_lower_bound, 0)) - 1);
                lowestEnergy += penalized_emg_score;
            }

            if(current_layout_energy.ECGScore > ecg_lower_bound){
                penalized_ecg_score = 1 * (Math.exp(Math.max(current_layout_energy.ECGScore - ecg_lower_bound, 0)) - 1);
                lowestEnergy += penalized_ecg_score;
            }

            console.log("Starting Lowest Energy:" + lowestEnergy);
        }

        while(currentSystemTemperature > coolingFactor){
            if (currentSystemTemperature > freezingTemperature){
                for (var i = 0; i < currentStabilizer; i++){
                    totalSolutions++;

                    newElectrodeLayout = ElectrodeLayoutGenerator.GenerateNeighbourLayout(forearmTrapezoidpoints, currentElectrodeSet, input_shape_coords, input_shape_svg);
                    var newEnergy = EnergyCalculator.GetSystemEnergyForArea(newElectrodeLayout, forearmTrapezoidPoints, weights, main_canvas);


                    current_layout_energy= EnergyCalculator.GetLayoutEnergy();
                    newEnergy = current_layout_energy.AreaScore;
                    if(current_layout_energy.EDAScore[1] > eda_lower_bound){
                        penalized_eda_score = 1 * (Math.exp(Math.max(current_layout_energy.EDAScore[1] - eda_lower_bound, 0)) - 1);

                        newEnergy += penalized_eda_score;
                    }

                    if(current_layout_energy.EMGScore > emg_lower_bound){
                        penalized_emg_score = 1 * (Math.exp(Math.max(current_layout_energy.EMGScore - emg_lower_bound, 0)) - 1);
                      
                        newEnergy += penalized_emg_score;
                    }

                    if(current_layout_energy.ECGScore > ecg_lower_bound){
                        penalized_ecg_score = 1 * (Math.exp(Math.max(current_layout_energy.ECGScore - ecg_lower_bound, 0)) - 1);

                        newEnergy += penalized_ecg_score;
                    }

                    if(newEnergy < lowestEnergy){
                        lowestEnergy = newEnergy;
                        lowestElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        acceptedSolutions++;
                    }

                    var energyDelta = newEnergy - currentSystemEnergy;

                    if (_probabilityFunction(currentSystemTemperature, energyDelta)) {
                        currentElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        currentSystemEnergy = newEnergy;
                        acceptedSolutions++;
                    }
                }
                currentSystemTemperature = currentSystemTemperature - coolingFactor;
                currentStabilizer = currentStabilizer * stabilizingFactor;
            }
        }
        currentSystemTemperature = freezingTemperature;
        console.log("Total Solutions:" + totalSolutions);
        console.log("Accepted Solutions:" + acceptedSolutions);
        console.log("Acceptance Ration:" + acceptedSolutions/totalSolutions);


        if(acceptedSolutions == 0){
            swal({
                title: "No Solution found with the given Constraints!!",
                text: "Please adjust the constraints for minimum quality!!",
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
            return startingElectrodeSet;
        }
        return lowestElectrodeSet;
    }

    function optimizeLayout_lb_weight_based(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas){
        currentElectrodeSet = ElectrodeLayout.AcceptNeighbour(electrodeSet);

        lowestElectrodeSet = currentElectrodeSet;

        if(startingStep == true){
            lowestEnergy = currentSystemEnergy;
            startingElectrodeSet = currentElectrodeSet;
            startingStep = false;

            current_layout_energy= EnergyCalculator.GetLayoutEnergy();
            if(current_layout_energy.EDAScore[1] > eda_lower_bound){
                penalized_eda_score = 1 * (Math.exp(Math.max(current_layout_energy.EDAScore[1] - eda_lower_bound, 0)) - 1);
                current_layout_energy.EDAScore[1] += penalized_eda_score;

            }

            if(current_layout_energy.EMGScore > emg_lower_bound){
                penalized_emg_score = 1 * (Math.exp(Math.max(current_layout_energy.EMGScore - emg_lower_bound, 0)) - 1);
                current_layout_energy.EMGScore += penalized_emg_score;

            }

            if(current_layout_energy.ECGScore > ecg_lower_bound){
                penalized_ecg_score = 1 * (Math.exp(Math.max(current_layout_energy.ECGScore - ecg_lower_bound, 0)) - 1);
                current_layout_energy.ECGScore += penalized_ecg_score;
            }
            lowestEnergy = (weights[0] * current_layout_energy.EMGScore) + (weights[1]+  current_layout_energy.EDAScore[1]) + (weights[2] * current_layout_energy.ECGScore)
                + (weights[3] * current_layout_energy.AreaScore);


        }

        while(currentSystemTemperature > coolingFactor){
            if (currentSystemTemperature > freezingTemperature){
                for (var i = 0; i < currentStabilizer; i++){
                    totalSolutions++;

                    newElectrodeLayout = ElectrodeLayoutGenerator.GenerateNeighbourLayout(forearmTrapezoidpoints, currentElectrodeSet, input_shape_coords, input_shape_svg);
                    var newEnergy = EnergyCalculator.GetSystemEnergyForArea(newElectrodeLayout, forearmTrapezoidPoints, weights, main_canvas);

                    current_layout_energy= EnergyCalculator.GetLayoutEnergy();
                    if(current_layout_energy.EDAScore[1] > eda_lower_bound){
                        penalized_eda_score = 1 * (Math.exp(Math.max(current_layout_energy.EDAScore[1] - eda_lower_bound, 0)) - 1);
                        current_layout_energy.EDAScore[1] += penalized_eda_score;
                    }

                    if(current_layout_energy.EMGScore > emg_lower_bound){
                        penalized_emg_score = 1 * (Math.exp(Math.max(current_layout_energy.EMGScore - emg_lower_bound, 0)) - 1);
                        current_layout_energy.EMGScore += penalized_emg_score;
                    }

                    if(current_layout_energy.ECGScore > ecg_lower_bound){
                        penalized_ecg_score = 1 * (Math.exp(Math.max(current_layout_energy.ECGScore - ecg_lower_bound, 0)) - 1);
                        current_layout_energy.ECGScore += penalized_ecg_score;
                    }
                    newEnergy = (weights[0] * current_layout_energy.EMGScore) + (weights[1] * current_layout_energy.EDAScore[1]) + (weights[2] * current_layout_energy.ECGScore)
                        + (weights[3] * current_layout_energy.AreaScore);

                    console.log(newEnergy);

                    if(newEnergy < lowestEnergy){
                        lowestEnergy = newEnergy;
                        lowestElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        acceptedSolutions++;
                    }

                    var energyDelta = newEnergy - currentSystemEnergy;

                    if (_probabilityFunction(currentSystemTemperature, energyDelta)) {
                        currentElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        currentSystemEnergy = newEnergy;
                        acceptedSolutions++;
                    }
                }
                currentSystemTemperature = currentSystemTemperature - coolingFactor;
                currentStabilizer = currentStabilizer * stabilizingFactor;
            }
        }
        currentSystemTemperature = freezingTemperature;
        console.log("Total Solutions:" + totalSolutions);
        console.log("Accepted Solutions:" + acceptedSolutions);
        console.log("Acceptance Ration:" + acceptedSolutions/totalSolutions);




        if(acceptedSolutions == 0){
            swal({
                title: "No Solution found with the given Constraints!!",
                text: "Please adjust the constraints for minimum quality!!",
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
        }
        return lowestElectrodeSet;
    }

    function optimizeLayout(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas) {

        if(document.getElementById("weight_based_radio").checked == true){
            lowestElectrodeSet = optimizeLayout_weight_based(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas);
        }else if(document.getElementById("lower_bound_radio").checked == true){

            lowestElectrodeSet = optimizeLayout_lb_based(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas);
        }else if(document.getElementById("lb_weight_based_radio").checked == true){
            lowestElectrodeSet = optimizeLayout_lb_weight_based(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas);

        }
        return lowestElectrodeSet;
    }

    function optimizeLayoutForArea(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, area, main_canvas) {
        currentElectrodeSet = ElectrodeLayout.AcceptNeighbour(electrodeSet);

        if(startingStep == true){
            lowestEnergy = currentSystemEnergy;
            startingStep = false;
        }

        while(currentSystemTemperature > coolingFactor){
            if (currentSystemTemperature > freezingTemperature){
                for (var i = 0; i < currentStabilizer; i++){
                    totalSolutions++;
                    if(totalSolutions >= 15489){
                        console.log("Debug log");
                    }

                    newElectrodeLayout = ElectrodeLayoutGenerator.GenerateNeighbourLayout(forearmTrapezoidpoints, currentElectrodeSet, input_shape_coords, input_shape_svg);
                    var newEnergy = EnergyCalculator.GetSystemEnergyForArea(newElectrodeLayout, forearmTrapezoidPoints, weights, area, main_canvas);

                    if(newEnergy < lowestEnergy){
                        lowestEnergy = newEnergy;
                        lowestElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        acceptedSolutions++;
                    }

                    var energyDelta = newEnergy - currentSystemEnergy;

                    if (_probabilityFunction(currentSystemTemperature, energyDelta)) {
                        currentElectrodeSet = ElectrodeLayoutGenerator.AcceptNeighbour(newElectrodeLayout);
                        currentSystemEnergy = newEnergy;
                        acceptedSolutions++;
                    }
                }
                currentSystemTemperature = currentSystemTemperature - coolingFactor;
                currentStabilizer = currentStabilizer * stabilizingFactor;

            }
        }

        currentSystemTemperature = freezingTemperature;
        console.log("Total Solutions:" + totalSolutions);
        console.log("Accepted Solutions:" + acceptedSolutions);
        console.log("Acceptance Ration:" + acceptedSolutions/totalSolutions);
        return lowestElectrodeSet;

    }

    function getOptions () {
        return {
            initialTemperature:  parseFloat(document.getElementById('initial_temperature').value),
            initialStabilizer:   parseFloat(document.getElementById('initial_stabilizer').value),
            coolingFactor:       parseFloat(document.getElementById('cooling_factor').value),
            stabilizingFactor:   parseFloat(document.getElementById('stabilizing_factor').value),
            freezingTemperature: parseFloat(document.getElementById('freezing_temperature').value)
        };
    }

    return {
        Initialize: function (options, electrodeSet, forearmTrapezoidPoints, weights, main_canvas) {
            _init(options, electrodeSet, forearmTrapezoidPoints, weights, main_canvas);
        },

        OptimizeElectrodeLayout: function(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas ){
            return optimizeLayout(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, main_canvas);

        },
        GetOptions: function(){
            return getOptions();
        },
        OptimizeElectrodeLayoutForArea: function(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, area, main_canvas ){
            return optimizeLayoutForArea(options, electrodeSet, forearmTrapezoidpoints, weights, input_shape_coords, input_shape_svg, area, main_canvas);

        }

    };




})();