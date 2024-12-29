import * as THREE from 'three';
class ContourUtils {
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    static getColorForValue(value, minValue, maxValue, colorScale = 'viridis') {
        const t = (value - minValue) / (maxValue - minValue);
        
        // Viridis 颜色映射
        const colors = [
            new THREE.Color(0x440154),
            new THREE.Color(0x3B528B),
            new THREE.Color(0x21908C),
            new THREE.Color(0x5DC963),
            new THREE.Color(0xFDE725)
        ];
        
        const index = t * (colors.length - 1);
        const i = Math.floor(index);
        const f = index - i;
        
        if (i >= colors.length - 1) return colors[colors.length - 1];
        if (i < 0) return colors[0];
        
        const color1 = colors[i];
        const color2 = colors[i + 1];
        
        return new THREE.Color(
            this.lerp(color1.r, color2.r, f),
            this.lerp(color1.g, color2.g, f),
            this.lerp(color1.b, color2.b, f)
        );
    }
}

export {ContourUtils};