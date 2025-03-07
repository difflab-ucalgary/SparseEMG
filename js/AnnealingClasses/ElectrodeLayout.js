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

/* This function handles the utility
*
* */

var ElectrodeLayout = ( function(){
    var OVERLAP_DISTANCE_THRESHOLD = 15;

    function getElectrodeSetCoordinates(electrodeSet){
        var coordsArray = new Array();

        for(var i = 0 ; i < electrodeSet.length; i++){
            coordsArray.push([electrodeSet[i].x, electrodeSet[i].y]);
        }
        return coordsArray;
    }

    function _getConvexHullForElectrodes(electrodeSet){

        var hull_points = ConvexHullCalculator.GetConvexHull(getElectrodeSetCoordinates(electrodeSet));
        return hull_points;
    }

    function acceptNeighbour(newElectrodeSet){
        var JSONStringObject = JSON.stringify(newElectrodeSet);
        return JSON.parse(JSONStringObject);
    }


    return {
        GetElectrodePoints: function(electrodeSet){
            return getElectrodeSetCoordinates(electrodeSet);
        },
        GetConvexHull: function (electrodeSet){
            var hull_points = _getConvexHullForElectrodes(electrodeSet);
            return hull_points;
        },

        AcceptNeighbour: function(newElectrodeSet){
            return acceptNeighbour(newElectrodeSet);
        }

    };




})();