const miscutils = {
    deferred() {
        let s, e;
        const i = new Promise( (r, a) => {
            s = r,
            e = a
        }
        );
        return i.resolve = s,
        i.reject = e,
        i
    },
    debounce(s, e) {
        let i = null;
        return () => {
            clearTimeout(i),
            i = setTimeout(s, e)
        }
    },
    wait(s, e=!1) {
        return new Promise(i => {
            if (typeof s == "number")
                e ? setTimeout(i, s * 1e3) : gsapWithCSS.delayedCall(s, i);
            else if (s && typeof e == "string") {
                const r = setInterval( () => {
                    s[e] !== void 0 && (clearInterval(r),
                    i())
                }
                , 50)
            } else
                console.warn("invalid wait"),
                i()
        }
        )
    },
    nextFrame(s) {
        return new Promise(e => {
            gsapWithCSS.delayedCall(0, () => {
                s && s(),
                e()
            }
            )
        }
        )
    },
    nextIdle(s) {
        return new Promise(e => {
            const i = () => {
                removeFromIdle(i),
                s && s(),
                e()
            }
            ;
            addToIdle(i)
        }
        )
    },
    taskIdle(s, e=2, i=10) {
        return new Promise(r => {
            const a = Date.now();
            let o = !1;
            const l = () => {
                removeFromIdle(c),
                o = !0,
                r()
            }
              , c = d => {
                const u = Date.now();
                let h = u
                  , f = -1;
                for (; !o && f < e && d.timeRemaining() > 0; )
                    s && s(l),
                    h = Date.now(),
                    f = h - u;
                !o && h - a > i * 1e3 && l()
            }
            ;
            addToIdle(c)
        }
        )
    },
    onResize(s, e=null) {
        s.call(e, client.screen.w, client.screen.h),
        events.on("resize", s, e)
    },
    offResize(s, e=null) {
        events.off("resize", s, e)
    },
    loadJson(s) {
        return fetch(s).then(e => e.json()).catch( () => console.log(`Load of ${s} failed.`))
    },
    preload(s=[], e) {
        if (!(s && s.length))
            return e && e(1),
            Promise.resolve();
        const i = [...new Set(s)]
          , r = i.length;
        let a = 0;
        const o = async l => {
            try {
                const d = await fetch(l);
                d.ok && await d.blob()
            } catch (d) {
                console.warn(`${d} ${l}`)
            }
            const c = ++a / r;
            e && e(c)
        }
        ;
        return Promise.all(i.map(l => o(l)))
    }
}

