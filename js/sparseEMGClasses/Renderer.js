/* The Renderer class for rendering the electrodes, and other elements
* */

var Renderer = (function(){



  function renderConvexHull(coordsArray, s){
    s.polygon(coordsArray).attr({ fill: "none", stroke: "blue", strokeWidth: 0.25 });
  }

  function drawGridWithLines(s){
    for(var i = 0; i < MAIN_CANVAS_SVG_HEIGHT; i += 10) {
      s.line(i, 0, i, MAIN_CANVAS_SVG_HEIGHT).attr({fill: "none", stroke: "gray", strokeWidth: 0.25});;
    }
    for(var j = 0; j < MAIN_CANVAS_SVG_HEIGHT; j += 10) {
      s.line(0, j, MAIN_CANVAS_SVG_HEIGHT, j).attr({fill: "none", stroke: "gray", strokeWidth: 0.25});;
    }
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
    }
    return electrode_circle;
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


  return{
    RenderElectrode: function(electrode, s){
      return renderElectrode(electrode, s);
    },

    RenderConvexHull: function (coordsArray, s){
      renderConvexHull(coordsArray, s);
    },
    RenderGridWithLines: function (s) {
      drawGridWithLines(s);
    },
    RenderInputShape: function(main_canvas, input_shape_type){
      return renderInputShape(main_canvas, input_shape_type);
    },
    SetInputShapeType: function(input_shape_type){
      shape_type =  input_shape_type;
    },
  }





})();
