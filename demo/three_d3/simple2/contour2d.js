export default class Contour2D {
    constructor(container, data) {
        this.container = container;
        this.data = data;
        this.init();
    }

    init() {
        // 设置SVG尺寸和边距
        this.margin = { top: 50, right: 50, bottom: 50, left: 50 };
        this.width = 1400;
        this.height = 700;

        this.createSvg();
        this.createScales();
        this.createContours();
        this.render();
    }

    createSvg() {
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }

    createScales() {
        // 修正比例尺的定义
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.data.x))
            .range([0, this.width])
            .nice();

        this.yScale = d3.scaleLinear()
            .domain(d3.extent(this.data.y))
            .range([this.height, 0])
            .nice();

        // 创建颜色比例尺
        const values = this.data.v.flat();
        this.colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([d3.max(values), d3.min(values)]);
    }

    createContours() {
        // 生成等值线数据
        this.contours = d3.contours()
            .size([this.data.v[0].length, this.data.v.length])
            .thresholds(20)
            (this.data.v.flat());

        // 使用 geoIdentity 替代 geoTransform
        const transform = d3.geoIdentity()
            .scale(this.width / (this.data.v[0].length - 1))
            .translate([0, 0]);

        this.path = d3.geoPath().projection(transform);
    }

    render() {
        // 创建裁剪区域
        this.svg.append("defs")
            .append("clipPath")
            .attr("id", "plot-area")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", this.height);

        // 绘制等值线填充
        const plotArea = this.svg.append("g")
            .attr("clip-path", "url(#plot-area)");

        plotArea.append("g")
            .selectAll("path")
            .data(this.contours)
            .enter()
            .append("path")
            .attr("d", this.path)
            .attr("fill", d => this.colorScale(d.value))
            .attr("opacity", 0.8);

        // 绘制等值线
        plotArea.append("g")
            .selectAll("path")
            .data(this.contours)
            .enter()
            .append("path")
            .attr("d", this.path)
            .attr("class", "contour-path")
            .attr("stroke", d => this.colorScale(d.value))
            .attr("stroke-width", 1)
            .attr("opacity", 1);

        // 添加坐标轴
        this.svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale));

        this.svg.append("g")
            .call(d3.axisLeft(this.yScale));
    }
}