const vertex = `
    //- edit

    #define PHONG

    ${globalUBO}
    ${sinenoise}
    ${fit}

    varying vec3 vViewPosition;

    uniform mat4 csmMatrix;
    uniform vec2 csmBiases;
    varying vec4 vCsmShadowCoord;
    varying vec3 wPos;

    #include <common>
    #include <uv_pars_vertex>
    #include <color_pars_vertex>
    #include <normal_pars_vertex>

    #ifdef USE_SKINNING
            uniform mat4 bindMatrix;
            uniform mat4 bindMatrixInverse;
            uniform sampler2D boneTexture;
            uniform int boneTextureSize;

        #ifdef IS_CHARACTER
            attribute int instanceID;
            mat4 getBoneMatrix(const in float i) {
                int x = int(i) * 4;
                vec4 v1 = texelFetch(boneTexture, ivec2(x, instanceID), 0);
                vec4 v2 = texelFetch(boneTexture, ivec2(x + 1, instanceID), 0);
                vec4 v3 = texelFetch(boneTexture, ivec2(x + 2, instanceID), 0);
                vec4 v4 = texelFetch(boneTexture, ivec2(x + 3, instanceID), 0);
                mat4 bone = mat4(v1, v2, v3, v4);
                return bone;
            }
        #else
            mat4 getBoneMatrix( const in float i ) {
                float j = i * 4.0;
                float x = mod( j, float( boneTextureSize ) );
                float y = floor( j / float( boneTextureSize ) );
                float dx = 1.0 / float( boneTextureSize );
                float dy = 1.0 / float( boneTextureSize );
                y = dy * ( y + 0.5 );
                vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
                vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
                vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
                vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
                mat4 bone = mat4( v1, v2, v3, v4 );
                return bone;
            }
        #endif
    #endif

    #if defined(MULTICOLOR) || defined(USE_RAMP)
        attribute vec2 colorInfo;
        varying vec2 vColorInfo;
    #endif

    #if defined(SHAKE) || defined(GRASS)
        float hash13(vec3 p3) {
            p3  = fract(p3 * .1031);
            p3 += dot(p3, p3.zyx + 31.32);
            return fract((p3.x + p3.y) * p3.z);
        }
    #endif

    #ifdef REACT_CHARACTER
        uniform vec3 charPos;
        uniform float charSpeed;
    #endif

    #ifdef RANDOM_ATTRIB
        attribute vec4 random;
        varying vec4 vRand;
    #endif

    #ifdef IS_CHARACTER
        attribute float instanceSeed;
        varying float vSeed;
    #endif

    #include <shadowmap_pars_vertex>

    void main() {
        #include <uv_vertex>
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>
        #include <normal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>

        #ifdef IS_CHARACTER
            vSeed = instanceSeed;
        #endif

        #ifdef RANDOM_ATTRIB
            vRand = random;
        #endif

        vec4 mvPosition = vec4(transformed, 1.0);

        #ifdef PLANE_FACE_CHARACTER
            mvPosition.xz = vec2(viewMatrix[0][0], viewMatrix[2][0]) * mvPosition.x;
        #endif

        #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
        #endif

        vec4 worldPosition = modelMatrix * mvPosition;

        wPos = worldPosition.xyz;
        vec4 _wPos = worldPosition;

        #if defined(USE_RAMP)
            vColorInfo = colorInfo;
        #endif

        #ifdef SHAKE
            float mult = 1.0;
            #if defined(USE_RAMP)
                mult = colorInfo.y; // tree moving
            #endif

            #ifdef USE_INSTANCING
                float seed = hash13(instanceMatrix[3].xyz); // take tree/bush position
            #else
                float seed = hash13(_wPos.xyz); // use vertex position
            #endif

            #ifdef LIGHTWIRES
                float peri = _wPos.z * 0.05; // waviness
                float ttotal = (sin(time * 0.2 + peri) + 1.0) * 0.5;
                float amp = mult * ttotal * 0.75;
                _wPos.x += sin(time * 0.5 + peri) * amp;
            #else
                float disp = smoothstep(0.0, 2.0, mvPosition.y); //  bottom parts won't move as much
                float peri = _wPos.y * 0.3; // waviness
                float ttotal = (sin(time * (0.4 + 0.2 * seed) + seed * 120.2) + 1.0) * 0.5; // make them move only sometimes
                float amp = seed * disp * mult * ttotal * 0.2; // random multiplier from seed + limiters + max shake
                _wPos.x += sin(seed * 21.23 + time * 1.0 + peri) * amp;
                _wPos.z += sin(seed * 3.23 + time * 1.5 + peri) * amp;
            #endif
        #endif

        #ifdef GRASS
            float mult = step(0.1, position.y);
            vec3 grassPos = instanceMatrix[3].xyz;
            float grassdisp = 0.1 + 0.2 * random.x;
            float grassspeed = 0.25 + 0.3 * random.y;
            _wPos.x += sinenoise1(vec3(grassPos.x, 0.0, grassPos.z) * vec3(0.05) + time * grassspeed) * grassdisp * mult;
            _wPos.z += sinenoise1(vec3(grassPos.x, 0.0, grassPos.z) * vec3(0.1) + vec3(313.123) + time * grassspeed) * grassdisp * mult;

            vec3 grassCharDir = _wPos.xyz - charPos;
            float dist = length(grassCharDir);
            vec3 disp = normalize(grassCharDir) * fit(dist, 0.0, fit(charSpeed, 0.0, 0.01, 0.0, 1.25), 1.0, 0.0) * mult * 15.0 * charSpeed;
            _wPos.xz += disp.xz;
        #endif

        vec4 vPos = viewMatrix * _wPos;
        vViewPosition = -vPos.xyz;
        gl_Position = projectionMatrix * vPos;

        #include <shadowmap_vertex>

        vec3 csmWorldNormal = inverseTransformDirection(transformedNormal, viewMatrix);
        vec4 cmsWorldPosition = worldPosition + vec4(csmWorldNormal * csmBiases.x, 0); // shadow normal bias
        vCsmShadowCoord = csmMatrix * cmsWorldPosition;
    }
`
const fragment = `
    //- edit

    #define PHONG

    ${globalUBO}
    ${linearstep}
    ${fit}
    ${colorutils}
    ${fogChunk}

    uniform vec3 diffuse;
    uniform vec3 emissive;
    uniform vec3 specular;
    uniform float shininess;
    uniform float opacity;

    #ifdef IS_CHARACTER
        varying float vSeed;
    #endif

    #ifdef IS_TERRAIN
        uniform sampler2D tMasks;
        uniform sampler2D tTerrNoises;
        uniform sampler2D tTerrDetails;
        uniform vec3 grassColor1;
        uniform vec3 grassColor2;
    #endif

    #if defined(USE_RAMP)
        uniform sampler2D tRamp;
        varying vec2 vColorInfo;

        float getRamp(float index) {
            const float rampStep = 1.0 / 100.0;
            return 1.0 - index * rampStep + rampStep * 0.5;
        }
    #endif

    #ifdef RECEIVE_SHADOW_CLOUDS
        uniform sampler2D tCloudsTop;
    #endif

    uniform sampler2D csmMap;
    uniform vec4 csmOptions;
    uniform vec2 csmBiases;
    uniform vec3 csmTarget;
    varying vec4 vCsmShadowCoord;
    varying vec3 wPos;

    float lineFade(vec3 p, float size, float amount) {
        float h = size * 0.5;
        return 1.0 - step(amount * 1.01, (abs(mod(p.y, size) - h) / h));
    }

    float sphereFade(vec3 p, float size, float amount) {
        float h = size * 0.5;
        return clamp(1.0 - step(amount * 1.85, length(mod(p, size) - h) / h), 0.0, 1.0);
    }

    #include <common>
    #include <packing>
    #include <uv_pars_fragment>
    #include <map_pars_fragment>
    #include <bsdfs>
    #include <lights_pars_begin>
    #include <normal_pars_fragment>
    #include <lights_phong_pars_fragment>
    #include <shadowmap_pars_fragment>

    #ifdef RANDOM_ATTRIB
        varying vec4 vRand;
    #endif

    void main() {
        #ifndef IS_CHARACTER
            float dist = length(wPos - cameraPosition);
            float showAmount = lineFade(wPos, 0.015, linearstep(1.5, 2.0, dist));
            if (showAmount < 0.001) discard;
        #endif

        vec4 diffuseColor = vec4(diffuse, opacity);

        ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        vec3 totalEmissiveRadiance = emissive;
        #include <specularmap_fragment>
        #include <normal_fragment_begin>

        // accumulation
        #include <lights_phong_fragment>

        // include <lights_fragment_begin>
        ${tweakedLightsFragment}

        #include <lights_fragment_end>

        vec3 diffuseSpecular = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;

        #if NUM_DIR_LIGHTS > 0 && defined(USE_RAMP)
            DirectionalLight rampLight = directionalLights[0];
            float rampX = fit(dot(geometry.normal, rampLight.direction), -1.0, 1.0, 0.0, 1.0) * _shadow0;
            float rampStep = 1.0 / 100.0;

            #ifdef IS_TERRAIN
                // colors
                vec4 terrain = texture2D(tMasks, vUv);
                float path = smoothstep(0.35, 0.4, terrain.b);
                float road = smoothstep(0.35, 0.4, terrain.r);
                float bridge = terrain.a;

                vec3 colorGrass;
                vec3 colorPath;
                vec3 colorRoad;
                vec3 colorSand;
                vec3 colorBridge;

                // grass
                if (path < 1.0) {
                    colorGrass = mix(texture2D(tRamp, vec2(rampX, getRamp(48.0))).rgb, texture2D(tRamp, vec2(rampX, getRamp(49.0))).rgb, texture2D(tTerrNoises, wPos.xz * 0.03).r);
                    float maskGrass1 = texture2D(tTerrNoises, wPos.xz * 0.05).r;
                    float maskGrass2 = texture2D(tTerrNoises, wPos.xz * 0.1).r;
                    colorGrass = mix(colorGrass, grassColor1, texture2D(tTerrDetails, wPos.xz * 0.25).b * fit(_shadow0, 0.0, 1.0, 0.2, 1.0) * pow(maskGrass1, 2.0));
                    colorGrass = mix(colorGrass, grassColor2, texture2D(tTerrDetails, wPos.xz * 0.25).a * fit(_shadow0, 0.0, 1.0, 0.2, 1.0) * pow(maskGrass2, 2.0));
                }

                // path
                if (path > 0.0) {
                    colorPath = texture2D(tRamp, vec2(rampX, getRamp(50.0))).rgb;
                    colorPath += fit(texture2D(tTerrDetails, wPos.xz * 0.25).g, 0.0, 1.0, 0.0, 0.05) * fit(_shadow0, 0.0, 1.0, 0.3, 1.0);
                }

                diffuseSpecular = mix(colorGrass, colorPath, path);

                // road
                if (road > 0.0) {
                    colorRoad = texture2D(tRamp, vec2(rampX, getRamp(52.0))).rgb;
                    colorRoad += fit(texture2D(tTerrDetails, wPos.xz * 0.5).r, 0.0, 1.0, 0.0, 0.05) * fit(_shadow0, 0.0, 1.0, 0.3, 1.0);
                    colorRoad = mix(colorRoad, texture2D(tRamp, vec2(rampX, getRamp(63.0))).rgb, smoothstep(0.6, 0.65, texture2D(map, vUv).r));
                    diffuseSpecular = mix(diffuseSpecular, colorRoad, road);
                }

                // sand
                if (terrain.g > 0.0) {
                    colorSand = mix(texture2D(tRamp, vec2(rampX, getRamp(56.0))).rgb, texture2D(tRamp, vec2(rampX, getRamp(57.0))).rgb, texture2D(tTerrNoises, (wPos.xz + 63.6354) * 0.05).g);
                    colorSand += fit(texture2D(tTerrDetails, wPos.xz * 1.0).r, 0.0, 1.0, 0.0, 0.3) * fit(_shadow0, 0.0, 1.0, 0.3, 1.0) * texture2D(tTerrNoises, wPos.xz * 1.5).r;
                    diffuseSpecular = mix(diffuseSpecular, colorSand, terrain.g);
                }

                // bridge
                if (bridge > 0.0) {
                    colorBridge = mix(texture2D(tRamp, vec2(rampX, getRamp(54.0))).rgb, texture2D(tRamp, vec2(rampX, getRamp(55.0))).rgb, texture2D(tTerrNoises, (wPos.xz + 63.6354) * 0.03).r);
                    diffuseSpecular = mix(diffuseSpecular, colorBridge, bridge);
                }

                // sea
                float beachZone = step(50.0, wPos.x);
                if (beachZone > 0.0) {
                    float seaYLevel = -0.815 + (sin(time * 0.5 + 23.124) + sin(time * 0.15 + 3213.32)) * 0.2 + (sin(time + wPos.z) * 0.01);
                    diffuseSpecular = mix(diffuseSpecular, vec3(1.0), step(wPos.y, seaYLevel + 0.025) * beachZone);
                }

                /*
                // defined paths with small pattern details
                vec3 colorPath = texture2D(tRamp, vec2(rampX, getRamp(50.0))).rgb;
                vec3 colorRoad = texture2D(tRamp, vec2(rampX, getRamp(52.0))).rgb;
                colorRoad += fit(texture2D(tTerrDetails, wPos.xz * 0.5).r, 0.0, 1.0, 0.0, 0.05) * fit(_shadow0, 0.0, 1.0, 0.3, 1.0);

                // road details
                colorRoad = mix(colorRoad, texture2D(tRamp, vec2(rampX, getRamp(63.0))).rgb, smoothstep(0.6, 0.65, texture2D(map, vUv).r));

                colorPath += fit(texture2D(tTerrDetails, wPos.xz * 0.25).g, 0.0, 1.0, 0.0, 0.05) * fit(_shadow0, 0.0, 1.0, 0.3, 1.0);

                // special cases with more variation or custom colors
                vec3 colorGrass = mix(texture2D(tRamp, vec2(rampX, getRamp(48.0))).rgb, texture2D(tRamp, vec2(rampX, getRamp(49.0))).rgb, texture2D(tTerrNoises, wPos.xz * 0.03).r);
                vec3 colorSand = mix(texture2D(tRamp, vec2(rampX, getRamp(56.0))).rgb, texture2D(tRamp, vec2(rampX, getRamp(57.0))).rgb, texture2D(tTerrNoises, (wPos.xz + 63.6354) * 0.05).g);
                vec3 colorBridge = mix(texture2D(tRamp, vec2(rampX, getRamp(54.0))).rgb, texture2D(tRamp, vec2(rampX, getRamp(55.0))).rgb, texture2D(tTerrNoises, (wPos.xz + 63.6354) * 0.03).r);

                float maskGrass1 = texture2D(tTerrNoises, wPos.xz * 0.05).r;
                float maskGrass2 = texture2D(tTerrNoises, wPos.xz * 0.1).r;
                colorGrass = mix(colorGrass, grassColor1, texture2D(tTerrDetails, wPos.xz * 0.25).b * fit(_shadow0, 0.0, 1.0, 0.2, 1.0) * pow(maskGrass1, 2.0));
                colorGrass = mix(colorGrass, grassColor2, texture2D(tTerrDetails, wPos.xz * 0.25).a * fit(_shadow0, 0.0, 1.0, 0.2, 1.0) * pow(maskGrass2, 2.0));
                colorSand += fit(texture2D(tTerrDetails, wPos.xz * 1.0).r, 0.0, 1.0, 0.0, 0.3) * fit(_shadow0, 0.0, 1.0, 0.3, 1.0) * texture2D(tTerrNoises, wPos.xz * 1.5).r;

                // final layering of colors
                diffuseSpecular = mix(colorGrass, colorPath, path);
                diffuseSpecular = mix(diffuseSpecular, colorRoad, road);
                diffuseSpecular = mix(diffuseSpecular, colorSand, terrain.g);
                diffuseSpecular = mix(diffuseSpecular, colorBridge, bridge);

                // foam
                float beachZone = step(50.0, wPos.x);
                float seaYLevel = -0.815 + (sin(time * 0.5 + 23.124) + sin(time * 0.15 + 3213.32)) * 0.2 + (sin(time + wPos.z) * 0.01);
                diffuseSpecular = mix(diffuseSpecular, vec3(1.0), step(wPos.y, seaYLevel + 0.025) * beachZone);
                */

            #else
                #ifdef GRASS
                    // patches / opacity
                    const float grassPatches = 8.0;
                    const float grassPatchStep = 1.0 / grassPatches;
                    float grassID = floor(vRand.w * grassPatches);
                    vec2 uvgrass = vec2(grassID * grassPatchStep + vUv.x * grassPatchStep, vUv.y + 0.015);
                    vec4 grassPatch = texture2D(map, uvgrass);

                    diffuseColor.a = pow(grassPatch.a, 5.0);

                    // alpha
                    if (diffuseColor.a < 0.01) discard;

                    // save shadow contribution
                    float shadowMult = _shadow0;

                    // select ramp: 58 - 59 and get color
                    float rampID = 58.0 + step(0.8, fract(vRand.x + vRand.y));
                    diffuseSpecular = texture2D(tRamp, vec2(_shadow0, getRamp(rampID))).rgb;
                    diffuseSpecular *= fit(vUv.y, 0.0, 0.75, 1.0, 1.25);
                #elif defined(IS_CHARACTER)
                    if (vColorInfo.y < 0.01) { // not changing parts
                        float rampY = getRamp(vColorInfo.r);
                        diffuseSpecular = texture2D(tRamp, vec2(rampX, rampY)).rgb;
                    } else if (vColorInfo.y < 1.01) {
                        // skin
                        float rampY = getRamp(79.0 + clamp(floor(vSeed), 0.0, 3.0));
                        diffuseSpecular = texture2D(tRamp, vec2(rampX, rampY)).rgb;
                    } else {
                        // player color
                        vec3 cc_color = vec3(0.0);
                        cc_color.x = fract(vSeed);
                        cc_color.y = 0.4;

                        const float ss_step = 0.3;
                        cc_color.z = 0.2 + floor(rampX * 2.99) * ss_step;
                        diffuseSpecular = hsv2rgb(cc_color);
                    }
                #elif defined(GOSSIP)
                    float rampY = getRamp(vColorInfo.r);
                    vec3 col = texture2D(tRamp, vec2(rampX, rampY)).rgb;

                    if (vColorInfo.y < 0.01) {
                        float mask = texture2D(map, vUv).r;
                        diffuseSpecular = mix(texture2D(tRamp, vec2(mask, getRamp(89.0))).rgb, col, fit(mask, 0.7, 0.68, 1.0, 0.0));
                    } else {
                        diffuseSpecular = col;
                    }
                #else
                    float rampY = getRamp(vColorInfo.r);
                    diffuseSpecular = texture2D(tRamp, vec2(rampX, rampY)).rgb;
                #endif
            #endif
        #endif

        // add clouds
        #ifdef RECEIVE_SHADOW_CLOUDS
            ${cloudsChunk}
            diffuseSpecular *= fit(cloudsMult, 0.0, 1.0, 0.7, 1.0);
        #endif

        vec3 outgoingLight = diffuseSpecular + totalEmissiveRadiance;
        float lenCam = length(-vViewPosition);

        addFog(outgoingLight, lenCam);

        gl_FragColor = vec4(outgoingLight, diffuseColor.a);

        #ifdef FADE_AWAY
            gl_FragColor.a *= smoothstep(FADE_AWAY, FADE_AWAY - 5.0, length(lenCam));
        #endif

        #include <encodings_fragment>
    }
`


