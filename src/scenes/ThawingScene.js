// src/scenes/ThawingScene.js
// 챕터 1 (Thawing) 씬. 이 파일의 역할은 "오브젝트 조립" 만 한다.

import * as THREE from 'three';
import IceBox from '../objects/IceBox.js';
import Pipette from '../objects/Pipette.js';
import TipBox from '../objects/TipBox.js';

export default class ThawingScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a24);

        this.objects = {};

        this._setupLighting();
        this._setupFloor();
        this._placeObjects();
    }

    _setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.55);
        this.scene.add(ambient);

        const key = new THREE.DirectionalLight(0xffffff, 0.85);
        key.position.set(6, 10, 7);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 30;
        key.shadow.camera.left = -10;
        key.shadow.camera.right = 10;
        key.shadow.camera.top = 10;
        key.shadow.camera.bottom = -10;
        this.scene.add(key);

        // 보조광 (반대편에서 약하게)
        const fill = new THREE.DirectionalLight(0xb0c8ff, 0.25);
        fill.position.set(-5, 6, -4);
        this.scene.add(fill);

        const hemi = new THREE.HemisphereLight(0xddeeff, 0x404040, 0.4);
        this.scene.add(hemi);
    }

    _setupFloor() {
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x222230,
            roughness: 0.85,
            metalness: 0.15
        });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const grid = new THREE.GridHelper(24, 24, 0x3f3f5a, 0x2a2a3a);
        grid.position.y = 0.002;
        this.scene.add(grid);
    }

    _placeObjects() {
        // === IceBox (중앙) ===
        const iceBox = new IceBox();
        iceBox.position.set(0, 0, 0);
        this.scene.add(iceBox);
        this.objects.iceBox = iceBox;

        // === Pipettes (우측, 작업대 위에 세워둠) ===
        // P200 = 노란 노브, P1000 = 파란 노브
        // 둘이 살짝 떨어져서 비스듬히 기댄 형태
        const p200 = new Pipette('p200');
        p200.position.set(3.5, 0.85, 0.8);
        p200.rotation.set(Math.PI / 14, 0, Math.PI / 18);
        this.scene.add(p200);
        this.objects.p200 = p200;

        const p1000 = new Pipette('p1000');
        p1000.position.set(4.3, 0.9, -0.2);
        p1000.rotation.set(Math.PI / 14, 0, -Math.PI / 18);
        this.scene.add(p1000);
        this.objects.p1000 = p1000;

        // === Tip Boxes (좌측, 충분히 떨어뜨려서 가로로 나란히) ===
        const tipBoxYellow = new TipBox('yellow');
        tipBoxYellow.position.set(-3.5, 0.25, -0.8);
        this.scene.add(tipBoxYellow);
        this.objects.tipBoxYellow = tipBoxYellow;

        const tipBoxBlue = new TipBox('blue');
        tipBoxBlue.position.set(-3.5, 0.25, 0.8);
        this.scene.add(tipBoxBlue);
        this.objects.tipBoxBlue = tipBoxBlue;
    }

    update(deltaMs) {
        for (const key in this.objects) {
            const obj = this.objects[key];
            if (typeof obj.update === 'function') {
                obj.update(deltaMs);
            }
        }
    }

    getObject(key) {
        return this.objects[key];
    }
}