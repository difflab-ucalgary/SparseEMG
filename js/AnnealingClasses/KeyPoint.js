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

/* This is the class for Keypoint has the getters and setters for the individual keypoints.
* */
class KeyPoint {
    /* constructor(x, y, size) {
         this.x = x;
         this.y = y;
         this.size = size;
     }*/

    constructor(x, y, size, type, id){
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;
        this.id = id;
    }
    get GetX(){
        return this.x;
    }

    get GetY(){
        return this.y;
    }

    get getType(){
        return this.type;
    }
    // Getter
    get getId() {
        return this.id();
    }

    // Method
    /*  calcArea() {
          if(this.shape == "square")
              return this.size* this.size;
          else if(this.shape == "circle")
              return 3.14 * this.size * this.size;
        //  return this.height * this.width;
      }*/
}