const UniformsLib = {
    common: {
        diffuse: {
            value: new Color(16777215)
        },
        opacity: {
            value: 1
        },
        map: {
            value: null
        },
        uvTransform: {
            value: new Matrix3
        },
        uv2Transform: {
            value: new Matrix3
        },
        alphaMap: {
            value: null
        },
        alphaTest: {
            value: 0
        }
    },
    specularmap: {
        specularMap: {
            value: null
        }
    },
    envmap: {
        envMap: {
            value: null
        },
        flipEnvMap: {
            value: -1
        },
        reflectivity: {
            value: 1
        },
        ior: {
            value: 1.5
        },
        refractionRatio: {
            value: .98
        }
    },
    aomap: {
        aoMap: {
            value: null
        },
        aoMapIntensity: {
            value: 1
        }
    },
    lightmap: {
        lightMap: {
            value: null
        },
        lightMapIntensity: {
            value: 1
        }
    },
    emissivemap: {
        emissiveMap: {
            value: null
        }
    },
    bumpmap: {
        bumpMap: {
            value: null
        },
        bumpScale: {
            value: 1
        }
    },
    normalmap: {
        normalMap: {
            value: null
        },
        normalScale: {
            value: new Vector2(1,1)
        }
    },
    displacementmap: {
        displacementMap: {
            value: null
        },
        displacementScale: {
            value: 1
        },
        displacementBias: {
            value: 0
        }
    },
    roughnessmap: {
        roughnessMap: {
            value: null
        }
    },
    metalnessmap: {
        metalnessMap: {
            value: null
        }
    },
    gradientmap: {
        gradientMap: {
            value: null
        }
    },
    fog: {
        fogDensity: {
            value: 25e-5
        },
        fogNear: {
            value: 1
        },
        fogFar: {
            value: 2e3
        },
        fogColor: {
            value: new Color(16777215)
        }
    },
    lights: {
        ambientLightColor: {
            value: []
        },
        lightProbe: {
            value: []
        },
        directionalLights: {
            value: [],
            properties: {
                direction: {},
                color: {}
            }
        },
        directionalLightShadows: {
            value: [],
            properties: {
                shadowBias: {},
                shadowNormalBias: {},
                shadowRadius: {},
                shadowMapSize: {}
            }
        },
        directionalShadowMap: {
            value: []
        },
        directionalShadowMatrix: {
            value: []
        },
        spotLights: {
            value: [],
            properties: {
                color: {},
                position: {},
                direction: {},
                distance: {},
                coneCos: {},
                penumbraCos: {},
                decay: {}
            }
        },
        spotLightShadows: {
            value: [],
            properties: {
                shadowBias: {},
                shadowNormalBias: {},
                shadowRadius: {},
                shadowMapSize: {}
            }
        },
        spotLightMap: {
            value: []
        },
        spotShadowMap: {
            value: []
        },
        spotLightMatrix: {
            value: []
        },
        pointLights: {
            value: [],
            properties: {
                color: {},
                position: {},
                decay: {},
                distance: {}
            }
        },
        pointLightShadows: {
            value: [],
            properties: {
                shadowBias: {},
                shadowNormalBias: {},
                shadowRadius: {},
                shadowMapSize: {},
                shadowCameraNear: {},
                shadowCameraFar: {}
            }
        },
        pointShadowMap: {
            value: []
        },
        pointShadowMatrix: {
            value: []
        },
        hemisphereLights: {
            value: [],
            properties: {
                direction: {},
                skyColor: {},
                groundColor: {}
            }
        },
        rectAreaLights: {
            value: [],
            properties: {
                color: {},
                position: {},
                width: {},
                height: {}
            }
        },
        ltc_1: {
            value: null
        },
        ltc_2: {
            value: null
        }
    },
    points: {
        diffuse: {
            value: new Color(16777215)
        },
        opacity: {
            value: 1
        },
        size: {
            value: 1
        },
        scale: {
            value: 1
        },
        map: {
            value: null
        },
        alphaMap: {
            value: null
        },
        alphaTest: {
            value: 0
        },
        uvTransform: {
            value: new Matrix3
        }
    },
    sprite: {
        diffuse: {
            value: new Color(16777215)
        },
        opacity: {
            value: 1
        },
        center: {
            value: new Vector2(.5,.5)
        },
        rotation: {
            value: 0
        },
        map: {
            value: null
        },
        alphaMap: {
            value: null
        },
        alphaTest: {
            value: 0
        },
        uvTransform: {
            value: new Matrix3
        }
    }
}

