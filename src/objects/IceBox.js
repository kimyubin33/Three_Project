// src/objects/IceBox.js
// 아이스박스 = 파란 플라스틱 박스 (위가 열림) + crushed ice (InstancedMesh) + 튜브 슬롯
//
// 참고 사진 기준 형태:
//   - 위가 열린 통 (오픈탑)
//   - 사다리꼴 단면 (위가 약간 넓음, 벽 안쪽이 살짝 기울어짐)
//   - 가장자리에 두꺼운 rim (테두리)
//   - 안에 잘게 부순 얼음이 봉긋하게 쌓임
//   - 튜브는 얼음에 깊이 박혀 뚜껑만 노출
//
// 좌표계: 박스의 바닥 중심이 로컬 (0, 0, 0).

import * as THREE from 'three';
import MicroTube from './MicroTube.js';
import { TUBE_CONFIG } from '../data/tubeConfig.js';

const BOX = {
    outerW: 3.2,       // 외부 가로
    outerD: 2.0,       // 외부 세로(깊이)
    outerH: 1.0,       // 외부 높이
    wall: 0.18,        // 벽 두께
    rimH: 0.12,        // 상단 테두리 두께(높이)
    rimOverhang: 0.08  // rim이 바깥으로 튀어나오는 정도
};

const ICE_COUNT = 450;

