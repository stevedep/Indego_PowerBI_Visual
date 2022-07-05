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

//for interfaces
import { ContainerElement, Primitive } from "d3";

import ISelectionManager = powerbi.extensibility.ISelectionManager; // added for selections
import ISelectionId = powerbi.visuals.ISelectionId; //added for selections
import IVisualHost = powerbi.extensibility.visual.IVisualHost; // added for selections

//for selections
import {
    select as d3Select
} from "d3-selection";

interface XYDates {
    i: number;
    xy_date: Date;
    hour: number;
    minute: number;
};

interface HourPrint {
    x: number;
    hour: number;
};
// if (ET[i - 1] != null && diff != 0) ETRange.push([ETstartindex, i - 1, ET[i - 1], diff]);// [DT[ETstartindex] , DT[i-1] ]  ]);

interface ETRange {
    id: number;
    start: number;
    eind: number;
    state: number;
    duration: number;
    cum_duration: number;
    width: number;
    endhour: number;
    starttime: Date;
    sels: ISelectionId[];
};


export class Visual implements IVisual {
    private svg: Selection<SVGElement>; //added
    private svg2: Selection<SVGElement>; //added
    private visualSettings: VisualSettings;

    //to print info
    private container: Selection<SVGElement>;
    private textValue: Selection<SVGElement>;
    private state: Selection<SVGElement>;
    recSelection: d3.Selection<d3.BaseType, unknown, SVGElement, any>;
    totalduration: number;
    cumduration: number;
    dail: d3.Selection<SVGRectElement, any, any, any>;
    times: d3.Selection<SVGTextElement, any, any, any>;
    txtSelection: d3.Selection<d3.BaseType, HourPrint, SVGElement, any>;
    counter: number = 0;
    recactSelection: d3.Selection<d3.BaseType, ETRange, SVGElement, any>;

    //selections
    private selectionManager: ISelectionManager;
    private host: IVisualHost;
    loopsel: (sel: any) => void;
    selectedblock: number;
    statemouseover: d3.Selection<SVGTextElement, any, any, any>;
    selections: ETRange[];

    constructor(options: VisualConstructorOptions) {  
        this.host = options.host; //added for selections        
        this.selectionManager = this.host.createSelectionManager(); // added for selections

        this.svg = d3.select(options.element)
            .append('svg')
            .classed('circleCard', true);
        this.container = this.svg.append("g")
            .classed('container', true);
        this.textValue = this.container.append("text")
            .classed("textValue", true)
        this.state = this.container.append("text")
            .classed("textValue", true)
        
        this.textValue
            .text("Value")
            .attr("x", "60%")
            .attr("y", "90%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 30 + "px");        
        this.state
            .text("Value")
            .attr("x", "70%")
            .attr("y", "80%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 30 + "px");
    }


    public update(options: VisualUpdateOptions) {

        this.svg.selectAll(".dail").remove();
        this.svg.selectAll(".textValue").remove();
        this.textValue = this.container.append("text")
            .classed("textValue", true)
        this.state = this.container.append("text")
            .classed("textValue", true)
        this.statemouseover = this.container.append("text")
            .classed("textValue", true)

        this.times = this.container.append("text")
            .classed("time", true)

        this.textValue //TIME
            .text("Value")
            .attr("x", "65%")
            .attr("y", "75%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 20 + "px");
        this.state
            .text("Value")
            .attr("x", "75%")
            .attr("y", "75%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 20 + "px");

        this.statemouseover
            .text("Value")
            .attr("x", "75%")
            .attr("y", "80%")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", 20 + "px");

        this.dail = this.svg
            .append('rect')
            .classed('dail', true);

        let dataView: DataView = options.dataViews[0];
        let t = dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "SVG");
        this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);

        let speedsetting: number = Number(this.visualSettings.dataPoint.speed);
        let width: number = options.viewport.width; let height: number = options.viewport.height;
        this.svg.attr("width", width); this.svg.attr("height", height);
        let SVG_width2: number = Number(this.visualSettings.dataPoint.SVG_width);
        let SVG_height2: number = Number(this.visualSettings.dataPoint.SVG_height);

        height = (height > (width * SVG_height2 / SVG_width2)) ? width * SVG_height2 / SVG_width2 : height;
        width = (width > (height * SVG_width2 / SVG_height2)) ? width = height * SVG_width2 / SVG_height2 : width;

        this.dail
            .attr("x", 0)
            .attr("y", height * 95 / 100)
            .attr("width", 5)
            .attr("height", 50)
            .style("fill", "red")
            .style("fill-opacity", 0.8);


        let Sel = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "I")];
        let SelVals = Sel.values;
        const SelValsIds = SelVals.map( (element, index)  => {
            let selectionId: ISelectionId = this.host.createSelectionIdBuilder()
                .withCategory(Sel, index)
                .createSelectionId();
            return selectionId
        });

        
        let X = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "X")].values
        X.map(x => <number>x);
        let Y = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "Y")].values
        X.map(y => <number>y);
        let DT = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "DT")].values

        let DT2: XYDates[] = [];
        for (let i: number = 0; i < DT.length; i++) {
           if (DT[i] !== null) {
                DT2.push({ i: i, xy_date: new Date(<string>DT[i]), hour: new Date(<string>DT[i]).getHours(), minute: new Date(<string>DT[i]).getMinutes() });
            }
        }

        let ET = dataView.categorical.categories[dataRoleHelper.getCategoryIndexOfRole(dataView.categorical.categories, "ET")].values
        let ETstartindex = 0;
        let ETRange: ETRange[] = [];
        this.cumduration = 0;

