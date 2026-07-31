// src/objects/HeatingBlock.js
// 미니 디지털 히팅블록 (Dry Bath).
//
// 구조:
//   - 본체 박스 (플라스틱 하우징, 어두운 회색)
//   - 상단 금속 블록 (알루미늄, 튜브 구멍 격자)
//   - 전면 디지털 디스플레이 (CSS2D 라벨로 온도 표시)
//   - 구멍: 4×6 격자 (튜브가 꽂히는 자리)

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const BLOCK = {
    bodyW: 2.4,
    bodyH: 0.9,
    bodyD: 1.8,
    metalW: 2.0,
    metalH: 0.35,
    metalD: 1.5,
    holeRows: 4,
    holeCols: 6,
    holeRadius: 0.07,
    holeDepth: 0.25
};

export default class HeatingBlock extends THREE.Group {
    constructor(targetTempC = 42) {
        super();
        this.name = 'heatingBlock';
        this.userData.tubeName = 'Heating Block (히팅블록)';
        this.userData.isInteractive = true;

        this.targetTemp = targetTempC;
        this.holePositions = [];   // 튜브를 꽂을 수 있는 로컬 좌표 목록

        this._buildBody();
        this._buildMetalBlock();
        this._buildDisplay();

        this.traverse((c) => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
            }
        });
    }

    _buildBody() {
        // 하우징 (어두운 회색 플라스틱)
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x3a3f4a,
            roughness: 0.6,
            metalness: 0.15
        });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(BLOCK.bodyW, BLOCK.bodyH, BLOCK.bodyD),
            bodyMat
        );
        body.position.y = BLOCK.bodyH / 2;
        this.add(body);

        // 전면 패널 (조금 더 밝은 색, 디스플레이가 붙을 자리)
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x2a2e37,
            roughness: 0.5,
            metalness: 0.2
        });
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(BLOCK.bodyW * 0.9, BLOCK.bodyH * 0.55, 0.04),
            panelMat
        );
        panel.position.set(0, BLOCK.bodyH * 0.42, BLOCK.bodyD / 2 + 0.02);
        this.add(panel);

        // 전원 LED (작은 초록 점)
        const ledMat = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x22c55e,
            emissiveIntensity: 1.5
        });
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), ledMat);
        led.position.set(BLOCK.bodyW * 0.35, BLOCK.bodyH * 0.25, BLOCK.bodyD / 2 + 0.03);
        this.add(led);
    }

    _buildMetalBlock() {
        // 상단 알루미늄 블록
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xb8bcc4,
            roughness: 0.35,
            metalness: 0.85
        });
        const metal = new THREE.Mesh(
            new THREE.BoxGeometry(BLOCK.metalW, BLOCK.metalH, BLOCK.metalD),
            metalMat
        );
        const metalY = BLOCK.bodyH + BLOCK.metalH / 2;
        metal.position.y = metalY;
        this.add(metal);

        // 튜브 구멍 (어두운 원통을 살짝 파묻어서 구멍처럼 보이게)
        const holeMat = new THREE.MeshStandardMaterial({
            color: 0x1a1d23,
            roughness: 0.9,
            metalness: 0.1
        });
        const holeGeo = new THREE.CylinderGeometry(
            BLOCK.holeRadius, BLOCK.holeRadius * 0.85, BLOCK.holeDepth, 16
        );

        const spacingX = BLOCK.metalW * 0.8 / (BLOCK.holeCols - 1);
        const spacingZ = BLOCK.metalD * 0.75 / (BLOCK.holeRows - 1);
        const startX = -(BLOCK.metalW * 0.8) / 2;
        const startZ = -(BLOCK.metalD * 0.75) / 2;
        const holeY = metalY + BLOCK.metalH / 2 - BLOCK.holeDepth / 2 + 0.01;

        for (let r = 0; r < BLOCK.holeRows; r++) {
            for (let c = 0; c < BLOCK.holeCols; c++) {
                const x = startX + c * spacingX;
                const z = startZ + r * spacingZ;
                const hole = new THREE.Mesh(holeGeo, holeMat);
                hole.position.set(x, holeY, z);
                this.add(hole);

                // 튜브가 꽂힐 위치 기록 (구멍 입구 높이)
                this.holePositions.push({
                    x,
                    y: metalY + BLOCK.metalH / 2,
                    z
                });
            }
        }
    }

    _buildDisplay() {
        // 전면 디지털 온도 표시 (CSS2DObject)
        const div = document.createElement('div');
        div.className = 'heating-block-display';
        div.innerHTML = `
            <div class="hb-temp">${this.targetTemp.toFixed(1)}</div>
            <div class="hb-unit">°C</div>
        `;
        const label = new CSS2DObject(div);
        label.position.set(0, BLOCK.bodyH * 0.42, BLOCK.bodyD / 2 + 0.06);
        this.add(label);
        this.displayLabel = div;
    }

    /**
     * 특정 인덱스 구멍의 로컬 좌표 반환.
     * 튜브를 꽂을 때 사용.
     */
    getHolePosition(index) {
        return this.holePositions[index] || this.holePositions[0];
    }

    /**
     * 디스플레이 온도 갱신 (필요시)
     */
    setTemperature(tempC) {
        this.targetTemp = tempC;
        if (this.displayLabel) {
            const tempEl = this.displayLabel.querySelector('.hb-temp');
            if (tempEl) tempEl.textContent = tempC.toFixed(1);
        }
    }

    setHighlight(on) {
        // 인터랙션 hover 시 시각 피드백 (금속 블록만)
        // 필요하면 나중에 구현
    }

    update(deltaMs) {
        // 향후 확장
    }
}