export default class IceBox extends THREE.Group {
    constructor() {
        super();
        this.name = 'iceBoxGroup';

        this.tubes = {};
        this.iceMesh = null;

        this._buildBoxShell();
        this._buildIce();
        this._placeTubes();

        this.traverse((child) => {
            if (child.isMesh || child.isInstancedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    _buildBoxShell() {
        // 파란 플라스틱 재질 (외부)
        const outerMat = new THREE.MeshStandardMaterial({
            color: 0x1e60ff,
            roughness: 0.55,
            metalness: 0.05
        });

        // 안쪽 면 재질 (살짝 더 어둡게 → 깊이감)
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x144ad9,
            roughness: 0.7,
            metalness: 0.03,
            side: THREE.DoubleSide
        });

        const { outerW, outerD, outerH, wall, rimH, rimOverhang } = BOX;

        // === 1. 바닥 ===
        const floorGeo = new THREE.BoxGeometry(outerW, wall, outerD);
        const floor = new THREE.Mesh(floorGeo, outerMat);
        floor.position.y = wall / 2;
        this.add(floor);

        // === 2. 네 벽 (위가 열린 형태) ===
        // 벽 높이 = 전체 높이 - 바닥 두께 - rim 두께
        const wallH = outerH - wall - rimH;

        // 전면 / 후면 벽
        for (const zSign of [1, -1]) {
            const wallGeo = new THREE.BoxGeometry(outerW, wallH, wall);
            const wallMesh = new THREE.Mesh(wallGeo, outerMat);
            wallMesh.position.set(
                0,
                wall + wallH / 2,
                zSign * (outerD / 2 - wall / 2)
            );
            this.add(wallMesh);
        }

        // 좌/우 벽
        for (const xSign of [1, -1]) {
            const wallGeo = new THREE.BoxGeometry(wall, wallH, outerD - wall * 2);
            const wallMesh = new THREE.Mesh(wallGeo, outerMat);
            wallMesh.position.set(
                xSign * (outerW / 2 - wall / 2),
                wall + wallH / 2,
                0
            );
            this.add(wallMesh);
        }

        // === 3. 상단 rim (테두리) ===
        // 안쪽이 뚫려있는 액자 형태로 만들기 위해 4개의 막대로 구성
        const rimY = wall + wallH + rimH / 2;
        const rimOuterW = outerW + rimOverhang * 2;
        const rimOuterD = outerD + rimOverhang * 2;
        const rimThickness = wall + rimOverhang;  // rim의 폭(안에서 바깥까지)

        // 전면 / 후면 rim
        for (const zSign of [1, -1]) {
            const rimGeo = new THREE.BoxGeometry(rimOuterW, rimH, rimThickness);
            const rimMesh = new THREE.Mesh(rimGeo, outerMat);
            rimMesh.position.set(
                0,
                rimY,
                zSign * (rimOuterD / 2 - rimThickness / 2)
            );
            this.add(rimMesh);
        }

        // 좌/우 rim (가운데 비워둠)
        for (const xSign of [1, -1]) {
            const rimGeo = new THREE.BoxGeometry(rimThickness, rimH, rimOuterD - rimThickness * 2);
            const rimMesh = new THREE.Mesh(rimGeo, outerMat);
            rimMesh.position.set(
                xSign * (rimOuterW / 2 - rimThickness / 2),
                rimY,
                0
            );
            this.add(rimMesh);
        }

        // === 4. 벽 안쪽 라이닝 (살짝 더 어두운 색조로 깊이감) ===
        // 4면의 안쪽 면에 평면을 살짝 띄워서 부착
        const inset = 0.002;  // 벽보다 살짝 안쪽에
        const innerWallH = wallH + 0.01;
        const innerY = wall + innerWallH / 2;

        // 전/후 안쪽 면
        for (const zSign of [1, -1]) {
            const linGeo = new THREE.PlaneGeometry(outerW - wall * 2, innerWallH);
            const lin = new THREE.Mesh(linGeo, innerMat);
            lin.position.set(0, innerY, zSign * (outerD / 2 - wall - inset));
            lin.rotation.y = zSign === 1 ? Math.PI : 0;
            this.add(lin);
        }

        // 좌/우 안쪽 면
        for (const xSign of [1, -1]) {
            const linGeo = new THREE.PlaneGeometry(outerD - wall * 2, innerWallH);
            const lin = new THREE.Mesh(linGeo, innerMat);
            lin.position.set(xSign * (outerW / 2 - wall - inset), innerY, 0);
            lin.rotation.y = xSign === 1 ? -Math.PI / 2 : Math.PI / 2;
            this.add(lin);
        }

        // 바닥 안쪽 면 (윗면)
        const floorInnerGeo = new THREE.PlaneGeometry(outerW - wall * 2, outerD - wall * 2);
        const floorInner = new THREE.Mesh(floorInnerGeo, innerMat);
        floorInner.rotation.x = -Math.PI / 2;
        floorInner.position.y = wall + inset;
        this.add(floorInner);
    }

    _buildIce() {
        // 작은 얼음 조각 하나를 만들어 InstancedMesh로 박스 안쪽에 뿌림
        const iceGeo = new THREE.IcosahedronGeometry(0.07, 0);
        const iceMat = new THREE.MeshPhysicalMaterial({
            color: 0xeaf6ff,
            transparent: true,
            opacity: 0.82,
            roughness: 0.2,
            metalness: 0.0,
            transmission: 0.35,
            thickness: 0.08,
            ior: 1.31
        });

        const iceMesh = new THREE.InstancedMesh(iceGeo, iceMat, ICE_COUNT);
        iceMesh.castShadow = true;
        iceMesh.receiveShadow = true;
        iceMesh.name = 'crushedIce';

        const dummy = new THREE.Object3D();

        const innerW = BOX.outerW - BOX.wall * 2 - 0.15;
        const innerD = BOX.outerD - BOX.wall * 2 - 0.15;
        const iceBaseY = BOX.wall + 0.05;    // 바닥 바로 위
        const iceMaxY = BOX.outerH - 0.05;   // rim 살짝 아래

        for (let i = 0; i < ICE_COUNT; i++) {
            const x = (Math.random() - 0.5) * innerW;
            const z = (Math.random() - 0.5) * innerD;

            // 중심에서 멀수록 낮게 → 봉우리 형태
            const distFromCenter = Math.sqrt(
                (x / (innerW / 2)) ** 2 + (z / (innerD / 2)) ** 2
            );
            const heightCurve = Math.max(0, 1 - distFromCenter ** 1.5);
            const yMax = iceBaseY + (iceMaxY - iceBaseY) * heightCurve;

            const y = iceBaseY + Math.random() * (yMax - iceBaseY);

            const scale = 0.55 + Math.random() * 0.7;
            const rotX = Math.random() * Math.PI * 2;
            const rotY = Math.random() * Math.PI * 2;
            const rotZ = Math.random() * Math.PI * 2;

            dummy.position.set(x, y, z);
            dummy.rotation.set(rotX, rotY, rotZ);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();

            iceMesh.setMatrixAt(i, dummy.matrix);
        }

        iceMesh.instanceMatrix.needsUpdate = true;
        this.iceMesh = iceMesh;
        this.add(iceMesh);
    }

    _placeTubes() {
        // 튜브 5개를 얼음 봉우리 위에 박힌 형태로 배치.
        // 각 튜브의 본체는 얼음 속에 묻히고 뚜껑만 노출되도록 y를 조정.

        for (const cfg of TUBE_CONFIG) {
            const tube = new MicroTube(cfg);

            // 튜브 원점은 본체 중심. 본체+뚜껑 길이가 약 0.3 정도라서
            // y ≈ 0.65 ~ 0.75 정도면 뚜껑이 얼음 봉우리 위에 노출됨
            const buriedY = BOX.outerH - 0.25 + cfg.position.y;
            tube.position.set(cfg.position.x, buriedY, cfg.position.z);
            tube.rotation.set(cfg.rotation.x, cfg.rotation.y, cfg.rotation.z);

            this.add(tube);
            this.tubes[cfg.id] = tube;
        }
    }

    getTube(id) {
        return this.tubes[id];
    }

    update(deltaMs) {
        for (const id in this.tubes) {
            this.tubes[id].update(deltaMs);
        }
    }
}