//DEFINE RANGES FOR STATES
        let statecounter: number = 0;
        for (let i = 0; i < ET.length; i++) {
            if (i != 0) if (ET[i] != ET[i - 1]) { // exclude the null range that is used to draw the map
                let eind = new Date(<string>DT[i - 1]);
                let begin = new Date(<string>DT[ETstartindex]);
                let diff = eind.getTime() - begin.getTime();
                let endtime = new Date(eind.getTime());

                this.cumduration = this.cumduration + diff;
                if (ET[i - 1] != null && diff != 0)

                    ETRange.push({
                        id: statecounter,
                        start: ETstartindex,
                        eind: i - 1,
                        state: <number>ET[i - 1],
                        duration: diff
                        , cum_duration: this.cumduration//ETRange[i-1].duration + diff
                        , width: options.viewport.width
                        , endhour: endtime.getHours()
                        , starttime: begin
                        , sels: SelValsIds.slice(ETstartindex,i-1)
                    });// [DT[ETstartindex] , DT[i-1] ]  ]);
                statecounter++;
                ETstartindex = i;

            }
        };
       
        let ETRangeLength = ETRange.length;
        this.totalduration = ETRange[ETRangeLength - 1].cum_duration;
        
        let HourPrintArr: HourPrint[] = [];

        const start = DT2[0].hour;
        const end = DT2[DT2.length-1].hour;
        const range = [...Array(end - start + 1).keys()].map(x => x + start);
        console.log(range);
         
        let xunit = options.viewport.width / this.totalduration;
       
        let startpos = ((60 - DT2[0].minute) * 60 * 1000) * xunit;
        HourPrintArr.push({ x: startpos, hour: DT2[0].hour + 1 }); 
        let hourblock = 60 * 60 * 1000 * xunit;
        for (let i = 1; i < range.length; i++) {
            HourPrintArr.push({ x: startpos + (i * hourblock), hour: range[i]+1});          
        };
        
//TIMELINE MARKERS
            this.svg.selectAll(".rect").remove();       
            this.recSelection = this.svg
                .selectAll('.rect')
                .data(ETRange); // map data, with indexes, to svg element collection
            const recSelectionMerged = this.recSelection
                .enter()
                .append('rect')
                .classed('rect', true);
            this.svg.selectAll('.rect')
                .transition()
                .duration(1000)
                .attr("x", (d: ETRange) => {return  (d.width  * (d.cum_duration / this.totalduration)) }) //width devided by number of kpis for x position
                .attr("y", height * 95/100)
                .attr("width", 5)
                .attr("height", 50)
                .style("fill", "black")
                .style("fill-opacity", 0.8);       

