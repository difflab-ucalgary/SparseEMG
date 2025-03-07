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

/* Convex hull implementation based on the Graham Scan algorithm
* */
var ConvexHullCalculator = ( function(){

    function computeConvexHull(points)
    {
        function min(a, fn)
        {
            if (!a.length)
            {
                return -1;
            }

            var i = 0;
            for (var j = 1; j < a.length; j++)
            {
                if (fn(a[i], a[j]) < 0)
                    i = j;
            }
            return i;
        }

        function ccw(p1, p2, p3)
        {
            return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
        }

        var n = points.length;

        //--- Find the point with the lowest y coordinate (breaking ties by looking at the x coordinate)---
        var i = min(points, function(a, b) { return a[1] == b[1] ? b[0] - a[0] : b[1] - a[1] });

        //--- Take it out of the array---
        var p = points[i];
        points[i] = null;

        //--- Put an extra entry in the array---
        points.push(null);

        //--- Sort the points by the angle that the line from p to the point makes with the x axis---
        points.sort(function(a, b)
        {
            return !a ? -1 : (!b ? 1 : (a[0] - p[0]) / (a[1] - p[1]) - (b[0] - p[0]) / (b[1] - p[1]));
        });

        //--- Now the first two elements of points should be null---
        //--- Place the lowest-y-coordinate point at p[1], and a sentinel value at p[0]---
        points[0] = points[n];
        points[1] = p;

        var m = 2;
        for (i = 3; i <= n; i++)
        {
            //---Look at the next point---
            while (ccw(points[m - 1], points[m], points[i]) >= 0)
            {
                /*
                     If adding the next point would make the polygon non-convex,
                     remove the most recently added point from the convex polygon
                     we're building up.
                */
                m--;
            }

            //--- Add this point to the convex polygon ---
            m++;
            points[m] = points[i];
        }

        //---m=usable points for polygon---
        var myPoints=points.slice(0,m)
        return myPoints
    }

    return {
        GetConvexHull: function(points) {
            var hull_points =  computeConvexHull(points);
            return hull_points;
        }
    };
})();