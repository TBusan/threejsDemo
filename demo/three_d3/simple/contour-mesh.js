import * as THREE from 'three';

export default class ContourMesh {
    constructor(data, generator) {
        this.data = data;
        this.generator = generator;
        this.group = new THREE.Group();
        this.create();
    }

    create() {
        const { contours, xScale, yScale, minValue, maxValue } = this.generator.generate();
        const colorScale = this.generator.getColorScale();

        contours.forEach(contour => {
            contour.coordinates.forEach(coord => {
                coord.forEach(points => {
                    const linePoints = points.map(point => 
                        new THREE.Vector3(
                            xScale(point[0]),
                            yScale(point[1]),
                            0
                        )
                    );
                    linePoints.push(linePoints[0].clone());

                    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
                    const normalizedValue = (contour.value - minValue) / (maxValue - minValue);
                    const material = new THREE.LineBasicMaterial({
                        color: new THREE.Color(colorScale(normalizedValue)),
                        linewidth: 1
                    });

                    const line = new THREE.Line(geometry, material);
                    this.group.add(line);
                });
            });
        });

        this.createGrid();
    }

    createGrid() {
        const xMin = this.data.x[0];
        const xMax = this.data.x[this.data.x.length - 1];
        const yMin = this.data.y[0];
        const yMax = this.data.y[this.data.y.length - 1];

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0xcccccc,
            opacity: 0.5,
            transparent: true
        });

        // X 方向网格线
        for (let x of this.data.x) {
            const points = [
                new THREE.Vector3(x, yMin, 0),
                new THREE.Vector3(x, yMax, 0)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.group.add(line);
        }

        // Y 方向网格线
        for (let y of this.data.y) {
            const points = [
                new THREE.Vector3(xMin, y, 0),
                new THREE.Vector3(xMax, y, 0)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.group.add(line);
        }
    }
} 