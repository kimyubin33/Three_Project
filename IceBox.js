// src/objects/IceBox.js
// 아이스박스 = 파란 플라스틱 박스 + crushed ice (InstancedMesh) + 튜브 슬롯
//
// 참고 사진 기준 형태:
//   - 사다리꼴 단면 (위가 약간 넓음)
//   - 둥근 모서리
//   - 가장자리에 가로 홈(rim line) 한 줄
//   - 안에 잘게 부순 얼음이 봉긋하게 쌓여있음
//   - 튜브는 얼음에 깊이 박혀 뚜껑만 노출
//
// 좌표계: 박스의 바닥 중심이 로컬 (0, 0, 0).

import * as THREE from 'three';
import MicroTube from './MicroTube.js';
import { TUBE_CONFIG } from '../data/tubeConfig.js';

const BOX_OUTER = { w: 3.2, h: 1.0, d: 2.0 };  // 외부 치수
const BOX_WALL = 0.18;                          // 벽 두께
const ICE_COUNT = 450;                          // crushed ice 인스턴스 수

export default class IceBox extends THREE.Group {
    constructor() {
        super();
        this.name = 'iceBoxGroup';

        this.tubes = {};        // id → MicroTube 인스턴스
        this.iceMesh = null;    // InstancedMesh 참조

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
        // 파란 플라스틱 재질
        const plasticMat = new THREE.MeshStandardMaterial({
            color: 0x1e60ff,
            roughness: 0.55,
            metalness: 0.05
        });

        // === 외부 본체 (사다리꼴 단면을 BoxGeometry로 근사) ===
        // 아래가 살짝 좁고 위가 넓은 형태를 만들기 위해 두 박스를 겹침
        // 더 정밀히 하려면 ExtrudeGeometry로 단면 모양을 그릴 수 있지만,
        // 시각적 차이는 미미하고 단순화 효과가 크므로 BoxGeometry 사용.

        // 바닥 (살짝 좁음)
        const bottomGeo = new THREE.BoxGeometry(BOX_OUTER.w - 0.15, 0.08, BOX_OUTER.d - 0.15);
        const bottom = new THREE.Mesh(bottomGeo, plasticMat);
        bottom.position.y = 0.04;
        this.add(bottom);

        // 4면 벽 (위가 살짝 벌어진 사다리꼴 효과를 위해 벽을 살짝 기울임)
        const wallHeight = BOX_OUTER.h - 0.08;
        const tiltAngle = 0.06;  // 라디안

        // 앞/뒤 벽
        for (const [zSign, name] of [[1, 'wallFront'], [-1, 'wallBack']]) {
            const wallGeo = new THREE.BoxGeometry(BOX_OUTER.w, wallHeight, BOX_WALL);
            const wall = new THREE.Mesh(wallGeo, plasticMat);
            wall.position.set(0, 0.08 + wallHeight / 2, zSign * (BOX_OUTER.d / 2 - BOX_WALL / 2));
            wall.rotation.x = -zSign * tiltAngle;
            wall.name = name;
            this.add(wall);
        }

        // 좌/우 벽
        for (const [xSign, name] of [[1, 'wallRight'], [-1, 'wallLeft']]) {
            const wallGeo = new THREE.BoxGeometry(BOX_WALL, wallHeight, BOX_OUTER.d);
            const wall = new THREE.Mesh(wallGeo, plasticMat);
            wall.position.set(xSign * (BOX_OUTER.w / 2 - BOX_WALL / 2), 0.08 + wallHeight / 2, 0);
            wall.rotation.z = xSign * tiltAngle;
            wall.name = name;
            this.add(wall);
        }

        // === 상단 rim (가장자리 테두리, 사진의 가로 홈 라인 효과) ===
        // 박스 상단 둘레에 약간 더 큰 박스를 띄워서 rim 형태
        const rimGeo = new THREE.BoxGeometry(BOX_OUTER.w + 0.12, 0.1, BOX_OUTER.d + 0.12);
        const rim = new THREE.Mesh(rimGeo, plasticMat);
        rim.position.y = BOX_OUTER.h - 0.02;
        this.add(rim);

        // rim 아래에 가는 홈 라인 (살짝 어두운 띠)
        const grooveGeo = new THREE.BoxGeometry(BOX_OUTER.w + 0.05, 0.02, BOX_OUTER.d + 0.05);
        const grooveMat = new THREE.MeshStandardMaterial({
            color: 0x0d3a99,
            roughness: 0.7
        });
        const groove = new THREE.Mesh(grooveGeo, grooveMat);
        groove.position.y = BOX_OUTER.h - 0.12;
        this.add(groove);

        // === 박스 내부에 더 어두운 색조 (입체감) ===
        // 안쪽이 푸르스름한 그림자 영역으로 보이게
        const innerShadowMat = new THREE.MeshStandardMaterial({
            color: 0x0a3380,
            roughness: 0.9,
            side: THREE.BackSide
        });
        const innerShadowGeo = new THREE.BoxGeometry(
            BOX_OUTER.w - BOX_WALL * 2 - 0.05,
            BOX_OUTER.h - 0.1,
            BOX_OUTER.d - BOX_WALL * 2 - 0.05
        );
        const innerShadow = new THREE.Mesh(innerShadowGeo, innerShadowMat);
        innerShadow.position.y = 0.1 + (BOX_OUTER.h - 0.1) / 2;
        this.add(innerShadow);
    }

