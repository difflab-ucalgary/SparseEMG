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


/* This class handles the SNR look up table for the ECG electrode pairs. The SNR score for a given electrode pair,
the keypoints associated with the ECG electrodes are created through this class.
*
* */
class EcgElectrodeMap {
    constructor(keypoint1, keypoint2, score, snr, electrodePair) {
        this.keypoint1 = keypoint1;
        this.keypoint2 = keypoint2;
        this.score = score;
        this.snr = snr;
        this.electrodePair= electrodePair;
    }
    get GetScore(){
        return this.score;
    }

    get GetKeyPoints(){
        return [this.keypoint1, this.keypoint2];
    }

    get GetKeyPoint1(){
        return this.keypoint1;
    }

    get GetKeyPoint2(){
        return this.keypoint2;
    }
    // Getter
    get GetElectrodePair() {
        return this.electrodePair;
    }

}
