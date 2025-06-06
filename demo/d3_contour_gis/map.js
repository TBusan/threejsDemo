import { REVISION, Vector3 } from "three";
// import * as tt from "../../threetiles/tile.js";

// import * as gui from "./gui";
import * as source from "../../threetiles/mapSource.js";

// import * as plugin from "../../threetiles/plugin.js";

// debugger

//================================注册加载器====================================
// 注册wrieframe加载器
tt.registerImgLoader(new plugin.TileMaterialWrieLoader());
// 注册瓦片调试加载器
tt.registerImgLoader(new plugin.TileMaterialDebugeLoader());
// 注册logo加载器
tt.registerImgLoader(new plugin.TileMaterialLogoLoader());
// 注册法向量图像加载器
tt.registerImgLoader(new plugin.TileMateriaNormalLoader());
// 注册GeoJSON加载器
tt.registerImgLoader(new plugin.GeoJSONLoader());
// 注册矢量瓦片MVT加载器
tt.registerImgLoader(new plugin.MVTLoader());
// 注册单影像加载器
tt.registerImgLoader(new plugin.SingleImageLoader());
// 注册单影像TIF-DEM加载器
tt.registerDEMLoader(new plugin.SingleTifDEMLoader());
//===============================================================================

// 启用indexDB缓存
// plugin.IndexDBCacheEable();

console.log(
	"==================================================================="
);
console.log(`threejs V${REVISION}`);
console.log(`three-tile V${tt.version}, ${tt.author.email}`);
// document.querySelector<HTMLSpanElement>("#version")!.innerText = tt.version;

// 创建地图
function createMap() {
	// 影像数据源
	const imgSource = [source.arcGisSource, source.arcGisCiaSource];
	// 地形数据源
	const demSource = source.arcGisDemSource;

	// 创建地图对象
	const map = new tt.TileMap({
		// 影像数据源
		imgSource: imgSource,
		// 高程数据源
		demSource: demSource,
		// 地图投影中央经线经度
		lon0: 90,
		// 最小缩放级别
		minLevel: 2,
		// 最大缩放级别
		maxLevel: 20,
	});

	// map.scale.setScalar(1000);

	// 地图旋转到xz平面
	map.rotateX(-Math.PI / 2);
	// 开启阴影
	// map.receiveShadow = true;

	// 地图准备就绪
	map.addEventListener("ready", () => console.log("Map ready!!!!!!"));

	return map;
}

// 初始化三维场景
function initViewer(id, map) {
	// 初始化场景
	const viewer = new plugin.GLViewer(id);
	// 地图添加到场景
	viewer.scene.add(map);

	// 填加伪球体
	// const frakeEarth = plugin.createFrakEarth(map);
	// map.add(frakeEarth);
	// map.addEventListener("update", () => {
	// 	frakeEarth.visible = viewer.controls.getDistance() > 5e5;
	// });

	// 添加罗盘
	const compass = plugin.createCompass(viewer.controls);
	document.querySelector("#compass-container")?.appendChild(compass.dom);

	// 防止摄像机进入地下
	viewer.addEventListener("update", () => {
		plugin.limitCameraHeight(map, viewer.camera);
	});

	// 测试
	// const imageBounds = map.projection.getProjBounds([105, 33, 109, 37]);
	// const imageMesh = createBoundsMesh(imageBounds, 0xffff00);
	// map.add(imageMesh);

	// const tileBounds = map.projection.getTileBounds(7, 2, 3);
	// const tileMesh = createBoundsMesh(tileBounds, 0xff0000);
	// map.add(tileMesh);

	// const mapBounds = map.imgSource[0]._projectionBounds;
	// const mapMesh = createBoundsMesh(mapBounds, 0x00ff00);
	// map.add(mapMesh);

	return viewer;
}

