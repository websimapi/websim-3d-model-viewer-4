import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

let camera, scene, renderer;
let orbitControls;
let draggableObjects = [];

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 10, 7.5).normalize();
    scene.add(directionalLight);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90 }); // Light green
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    scene.add(plane);

    // Orbit Controls (for camera rotation and zoom)
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;

    // Load Models
    const modelUrls = [
        '/ac49d5737e5b_Wings__3d_asset_0_glb.glb',
        '/ec5cf668426b___skill____n___Smithing___d__0_glb.glb',
        '/2868ce79fd87_Unicorn_horn__3d_asset_0_glb.glb',
        '/a632999bc02d_Cartoon_my_pony__3d_asset_0_glb.glb'
    ];

    const positions = [
        new THREE.Vector3(-3, 0, -3),
        new THREE.Vector3(3, 0, -3),
        new THREE.Vector3(-3, 0, 3),
        new THREE.Vector3(3, 0, 3)
    ];

    const loader = new GLTFLoader();
    modelUrls.forEach((url, index) => {
        loader.load(url, (gltf) => {
            const model = gltf.scene;
            
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.0 / maxDim; // Scale to fit in a 2x2x2 box
            
            model.position.sub(center);
            model.scale.multiplyScalar(scale);

            model.position.add(positions[index]);
            scene.add(model);
            draggableObjects.push(model);
        }, undefined, (error) => {
            console.error('An error happened while loading a model:', error);
        });
    });

    // Drag Controls (for moving objects)
    const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
    dragControls.addEventListener('dragstart', function () {
        orbitControls.enabled = false;
    });
    dragControls.addEventListener('dragend', function () {
        orbitControls.enabled = true;
    });
    
    // Window resize handler
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}

