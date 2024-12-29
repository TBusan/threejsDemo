import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class RayTracer {
    constructor(container, width = 800, height = 600) {
        // 初始化渲染器
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        // 创建相机和场景
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.scene = new THREE.Scene();

        // 设置相机位置
        this.camera.position.z = 5;

        // 创建光线追踪材质
        const fragmentShader = `
            precision highp float;
            
            uniform vec2 resolution;
            uniform mat4 cameraWorldMatrix;
            
            const int MAX_BOUNCE = 5;
            const float EPSILON = 0.001;
            const int NUM_SPHERES = 3;
            
            struct Sphere {
                vec3 center;
                float radius;
                vec3 color;
                float reflectivity;
            };
            
            Sphere spheres[NUM_SPHERES];
            
            // 光线-球体相交测试
            float intersectSphere(vec3 ro, vec3 rd, Sphere sphere) {
                vec3 oc = ro - sphere.center;
                float b = dot(oc, rd);
                float c = dot(oc, oc) - sphere.radius * sphere.radius;
                float h = b * b - c;
                
                if(h < 0.0) return -1.0;
                h = sqrt(h);
                float t = -b - h;
                return t > 0.0 ? t : (-b + h > 0.0 ? -b + h : -1.0);
            }
            
            // 计算法线
            vec3 getNormal(vec3 p, Sphere sphere) {
                return normalize(p - sphere.center);
            }
            
            // 光线追踪主函数
            vec3 trace(vec3 ro, vec3 rd) {
                vec3 col = vec3(0.0);
                vec3 contribution = vec3(1.0);
                
                // 初始化球体
                spheres[0] = Sphere(
                    vec3(0.0, 0.0, -1.0),  // center
                    0.5,                    // radius
                    vec3(1.0, 0.2, 0.2),   // color
                    0.5                     // reflectivity
                );
                
                spheres[1] = Sphere(
                    vec3(1.0, 0.0, -1.0),
                    0.3,
                    vec3(0.2, 1.0, 0.2),
                    0.7
                );
                
                spheres[2] = Sphere(
                    vec3(-1.0, 0.0, -1.0),
                    0.3,
                    vec3(0.2, 0.2, 1.0),
                    0.7
                );
                
                for(int bounce = 0; bounce < MAX_BOUNCE; bounce++) {
                    float t = 1e10;
                    int hitIndex = -1;
                    
                    // 找到最近的相交点
                    for(int i = 0; i < NUM_SPHERES; i++) {
                        float h = intersectSphere(ro, rd, spheres[i]);
                        if(h > 0.0 && h < t) {
                            t = h;
                            hitIndex = i;
                        }
                    }
                    
                    if(hitIndex < 0) {
                        // 没有击中任何物体，返回背景色
                        col += contribution * vec3(0.2, 0.3, 0.5);
                        break;
                    }
                    
                    // 计算交点和法线
                    vec3 pos = ro + t * rd;
                    vec3 normal = getNormal(pos, spheres[hitIndex]);
                    
                    // 添加漫反射光照
                    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                    float diff = max(dot(normal, lightDir), 0.0);
                    
                    // 计算颜色贡献
                    col += contribution * spheres[hitIndex].color * diff;
                    
                    // 计算反射
                    contribution *= spheres[hitIndex].reflectivity;
                    ro = pos + normal * EPSILON;
                    rd = reflect(rd, normal);
                }
                
                return col;
            }
            
            void main() {
                vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
                uv.x *= resolution.x / resolution.y;
                
                // 使用内置的 cameraPosition
                vec3 ro = cameraPosition;
                vec3 rd = normalize(vec3(uv, -1.0));
                rd = (cameraWorldMatrix * vec4(rd, 0.0)).xyz;
                
                vec3 col = trace(ro, rd);
                
                // 简单的色调映射
                col = col / (1.0 + col);
                
                gl_FragColor = vec4(col, 1.0);
            }
        `;

        const vertexShader = `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `;

        this.rayTracingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                resolution: { value: new THREE.Vector2(width, height) },
                cameraWorldMatrix: { value: this.camera.matrixWorld }
            },
            fragmentShader: fragmentShader,
            vertexShader: vertexShader
        });

        // 创建全屏四边形
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.rayTracingMaterial);
        this.scene.add(mesh);

        // 添加轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // 开始渲染循环
        this.animate();
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        // 更新相机相关的 uniforms
        this.rayTracingMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld);

        // 更新控制器
        this.controls.update();

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.rayTracingMaterial.uniforms.resolution.value.set(width, height);
    }
}

export { RayTracer };