var InputShapeController = (function () {
    var currentShapeObject = this;
    var input_shape_svg;
    var input_shape_coords = new Array();
    var shape_type;

    function addShapeToCanvas(x, y, w, h, object_type, main_canvas){
        var shape_strokewidth = parseInt(document.getElementById("input_polygon_stroke_width").value);
        var shape_opacity = parseFloat(document.getElementById("input_polygon_opacity").value);
        var shape_color = document.getElementById("input_polygon_outline_color").value;
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


    return {

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
        }




    };












})();
