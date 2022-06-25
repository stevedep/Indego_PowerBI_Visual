/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "regenerator-runtime/runtime"; //added
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
//added
import * as d3 from "d3";
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

import { VisualSettings } from "./settings";

import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;



export class Visual implements IVisual {
    private svg: Selection<SVGElement>; //added
    private div: Selection<SVGElement>; //added
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    private visualSettings: VisualSettings;

    private container: Selection<SVGElement>;
    private textValue: Selection<SVGElement>;
    private xval: Selection<SVGElement>;
    private yval: Selection<SVGElement>;


    constructor(options: VisualConstructorOptions) {

        let random = d3.randomUniform(1e5, 1e7);

        this.svg = d3.select(options.element)
            .append('svg')
            .classed('circleCard', true);
        this.container = this.svg.append("g")
            .classed('container', true);
        this.textValue = this.container.append("text")
            .classed("textValue", true)            
        this.xval= this.container.append("text")
            .classed("textValue", true)
        this.yval= this.container.append("text")
            .classed("textValue", true)


    }



    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }
    //https://docs.microsoft.com/en-us/power-bi/developer/visuals/custom-visual-develop-tutorial-format-options
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const settings: VisualSettings = this.visualSettings || <VisualSettings>VisualSettings.getDefault();
        return VisualSettings.enumerateObjectInstances(settings, options);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */

    /*
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        const settings: VisualSettings = this.visualSettings || <VisualSettings>VisualSettings.getDefault();
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
    */
    public update(options: VisualUpdateOptions) {


        let width: number = options.viewport.width;
        let height: number = options.viewport.height;
        let width_adjusted: number;
        let height_adjusted: number;

        this.svg.attr("width", width);
        this.svg.attr("height", height);
        //let radius: number = Math.min(width, height) / 2.2;
        let dataView: DataView = options.dataViews[0];
        let DTS = dataView.categorical.values[0].values;      
        const DTS2 = DTS.filter(n => n);
        
      

        let X = dataView.categorical.values[1].values;
        
        let Y = dataView.categorical.values[2].values;
        let X2 = X.filter(n => n);
        let X3 = X2.slice(2, X2.length - 1);
        
        let Y2 = Y.filter(n => n);
        let Y3 = Y2.slice(2, Y2.length - 1);
        //debugger;
        const I = d3.range(X.length);
        console.log(dataView);

        this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);
        //debugger;
        let speedsetting: number = Number(this.visualSettings.dataPoint.speed);
        let SVG_width2: number = Number(this.visualSettings.dataPoint.SVG_width);
        let SVG_height2: number = Number(this.visualSettings.dataPoint.SVG_height);

        this.textValue
            .text("Value")
            .attr("x", "10%")
            .attr("y", "10%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 30 + "px");
        let waitingduration: number = 10000 / DTS2.length; 
        this.xval
            .text("Value")
            .attr("x", "10%")
            .attr("y", "20%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 30 + "px");
        this.yval
            .text("Value")
            .attr("x", "20%")
            .attr("y", "20%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 30 + "px");




        const sleep = ms => new Promise(r => setTimeout(r, ms));
      
        async function loopnumbers() {
            for (let i = 0; i < DTS.length; i++) {
            //for (const dt of DTS2) { //use for loop instead of forEach https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
                await sleep(waitingduration);
                this.textValue.text(DTS2[i]);
                this.xval.text(X3[i]);
                this.yval.text(Y3[i]);

                //this.textValue.text(dt);
                //console.log(DTS2[i]);
            }
        }
        //debugger;
        loopnumbers.call(this); //call om the this context mee te geven
        //this.textValue.text(numbers[0]);

        
        //debugger;
        //this.visualSettings.dataPoint.speed = this.visualSettings.dataPoint.speed * 2;
       
        if (height > (width * SVG_height2 / SVG_width2)) {
            height = width * SVG_height2 / SVG_width2;
        }

        if (width > (height * SVG_width2 / SVG_height2)) {
            width = height * SVG_width2 / SVG_height2;
        }

        let data: [number, number][] = X3.map((e, i) => [<number>e, <number>Y3[i]]);
        //debugger;

        this.svg.selectAll("polygon").remove();
        this.svg.selectAll("circle").remove();
        this.svg.selectAll(".circles").remove();
        this.svg.selectAll("path").remove();


        for (let i = 3; i < dataView.categorical.values.length; i++) {

            let Z = dataView.categorical.values[i].values;

            let data3 = Z.map(function (d) {
                if (isNaN(<number>d)) {
                    var f;
                    var x: number;
                    var y: number;
                    var result: string;
                    f = String(d).split(',');
                    x = <number>f[0];
                    y = <number>f[1];
                    x = x * (width / SVG_width2);
                    y = y * (height / SVG_height2);
                    result = String(x) + ',' + String(y);
                    return <string>result
                }
            }).join(' ');

            this.svg.append("polygon")
                .attr("points", data3)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("fill-opacity", 0.3);
        }

        // Construct the line generator.
        const line = d3.line()
            .curve(d3.curveCatmullRom)
            .x(i => <number>(
                (
                    (<number>
                        (i[1]) * (width / SVG_width2))// (8.1 * (width / SVG_width2))) + (20 * (width / SVG_width2))))
                )
            ))
            .y(i => <number>(
                (
                    (<number>
                        (i[0]) * (height / SVG_height2)) //* (8.1 * (height / SVG_height2)) + (30 * (height / SVG_height2)))))
                )
            ));

        const l = (line(data).length);
        let test = line(data);
        //debugger;


        async function loopnumbers2() {
            for (let i = 0; i < 2; i++) {
                //for (const dt of DTS2) { //use for loop instead of forEach https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
                
                console.log(i);
                let s = function (i) {
                    switch (i) {
                        case 0:
                            return "black";
                        case 1:
                            return "red";
                    }
                }
                console.log(s(i));
                this.svg.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", s(i))
                    .attr("stroke-width", 2.5)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-dasharray", `0,${l}`)
                    .attr("d", line)
                    .transition()
                    .duration(10000)
                    .ease(d3.easeLinear)
                    .attr("stroke-dasharray", `${l},${l}`);
                await sleep(10000);
            }
        }

            loopnumbers2.call(this);

        



            /*
            .attr("fill", "none")
            .attr("stroke", "ghostwhite")
            .attr("stroke-width", 2)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line(data))
            //.interrupt()

            
            .attr("stroke-dasharray", `0,${l}`)
            .transition()
            .duration(100000) //X.length * <number>speedsetting)
            .ease(d3.easeLinear)
            .attr("stroke-dasharray", `${l},${l}`);
            */
      //debugger;  
    }


}