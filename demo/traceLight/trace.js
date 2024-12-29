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

        // 调整相机位置以更好地观察场景
        this.camera.position.set(0, 2, 4);
        this.camera.lookAt(0, 0, -1);

        // 创建光线追踪材质
        const fragmentShader = `
            precision highp float;
            
            uniform vec2 resolution;
            uniform mat4 cameraWorldMatrix;
            
            const int MAX_BOUNCE = 5;
            const float EPSILON = 0.001;
            const int NUM_SPHERES = 4;  // 增加一个地面球体
            
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
            
            // 软阴影计算
            float softShadow(vec3 ro, vec3 rd, float mint, float maxt) {
                float res = 1.0;
                float t = mint;
                for(int i = 0; i < 16; i++) {
                    if(t > maxt) break;
                    float h = 1e10;
                    for(int j = 0; j < NUM_SPHERES; j++) {
                        float d = intersectSphere(ro + rd * t, rd, spheres[j]);
                        if(d > 0.0) h = min(h, d);
                    }
                    res = min(res, 8.0 * h / t);
                    t += h;
                }
                return clamp(res, 0.0, 1.0);
            }
            
            // 光线追踪主函数
            vec3 trace(vec3 ro, vec3 rd) {
                vec3 col = vec3(0.0);
                vec3 contribution = vec3(1.0);
                
                // 初始化球体
                spheres[0] = Sphere(  // 红色球体
                    vec3(0.0, 0.5, -1.0),
                    0.5,
                    vec3(0.9, 0.2, 0.2),
                    0.8
                );
                
                spheres[1] = Sphere(  // 绿色球体
                    vec3(1.0, 0.3, -0.5),
                    0.3,
                    vec3(0.2, 0.9, 0.2),
                    0.6
                );
                
                spheres[2] = Sphere(  // 蓝色球体
                    vec3(-1.0, 0.3, -0.5),
                    0.3,
                    vec3(0.2, 0.2, 0.9),
                    0.6
                );

                spheres[3] = Sphere(  // 地面
                    vec3(0.0, -1000.0, 0.0),
                    1000.0,
                    vec3(0.5, 0.5, 0.5),
                    0.2
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
                        // 天空颜色
                        vec3 sky = vec3(0.6, 0.7, 0.9) - rd.y * 0.2;
                        col += contribution * sky;
                        break;
                    }
                    
                    // 计算交点和法线
                    vec3 pos = ro + t * rd;
                    vec3 normal = getNormal(pos, spheres[hitIndex]);
                    
                    // 光照设置
                    vec3 lightPos = vec3(2.0, 4.0, 2.0);
                    vec3 lightDir = normalize(lightPos - pos);
                    float lightDist = length(lightPos - pos);
                    
                    // 计算阴影
                    float shadow = softShadow(pos + normal * EPSILON, lightDir, 0.02, lightDist);
                    
                    // 漫反射
                    float diff = max(dot(normal, lightDir), 0.0);
                    
                    // 镜面反射
                    vec3 reflectDir = reflect(-lightDir, normal);
                    float spec = pow(max(dot(reflectDir, -rd), 0.0), 32.0);
                    
                    // 环境光遮蔽
                    float ao = 0.5 + 0.5 * normal.y;
                    
                    // 计算颜色
                    vec3 diffuse = spheres[hitIndex].color * diff * shadow;
                    vec3 specular = vec3(0.5) * spec * shadow;
                    vec3 ambient = spheres[hitIndex].color * 0.1 * ao;
                    
                    col += contribution * (ambient + diffuse + specular);
                    
                    // 更新光线
                    contribution *= spheres[hitIndex].reflectivity;
                    ro = pos + normal * EPSILON;
                    rd = reflect(rd, normal);
                }
                
                return col;
            }
            
            void main() {
                vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
                uv.x *= resolution.x / resolution.y;
                
                vec3 ro = cameraPosition;
                vec3 rd = normalize(vec3(uv, -1.0));
                rd = (cameraWorldMatrix * vec4(rd, 0.0)).xyz;
                
                vec3 col = trace(ro, rd);
                
                // 色调映射和伽马校正
                col = col / (1.0 + col);
                col = pow(col, vec3(0.4545));
                
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