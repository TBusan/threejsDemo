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

        // 创建渐变填充
        contours.forEach((contour, index) => {
            contour.coordinates.forEach(coord => {
                coord.forEach(points => {
                    const shape = new THREE.Shape();
                    const firstPoint = points[0];
                    shape.moveTo(xScale(firstPoint[0]), yScale(firstPoint[1]));
                    
                    points.forEach(point => {
                        shape.lineTo(xScale(point[0]), yScale(point[1]));
                    });
                    
                    shape.lineTo(xScale(firstPoint[0]), yScale(firstPoint[1]));

                    const geometry = new THREE.ShapeGeometry(shape);
                    const normalizedValue = (contour.value - minValue) / (maxValue - minValue);
                    const material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color(colorScale(normalizedValue)),
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 1.0,
                        depthWrite: false
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.renderOrder = index;
                    this.group.add(mesh);
                });
            });
        });

        // 创建等值线
        contours.forEach((contour, index) => {
            contour.coordinates.forEach(coord => {
                coord.forEach(points => {
                    const linePoints = points.map(point => 
                        new THREE.Vector3(
                            xScale(point[0]),
                            yScale(point[1]),
                            0.1
                        )
                    );
                    linePoints.push(linePoints[0].clone());

                    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
                    const normalizedValue = (contour.value - minValue) / (maxValue - minValue);
                    const material = new THREE.LineBasicMaterial({
                        color: new THREE.Color(colorScale(normalizedValue)),
                        linewidth: 1,
                        transparent: true,
                        opacity: 0.8
                    });

                    const line = new THREE.Line(geometry, material);
                    line.renderOrder = contours.length + index;
                    this.group.add(line);
                });
            });
        });

        // 创建坐标轴
        this.createAxes();
    }

    createAxes() {
        const xMin = this.data.x[0];
        const xMax = this.data.x[this.data.x.length - 1];
        const yMin = this.data.y[0];
        const yMax = this.data.y[this.data.y.length - 1];

        // 坐标轴材质
        const axisMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2
        });

        // X轴
        const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xMin, yMin, 0.2),
            new THREE.Vector3(xMax, yMin, 0.2)
        ]);
        const xAxis = new THREE.Line(xAxisGeometry, axisMaterial);
        this.group.add(xAxis);

        // Y轴
        const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xMin, yMin, 0.2),
            new THREE.Vector3(xMin, yMax, 0.2)
        ]);
        const yAxis = new THREE.Line(yAxisGeometry, axisMaterial);
        this.group.add(yAxis);

        // 创建刻度
        this.createTicks(xMin, xMax, yMin, yMax);
    }

    createTicks(xMin, xMax, yMin, yMax) {
        const tickMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const tickSize = 0.1;

        // X轴刻度
        this.data.x.forEach(x => {
            // 刻度线
            const tickGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, yMin, 0.2),
                new THREE.Vector3(x, yMin - tickSize, 0.2)
            ]);
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            this.group.add(tick);

            // 刻度值标签
            const label = this.createTextLabel(x.toString(), {
                x: x,
                y: yMin - tickSize * 2,
                z: 0.2
            });
            this.group.add(label);
        });

        // Y轴刻度
        this.data.y.forEach(y => {
            // 刻度线
            const tickGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(xMin, y, 0.2),
                new THREE.Vector3(xMin - tickSize, y, 0.2)
            ]);
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            this.group.add(tick);

            // 刻度值标签
            const label = this.createTextLabel(y.toString(), {
                x: xMin - tickSize * 3,
                y: y,
                z: 0.2
            });
            this.group.add(label);
        });
    }

    createTextLabel(text, position) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 32;

        context.fillStyle = 'black';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(position.x, position.y, position.z);
        sprite.scale.set(0.5, 0.25, 1);

        return sprite;
    }
} 