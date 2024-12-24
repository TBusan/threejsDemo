import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export default class ContourGenerator {
    constructor(data) {
        this.data = data;
        this.width = data.v[0].length;
        this.height = data.v.length;
        this.flatValues = data.v.flat();
    }

    generate() {
        const contours = d3.contours()
            .size([this.width, this.height])
            .thresholds(15)
            (this.flatValues);

        const xScale = d3.scaleLinear()
            .domain([0, this.width - 1])
            .range([this.data.x[0], this.data.x[this.data.x.length - 1]]);

        const yScale = d3.scaleLinear()
            .domain([0, this.height - 1])
            .range([this.data.y[0], this.data.y[this.data.y.length - 1]]);

        return {
            contours,
            xScale,
            yScale,
            minValue: d3.min(this.flatValues),
            maxValue: d3.max(this.flatValues)
        };
    }

    getColorScale() {
        return d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([1, 0]);
    }
} 