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


/* This class handles the selection of muscles in "Muscle Selection" area. The muscles can toggled on/off
*  by clicking on them. The click events are handled and the corresponding muscles are toggled on/off through this
*  class.
* */


var StatusAreaController = ( function(){

    var status_area_canvas, status_area;
    var emg_quality_bar, eda_quality_bar, ecg_quality_bar;
    var brachioradialis_muscle, fcr_muscle, pq_muscle, pl_muscle, fcu_muscle;
    var br_muscle_selected = false, fcr_muscle_selected = false, pl_selected = false, pq_selected = false , fcu_selected = false;

    var selected_muscle_groups = new Array();   //0 for FCR, 1 for BR, 2 for PL, 3 for PQ
    selected_muscle_groups = [false, false, false, false, false];
    var emgToggle = document.getElementById("emgToggle");
    var ecg_status_heart, eda_status_skin;



    function init() {
        console.log("Initializing Status Area!!");
        status_area_canvas = Snap("#status_canvas");
        status_area_canvas.clear();
        status_area = Snap.load("./resources/muscle_selection_v1.svg", function (loadedFragment) {
            // emg_quality_bar = loadedFragment.select("#emg_quality_bar");
            // emg_quality_bar.attr({width:"40"});

            brachioradialis_muscle = loadedFragment.select('#Brachiordialis_copy *');
            fcr_muscle = loadedFragment.select('#fcr_muscle *');
            pl_muscle = loadedFragment.select('#palmaris_longus *');
            pq_muscle = loadedFragment.select('#pronator_quadratus');
            fcu_muscle = loadedFragment.select('#fcu_muscle');

            console.log(pl_muscle);


            brachioradialis_muscle.click(function () {
                var emgToggle = document.getElementById("emgToggle");
                br_muscle_selected = ! (br_muscle_selected);
                console.log(br_muscle_selected);
                if(br_muscle_selected == true){
                    console.log("BR muscle is selected!!!");
                    loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#22ff69' });
                    selected_muscle_groups[1] = true;
                    emgToggle.checked = true;
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }else{
                    console.log("BR muscle is de-selected!!!");
                    loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#00a4a7' });
                    selected_muscle_groups[1] = false;
                    console.log(getNumSelectedMuscles());
                    if(getNumSelectedMuscles() == 0){
                        emgToggle.checked = false;
                    }
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }

            });

            pl_muscle.click(function () {
                var emgToggle = document.getElementById("emgToggle");
                pl_selected = ! (pl_selected);
                if(pl_selected == true){
                    console.log("PL muscle is selected!!!");
                    loadedFragment.selectAll('#palmaris_longus *').attr({stroke:'#22ff69'});
                    selected_muscle_groups[2] = true;
                    emgToggle.checked = true;
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }else{
                    console.log("PL muscle de-selected");
                    loadedFragment.selectAll('#palmaris_longus *').attr({stroke:'#ceb22c'});
                    selected_muscle_groups[2] = false;
                    console.log(getNumSelectedMuscles());
                    if(getNumSelectedMuscles() == 0){
                        emgToggle.checked = false;
                    }
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }
            });

            fcr_muscle.click(function () {
                var emgToggle = document.getElementById("emgToggle");
                fcr_muscle_selected = ! (fcr_muscle_selected);
                //console.log(br_muscle_selected);
                if(fcr_muscle_selected == true){
                    console.log("FCR muscle is selected!!!");
                    loadedFragment.selectAll('#fcr_muscle *').attr({stroke: '#22ff69' });
                    selected_muscle_groups[0] = true;
                    emgToggle.checked = true;
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }else{
                    console.log("FCR muscle is de-selected!!!");
                    loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#b596c6' });
                    selected_muscle_groups[0] = false;

                    if(getNumSelectedMuscles() == 0){
                        emgToggle.checked = false;
                    }
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }
            });

            pq_muscle.click(function () {
                var emgToggle = document.getElementById("emgToggle");
                pq_selected = ! (pq_selected);
                //console.log(br_muscle_selected);
                if(pq_selected == true){
                    console.log("PQ muscle is selected!!!");
                    loadedFragment.selectAll('#pronator_quadratus *').attr({ stroke: '#22ff69' });
                    selected_muscle_groups[3] = true;
                    emgToggle.checked = true;
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }else{
                    console.log("PQ muscle is de-selected!!!");
                    loadedFragment.selectAll('#pronator_quadratus *').attr({ stroke: '#84FFFF' });
                    selected_muscle_groups[3] = false;

                    if(getNumSelectedMuscles() == 0){
                        emgToggle.checked = false;
                    }
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }
            });

            fcu_muscle.click(function () {
                var emgToggle = document.getElementById("emgToggle");
                fcu_selected = ! (fcu_selected);
                //console.log(br_muscle_selected);
                if(fcu_selected == true){
                    console.log("FCU muscle is selected!!!");
                    loadedFragment.selectAll('#fcu_muscle *').attr({ stroke: '#22ff69' });
                    selected_muscle_groups[4] = true;
                    emgToggle.checked = true;
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }else{
                    console.log("FCU muscle is de-selected!!!");
                    loadedFragment.selectAll('#fcu_muscle *').attr({ stroke: '#72bf46' });
                    selected_muscle_groups[4] = false;

                    if(getNumSelectedMuscles() == 0){
                        emgToggle.checked = false;
                    }
                    document.getElementById("num_selected_muscles_label").innerText = "Muscles Selected: " + getNumSelectedMuscles();
                }
            });


            status_area_canvas.append( loadedFragment );
        });
        return;
    }

    function setEMGQualityBar(qualityValue){
        console.log(emg_quality_bar);
        emg_quality_bar.attr({width:"40mm"});
    }

    function selectBRMuscleFibres() {

        status_area_canvas = Snap("#status_canvas");
        status_area = Snap.load("../resources/muscle_selection_v1.svg", function (loadedFragment) {
            emg_quality_bar = loadedFragment.select("#emg_quality_bar");
            emg_quality_bar.attr({width:"40"});
            //console.log(emg_quality_bar);

            brachioradialis_muscle = loadedFragment.select('#Brachiordialis_copy *');
            fcr_muscle = loadedFragment.select('#fcr_muscle *');
            loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#22ff69' });
            loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#22ff69' });


            brachioradialis_muscle.click(function () {
                br_muscle_selected = ! (br_muscle_selected);
                console.log(br_muscle_selected);
                if(br_muscle_selected == true){
                    console.log("BR muscle is selected!!!");
                    loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#22ff69' });
                }else{
                    console.log("BR muscle is de-selected!!!");
                    loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#00a4a7' });
                }

            });

            fcr_muscle.click(function () {
                fcr_muscle_selected = ! (fcr_muscle_selected);
                console.log(br_muscle_selected);
                if(fcr_muscle_selected == true){
                    console.log("FCR muscle is selected!!!");
                    loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#22ff69' });
                }else{
                    console.log("FCR muscle is de-selected!!!");
                    loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#00a4a7' });
                }

            });


            status_area_canvas.append( loadedFragment );
        });
        return;
    }

    function deselectBRMuscleFibres() {
        br_muscle_selected = true;
        fcr_muscle_selected = true;
        init();
    }

    function getNumSelectedMuscles() {
        var count = 0;
        for (var i = 0 ; i < selected_muscle_groups.length; i++){
            if(selected_muscle_groups[i] == true){
                count++;
            }
        }
        return count;
    }

    function getSelectedMuscleGroups(){
        return selected_muscle_groups;
    }

    function initForehead(){

        status_area_canvas = Snap("#status_canvas");
        status_area_canvas.clear();
        status_area = Snap.load("./resources/forehead_v1.svg", function (loadedFragment){

            status_area_canvas.append( loadedFragment );

        });

    }

    function updateQualityStatus(keyPointSet, electrodeSet, layoutEnergy){
        status_area_canvas = Snap("#status_canvas");
        status_area_canvas.clear();

        status_area = Snap.load("./resources/status_svg_v2.svg", function (loadedFragment) {


            brachioradialis_muscle = loadedFragment.select('#Brachiordialis_copy *');
            fcr_muscle = loadedFragment.select('#fcr_muscle *');
            pl_muscle = loadedFragment.select('#palmaris_longus *');

            ecg_status_heart = loadedFragment.select('#ecg_heart_status *');
            eda_status_skin = loadedFragment.select('#eda_status *');

            var ecg_quality_percentage = loadedFragment.select("#ecg_quality_percentage");
            var ecg_quality_value = Math.floor((1 - layoutEnergy.ECGScore) * 100);
            var ecg_quality_bar_width = 70 * (1 - layoutEnergy.ECGScore);

            ecg_quality_bar = loadedFragment.select("#ecg_quality_bar");
            ecg_quality_bar.attr({width: ecg_quality_bar_width});
            ecg_quality_percentage.attr({text:ecg_quality_value+"%"});

            if(1 - layoutEnergy.ECGScore > 0.65){
                ecg_status_heart.selectAll('#ecg_heart_status *').attr({ stroke: '#2b9e1f', fill: '#2b9e1f', opacity:0.75});

            }else if(1 - layoutEnergy.ECGScore < 0.3){
                ecg_status_heart.selectAll('#ecg_heart_status *').attr({ stroke: '#9e0e0e', fill: '#9e0e0e', opacity:0.75  });
            }else{
                ecg_status_heart.selectAll('#ecg_heart_status *').attr({ stroke: '#FDD835', fill: '#FDD835', opacity:0.75 });
            }

            if(layoutEnergy.EDAScore[1] > 0.66){
                eda_status_skin.selectAll('#eda_status *').attr({ stroke: '#9e0e0e', fill: '#9e0e0e', opacity:0.75});
            }else if(layoutEnergy.EDAScore[1] < 0.33){
                eda_status_skin.selectAll('#eda_status *').attr({ stroke: '#2b9e1f', fill: '#2b9e1f', opacity:0.75  });
            }else{
                eda_status_skin.selectAll('#eda_status *').attr({ stroke: '#FDD835', fill: '#FDD835', opacity:0.75 });
            }

            var eda_quality_percentage = loadedFragment.select("#eda_quality_percentage");
            var eda_quality_value = Math.floor((1 - layoutEnergy.EDAScore[1]) * 100);
            var eda_quality_bar_width = 70 * (1 - layoutEnergy.EDAScore[1]);

            eda_quality_bar = loadedFragment.select("#eda_quality_bar");
            eda_quality_bar.attr({width: eda_quality_bar_width});
            eda_quality_percentage.attr({text:eda_quality_value+"%"});

            for( var i = 0 ; i < 2* getNumSelectedMuscles(); i = i + 2){
                if(keyPointSet[i].id == "FCR1"){
                    var emg_quality_fcr = 1 - layoutEnergy.FCRScore[2];
                    fcr_muscle = loadedFragment.select('#fcr_muscle *');
                    if(emg_quality_fcr > 0.6){
                        loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#2b9e1f', opacity:0.75 });
                    }else if(emg_quality_fcr < 0.3){
                        loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#9e0e0e', opacity:0.75 });
                    }else{
                        loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#FDD835', opacity:0.75 });
                    }
                }
                else if(keyPointSet[i].id == "BR1"){
                    var emg_quality_br = 1 - layoutEnergy.BrScore[2];
                    brachioradialis_muscle = loadedFragment.select('#Brachiordialis_copy *');
                    if(emg_quality_br > 0.6){
                        loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#2b9e1f', opacity:0.75 });
                    }else if(emg_quality_br < 0.3){
                        loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#9e0e0e', opacity:0.75 });
                    }else {
                        loadedFragment.selectAll('#Brachiordialis_copy *').attr({stroke: '#FDD835', opacity:0.75});
                    }
                }else if(keyPointSet[i].id == "PL1"){
                    var emg_quality_pl = 1 - layoutEnergy.PLScore[2];

                    if(emg_quality_pl > 0.6){
                        loadedFragment.selectAll('#palmaris_longus *').attr({ stroke: '#2b9e1f', opacity:0.75 });
                    }else if(emg_quality_pl < 0.3){
                        loadedFragment.selectAll('#palmaris_longus *').attr({ stroke: '#9e0e0e', opacity:0.75 });
                    }else{
                        loadedFragment.selectAll('#palmaris_longus *').attr({ stroke: '#FDD835', opacity:0.75 });
                    }
                }
                else if(keyPointSet[i].id == "PQ1"){
                    var emg_quality_pq = 1 - layoutEnergy.PQScore[2];

                    if(emg_quality_pq > 0.6){
                        loadedFragment.selectAll('#pronator_quadratus *').attr({ stroke: '#2b9e1f', opacity:0.75 });
                    }else if(emg_quality_pq < 0.3){
                        loadedFragment.selectAll('#pronator_quadratus *').attr({ stroke: '#9e0e0e', opacity:0.75 });
                    }else{
                        loadedFragment.selectAll('#pronator_quadratus *').attr({ stroke: '#FDD835', opacity:0.75 });
                    }
                }
                else if(keyPointSet[i].id == "FCU1"){
                    var emg_quality_fcu = 1 - layoutEnergy.FCUScore[2];

                    if(emg_quality_fcu > 0.6){
                        loadedFragment.selectAll('#fcu_muscle *').attr({ stroke: '#2b9e1f', opacity:0.75 });
                    }else if(emg_quality_pq < 0.3){
                        loadedFragment.selectAll('#fcu_muscle *').attr({ stroke: '#9e0e0e', opacity:0.75 });
                    }else{
                        loadedFragment.selectAll('#fcu_muscle *').attr({ stroke: '#FDD835', opacity:0.75 });
                    }
                }
            }


            // var overall_emg_quality = 0;
            // for(var i = 0 ; i < layoutEnergy[0].length; i++){
            //     overall_emg_quality +=  ( (layoutEnergy[0][i] + layoutEnergy[1][i]) / 2);
            // }
          //  overall_emg_quality = Math.floor(overall_emg_quality / layoutEnergy[0].length);
            var overall_emg_quality_percentage = Math.floor( (1 - layoutEnergy.EMGScore) * 100);
            var emg_quality_percentage = loadedFragment.select("#emg_quality_percentage");
            emg_quality_percentage.attr({text:overall_emg_quality_percentage+"%"});

            emg_quality_bar = loadedFragment.select("#emg_quality_bar");
            var emg_quality_bar_width = 70 * (1 - layoutEnergy.EMGScore);
            emg_quality_bar.attr({width:emg_quality_bar_width});
            console.log(emg_quality_bar);




            brachioradialis_muscle.click(function () {
                br_muscle_selected = ! (br_muscle_selected);
                console.log(br_muscle_selected);
                if(br_muscle_selected == true){
                    console.log("BR muscle is selected!!!");
                    loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#22ff69' });
                }else{
                    console.log("BR muscle is de-selected!!!");
                    loadedFragment.selectAll('#Brachiordialis_copy *').attr({ stroke: '#00a4a7' });
                }

            });

            fcr_muscle.click(function () {
                fcr_muscle_selected = ! (fcr_muscle_selected);
                console.log(br_muscle_selected);
                if(fcr_muscle_selected == true){
                    console.log("FCR muscle is selected!!!");
                    loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#22ff69' });
                }else{
                    console.log("FCR muscle is de-selected!!!");
                    loadedFragment.selectAll('#fcr_muscle *').attr({ stroke: '#b596c6' });
                }

            });

            pl_muscle.click(function () {
                var emgToggle = document.getElementById("emgToggle");
                pl_selected = ! (pl_selected);
                if(pl_selected == true){
                    console.log("PL muscle is selected!!!");
                    loadedFragment.selectAll('#palmaris_longus *').attr({stroke:'#22ff69'});
                    selected_muscle_groups[2] = true;
                    emgToggle.checked = true;
                    document.getElementById("emg_channels").value = getNumSelectedMuscles();
                }else{
                    console.log("PL muscle de-selected");
                    loadedFragment.selectAll('#palmaris_longus *').attr({stroke:'#ceb22c'});
                    selected_muscle_groups[2] = false;
                    console.log(getNumSelectedMuscles());
                    if(getNumSelectedMuscles() == 0){
                        emgToggle.checked = false;
                    }
                    document.getElementById("emg_channels").value = getNumSelectedMuscles();
                }
            });


            status_area_canvas.append( loadedFragment );
        });


    }


    return {
        InitStatus: function(){
            console.log("Init called");
            init();
            return;
        },

        InitForearmAnteriorStatus: function(){
            console.log("Init called");
            init();
            return;
        },

        InitForeheadStatus: function(){
            console.log("Initialing Forehead Status");
            initForehead();
            return;

        },
        SetEMGQualityBar: function (qualityValue) {
            setEMGQualityBar(qualityValue);
            return;
        },

        SelectBRMuscleFibres: function () {
            selectBRMuscleFibres();
        },

        DeSelectBRMuscleFibres: function () {
            deselectBRMuscleFibres();
        },

        GetNumSelectedMuscles: function(){
            return getNumSelectedMuscles();
        },

        GetSelectedMuscleGroups: function(){
            return getSelectedMuscleGroups();
        },

        UpdateQualityStatus: function(keyPointSet, electrodeSet, layoutEnergy){
            updateQualityStatus(keyPointSet, electrodeSet, layoutEnergy);
        }
    };

})();













