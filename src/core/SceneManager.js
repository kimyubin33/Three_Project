// src/core/SceneManager.js
// Three.js의 Scene/Camera/Renderer/조명/바닥 등 공통 인프라.
// 챕터별 씬은 ThawingScene 등이 이 매니저에게 자신을 넘겨주는 식으로 동작.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class SceneManager {
    constructor(container) {
        this.container = container;
        this.clock = new THREE.Clock();
        this.currentScene = null;  // 현재 활성 챕터 씬 (ThawingScene 등)

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
        });
    }

    /**
     * 챕터 씬 설정. 챕터 객체는 .scene (THREE.Scene)을 노출해야 함.
     */
    setScene(chapterScene) {
        this.currentScene = chapterScene;
    }

    /**
     * 메인 애니메이션 루프
     */
    start() {
        const animate = () => {
            requestAnimationFrame(animate);
            const deltaMs = this.clock.getDelta() * 1000;
            this.controls.update();

            if (this.currentScene && typeof this.currentScene.update === 'function') {
                this.currentScene.update(deltaMs);
            }

            if (this.currentScene && this.currentScene.scene) {
                this.renderer.render(this.currentScene.scene, this.camera);
            }
        };
        animate();
    }
}