//STATE BLOCKS
        this.svg.selectAll(".rectact").remove();
        this.recactSelection = this.svg
                .selectAll('.rectact')
                .data(ETRange); // map data, with indexes, to svg element collection
        const recSactelectionMerged = this.recactSelection
                .enter()
                .append('rect')
                .classed('rectact', true);
        this.svg.selectAll('.rectact')
            .transition()
            .duration(1000)
            .attr("x", (d: ETRange) => { return ((d.width * (d.cum_duration / this.totalduration)) - ((d.width / this.totalduration) * d.duration)) + 5 }) //width devided by number of kpis for x position, //minus de breedte
            .attr("y", height * 95 / 100)
            .attr("width", (d: ETRange) => {
                let w;
                w = ((d.width / this.totalduration) * d.duration) - 5;
                w = w <= 0 ? 0 : w;
                return w;
            })
            .attr("height", 50)
            .style("fill", (d: ETRange) => {
                switch (true) {
                    case d.state < 300: //docked
                        return "pink"; break;
                    case d.state == 513: //mowing
                        return "blue"; break;
                    case d.state == 514: //relocalizing
                        return "orange"; break;
                    case d.state == 518: //border cut
                        return "green"; break;
                    case d.state == 519: //idle in lawn
                        return "red"; break;
                    case d.state > 600: //going back
                        return "purple"; break;
                    default: return "white";
                }
            }).style("fill-opacity", 0.3);
        //pass SelectionId to the selectionManager
        recSactelectionMerged.on('click', (d: ETRange) => {

            let val = MOWER_STATE_DESCRIPTION_DETAIL[d.state];
            this.state.text(val);
            this.textValue.text("");
            this.counter++;
            this.svg.selectAll("path").remove();

            if (event['ctrlKey']) {
                this.selections.push(d);
                loopnumbers2.call(this, this.selections, false); 
            } else {
                this.selections = [d];
                loopnumbers2.call(this, this.selections, false); 
            }

            if (this.selectedblock != d.id) {
                let sels: ETRange[] = this.selections;
                recSactelectionMerged.style("fill-opacity", 0.3);
                for (let j = 0; j < sels.length; j++) {
                    recSactelectionMerged.filter((i) => i.id === sels[j].id).style("fill-opacity", 0.8)
                }
                if (d.sels != null) {  this.selectionManager.select(d.sels) };
            } else {
                recSactelectionMerged.style("fill-opacity", 0.3);
                this.selectionManager.clear();
                this.svg.selectAll("path").remove();                
                loopnumbers2.call(this, ETRange, true);
            }
            this.selectedblock = d.id;
        });
        recSactelectionMerged.on('mouseover', (d: ETRange) => {
            let val = MOWER_STATE_DESCRIPTION_DETAIL[d.state];
            this.statemouseover.text(val);
        })

//HOURS ON TIMELINE
            this.svg.selectAll(".time").remove();    
            this.txtSelection = this.svg
                .selectAll('.time')
                .data(HourPrintArr); // map data, with indexes, to svg element collection
            const txtSelectionMerged = this.txtSelection
                .enter()
                .append('text')
                .classed('time', true);
            this.svg.selectAll('.time')
                .text((d : HourPrint)=> d.hour)
                .attr("x", (d: HourPrint) => d.x) //width devided by number of kpis for x position
                .attr("y", height * 107 / 100)
                .attr("dy", "0.35em")
                .attr("text-anchor", "start")
                .style("font-size", 10 + "px");


        let data: [number, number][] = X.map((e, i) => [<number>e, <number>Y[i]]);

        this.svg.selectAll("polygon").remove(); this.svg.selectAll("circle").remove();  this.svg.selectAll(".circles").remove(); this.svg.selectAll("path").remove();

