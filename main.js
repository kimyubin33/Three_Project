import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ThawingScene from './thawingScene.js';

let container;
let camera;
let renderer;
let controls;
let currentSceneModule;
const clock = new THREE.Clock();

function init() {
    container = document.getElementById('webgl-container');
    if (!container) {
        console.error('WebGL container was not found.');
        return;
    }

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    currentSceneModule = new ThawingScene();

    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );
    camera.position.set(0, 6, 8);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.target.set(0, 0.5, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (!loader) return;

        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 400);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    controls.update();

    if (currentSceneModule && typeof currentSceneModule.update === 'function') {
        currentSceneModule.update(elapsedTime * 1000);
    }

    if (currentSceneModule) {
        renderer.render(currentSceneModule.getScene(), camera);
    }
}

function onWindowResize() {
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

document.addEventListener('DOMContentLoaded', init);
