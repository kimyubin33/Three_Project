// src/scenes/ThawingScene.js
// 챕터 1 (Thawing) 씬. 이 파일의 역할은 "오브젝트 조립" 만 한다.
// 각 객체의 내부 구조는 src/objects/*.js 에 있다.

import * as THREE from 'three';
import IceBox from '../objects/IceBox.js';
import Pipette from '../objects/Pipette.js';
import TipBox from '../objects/TipBox.js';

export default class ThawingScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a24);

        this.objects = {};  // 오브젝트 핸들 (외부에서 참조 시 사용)

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
        key.shadow.camera.left = -8;
        key.shadow.camera.right = 8;
        key.shadow.camera.top = 8;
        key.shadow.camera.bottom = -8;
        this.scene.add(key);

        const hemi = new THREE.HemisphereLight(0xddeeff, 0x404040, 0.35);
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
        // === IceBox (튜브 5개 내장) ===
        const iceBox = new IceBox();
        iceBox.position.set(-1.5, 0, 0);     // 작업대 중앙 좌측
        this.scene.add(iceBox);
        this.objects.iceBox = iceBox;

        // === Pipettes (좌측 후방에 비스듬히 세움) ===
        const p200 = new Pipette('p200');
        p200.position.set(-4.5, 0.85, -1.8);
        p200.rotation.set(Math.PI / 14, 0, Math.PI / 24);
        this.scene.add(p200);
        this.objects.p200 = p200;

        const p1000 = new Pipette('p1000');
        p1000.position.set(-3.5, 0.9, -1.8);
        p1000.rotation.set(Math.PI / 14, 0, -Math.PI / 24);
        this.scene.add(p1000);
        this.objects.p1000 = p1000;

        // === Tip Boxes (아이스박스 오른편) ===
        const tipBoxBlue = new TipBox('blue');
        tipBoxBlue.position.set(2.4, 0.25, -0.6);
        this.scene.add(tipBoxBlue);
        this.objects.tipBoxBlue = tipBoxBlue;

        const tipBoxYellow = new TipBox('yellow');
        tipBoxYellow.position.set(2.4, 0.25, 0.9);
        this.scene.add(tipBoxYellow);
        this.objects.tipBoxYellow = tipBoxYellow;
    }

    update(deltaMs) {
        // 자식 객체들의 update를 일괄 호출
        for (const key in this.objects) {
            const obj = this.objects[key];
            if (typeof obj.update === 'function') {
                obj.update(deltaMs);
            }
        }
    }

    /**
     * 외부에서 특정 오브젝트 접근
     */
    getObject(key) {
        return this.objects[key];
    }
}