//DRAW MAP
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
            .x(i => (i[0]) * (width / SVG_width2))
            .y(i => (i[1]) * (height / SVG_height2))

        const sleep = ms => new Promise(r => setTimeout(r, ms));

        let MOWER_STATE_DESCRIPTION_DETAIL = {
            0: "Reading status",
            101: "Mower lifted",
            257: "Charging",
            258: "Docked",
            259: "Docked - Software update",
            260: "Charging",
            261: "Docked",
            262: "Docked - Loading map",
            263: "Docked - Saving map",
            266: "Docked - Leaving dock",
            512: "Mowing - Leaving dock",
            513: "Mowing",
            514: "Mowing - Relocalising",
            515: "Mowing - Loading map",
            516: "Mowing - Learning lawn",
            517: "Mowing - Paused",
            518: "Border cut",
            519: "Idle in lawn",
            520: "Mowing - Learning lawn paused",
            521: "Border cut",
            523: "Mowing - Spot mowing",
            524: "Mowing - Random",
            525: "Mowing - Random complete",
            768: "Returning to Dock",
            769: "Returning to Dock",
            770: "Returning to Dock",
            771: "Returning to Dock - Battery low",
            772: "Returning to dock - Calendar timeslot ended",
            773: "Returning to dock - Battery temp range",
            774: "Returning to dock - requested by user/app",
            775: "Returning to dock - Lawn complete",
            776: "Returning to dock - Relocalising",
            1005: "Connection to dockingstation failed",
            1025: "Diagnostic mode",
            1026: "End of life",
            1027: "Service Requesting Status",
            1038: "Mower immobilized",
            1281: "Software update",
            1537: "Stuck on lawn, help needed",
            64513: "Sleeping",
            99999: "Offline",
        }

//ANIMATE LINES
        async function print(start, eind, duur) {
            let val = MOWER_STATE_DESCRIPTION_DETAIL[<number>ET[start]];
            this.state.text(val);
            
            for (let i = start; i < eind; i++) {
                //for (const dt of DTS2) { //use for loop instead of forEach https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
                if (i % 2 == 0) {
                    await sleep((duur / (eind-start))*2);
                    this.textValue.text(DT2[i - ETRange[0].start].hour + ":" + DT2[i - ETRange[0].start].minute); //minus the empty rows for the map
                }
            }
        }


        async function loopnumbers2(this, ETR : ETRange[], animate: boolean) {
            let c: number = this.counter;
            for (let i = 0; i < ETR.length; i++) {
                if (c == this.counter) {
                    //console.log('stil running');
                    let L = (line(data.slice(ETR[i].start, ETR[i].eind)));
                    //console.log(diff);
                    let eventcode = ETR[i].state;
                    let diff = ETR[i].duration; // duration

                    if (animate) {
                        print.call(this, ETR[i].start, ETR[i].eind, diff / speedsetting);
                        this.dail
                            .transition()
                            .duration(diff / speedsetting)
                            .ease(d3.easeLinear)
                            .attr("x", width * (ETR[i].cum_duration / this.totalduration));
                    }
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

                    const path = this.svg.append("path")
                        .attr("fill", "none")
                        .attr("stroke", s(i))
                        .attr("stroke-width", sw(i))
                        .attr("stroke-linejoin", "round")
                        .attr("stroke-linecap", "round")
                        .attr("d", L);
                    let duration = (animate) ? diff / speedsetting : 0
                    path
                        .interrupt()
                        .attr("stroke-dasharray", function (d) { return "0," + this.getTotalLength(); })
                        .transition()
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr("stroke-dasharray", function (d) { return this.getTotalLength() + "," + this.getTotalLength(); })
                    if (animate) await sleep(diff / speedsetting);

                } else { console.log('stop running')}
            }
        }
        this.counter++;
        loopnumbers2.call(this, ETRange, true);
       
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