// src/objects/TipBox.js
// 피펫 팁 박스. blue(P1000용) / yellow(P200용) 두 종류 지원.
//
// 구조:
//   - 베이스 (흰색 박스)
//   - 컬러 플레이트 (위쪽, blue/yellow)
//   - 격자형 팁 배열 (8x12 = 96개가 표준이지만 시각적 단순화로 축소)

import * as THREE from 'three';

const TIPBOX_SPECS = {
    blue: {
        name: 'Tip Box (P1000)',
        plateColor: 0x2e7df0,
        tipColor: 0xeaf0fa,         // 큰 투명 팁
        tipRadius: 0.025,
        tipHeight: 0.22,
        grid: { rows: 6, cols: 8, spacing: 0.13 }
    },
    yellow: {
        name: 'Tip Box (P200)',
        plateColor: 0xf5c518,
        tipColor: 0xfff8d0,         // 중간 크기 투명 팁
        tipRadius: 0.018,
        tipHeight: 0.16,
        grid: { rows: 6, cols: 8, spacing: 0.11 }
    }
};

export default class TipBox extends THREE.Group {
    constructor(type) {
        super();

        if (!TIPBOX_SPECS[type]) {
            throw new Error(`TipBox: unknown type "${type}"`);
        }

        this.type = type;
        this.spec = TIPBOX_SPECS[type];
        this.name = `tipBox_${type}`;
        this.userData.tubeName = this.spec.name;
        this.userData.isInteractive = true;

        this._buildBase();
        this._buildPlate();
        this._buildTips();

        this.traverse((child) => {
            if (child.isMesh || child.isInstancedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    _buildBase() {
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xf2f2f2,
            roughness: 0.55
        });
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.0), baseMat);
        base.position.y = 0;
        this.add(base);
    }

    _buildPlate() {
        const plateMat = new THREE.MeshStandardMaterial({
            color: this.spec.plateColor,
            roughness: 0.25,
            metalness: 0.05
        });
        const plate = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.04, 0.98), plateMat);
        plate.position.y = 0.27;
        this.add(plate);

        // 격자 구멍 시각화는 생략 (성능 + 시각적 단순화)
    }

    _buildTips() {
        // InstancedMesh로 팁 배열
        const { rows, cols, spacing } = this.spec.grid;
        const total = rows * cols;

        const tipGeo = new THREE.CylinderGeometry(
            this.spec.tipRadius,
            this.spec.tipRadius * 0.25,
            this.spec.tipHeight,
            8
        );
        const tipMat = new THREE.MeshPhysicalMaterial({
            color: this.spec.tipColor,
            transparent: true,
            opacity: 0.55,
            roughness: 0.2,
            transmission: 0.3,
            thickness: 0.02
        });

        const tipsMesh = new THREE.InstancedMesh(tipGeo, tipMat, total);
        const dummy = new THREE.Object3D();

        const startX = -((cols - 1) * spacing) / 2;
        const startZ = -((rows - 1) * spacing) / 2;
        const tipY = 0.29 + this.spec.tipHeight / 2;

        let i = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                dummy.position.set(
                    startX + c * spacing,
                    tipY,
                    startZ + r * spacing
                );
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                tipsMesh.setMatrixAt(i++, dummy.matrix);
            }
        }
        tipsMesh.instanceMatrix.needsUpdate = true;
        tipsMesh.castShadow = true;
        tipsMesh.receiveShadow = true;
        this.add(tipsMesh);
        this.tipsMesh = tipsMesh;
    }

    update(deltaMs) {
        // 향후 확장 (팁 사용/제거 등)
    }
}
