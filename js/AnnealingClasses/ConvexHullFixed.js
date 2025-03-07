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

/* This is another implementation for generating the Convex hull for the electrode layout based on
*  the Monotone-chain algorithm.
* */

var ConvexHullFixed = ( function(){

    function computeConvexHull(points){
        var coordsArray = new Array();

        for(var i = 0 ; i < electrodeSet.length; i++){
            coordsArray.push(createVector(electrodeSet[i].x, electrodeSet[i].y));
        }

        hull = convexHull(coordsArray);

        return hull;
    }
    // https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
    function convexHull(points) {
        points.sort(comparison);
        var L = [];
        for (var i = 0; i < points.length; i++) {
            while (L.length >= 2 && cross(L[L.length - 2], L[L.length - 1], points[i]) <= 0) {
                L.pop();
            }
            L.push(points[i]);
        }
        var U = [];
        for (var i = points.length - 1; i >= 0; i--) {
            while (U.length >= 2 && cross(U[U.length - 2], U[U.length - 1], points[i]) <= 0) {
                U.pop();
            }
            U.push(points[i]);
        }
        L.pop();
        U.pop();
        return L.concat(U);
    }

    function comparison(a, b) {
        return a.x == b.x ? a.y - b.y : a.x - b.x;
    }

    function cross(a, b, o) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    return {
        GetConvexHull: function(points) {
            var hull_points =  computeConvexHull(points);
            return hull_points;
        }
    };
})();