const uniforms = UniformsUtils.merge([UniformsLib.common, UniformsLib.lights, {
        emissive: {
            value: new Color(0)
        },
        specular: {
            value: new Color(1118481)
        },
        shininess: {
            value: 30
        },
        tRamp: {
            value: null
        },
        tCloudsTop: {
            value: null
        },
        csmMap: {
            value: null
        },
        csmMatrix: {
            value: new Matrix4
        },
        csmOptions: {
            value: new Vector4
        },
        csmBiases: {
            value: new Vector2(.07, 1e-6)
        },
        csmTarget: {
            value: new Vector3
        }
    }]);


function cloneUniforms(s) {
    const e = {};
    for (const i in s) {
        e[i] = {};
        for (const r in s[i]) {
            const a = s[i][r];
            a && (a.isColor || a.isMatrix3 || a.isMatrix4 || a.isVector2 || a.isVector3 || a.isVector4 || a.isTexture || a.isQuaternion) ? e[i][r] = a.clone() : Array.isArray(a) ? e[i][r] = a.slice() : e[i][r] = a
        }
    }
    return e
}
function mergeUniforms(s) {
    const e = {};
    for (let i = 0; i < s.length; i++) {
        const r = cloneUniforms(s[i]);
        for (const a in r)
            e[a] = r[a]
    }
    return e
}
const UniformsUtils = {
    clone: cloneUniforms,
    merge: mergeUniforms
};


