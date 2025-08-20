import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

let camera, scene, renderer;
let orbitControls;
let draggableObjects = [];
let composer, outlinePass;
let selectedObject = null;
const infoBox = document.getElementById('info-box');

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

    // Post-processing for outline effect
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.edgeStrength = 5;
    outlinePass.edgeGlow = 0.5;
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set('#ffffff');
    outlinePass.hiddenEdgeColor.set('#190a05');
    composer.addPass(outlinePass);

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
        '/a632999bc02d_Cartoon_my_pony__3d_asset_0_glb.glb',
        '/ac49d5737e5b_Wings__3d_asset_0_glb.glb',
        '/2868ce79fd87_Unicorn_horn__3d_asset_0_glb.glb'
    ];

    const positions = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.26, 0.08, 0.00),
        new THREE.Vector3(-0.63, 0.31, 0.01)
    ];

    const modelNames = ['Pony', 'Wings', 'Unicorn Horn'];

    const loader = new GLTFLoader();
    modelUrls.forEach((url, index) => {
        loader.load(url, (gltf) => {
            const model = gltf.scene;
            model.userData.name = modelNames[index];
            
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            let scale = 2.0 / maxDim; // Scale to fit in a 2x2x2 box
            
            if (modelNames[index] === 'Pony') {
                 scale = 3.0 / maxDim; // Make pony bigger
            }

            model.position.sub(center.multiplyScalar(scale));
            model.scale.set(scale, scale, scale);

            model.position.add(positions[index]);
            scene.add(model);
            draggableObjects.push(model);
        }, undefined, (error) => {
            console.error('An error happened while loading a model:', error);
        });
    });

    // Drag Controls (for moving objects)
    const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
    dragControls.addEventListener('dragstart', function (event) {
        orbitControls.enabled = false;
        selectedObject = event.object;
        outlinePass.selectedObjects = [selectedObject];
        updateInfoBox();
    });
    dragControls.addEventListener('drag', function () {
        if(selectedObject) {
            updateInfoBox();
        }
    });
    dragControls.addEventListener('dragend', function () {
        orbitControls.enabled = true;
    });
    
    // Window resize handler
    window.addEventListener('resize', onWindowResize, false);
}

function updateInfoBox() {
    if (selectedObject) {
        const pos = selectedObject.position;
        infoBox.innerHTML = `<b>${selectedObject.userData.name || 'Object'}</b><br>
            x: ${pos.x.toFixed(2)}<br>
            y: ${pos.y.toFixed(2)}<br>
            z: ${pos.z.toFixed(2)}`;
    } else {
        infoBox.textContent = 'No object selected';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    composer.render();
}