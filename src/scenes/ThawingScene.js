// src/scenes/ThawingScene.js
// 챕터 1 (Thawing) 씬. 오브젝트 조립 + 인터랙션 대상 수집.

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
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        this.scene.add(this.ambientLight);

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
        const iceBox = new IceBox();
        iceBox.position.set(0, 0, 0);
        this.scene.add(iceBox);
        this.objects.iceBox = iceBox;

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

        const tipBoxYellow = new TipBox('yellow');
        tipBoxYellow.position.set(-3.5, 0.25, -0.8);
        this.scene.add(tipBoxYellow);
        this.objects.tipBoxYellow = tipBoxYellow;

        const tipBoxBlue = new TipBox('blue');
        tipBoxBlue.position.set(-3.5, 0.25, 0.8);
        this.scene.add(tipBoxBlue);
        this.objects.tipBoxBlue = tipBoxBlue;
    }

    /**
     * 인터랙션 대상 수집. main.js의 InteractionController가 이 목록을 등록.
     * 각 항목: { type, root, meshes, displayName, displayRole }
     */
    getInteractiveTargets() {
        const targets = [];

        // 아이스박스 + 5개 튜브 (IceBox가 내부적으로 분리해서 줌)
        targets.push(...this.objects.iceBox.getInteractiveTargets());

        // 피펫 2개
        for (const id of ['p200', 'p1000']) {
            const pip = this.objects[id];
            const meshes = [];
            pip.traverse((c) => { if (c.isMesh) meshes.push(c); });
            targets.push({
                type: 'pipette',
                root: pip,
                meshes,
                displayName: pip.spec.name,
                displayRole: id === 'p200'
                    ? '소량 정밀 분주 (50~200 µL)'
                    : '대용량 분주 (200~1000 µL)'
            });
        }
        

        // 팁박스 2개
        for (const [id, role] of [
            ['tipBoxYellow', 'P200 피펫용 팁 (노란색)'],
            ['tipBoxBlue', 'P1000 피펫용 팁 (파란색)']
        ]) {
            const tb = this.objects[id];
            const meshes = [];
            tb.traverse((c) => {
                if (c.isMesh || c.isInstancedMesh) meshes.push(c);
            });
            targets.push({
                type: 'tipBox',
                root: tb,
                meshes,
                displayName: tb.spec.name,
                displayRole: role
            });
        }

        return targets;
    }

    /**
     * 챕터 진입 시 호출. focus.spotLight 정보로 spot light 생성.
     */
    addSpotLight(config) {
        // 기존 것 있으면 먼저 제거
        this.removeSpotLight();

        const spot = new THREE.SpotLight(
            config.color || 0xffffff,
            config.intensity || 5,
            config.distance || 10,
            config.angle || 0.5,
            config.penumbra || 0.4
        );
        spot.position.set(config.position[0], config.position[1], config.position[2]);

        // SpotLight는 target 객체의 position을 향함 (Object3D)
        const target = new THREE.Object3D();
        target.position.set(config.target[0], config.target[1], config.target[2]);
        this.scene.add(target);
        spot.target = target;

        // 그림자 설정 (선택)
        spot.castShadow = true;
        spot.shadow.mapSize.set(1024, 1024);
        spot.shadow.camera.near = 0.5;
        spot.shadow.camera.far = 12;

        this.scene.add(spot);

        this._currentSpotLight = spot;
        this._currentSpotTarget = target;
    }

    /**
     * 챕터 나갈 때 호출. 현재 spot light 제거.
     */
    removeSpotLight() {
        if (this._currentSpotLight) {
            this.scene.remove(this._currentSpotLight);
            this._currentSpotLight.dispose();
            this._currentSpotLight = null;
        }
        if (this._currentSpotTarget) {
            this.scene.remove(this._currentSpotTarget);
            this._currentSpotTarget = null;
        }
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