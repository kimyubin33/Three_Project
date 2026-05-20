// src/objects/IceBox.js
// 아이스박스 = 파란 플라스틱 박스 (위가 열림) + crushed ice (InstancedMesh) + 튜브 슬롯

import * as THREE from 'three';
import MicroTube from './MicroTube.js';
import { TUBE_CONFIG } from '../data/tubeConfig.js';

const BOX = {
    outerW: 3.2,
    outerD: 2.0,
    outerH: 1.0,
    wall: 0.18,
    rimH: 0.12,
    rimOverhang: 0.08
};

const ICE_COUNT = 450;

export default class IceBox extends THREE.Group {
    constructor() {
        super();
        this.name = 'iceBoxGroup';
        this.userData.tubeName = 'Ice Box (아이스박스)';
        this.userData.isInteractive = true;

        this.tubes = {};
        this.iceMesh = null;
        this.shellMeshes = [];  // 박스 외형 mesh들 (튜브와 분리해서 hover 대상으로)

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
        const outerMat = new THREE.MeshStandardMaterial({
            color: 0x1e60ff,
            roughness: 0.55,
            metalness: 0.05
        });
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x144ad9,
            roughness: 0.7,
            metalness: 0.03,
            side: THREE.DoubleSide
        });

        const { outerW, outerD, outerH, wall, rimH, rimOverhang } = BOX;

        const floorGeo = new THREE.BoxGeometry(outerW, wall, outerD);
        const floor = new THREE.Mesh(floorGeo, outerMat);
        floor.position.y = wall / 2;
        this.add(floor);
        this.shellMeshes.push(floor);

        const wallH = outerH - wall - rimH;

        for (const zSign of [1, -1]) {
            const wallGeo = new THREE.BoxGeometry(outerW, wallH, wall);
            const wallMesh = new THREE.Mesh(wallGeo, outerMat);
            wallMesh.position.set(0, wall + wallH / 2, zSign * (outerD / 2 - wall / 2));
            this.add(wallMesh);
            this.shellMeshes.push(wallMesh);
        }
        for (const xSign of [1, -1]) {
            const wallGeo = new THREE.BoxGeometry(wall, wallH, outerD - wall * 2);
            const wallMesh = new THREE.Mesh(wallGeo, outerMat);
            wallMesh.position.set(xSign * (outerW / 2 - wall / 2), wall + wallH / 2, 0);
            this.add(wallMesh);
            this.shellMeshes.push(wallMesh);
        }

        const rimY = wall + wallH + rimH / 2;
        const rimOuterW = outerW + rimOverhang * 2;
        const rimOuterD = outerD + rimOverhang * 2;
        const rimThickness = wall + rimOverhang;

        for (const zSign of [1, -1]) {
            const rimGeo = new THREE.BoxGeometry(rimOuterW, rimH, rimThickness);
            const rimMesh = new THREE.Mesh(rimGeo, outerMat);
            rimMesh.position.set(0, rimY, zSign * (rimOuterD / 2 - rimThickness / 2));
            this.add(rimMesh);
            this.shellMeshes.push(rimMesh);
        }
        for (const xSign of [1, -1]) {
            const rimGeo = new THREE.BoxGeometry(rimThickness, rimH, rimOuterD - rimThickness * 2);
            const rimMesh = new THREE.Mesh(rimGeo, outerMat);
            rimMesh.position.set(xSign * (rimOuterW / 2 - rimThickness / 2), rimY, 0);
            this.add(rimMesh);
            this.shellMeshes.push(rimMesh);
        }

        const inset = 0.002;
        const innerWallH = wallH + 0.01;
        const innerY = wall + innerWallH / 2;

        for (const zSign of [1, -1]) {
            const linGeo = new THREE.PlaneGeometry(outerW - wall * 2, innerWallH);
            const lin = new THREE.Mesh(linGeo, innerMat);
            lin.position.set(0, innerY, zSign * (outerD / 2 - wall - inset));
            lin.rotation.y = zSign === 1 ? Math.PI : 0;
            this.add(lin);
            this.shellMeshes.push(lin);
        }
        for (const xSign of [1, -1]) {
            const linGeo = new THREE.PlaneGeometry(outerD - wall * 2, innerWallH);
            const lin = new THREE.Mesh(linGeo, innerMat);
            lin.position.set(xSign * (outerW / 2 - wall - inset), innerY, 0);
            lin.rotation.y = xSign === 1 ? -Math.PI / 2 : Math.PI / 2;
            this.add(lin);
            this.shellMeshes.push(lin);
        }

        const floorInnerGeo = new THREE.PlaneGeometry(outerW - wall * 2, outerD - wall * 2);
        const floorInner = new THREE.Mesh(floorInnerGeo, innerMat);
        floorInner.rotation.x = -Math.PI / 2;
        floorInner.position.y = wall + inset;
        this.add(floorInner);
        this.shellMeshes.push(floorInner);
    }

    _buildIce() {
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
        // 얼음은 hover 대상에서 제외 (튜브 hover 방해 방지)
        iceMesh.userData.skipInteraction = true;

        const dummy = new THREE.Object3D();
        const innerW = BOX.outerW - BOX.wall * 2 - 0.15;
        const innerD = BOX.outerD - BOX.wall * 2 - 0.15;
        const iceBaseY = BOX.wall + 0.05;
        const iceMaxY = BOX.outerH - 0.05;

        for (let i = 0; i < ICE_COUNT; i++) {
            const x = (Math.random() - 0.5) * innerW;
            const z = (Math.random() - 0.5) * innerD;
            const distFromCenter = Math.sqrt(
                (x / (innerW / 2)) ** 2 + (z / (innerD / 2)) ** 2
            );
            const heightCurve = Math.max(0, 1 - distFromCenter ** 1.5);
            const yMax = iceBaseY + (iceMaxY - iceBaseY) * heightCurve;
            const y = iceBaseY + Math.random() * (yMax - iceBaseY);
            const scale = 0.55 + Math.random() * 0.7;
            dummy.position.set(x, y, z);
            dummy.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            iceMesh.setMatrixAt(i, dummy.matrix);
        }
        iceMesh.instanceMatrix.needsUpdate = true;
        this.iceMesh = iceMesh;
        this.add(iceMesh);
    }

    _placeTubes() {
        for (const cfg of TUBE_CONFIG) {
            const tube = new MicroTube(cfg);
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

    /**
     * 인터랙션 컨트롤러에 등록할 객체 목록을 반환.
     * - 박스 셸은 하나의 단위 (this 자체이지만 mesh만 노출)
     * - 각 튜브는 개별 단위
     */
    getInteractiveTargets() {
        const targets = [];

        // 박스 셸 — IceBox 그룹 자체를 root로 하되, 인터랙션 시엔 shellMeshes만 검사하도록
        // 다만 등록 패턴 단순화를 위해 별도 Group으로 묶지 않고
        // 직접 mesh 단위로 처리. InteractionController가 root로 IceBox를 받으면
        // traverse 결과에 튜브 mesh까지 다 포함되어버리므로 따로 처리.
        // → 해결: 박스 셸 전용 가상 root를 사용. 여기선 IceBox를 박스로 등록하되
        //   튜브 mesh는 traverse에서 제외해야 함. 가장 단순한 방법은 박스 셸 mesh만
        //   가진 ProxyObject를 만드는 것이지만, 더 단순하게: 각 튜브를 먼저 등록하면
        //   raycaster가 더 가까운 튜브를 우선 잡으므로 hover 우선순위로 해결됨.
        //   IceBox는 박스 셸 mesh만으로 등록.

        // 박스 셸 등록 정보 (shellMeshes를 가진 가상 핸들)
        targets.push({
            type: 'iceBoxShell',
            root: this,
            meshes: this.shellMeshes,
            displayName: 'Ice Box (아이스박스)',
            displayRole: '얼음으로 시료 저온 보관'
        });

        // 각 튜브 등록 정보
        for (const id in this.tubes) {
            const tube = this.tubes[id];
            const tubeMeshes = [];
            tube.traverse((c) => {
                if (c.isMesh) tubeMeshes.push(c);
            });
            targets.push({
                type: 'tube',
                root: tube,
                meshes: tubeMeshes,
                displayName: tube.config.shortName,
                displayRole: tube.config.role
            });
        }

        return targets;
    }

    update(deltaMs) {
        for (const id in this.tubes) {
            this.tubes[id].update(deltaMs);
        }
    }
}