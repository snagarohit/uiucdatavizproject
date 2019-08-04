import { Component } from '@angular/core';
import {DatabaseService} from '../database.service';

import * as d3 from 'd3';
import { from } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  circles: any;
  minCO2: number;
  maxCO2: number;
  minAge: number;
  maxAge: number;
  originalDataset: { 'CO2': number; 'Life': number; 'Population': number; 'Code': string; 'Name': string; 'IGroup': string; 'Region': string; 'Year': number; }[];
  minYear: number;
  maxYear: number;
  originalDatasetCountryCodes: string[];
  tooltipDiv: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  clsreg: { 'East Asia & Pacific': string; 'Europe & Central Asia': string; 'Latin America & Caribbean': string; 'Middle East & North Africa': string; 'North America': string; 'South Asia': string; 'Sub-Saharan Africa': string; };
  activeRegion = 'all';
  regionsMaster: string[];
  regionsMasterComp: { 'East Asia & Pacific': string; 'Europe & Central Asia': string; 'Latin America & Caribbean': string; 'Middle East & North Africa': string; 'North America': string; 'South Asia': string; 'Sub-Saharan Africa': string; };
  animationInProgress = false;
  consent = false;
  labels: any;
  constructor(private databaseService: DatabaseService) { }
  text = 'Default starting text';

  svgElem: any;
  svgWidth: any;
  svgHeight: any;
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  year = 1960;
  graphOrigin: any;
  r: d3.ScaleLogarithmic<number, number>;
  c: any;

  async onChangeText() {
    await this.startNarration();
  }

  async letsGo() {
    this.consent = true;
    await this.startNarration();
  }

  async startNarration() {

    this.animationInProgress = true;

    this.year = 1961;
    this.reAnimate();

    while (this.year < this.maxYear) {
      await this.delay(200);
      this.year += 1;
      this.reAnimate();
    }


    this.animationInProgress = false;
  }

  draw(year: number) {
    throw new Error('Method not implemented.');
  }

  getIncomeClass(d) {
    return d.IGroup.replace(/\s/g, '');
  }

  getRegionClass(d) {
    return d.Region.replace(/\s/g, '');
  }

  filterRegions(ar) {
    this.activeRegion = ar;
    const self = this;

    if (this.activeRegion == 'all') {
      d3.selectAll('circle.dataPointz')
      .attr('opacity', 1);
      d3.selectAll('text.labels')
      .attr('opacity', 1);
    } else {
      d3.selectAll('circle.dataPointz')
      .attr('opacity', function(d: { 'CO2': number; 'Life': number; 'Population': number; 'Code': string; 'Name': string; 'IGroup': string; 'Region': string; 'Year': number; }, i) {
        if (d.Region == self.activeRegion) {
          return 1;
        } else {
          return 0;
        }
      });
      d3.selectAll('text.labels')
      .attr('opacity', function(d: { 'CO2': number; 'Life': number; 'Population': number; 'Code': string; 'Name': string; 'IGroup': string; 'Region': string; 'Year': number; }, i) {
        if (d.Region == self.activeRegion) {
          return 1;
        } else {
          return 0;
        }
      });
    }
  }

  setupSvg() {
    this.svgElem = d3.select('svg#plot1');
    this.svgWidth = this.svgElem.node().getBoundingClientRect().width;
    this.svgHeight = this.svgElem.node().getBoundingClientRect().height;

    const marginOffset = 40;

    this.activeRegion = 'all';

    this.minCO2 = 0.005;
    this.maxCO2 = 45;

    this.x = d3.scaleLog()
    .domain([this.minCO2, this.maxCO2])
    .range([0, this.svgWidth - 2 * marginOffset]);

    this.minAge = 30;
    this.maxAge = 85;

    this.y = d3.scaleLinear()
    .domain([this.minAge, this.maxAge])
    .range([this.svgHeight - 2 * marginOffset, 0]);

    this.r = d3.scaleLog()
    .domain([100000, 1100000000])
    .range([3, 35]);

    this.c = {
      'East Asia & Pacific' : 'rgb(78, 121, 167)',
      'Europe & Central Asia' : 'rgb(242, 142, 43)',
      'Latin America & Caribbean' : 'rgb(225, 87, 89)',
      'Middle East & North Africa' : 'rgb(118, 183, 178)',
      'North America' : 'rgb(89, 161, 79)',
      'South Asia' : 'rgb(237, 201, 72)',
      'Sub-Saharan Africa' : 'rgb(176, 122, 161)'
    };
    this.clsreg = {
      'East Asia & Pacific' : '1afr',
      'Europe & Central Asia' : '1eur',
      'Latin America & Caribbean' : '1lat',
      'Middle East & North Africa' : '1me',
      'North America' : '1na',
      'South Asia' : '1as',
      'Sub-Saharan Africa' : '1sa'
    };
    this.regionsMaster = [
      'East Asia & Pacific',
      'Europe & Central Asia',
      'Latin America & Caribbean',
      'Middle East & North Africa',
      'North America',
      'South Asia',
      'Sub-Saharan Africa'];

    this.regionsMasterComp = {
      'East Asia & Pacific' : 'E Asia',
      'Europe & Central Asia' : 'Europe',
      'Latin America & Caribbean' : 'Lat Am',
      'Middle East & North Africa' : 'Middle E',
      'North America' : 'N America',
      'South Asia' : 'S Asia',
      'Sub-Saharan Africa' : 'Africa'
    };

    const xAxis = d3.axisBottom(this.x).tickFormat(function(n: number) {
      if (n >= 1) {
        return String(n);
      } else {
        let s = String(n.toPrecision(3)).substring(0, 4);

        if (s[3] == '0') {
          s = s.substr(0, 3);
        }

        if (s[0] == '0') {
          s = s.substring(1);
        }

        return s;
      }
    });

    const yAxis = d3.axisLeft(this.y);

    this.svgElem.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(' + String(marginOffset) + ' ' + String(this.svgHeight - marginOffset) + ')')
    .call(xAxis)
    .append('text')
    .attr('class', 'axis-title')
    .attr('y', 25)
    .attr('x', (this.svgWidth / 2))
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .attr('fill', '#5D6971')
    .text('CO2 Per Capita');

    this.svgElem.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + String(marginOffset) + ' ' + String(marginOffset) + ')')
    .call(yAxis)
    .append('text')
    .attr('class', 'axis-title')
    .attr('transform', 'rotate(-90)')
    .attr('y', -35)
    .attr('x', -1 * (this.svgHeight / 3))
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .attr('fill', '#5D6971')
    .text('Average Life Expectancy');

    const self = this;

    this.graphOrigin = this.svgElem.append('g')
    .attr('class', 'graphOrigin')
    .attr('transform', 'translate(' + String(marginOffset) + ', ' + String(marginOffset) + ')');

    this.minYear = 1960;
    this.maxYear = 2018;

    this.tooltipDiv = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
  }

  initDraw() {
    this.composeData();

    const self = this;

    d3.selectAll('.graphOrigin').html('');


    const priorityData = (self = this) => {
      self.originalDataset.sort((a, b) => -a.Population+b.Population);
      
      return self.originalDataset.filter(d => d.Region == self.regionsMaster[0]).slice(0, 3)
      .concat(self.originalDataset.filter(d => d.Region == self.regionsMaster[1]).slice(0, 3))
      .concat(self.originalDataset.filter(d => d.Region == self.regionsMaster[2]).slice(0, 3))
      .concat(self.originalDataset.filter(d => d.Region == self.regionsMaster[3]).slice(0, 3))
      .concat(self.originalDataset.filter(d => d.Region == self.regionsMaster[4]).slice(0, 3))
      .concat(self.originalDataset.filter(d => d.Region == self.regionsMaster[5]).slice(0, 3))
      .concat(self.originalDataset.filter(d => d.Region == self.regionsMaster[6]).slice(0, 3));
    }

    this.circles = this.graphOrigin.selectAll('circle')
      .data(this.originalDataset)
      .enter()
      .append('circle')
      .attr('opacity', 1)
      .attr('class', function(d, i) {
        return d.Code + ' ' + self.clsreg[d.Region] + ' dataPointz';
      })
      .attr('r', function(d, i) {
        return self.r(d.Population);
      })
      .attr('cx', function(d, i) {
        return self.x(d.CO2);
      })
      .attr('cy', function(d, i) {
        return self.y(d.Life);
      })
      .attr('fill',  function(d, i) {
        return self.c[d.Region];
      })
      .attr('stroke', function(d, i) {
        return self.c[d.Region];
      })
      .attr('stroke-width', 1)
      .attr('fill-opacity', 0.4)
      .on('mouseover', function(d) {
        self.tooltipDiv.transition()
          .duration(200)
          .style('opacity', .9);
        self.tooltipDiv.html(self.populateTooltip(d))
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        d3.select('circle.' + d.Code)
          .attr('fill-opacity', 1)
          .attr('stroke', 'yellow')
          .attr('stroke-width', 4);
      })
      .on('mouseout', function(d) {
          self.tooltipDiv.transition()
              .duration(500)
              .style('opacity', 0);
          d3.select('circle.' + d.Code)
            .attr('fill-opacity', 0.4)
            .attr('stroke', self.c[d.Region])
            .attr('stroke-width', 1);
      });

    this.labels = this.graphOrigin.selectAll('text.labels')
      .data(priorityData)
      .enter()
      .append('text')
      .attr('class', 'labels')
      .attr('x', (d, i) => {
        return self.x(d.CO2) - 10;
      })
      .attr('y', (d, i) => {
        return self.y(d.Life) + 5;
      })
      .attr('dy', '0.1em')
      .attr('fill', 'black')
      .text(d => d.Code);
  }

  populateTooltip(d) {
    const keyToVerbose = {
      CO2 : 'CO2 Per Capita',
      Life: 'Life Expectancy',
      Code : 'Country Code',
      Population : 'Population',
      Name : 'Name',
      IGroup : 'Income Group',
      Region: 'Geo Region',
      Year: 'Year'
    };

    const rows = Object.keys(d).map(function(value, idx) {
      return '<tr>\
        <td class=\'popupTd popupIdk\'>' + keyToVerbose[value] + '</td>\
        <td class=\'popupTd\'>' + d[value] + '</td>\
      </tr>';
    });
    const rowData = rows.join(' ');
    return '<table class=\'popupTable\'>' + rowData + '</table>';
  }

  reAnimate() {
    this.reComposeData();


    const getDataForCode = (code) => {
      return this.originalDataset.filter(d => d.Code == code)[0];
    };

    const self = this;

    this.circles
      .on('mouseover', function(d) {
        self.tooltipDiv.transition()
          .duration(200)
          .style('opacity', .9);
        self.tooltipDiv.html(self.populateTooltip(getDataForCode(d.Code)))
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        d3.select('circle.' + d.Code)
          .attr('fill-opacity', 1)
          .attr('stroke', 'yellow')
          .attr('stroke-width', 4);
      })
      .on('mouseout', function(d) {
          self.tooltipDiv.transition()
              .duration(500)
              .style('opacity', 0);
          d3.select('circle.' + d.Code)
            .attr('fill-opacity', 0.4)
            .attr('stroke', self.c[d.Region])
            .attr('stroke-width', 1);
      })
      .transition()
      .attr('r', function(d, i) {
        return self.r(getDataForCode(d.Code).Population);
      })
      .attr('cx', function(d, i) {
        return self.x(getDataForCode(d.Code).CO2);
      })
      .attr('cy', function(d, i) {
        return self.y(getDataForCode(d.Code).Life);
      });

    this.labels
      .transition()
      .attr('x', (d, i) => {
        return self.x(getDataForCode(d.Code).CO2) - 10;
      })
      .attr('y', (d, i) => {
        return self.y(getDataForCode(d.Code).Life) + 5;
      });
  }

  composeData() {
    this.year = this.minYear;

    this.originalDataset = this.databaseService.getDataByYear(this.year).filter(d => d.CO2 >= this.minCO2 &&
      d.CO2 <= this.maxCO2 &&
      d.Life >= this.minAge &&
      d.Life <= this.maxAge);

    this.originalDatasetCountryCodes = this.originalDataset.map(a => a.Code);
    this.originalDataset.sort(function(a, b) {return a.Code < b.Code ? -1 : 1; });
  }

  reComposeData() {
    const da = this.databaseService.getDataByYear(this.year)
      .filter(a => this.originalDatasetCountryCodes.includes(a.Code))
      .filter(d => d.CO2 >= this.minCO2 &&
        d.CO2 <= this.maxCO2 &&
        d.Life >= this.minAge &&
        d.Life <= this.maxAge);
    const thisCountryCodes = da.map( d => d.Code);
    const missingCountryData = this.originalDataset.filter(d => !thisCountryCodes.includes(d.Code));
    this.originalDataset = da.concat(missingCountryData).sort(function(a, b) {return a.Code < b.Code ? -1 : 1; });
  }


  ionViewWillEnter() {
    this.setupSvg();
    this.animate(this);
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(), ms)).then(() => console.log('fired'));
  }

  async animate(self) {
    this.initDraw();
  }


}
