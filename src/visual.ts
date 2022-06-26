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

//to find index of category
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import { dataRoleHelper } from "powerbi-visuals-utils-dataviewutils";

export class Visual implements IVisual {
    private svg: Selection<SVGElement>; //added
    private visualSettings: VisualSettings;
    constructor(options: VisualConstructorOptions) {this.svg = d3.select(options.element)
            .append('svg')
        }


    public update(options: VisualUpdateOptions) {
        let dataView: DataView = options.dataViews[0];
        let t = dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "SVG");
        console.log(t);
        //debugger;
        this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);
        let width: number = options.viewport.width; let height: number = options.viewport.height;
        this.svg.attr("width", width); this.svg.attr("height", height);
        let SVG_width2: number = Number(this.visualSettings.dataPoint.SVG_width);
        let SVG_height2: number = Number(this.visualSettings.dataPoint.SVG_height);

        height = (height > (width * SVG_height2 / SVG_width2)) ? width * SVG_height2 / SVG_width2 : height; 
        width = (width > (height * SVG_width2 / SVG_height2)) ? width = height * SVG_width2 / SVG_height2 : width;
        
        let X = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "X")].values
        X.map(x => <number>x);
        let Y = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "Y")].values
        X.map(y => <number>y);
        let DT = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "DT")].values
        let DT2 = [];
        for (let i = 0; i < DT.length; i++) {
            if (DT[i] !== null) {
                DT2.push(i,new Date(<string>DT[i]));
            }
        }

       let codes=[
            [0,"Readingstatus"],
            [257,"Charging"],
            [258,"Docked"],
            [259,"Docked-Softwareupdate"],
            [260,"Docked"],
            [261,"Docked"],
            [262,"Docked-Loadingmap"],
            [263,"Docked-Savingmap"],
            [513,"Mowing"],
            [514,"Relocalising"],
            [515,"Loadingmap"],
            [516,"Learninglawn"],
            [517,"Paused"],
            [518,"Bordercut"],
            [519,"Idleinlawn"],
            [769,"ReturningtoDock"],
            [770,"ReturningtoDock"],
            [771,"ReturningtoDock-Batterylow"],
            [772,"Returningtodock-Calendartimeslotended"],
            [773,"Returningtodock-Batterytemprange"],
            [774,"Returningtodock"],
            [775,"Returningtodock-Lawncomplete"],
            [776,"Returningtodock- Relocalising"]
        ];



        let ET = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "ET")].values
        let ETstartindex = 0;
        let ETRange = [];

        for (let i = 0; i < ET.length; i++) {
            if (i != 0) if (ET[i] != ET[i - 1]) { // exclude the null range that is used to draw the map
                if (ET[i - 1] != null) ETRange.push([ETstartindex, i - 1, ET[i - 1], [DT[ETstartindex] , DT[i-1] ]  ]);
                ETstartindex = i;
            }  
        }
        console.log(ETRange);

        //DT.map(x => new Date(<string>x));
        let min = Math.min.apply(null, DT2);
        let max = Math.max.apply(null, DT2);
        let diff = max - min;
        
        //debugger;

        let data: [number, number][] = X.map((e, i) => [<number>e, <number>Y[i]]);

        this.svg.selectAll("polygon").remove(); this.svg.selectAll("circle").remove();  this.svg.selectAll(".circles").remove(); this.svg.selectAll("path").remove();

        for (let i = dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "SVG"); i < dataView.categorical.categories.length; i++) {
            let Z = dataView.categorical.categories[i].values
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

        const sleep = ms => new Promise(r => setTimeout(r, ms));
        
        let kleur;
        async function loopnumbers2() {
            for (let i = 0; i < ETRange.length; i++) {
                let L = (line(data.slice(ETRange[i][0], ETRange[i][1])));     
                let eind = new Date(ETRange[i][3][1]);
                let begin = new Date(ETRange[i][3][0]);
                let diff = eind.getTime() - begin.getTime();
                //console.log(diff);
                let eventcode = ETRange[i][2];
                let s = function (i) {                    
                    switch (true) {
                        case eventcode < 300: //docked
                            return "pink"; break;
                        case eventcode == 513: //mowing
                            return "blue"; break;
                        case eventcode == 514: //relocalizing
                            return "orange"; break;
                        case eventcode == 518: //border cut
                            return "green"; break;
                        case eventcode == 519: //idle in lawn
                            return "red"; break;
                        case eventcode > 600: //going back
                            return "purple"; break;
                        default: return "white";
                    }
                }
                let sw = function (i) {
                    switch (true) {
                        case eventcode < 300: //docked
                            return 20; break;                       
                        default: return 2;
                    }
                }
               // console.log(s(i));

                const path = this.svg.append("path")
                    .attr("fill", "none")
                    .attr("stroke", s(i))
                    .attr("stroke-width",sw(i))
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("d", L);

                path
                    .interrupt()
                    .attr("stroke-dasharray", function (d) { return "0," + this.getTotalLength(); })
                    .transition()
                    .duration(diff/300)
                    .ease(d3.easeLinear)
                    .attr("stroke-dasharray", function (d) { return this.getTotalLength() + "," + this.getTotalLength(); })
                await sleep(diff/300);
            }
        }
        loopnumbers2.call(this);
       
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
}