// function shadowTest(viewer: tt.plugin.GLViewer, map: tt.TileMap) {
// 	const sphereGeometry = new SphereGeometry(5, 32, 32);
// 	const sphereMaterial = new MeshStandardMaterial({
// 		color: 0x049ef4,
// 		roughness: 0.2,
// 		metalness: 0.8,
// 		flatShading: true,
// 	});
// 	const sphere = new Mesh(sphereGeometry, sphereMaterial);
// 	const centerGeo = new Vector3(110, 35, 0);
// 	const centerPosition = map.geo2world(centerGeo);
// 	sphere.position.set(centerPosition.x, 5, centerPosition.z);
// 	sphere.castShadow = true;
// 	sphere.receiveShadow = true;
// 	viewer.scene.add(sphere);

// 	const shadowLight = new SpotLight(0xffffff, 10, 4e3, Math.PI / 6, 0.2, 0);
// 	shadowLight.position.set(centerPosition.x, 100, centerPosition.z + 100);
// 	shadowLight.target = sphere;
// 	shadowLight.castShadow = true;
// 	viewer.scene.add(shadowLight);

// 	const lightHelper = new SpotLightHelper(shadowLight);
// 	viewer.scene.add(lightHelper);
// 	lightHelper.updateMatrixWorld();

// 	const shadowCamera = shadowLight.shadow.camera;
// 	shadowCamera.far = 1e3;
// 	shadowCamera.near = 0.1;

// 	// const cameraHelper = new CameraHelper(shadowCamera);
// 	// viewer.scene.add(cameraHelper);
// }

// function createBoundsMesh(bounds: [number, number, number, number], color: ColorRepresentation) {
// 	const points = [];
// 	const z = 8;
// 	points.push(new Vector3(bounds[0], bounds[1], z));
// 	points.push(new Vector3(bounds[2], bounds[1], z));
// 	points.push(new Vector3(bounds[2], bounds[3], z));
// 	points.push(new Vector3(bounds[0], bounds[3], z));
// 	points.push(new Vector3(bounds[0], bounds[1], z));
// 	const geometry = new BufferGeometry().setFromPoints(points);
// 	const line = new Line(geometry, new LineBasicMaterial({ color }));
// 	line.renderOrder = 100;
// 	return line;
// }

// // 初始化GUI
// function initGui(viewer: plugin.GLViewer, map: tt.TileMap) {
// 	// 初始化配置项
// 	gui.initGui(viewer, map);
// 	// 添加地图背景
// 	gui.addMapBackground(map);
// 	// 添加状态指示器
// 	gui.addStats(viewer);
// 	// 状态栏显示瓦片加载状态
// 	gui.showLoading(map);
// 	// 状态栏显示鼠标位置经纬度高度信息
// 	gui.showLocation(viewer, map);
// 	// 显示版权信息
// 	gui.showAttribution(map);
// 	// 显示调试信息
// 	gui.showDebug(map, viewer);
// 	// 显示鼠标点击的瓦片信息-调试
// 	gui.showClickedTile(viewer, map);
// }

// 动画漫游指定位置
function fly(viewer, map) {
	// 地图中心坐标(经度，纬度，高度)
	const centerGeo = new Vector3(110, 35, 0);
	// 摄像坐标(经度，纬度，高度)
	const camersGeo = new Vector3(110, 15, 4000 * 1000);
	// 地图中心经纬度高度转为世界坐标
	const centerPosition = map.geo2world(centerGeo);
	// 摄像经纬度高度转为世界坐标
	const cmaeraPosition = map.geo2world(camersGeo);
	viewer.controls.enabled = false;
	// 飞到指定位置
	viewer.flyTo(centerPosition, cmaeraPosition, true, () => {
		viewer.controls.enabled = true;
	});
}

// function main() {
// 	// 创建地图
// 	const map = createMap();
// 	// 创建视图
// 	const viewer = initViewer("#map", map);
// 	// 初始化GUI
// 	initGui(viewer, map);
// 	// 摄像机动画移动到3000高度
// 	fly(viewer, map);
// }

// main();

export { createMap, initViewer, fly };
