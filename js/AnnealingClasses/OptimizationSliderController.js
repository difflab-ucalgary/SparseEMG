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


/* This class is used for setting up the Optimization weights slider panel. It has all the functions for rendering
*  the pie chart visualization for representing the weights for the individual modalities.0
* */


var OptimizationSliderController = (function () {

    // Script for setting up the optimization weights and updating the pie chart in line with the slider.
    var PIE_SLIDER_CENTER_X = 300;
    var PIE_SLIDER_CENTER_Y = 75;
    var PIE_SLIDER_RADIUS = 70;
    var NUM_ARCS = 100;
    var ANGLE_PER_ARC = 360 / NUM_ARCS;

    var EMG_weight, EDA_weight, ECG_weight, Area_Weight = 0;
    var emg_weight_text , eda_weight_text, ecg_weight_text;
    var weights_canvas;

    function init() {

        weights_canvas = Snap("#weight_pie_chart");
        var slider_panel = Snap.load("./resources/slider_panel_design.svg", function (loadedFragment) {
            emg_weight_text = loadedFragment.select("#emg_weight");
            eda_weight_text = loadedFragment.select("#eda_weight");
            ecg_weight_text = loadedFragment.select("#ecg_weight");
            weights_canvas.append( loadedFragment );

        });

        var handlesSlider = document.getElementById('slidertest');
        noUiSlider.create(handlesSlider, {
            start: [45, 75],
            connect: [true, true, true],
            animate: true,
            animationDuration: 300,
            step: 1,
            range: {
                'min': [0],
                'max': [100]
            }
        });

        var connect = handlesSlider.querySelectorAll('.noUi-connect');
        var classes = ['c-1-color', 'c-2-color', 'c-3-color'];

        for (var i = 0; i < connect.length; i++) {
            connect[i].classList.add(classes[i]);
        }

        // Binding signature
        handlesSlider.noUiSlider.on('update', modality_weight_slider_handler);


        console.log(handlesSlider.noUiSlider.get());

        var area_weight_slider = document.getElementById('area_weight_slider');
        noUiSlider.create(area_weight_slider, {
            start: 40,
            connect: 'lower',
            step:1,
            tooltips: [true],
            range: {
                'min': 0,
                'max': 100
            }
        });

        var connect = area_weight_slider.querySelectorAll('.noUi-connect');

        var classes = ['c-1-color', 'c-2-color', 'c-3-color'];

        for (var i = 0; i < connect.length; i++) {
            connect[i].classList.add(classes[i]);
        }

        area_weight_slider.noUiSlider.on('update', area_weight_slider_handler);

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

    function modality_weight_slider_handler(values, handle, unencoded, tap, positions) {
        var arc_paths = new Array();
        var emg_arc_path, eda_arc_path, ecg_arc_path;
        console.log(values);
        EMG_weight = values[0];
        EDA_weight = values[1] - values[0];
        ECG_weight = 100 - values[1];
        SensorControls.SetWeights(EMG_weight, EDA_weight, ECG_weight, Area_Weight);
        console.log("EMG Weight: " + EMG_weight + "EDA Weight: " + EDA_weight + "ECG Weight: " + ECG_weight);
        var emg_weight_on_pie = ANGLE_PER_ARC * EMG_weight;
        var eda_weight_on_pie = ANGLE_PER_ARC * EDA_weight;
        var ecg_weight_on_pie = ANGLE_PER_ARC * ECG_weight;

        console.log(emg_weight_on_pie);
        console.log(eda_weight_on_pie);
        console.log(ecg_weight_on_pie);


        arc_paths[0] = describeArc(PIE_SLIDER_CENTER_X, PIE_SLIDER_CENTER_Y, PIE_SLIDER_RADIUS, 0, emg_weight_on_pie);
        arc_paths[1] = describeArc(PIE_SLIDER_CENTER_X, PIE_SLIDER_CENTER_Y, PIE_SLIDER_RADIUS, emg_weight_on_pie, emg_weight_on_pie + eda_weight_on_pie);
        arc_paths[2] = describeArc(PIE_SLIDER_CENTER_X, PIE_SLIDER_CENTER_Y, PIE_SLIDER_RADIUS, emg_weight_on_pie + eda_weight_on_pie, emg_weight_on_pie + eda_weight_on_pie + ecg_weight_on_pie);

        if(emg_weight_text != null){
            emg_arc_path = weights_canvas.path(arc_paths[0]);
            emg_arc_path.attr({fill:"#FF4447"});
            emg_weight_text.attr({text:Math.abs(EMG_weight) + "%"});

            eda_arc_path = weights_canvas.path(arc_paths[1]);
            eda_arc_path.attr({fill:"#2D3033"});
            eda_weight_text.attr({text:Math.abs(EDA_weight) + "%"});


            ecg_arc_path = weights_canvas.path(arc_paths[2]);
            ecg_arc_path.attr({fill:"#257985"});
            ecg_weight_text.attr({text:Math.abs(ECG_weight) + "%"});

            arc_paths[0] = [];
            arc_paths[1] = [];
            arc_paths[2] = [];

        }
    }



    function area_weight_slider_handler(values, handle, unencoded, tap, positions){

        Area_Weight = values[0];

        SensorControls.SetWeights(EMG_weight, EDA_weight, ECG_weight, Area_Weight);
    }

    return{
        Initialize: function(){
            return init();
        }
    }

})();