    _buildIce() {
        // === Crushed Ice (InstancedMesh) ===
        // 작은 다면체 하나를 만들어 박스 안쪽 영역에 흩뿌림
        // 봉긋하게 가운데가 솟은 형태를 위해 중심부 밀도를 살짝 높이고
        // 가운데 y를 더 높게 배치

        const iceGeo = new THREE.IcosahedronGeometry(0.07, 0);  // 저폴리 다면체
        const iceMat = new THREE.MeshPhysicalMaterial({
            color: 0xeaf6ff,
            transparent: true,
            opacity: 0.78,
            roughness: 0.25,
            metalness: 0.0,
            transmission: 0.4,
            thickness: 0.08,
            ior: 1.31           // 얼음 굴절률
        });

        const iceMesh = new THREE.InstancedMesh(iceGeo, iceMat, ICE_COUNT);
        iceMesh.castShadow = true;
        iceMesh.receiveShadow = true;
        iceMesh.name = 'crushedIce';

        const dummy = new THREE.Object3D();

        // 박스 내부 가용 영역 (벽 안쪽)
        const innerW = BOX_OUTER.w - BOX_WALL * 2 - 0.2;
        const innerD = BOX_OUTER.d - BOX_WALL * 2 - 0.2;
        const iceBaseY = 0.15;    // 얼음이 시작되는 높이 (바닥에서)
        const iceMaxY = 0.85;     // 가운데 봉우리 최대 높이

        for (let i = 0; i < ICE_COUNT; i++) {
            // 박스 안쪽 랜덤 위치
            const x = (Math.random() - 0.5) * innerW;
            const z = (Math.random() - 0.5) * innerD;

            // 중심에서 멀수록 낮게 (봉우리 형태)
            const distFromCenter = Math.sqrt(
                (x / (innerW / 2)) ** 2 + (z / (innerD / 2)) ** 2
            );
            const heightCurve = Math.max(0, 1 - distFromCenter ** 1.5);
            const yMax = iceBaseY + (iceMaxY - iceBaseY) * heightCurve;

            // 0~yMax 사이에서 랜덤 (얼음이 쌓인 두께)
            const y = iceBaseY + Math.random() * (yMax - iceBaseY);

            // 회전/스케일 랜덤
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
        // 튜브 5개를 얼음 위쪽에 박힌 형태로 배치.
        // tubeConfig의 position을 기반으로 하되, y는 얼음 위로 살짝만 노출되도록.

        for (const cfg of TUBE_CONFIG) {
            const tube = new MicroTube(cfg);

            // 박스 로컬 좌표로 변환
            // config.position은 박스 중심 기준이라 그대로 적용
            // y는 "얼음에 박힌" 효과: 튜브 본체 대부분 묻히고 뚜껑만 보이게
            // 튜브의 로컬 원점은 본체 중심이므로, y를 0.55~0.65 정도에 두면
            // 뚜껑(y_local≈0.17 부근)이 얼음 봉우리 위에 살짝 노출됨

            const buriedY = 0.55 + cfg.position.y;
            tube.position.set(cfg.position.x, buriedY, cfg.position.z);
            tube.rotation.set(cfg.rotation.x, cfg.rotation.y, cfg.rotation.z);

            this.add(tube);
            this.tubes[cfg.id] = tube;
        }
    }

    /**
     * 외부에서 특정 튜브에 접근할 때 사용
     */
    getTube(id) {
        return this.tubes[id];
    }

    update(deltaMs) {
        // 각 튜브의 update 호출 (해동 진행 등)
        for (const id in this.tubes) {
            this.tubes[id].update(deltaMs);
        }
    }
}