const textureLoader = {
    _texturesCache: new Map,
    load(s=DEFAULT_TEXTURE, e="default") {
        const i = `${s}_<>_${e}`;
        if (this._texturesCache.has(i))
            return this._texturesCache.get(i);
        const a = /^https?:\/\//.test(s) ? s : `${relativeURL$1}assets/images/${s}`
          , o = s.split(".").pop()
          , l = e.toLowerCase();
        let c = null
          , d = null;
        o.startsWith("ktx2") ? (c = TEXTURE_FORMATS.BASIS,
        d = new (l.includes("lut") ? Data3DTexture : CompressedTexture)) : o.startsWith("exr") ? (c = TEXTURE_FORMATS.EXR,
        d = new DataTexture) : o.startsWith("mp4") || o.startsWith("webm") ? (c = TEXTURE_FORMATS.VIDEO,
        d = new CustomVideoTexture(a,l.includes("autoplay"))) : (o.startsWith("svg") ? c = TEXTURE_FORMATS.SVG : client.capabilities.imageBitmap && BITMAP_EXTENSIONS.some(f => o.startsWith(f)) ? c = TEXTURE_FORMATS.BITMAP : c = TEXTURE_FORMATS.IMAGE,
        d = new Texture),
        this._texturesCache.set(i, d),
        d._url = s,
        d._loadMode = e,
        d._loaded = miscutils.deferred();
        const h = l.includes("srgb") || s === DEFAULT_TEXTURE ? sRGBEncoding : d.encoding;
        return d.encoding = h,
        setTimeout(async () => {
            let f = null;
            try {
                c === TEXTURE_FORMATS.BASIS ? f = await basisLoader.loadAsync(a) : c === TEXTURE_FORMATS.EXR ? f = await exrLoader.loadAsync(a) : c === TEXTURE_FORMATS.SVG ? f = await svgLoader.loadAsync(a) : c === TEXTURE_FORMATS.VIDEO ? f = await d._videoLoadAsync : c === TEXTURE_FORMATS.BITMAP ? f = await bitmapLoader.loadAsync(a) : f = await basicLoader.loadAsync(a)
            } catch (b) {
                console.warn("Texture load:", b),
                c !== TEXTURE_FORMATS.EXR && c !== TEXTURE_FORMATS.VIDEO && !d.isData3DTexture && (d.encoding = sRGBEncoding,
                c === TEXTURE_FORMATS.BASIS ? f = await basisLoader.loadAsync(`${window.location.origin}/assets/images/${DEFAULT_TEXTURE_BASIS}`) : c === TEXTURE_FORMATS.BITMAP ? f = await bitmapLoader.loadAsync(`${window.location.origin}/assets/images/${DEFAULT_TEXTURE}`) : (c = TEXTURE_FORMATS.IMAGE,
                f = await basicLoader.loadAsync(`${window.location.origin}/assets/images/${DEFAULT_TEXTURE_BASIS}`)))
            }
            d !== f && d.copy(f),
            l.includes("repeat") && (d.wrapS = RepeatWrapping,
            d.wrapT = RepeatWrapping),
            l.includes("colordata") ? (d.magFilter = LinearFilter,
            d.minFilter = LinearFilter) : l.includes("nearest") && (d.magFilter = NearestFilter,
            d.minFilter = NearestFilter),
            (l.includes("nearest") || l.includes("colordata") || l.includes("nomipmaps")) && (d.generateMipmaps = !1),
            l.includes("lut") && (l.includes("luttetrahedral") ? (d.magFilter = NearestFilter,
            d.minFilter = NearestFilter) : (d.magFilter = LinearFilter,
            d.minFilter = LinearFilter)),
            d.encoding = h,
            d.needsUpdate = !0,
            d._loaded.resolve()
        }
        , 0),
        d
    },
    loadProgressive(s, e, i="value") {
        return new Promise(async r => {
            await e[i]._loaded;
            const o = this.load(s, e[i]._loadMode);
            await o._loaded,
            e[i] = o,
            r(o)
        }
        )
    },
    loadCurves(s, e=!1, i=1) {
        const r = `curves_${s}_<>_${e}_<>_${i}`;
        if (this._texturesCache.has(r))
            return this._texturesCache.get(r);
        const a = createCurvesTexture(s, e, i);
        return this._texturesCache.set(r, a),
        a
    },
    // PMREM(s, e="equirectangular") {
    //     return new Promise(async i => {
    //         const r = this.load(s);
    //         await r._loaded,
    //         i(global$2.PMREMGenerator[e === "equirectangular" ? "fromEquirectangular" : "fromCubemap"](r))
    //     }
    //     )
    // }
}

