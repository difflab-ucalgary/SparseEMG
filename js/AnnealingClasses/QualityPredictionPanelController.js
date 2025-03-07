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


/* This class is used for handling the visualization of the quality prediction panel.
*  The quality status of a given electrode layout is updated through this class.
* */

var QualityPredictionPanelController = ( function(){
    var emg_quality_bar, eda_quality_bar, ecg_quality_bar, overall_quality_bar;
    var brachioradialis_muscle, fcr_muscle, pq_muscle, pl_muscle, fcu_muscle;
    var br_muscle_selected = false, fcr_muscle_selected = false, pl_selected = false, pq_selected = false , fcu_selected = false;
    var g, quality_status;

    var ecg_status_heart, eda_status_skin;

    function init(){
        g = main_canvas.group();
        quality_status= Snap.load("./resources/status_svg_v6.svg", function (loadedFragment){
            g.append( loadedFragment );
            var myMatrix = new Snap.Matrix();
            myMatrix.translate(0,270);
            myMatrix.scale(0.32);

            g.attr({transform: myMatrix});

            var emg_quality_percentage = g.select('#emg_quality_percentage');
            emg_quality_percentage.attr({text:0+"%"});

            emg_quality_bar = g.select('#emg_quality_bar');
            var emg_quality_bar_width = emg_quality_bar.getBBox().width *  0;
            emg_quality_bar.attr({width:emg_quality_bar_width});


            var eda_quality_percentage = g.select('#eda_quality_percentage');
            eda_quality_percentage.attr({text:0+"%"});

            eda_quality_bar = g.select('#eda_quality_bar');
            var eda_quality_bar_width = eda_quality_bar.getBBox().width *  0;
            eda_quality_bar.attr({width:eda_quality_bar_width});


            var ecg_quality_percentage = g.select('#ecg_quality_percentage');
            ecg_quality_percentage.attr({text:0+"%"});

            ecg_quality_bar = g.select('#ecg_quality_bar');
            var ecg_quality_bar_width = ecg_quality_bar.getBBox().width *  0;
            ecg_quality_bar.attr({width:ecg_quality_bar_width});



            // var overall_quality_percentage = g.select('#overall_quality_percentage');
            // overall_quality_percentage.attr({text:0+"%"});
            //
            // overall_quality_bar = g.select('#overall_quality_bar');
            // var overall_quality_bar_width = overall_quality_bar.getBBox().width *  0;
            // overall_quality_bar.attr({width:overall_quality_bar_width});



            main_canvas.append( g );

        });

    }
    
    function updateQualityStatus(electrodeSet, forearmTrapezoidpoints, weights, main_canvas) {
        quality_status= Snap.load("./resources/status_svg_v6.svg", function (loadedFragment){

            g.clear();
            g.append( loadedFragment );


            var myMatrix = new Snap.Matrix();
            myMatrix.translate(0,270);
            myMatrix.scale(0.32);

            g.attr({transform: myMatrix});


            layoutEnergy = EnergyCalculator.GetSystemEnergyForArea(electrodeSet, forearmTrapezoidpoints, weights, main_canvas);

            var emg_quality_fcr = 1 - EnergyCalculator.GetLayoutEnergy().FCRScore[2];
            if(emg_quality_fcr > 0.6){
                g.selectAll('#fcr_muscle *').attr({ stroke: '#2b9e1f', opacity:0.75 });
            }else if(emg_quality_fcr < 0.3){
                g.selectAll('#fcr_muscle *').attr({ stroke: '#9e0e0e', opacity:0.75 });
            }else{
                g.selectAll('#fcr_muscle *').attr({ stroke: '#FDD835', opacity:0.75 });
            }

            var emg_quality_br = 1 - EnergyCalculator.GetLayoutEnergy().BrScore[2];
            if(emg_quality_br > 0.6){
                g.selectAll('#Brachiordialis_copy *').attr({ stroke: '#2b9e1f', opacity:0.75 });
            }else if(emg_quality_br < 0.3){
                g.selectAll('#Brachiordialis_copy *').attr({ stroke: '#9e0e0e', opacity:0.75 });
            }else{
                g.selectAll('#Brachiordialis_copy *').attr({ stroke: '#FDD835', opacity:0.75 });
            }

            if(EnergyCalculator.GetLayoutEnergy().PLScore[2] != -1){
                var emg_quality_pl = 1 - EnergyCalculator.GetLayoutEnergy().PLScore[2];
                if(emg_quality_pl > 0.6){
                    g.selectAll('#palmaris_longus *').attr({ stroke: '#2b9e1f', opacity:0.75 });
                }else if(emg_quality_pl < 0.3){
                    g.selectAll('#palmaris_longus *').attr({ stroke: '#9e0e0e', opacity:0.75 });
                }else{
                    g.selectAll('#palmaris_longus *').attr({ stroke: '#FDD835', opacity:0.75 });
                }
            }


            if(EnergyCalculator.GetLayoutEnergy().PQScore[2] != -1){
                var emg_quality_pq = 1 - EnergyCalculator.GetLayoutEnergy().PQScore[2];
                if(emg_quality_pq > 0.6){
                    g.selectAll('#pronator_quadratus *').attr({ fill:'#2b9e1f', stroke: '#2b9e1f', opacity:0.75 });
                }else if(emg_quality_pq < 0.3){
                    g.selectAll('#pronator_quadratus *').attr({ fill:'#9e0e0e', stroke: '#9e0e0e', opacity:0.75 });
                }else{
                    g.selectAll('#pronator_quadratus *').attr({ fill:'#FDD835', stroke: '#FDD835', opacity:0.75 });
                }
            }


            if(EnergyCalculator.GetLayoutEnergy().FCUScore[2] != -1){
                var emg_quality_fcu = 1 - EnergyCalculator.GetLayoutEnergy().FCUScore[2];
                if(emg_quality_fcu > 0.6){
                    g.selectAll('#fcu_muscle *').attr({ fill:'#2b9e1f', stroke: '#2b9e1f', opacity:0.75 });
                }else if(emg_quality_fcu < 0.3){
                    g.selectAll('#fcu_muscle *').attr({ fill:'#9e0e0e', stroke: '#9e0e0e', opacity:0.75 });
                }else{
                    g.selectAll('#fcu_muscle *').attr({ fill:'#FDD835', stroke: '#FDD835', opacity:0.75 });
                }
            }






            if(EnergyCalculator.GetLayoutEnergy().EDAScore[1] > 0.66){
                g.selectAll('#eda_status *').attr({ stroke: '#9e0e0e', fill: '#9e0e0e', opacity:0.75});
            }else if(EnergyCalculator.GetLayoutEnergy().EDAScore[1] < 0.33){
                g.selectAll('#eda_status *').attr({ stroke: '#2b9e1f', fill: '#2b9e1f', opacity:0.75  });
            }else{
                g.selectAll('#eda_status *').attr({ stroke: '#FDD835', fill: '#FDD835', opacity:0.75 });
            }


            if(1 - EnergyCalculator.GetLayoutEnergy().ECGScore > 0.65){
                g.selectAll('#ecg_heart_status *').attr({ stroke: '#2b9e1f', fill: '#2b9e1f', opacity:0.75});

            }else if(1 - EnergyCalculator.GetLayoutEnergy().ECGScore < 0.3){
                g.selectAll('#ecg_heart_status *').attr({ stroke: '#9e0e0e', fill: '#9e0e0e', opacity:0.75  });
            }else{
                g.selectAll('#ecg_heart_status *').attr({ stroke: '#FDD835', fill: '#FDD835', opacity:0.75 });
            }


            var emg_quality_percentage = g.select('#emg_quality_percentage');
            emg_quality_percentage.attr({text:((1 - EnergyCalculator.GetLayoutEnergy().EMGScore)* 100).toFixed(1)+"%"});

            emg_quality_bar = g.select('#emg_quality_bar');
            var emg_quality_bar_width = emg_quality_bar.getBBox().width *  (1 - EnergyCalculator.GetLayoutEnergy().EMGScore);
            emg_quality_bar.attr({width:emg_quality_bar_width});

            if(eda_enabled == true){
                var eda_quality_percentage = g.select('#eda_quality_percentage');
                eda_quality_percentage.attr({text:((1 - EnergyCalculator.GetLayoutEnergy().EDAScore[1])* 100).toFixed(1)+"%"});

                eda_quality_bar = g.select('#eda_quality_bar');
                var eda_quality_bar_width = eda_quality_bar.getBBox().width *  (1 - EnergyCalculator.GetLayoutEnergy().EDAScore[1]);
                eda_quality_bar.attr({width:eda_quality_bar_width});
            }else{
                var eda_quality_percentage = g.select('#eda_quality_percentage');
                eda_quality_percentage.attr({text:"N/A"});

                eda_quality_bar = g.select('#eda_quality_bar');
                var eda_quality_bar_width = eda_quality_bar.getBBox().width *  0;
                eda_quality_bar.attr({width:eda_quality_bar_width});
            }



            if(ecg_enabled == true){
                var ecg_quality_percentage = g.select('#ecg_quality_percentage');
                ecg_quality_percentage.attr({text:((1 - EnergyCalculator.GetLayoutEnergy().ECGScore)* 100).toFixed(1)+"%"});

                ecg_quality_bar = g.select('#ecg_quality_bar');
                var ecg_quality_bar_width = ecg_quality_bar.getBBox().width *  (1 - EnergyCalculator.GetLayoutEnergy().ECGScore);
                ecg_quality_bar.attr({width:ecg_quality_bar_width});
            }else{
                var ecg_quality_percentage = g.select('#ecg_quality_percentage');
                ecg_quality_percentage.attr({text:"N/A"});

                ecg_quality_bar = g.select('#ecg_quality_bar');
                var ecg_quality_bar_width = ecg_quality_bar.getBBox().width *  0;
                ecg_quality_bar.attr({width:ecg_quality_bar_width});
            }



            // var overall_modality_quality = weights[0] * EnergyCalculator.GetLayoutEnergy().EMGScore() +
            //                                 weights[1] * EnergyCalculator.GetLayoutEnergy().EDAScore()[1] +
            //                                 weights[2] * EnergyCalculator.GetLayoutEnergy().ECGScore();
            //
            // var overall_quality_percentage = g.select('#overall_quality_percentage');
            // overall_quality_percentage.attr({text:((layoutEnergy)* 100).toFixed(1)+"%"});
            //
            // overall_quality_bar = g.select('#overall_quality_bar');
            // var overall_quality_bar_width = overall_quality_bar.getBBox().width *  (layoutEnergy);
            // overall_quality_bar.attr({width:overall_quality_bar_width});

            var area_text_block = g.select('#area_text');


            var hull_points = ElectrodeLayout.GetConvexHull(electrodeSet);
            //var input_shape_coords = InputShapeObject.GetShapeCoords();
            hull_points = Utils.Convert2DArrayTo1D(hull_points);
            var hull_area = Utils.GetPolygonArea(Utils.GetXCoords(hull_points), Utils.GetYCoords(hull_points), hull_points.length/2);
            area_text_block.attr({text:(hull_area/100).toFixed(2)+""});
            console.log(EnergyCalculator.GetLayoutEnergy());




            main_canvas.append( g );

        });


    }

    return{
        InitStatus: function(){
            console.log("Init called");
            init();
            return;
        },
        UpdateQualityStatus: function(electrodeSet, forearmTrapezoidpoints, weights, main_canvas){
            updateQualityStatus(electrodeSet, forearmTrapezoidpoints, weights, main_canvas);
        }
    }


})();