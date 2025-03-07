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

/* This class is used for configuring and setting up the utility functions for the input polygon.
* Shapes can be added, deleted or modified on the canvas through these functions.
* */

/*
---------------------------------------------------------------------------------
Optimal Electrode Locations
----------------------------
Palmaris Longus : 0-20% or 47-100% on the muscle line
Flexor Carpi Radialis: 0-13% or 37-100% on the muscle line
BrachioRadialis: Between 32 and 100% on the muscle line


 */
var InputShapeController = (function () {

    var currentShapeObject = this;
    var input_shape_svg;
    var input_shape_coords = new Array();
    var shape_type;

    function init(main_canvas) {

        //var that = this;

        this.g = main_canvas.group();
    }
    function addShapeToCanvas(x, y, w, h, object_type, main_canvas){
        var shape_strokewidth = parseInt(document.getElementById("input_polygon_stroke_width").value);
        var shape_opacity = parseFloat(document.getElementById("input_polygon_opacity").value);
        var shape_color = document.getElementById("input_polygon_outline_color").value;
        //document.getElementById("input_polygon_opacity").value = input_shape_svg.attr("opacity");
        //document.getElementById("input_polygon_outline_color").value = Snap.color(input_shape_svg.attr("stroke")).hex;
        if(object_type == "rectangle"){
            shape_type = "rectangle";
            input_shape_coords = Utils.GetPointsForRectangle(x, y, w, h);

            input_shape_svg =  main_canvas.polygon(input_shape_coords);
            input_shape_svg.attr({fill:"none",stroke:shape_color, opacity:shape_opacity, strokewidth:shape_strokewidth});
            //shape_svg =  s.rect(0, 0, 50, 50, 0, 0).attr({'fill':'none', 'stroke':'#E82941'});
            this.g.append(input_shape_svg);
        }
    }


    function removeShape() {
        this.g.remove();

    }

    function updateInputShape(main_canvas){
        var shape_strokewidth = parseInt(document.getElementById("input_polygon_stroke_width").value);
        var shape_opacity = parseFloat(document.getElementById("input_polygon_opacity").value);
        var shape_color = document.getElementById("input_polygon_outline_color").value;

        var input_shape_width = parseInt(document.getElementById("input_shape_width").value);
        var input_shape_height = parseInt(document.getElementById("input_shape_height").value);
        var input_shape_center_x = parseInt(document.getElementById("input_shape_center_x").value);
        var input_shape_center_y = parseInt(document.getElementById("input_shape_center_y").value);

        if(shape_type == "rectangle"){
            shape_type = "rectangle";
            this.g.remove();
            input_shape_coords = Utils.GetPointsForRectangle(input_shape_center_x, input_shape_center_y,
                                                            input_shape_width, input_shape_height);

            input_shape_coords.object_type = shape_type;
            input_shape_svg =  main_canvas.polygon(input_shape_coords);
            input_shape_svg.attr({fill:"none",stroke:shape_color, opacity:shape_opacity, strokewidth:shape_strokewidth});
            //shape_svg =  s.rect(0, 0, 50, 50, 0, 0).attr({'fill':'none', 'stroke':'#E82941'});
            this.g = main_canvas.group();
            this.g.append(input_shape_svg);
        }
    }

    function renderInputShape(main_canvas, input_shape_type){
        if(input_shape_type == "rectangle"){
            input_shape_svg =  main_canvas.polygon(input_shape_coords);
            input_shape_svg.attr({fill:"none",stroke:"#ff0045", opacity:0.8, strokewidth:1});
            //shape_svg =  s.rect(0, 0, 50, 50, 0, 0).attr({'fill':'none', 'stroke':'#E82941'});
            this.g = main_canvas.group();
            this.g.append(input_shape_svg);
            return;
        }else{
            input_shape_svg =  main_canvas.polygon(input_shape_coords);
            input_shape_svg.attr({fill:"none",stroke:"#ff0045", opacity:0.8, strokewidth:1});
            this.g = main_canvas.group();
            this.g.append(input_shape_svg);

        }
    }

    function loadInputShape(main_canvas, input_shape_coords, input_shape_svg){
        if(input_shape_svg.type == "polygon"){
            input_shape_svg =  main_canvas.polygon(input_shape_coords);
            input_shape_svg.attr({fill:"none",stroke:"#ff0045", opacity:0.8, strokewidth:1});
            //shape_svg =  s.rect(0, 0, 50, 50, 0, 0).attr({'fill':'none', 'stroke':'#E82941'});
            this.g = main_canvas.group();
            this.g.append(input_shape_svg);
            return;
        }
    }

    function setShapeInputFields(input_shape_svg){
        var bbox = input_shape_svg.getBBox();
        document.getElementById("input_shape_center_x").value = parseInt(bbox.cx);
        document.getElementById("input_shape_center_y").value = parseInt(bbox.cy);
        document.getElementById("input_shape_width").value = parseInt(bbox.width);
        document.getElementById("input_shape_height").value = parseInt(bbox.height);

        document.getElementById("input_polygon_stroke_width").value = input_shape_svg.attr("strokeWidth");
        document.getElementById("input_polygon_opacity").value = input_shape_svg.attr("opacity");
        document.getElementById("input_polygon_outline_color").value = Snap.color(input_shape_svg.attr("stroke")).hex;

    }


    return {
        Init: function(main_canvas){
            return init(main_canvas);
        },
        RenderInputShape: function(main_canvas, input_shape_type){
            return renderInputShape(main_canvas, input_shape_type);
        },
        AddShapeToCanvas: function(x, y, w, h, object_type, main_canvas){
            addShapeToCanvas(x, y, w, h, object_type, main_canvas);
        },
        UpdateInputShape: function(main_canvas){
            updateInputShape(main_canvas);
        },
        RemoveShape: function () {
            removeShape();
        },
        GetShapeCoords: function(){
            return input_shape_coords;
        },
        GetShapeSVG: function(){
            return input_shape_svg;
        },
        GetInputShapeType: function(){
            return shape_type;
        },
        SetInputShapeType: function(input_shape_type){
            shape_type =  input_shape_type;
        },
        SetShapeCoords: function(input_coords){
            input_shape_coords = input_coords;
        },
        SetShapeSVG: function(input_svg){
            input_shape_svg = input_svg;
        },
        LoadInputShape: function(main_canvas, input_shape_coords, input_shape_svg){
            loadInputShape(main_canvas, input_shape_coords, input_shape_svg);
        },
        SetShapeInputFields: function (input_shape_svg) {
            setShapeInputFields(input_shape_svg);
        }




    };
})();


