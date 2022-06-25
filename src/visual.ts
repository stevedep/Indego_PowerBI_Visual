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
        this.xval = this.container.append("text")
            .classed("textValue", true)
        this.yval = this.container.append("text")
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
        let dataView: DataView = options.dataViews[0];
        this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);
        let width: number = options.viewport.width; let height: number = options.viewport.height;
        this.svg.attr("width", width); this.svg.attr("height", height);
        let SVG_width2: number = Number(this.visualSettings.dataPoint.SVG_width);
        let SVG_height2: number = Number(this.visualSettings.dataPoint.SVG_height);

        height = (height > (width * SVG_height2 / SVG_width2)) ? width * SVG_height2 / SVG_width2 : height; 
        width = (width > (height * SVG_width2 / SVG_height2)) ? width = height * SVG_width2 / SVG_height2 : width;
        
        let X = dataView.categorical.values[1].values;
        X.map(x => <number>x);
        let Y = dataView.categorical.values[2].values;
        X.map(y => <number>y);

        let data: [number, number][] = X.map((e, i) => [<number>e, <number>Y[i]]);

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

        const line = d3.line()            
            .x(i => (i[1]) * (width / SVG_width2))
            .y(i => (i[0]) * (height / SVG_height2))

        let L = (line(data));
        let I = L.length;

        const path = this.svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", L);

        // Measure the length of the given SVG path string.


        //below was not working, solution found here: 2022-06-25
        https://stackoverflow.com/questions/21140547/accessing-svg-path-length-in-d3

        /*
        function length(path) {
            return (d3.create("svg:path").attr("d", path).node()) .getTotalLength();
        }
        */
        //function animate() {
            
               // const l = length(line(I));

                path
                   // .interrupt()
                    .attr("stroke-dasharray", function (d) { return "0," + this.getTotalLength(); })
                    .transition()
                    .duration(5000)
                    .ease(d3.easeLinear)
                    .attr("stroke-dasharray", function (d) { return this.getTotalLength() + "," + this.getTotalLength(); })
       // }

       // animate();

       // return Object.assign(this.svg.node(), { animate });
    }
}