function phongMaterial(s={}) {
    const e = {}
    const i = new ShaderMaterial({
        defines: e,
        uniformsGroups: [threeutils.globalUBO],
        uniforms: UniformsUtils.clone(uniforms),
        vertexShader: vertex,
        fragmentShader: fragment,
        lights: !0
    });
    return e.RECEIVE_SHADOW_CLOUDS = 1,
    e.USE_RAMP = 1,
    i.uniforms.tCloudsTop.value = textureLoader.load("clouds_top.ktx2", "repeat"),
    (async () => (await miscutils.deferred(),
    textureLoader.loadProgressive("clouds_top-highq.ktx2", i.uniforms.tCloudsTop, "value")))(),
    s.isCharacters && (e.IS_CHARACTER = 1,
    i.shadowSide = FrontSide),
    s.isTerrain && (e.IS_TERRAIN = 1,
    e.USE_UV = !0,
    e.USE_MAP = !0,
    i.uniforms.map.value = textureLoader.load("terrain-road-highq.png", "colordata"),
    i.uniforms.tMasks = {
        value: textureLoader.load("masks.ktx2")
    },
    i.uniforms.tTerrNoises = {
        value: textureLoader.load("terrain-noises-highq.png", "repeat")
    },
    i.uniforms.tTerrDetails = {
        value: textureLoader.load("terrain-details-highq.png", "repeat")
    },
    i.uniforms.grassColor1 = {
        value: new Color("#558f6e")
    },
    i.uniforms.grassColor2 = {
        value: new Color("#9bc2a4")
    },
    (async () => (await miscutils.deferred(),
    textureLoader.loadProgressive("masks.png", i.uniforms.tMasks, "value")))()),
    s.isTree && (e.SHAKE = 1,
    i.shadowSide = FrontSide),
    s.isBush && (e.SHAKE = 1,
    i.shadowSide = FrontSide),
    s.isLightPost && (e.USE_RAMP = 1),
    s.isWires && (e.SHAKE = 1,
    e.LIGHTWIRES = 1,
    i.side = DoubleSide),
    s.isRock && (i.shadowSide = FrontSide),
    s.isPalmTree && (i.shadowSide = FrontSide,
    i.side = DoubleSide,
    e.SHAKE = 1),
    (s.isHouse2 || s.isCastles) && (i.shadowSide = FrontSide),
    s.isGrass && (i.side = FrontSide,
    i.transparent = !0,
    i.uniforms.map.value = textureLoader.load("grass-patches-highq.ktx2", "colordata"),
    i.uniforms.charPos = {
        value: new Vector3
    },
    i.uniforms.charSpeed = {
        value: 0
    },
    e.GRASS = 1,
    e.REACT_CHARACTER = 1,
    e.PLANE_FACE_CHARACTER = 1,
    e.FADE_AWAY = "60.0",
    e.RANDOM_ATTRIB = 1,
    e.USE_UV = 1,
    e.USE_MAP = 1),
    s.isUFO && (i.side = FrontSide),
    (s.isAlien || s.isCats || s.isSloth) && (i.shadowSide = FrontSide),
    s.isGossip && (e.GOSSIP = 1,
    e.USE_UV = 1,
    e.USE_MAP = 1,
    e.IS_INTERIOR = 1,
    i.uniforms.map.value = textureLoader.load("gossip.ktx2")),
    e.USE_RAMP && (i.uniforms.tRamp.value = textureLoader.load("ramps.png", "srgb-colordata")),
    i.ignore = !0,
    i
}