// src/core/SceneManager.js
// Three.js의 Scene/Camera/Renderer/조명/바닥 등 공통 인프라.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export default class SceneManager {
    constructor(container) {
        this.container = container;
        this.clock = new THREE.Clock();
        this.currentScene = null;

        // 매 프레임 호출할 외부 콜백들 (InteractionController.update 등)
        this._updateCallbacks = [];

        this._initRenderer();
        this._initCamera();
        this._initControls();
        this._bindResize();
    }

    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.left = '0';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.container.appendChild(this.labelRenderer.domElement);
    }

    _initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 5.5, 7.5);
    }

    _initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
        this.controls.minDistance = 2.5;
        this.controls.maxDistance = 15;
        this.controls.target.set(0, 0.8, 0);
        this.controls.update();
    }

    _bindResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    setScene(chapterScene) {
        this.currentScene = chapterScene;
    }

    /**
     * 매 프레임 호출할 콜백 추가. main.js에서 InteractionController.update() 등을 등록.
     */
    addUpdateCallback(cb) {
        this._updateCallbacks.push(cb);
    }

    start() {
        const animate = () => {
            requestAnimationFrame(animate);
            const deltaMs = this.clock.getDelta() * 1000;
            this.controls.update();

            // 외부 콜백 호출
            for (const cb of this._updateCallbacks) {
                cb(deltaMs);
            }

            if (this.currentScene && typeof this.currentScene.update === 'function') {
                this.currentScene.update(deltaMs);
            }
            if (this.currentScene && this.currentScene.scene) {
                this.renderer.render(this.currentScene.scene, this.camera);
                this.labelRenderer.render(this.currentScene.scene, this.camera);
            }
        };
        animate();
    }
}