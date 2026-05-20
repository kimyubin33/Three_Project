// src/objects/Pipette.js
// 마이크로피펫 모델. P200/P1000 두 종류를 type 인자로 구분.
//
// 구조 (위→아래):
//   - 플런저 노브 (다이얼 + 누름버튼)
//   - 디스플레이 (다이얼 숫자 표시 자리, 추후 CSS2DRenderer로 채움)
//   - 본체 (그립)
//   - 팁 이젝터 (옆 작은 버튼)
//   - 샤프트 (가늘어지는 부분)
//   - 팁 콘 (팁이 꽂히는 끝, 검정)
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as THREE from 'three';

const PIPETTE_SPECS = {
    p200: {
        name: 'P200 Pipette',
        knobColor: 0xffcc00,        // 노란색 노브 (P200 표준)
        bodyHeight: 1.1,
        bodyRadius: 0.07,
        tipConeLength: 0.28,
        defaultVolume: 200,
        maxVolume: 200,
        targetVolume: 50            // 시퀀스상 050으로 맞춰야 하는 값
    },
    p1000: {
        name: 'P1000 Pipette',
        knobColor: 0x3399ff,        // 파란색 노브 (P1000 표준)
        bodyHeight: 1.3,
        bodyRadius: 0.085,
        tipConeLength: 0.35,
        defaultVolume: 1000,
        maxVolume: 1000,
        targetVolume: 500           // 시퀀스상 0500으로 맞춰야 하는 값
    }
};

export default class Pipette extends THREE.Group {
    constructor(type) {
        super();

        if (!PIPETTE_SPECS[type]) {
            throw new Error(`Pipette: unknown type "${type}"`);
        }

        this.type = type;
        this.spec = PIPETTE_SPECS[type];
        this.name = type;
        this.userData.tubeName = this.spec.name;
        this.userData.isInteractive = true;

        // 현재 상태
        this.state = {
            currentVolume: this.spec.defaultVolume,
            hasTip: false,
            isInTube: false
        };

        this._buildBody();
        this._buildKnob();
        this._buildEjector();
        this._buildShaft();

        this.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    _buildBody() {
        // 메인 그립 부분 (위쪽 약간 굵음)
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            roughness: 0.45,
            metalness: 0.05
        });

        const bodyGeo = new THREE.CylinderGeometry(
            this.spec.bodyRadius * 1.15,    // 위
            this.spec.bodyRadius,           // 아래
            this.spec.bodyHeight,
            20
        );
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0;
        this.add(body);

        // 디스플레이 창 (작은 어두운 박스)
        const displayGeo = new THREE.BoxGeometry(0.08, 0.1, 0.005);
        const displayMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.3
        });
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(0, 0.15, this.spec.bodyRadius * 1.1);
        this.add(display);
        this.displayMesh = display;
        // CSS2DObject로 디스플레이 위에 숫자 라벨 부착
        const labelDiv = document.createElement('div');
        labelDiv.className = 'pipette-display-label';
        labelDiv.dataset.pipetteType = this.type;
        labelDiv.innerHTML = this._formatDisplayHtml(this.state.currentVolume);
        const label = new CSS2DObject(labelDiv);
        // 디스플레이 창 정면에 살짝 띄워서 배치
        label.position.set(0, 0.15, this.spec.bodyRadius * 1.15 + 0.005);
        this.add(label);
        this.displayLabel = labelDiv; // 업데이트 편의를 위해 DOM 요소 참조 저장
    }

    _buildKnob() {
        // 플런저 노브 (색상이 P200/P1000 구분 포인트)
        const knobMat = new THREE.MeshStandardMaterial({
            color: this.spec.knobColor,
            roughness: 0.3,
            metalness: 0.1
        });

        // 노브 아래 단 (두꺼운 띠)
        const knobBaseGeo = new THREE.CylinderGeometry(
            this.spec.bodyRadius * 1.3,
            this.spec.bodyRadius * 1.3,
            0.08,
            20
        );
        const knobBase = new THREE.Mesh(knobBaseGeo, knobMat);
        knobBase.position.y = this.spec.bodyHeight / 2 + 0.04;
        this.add(knobBase);

        // 노브 위 누름버튼 (작은 원통)
        const knobTopGeo = new THREE.CylinderGeometry(
            this.spec.bodyRadius * 0.7,
            this.spec.bodyRadius * 0.7,
            0.15,
            20
        );
        const knobTop = new THREE.Mesh(knobTopGeo, knobMat);
        knobTop.position.y = this.spec.bodyHeight / 2 + 0.155;
        this.add(knobTop);

        // 가장 위 캡 (살짝 어두운 마감)
        const capMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.4
        });
        const capGeo = new THREE.CylinderGeometry(
            this.spec.bodyRadius * 0.75,
            this.spec.bodyRadius * 0.75,
            0.03,
            20
        );
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = this.spec.bodyHeight / 2 + 0.245;
        this.add(cap);

        this.knobMesh = knobTop;  // 다이얼 인터랙션 대상
    }

    _buildEjector() {
        // 팁 이젝터 버튼 (본체 측면에 작게 튀어나옴)
        const ejMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.5
        });
        const ejGeo = new THREE.BoxGeometry(0.06, 0.18, 0.06);
        const ej = new THREE.Mesh(ejGeo, ejMat);
        ej.position.set(this.spec.bodyRadius + 0.04, 0.18, 0);
        this.add(ej);
    }

    _buildShaft() {
        // 본체 아래 가늘어지는 부분 (샤프트)
        const shaftMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.4
        });
        const shaftGeo = new THREE.CylinderGeometry(
            this.spec.bodyRadius * 0.7,
            this.spec.bodyRadius * 0.35,
            0.18,
            16
        );
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.position.y = -this.spec.bodyHeight / 2 - 0.09;
        this.add(shaft);

        // 팁 콘 (검정, 가장 끝부분 — 실제 팁이 이 위에 꽂힘)
        const coneMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.6
        });
        const coneGeo = new THREE.CylinderGeometry(
            this.spec.bodyRadius * 0.35,
            this.spec.bodyRadius * 0.12,
            this.spec.tipConeLength,
            16
        );
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = -this.spec.bodyHeight / 2 - 0.18 - this.spec.tipConeLength / 2;
        this.add(cone);

        this.tipConeMesh = cone;
    }

_formatDisplayHtml(volume) {
        // P200: 표시값 = 실제 µL (예: 50 µL → "050")
        // P1000: 표시값 × 10 = 실제 µL (예: 500 µL → "050", 작은 "×10" 표기)
        if (this.type === 'p200') {
            const display = Math.round(volume).toString().padStart(3, '0');
            return `<div class="pd-main">${display}</div>`;
        } else {
            const display = Math.round(volume / 10).toString().padStart(3, '0');
            return `<div class="pd-main">${display}</div><div class="pd-unit">×10 µL</div>`;
        }
    }
    /**
     * 다이얼 값 변경 (외부 UI에서 호출)
     * 추후 다이얼 인터랙션 모듈에서 사용
     */
    setVolume(value) {
        const clamped = Math.max(0, Math.min(this.spec.maxVolume, value));
        this.state.currentVolume = clamped;
        // TODO: displayMesh에 텍스트 라벨 업데이트
        if (this.displayLabel) {
            this.displayLabel.innerHTML = this._formatDisplayHtml(clamped);
        }
    }

    setHighlight(on) {
        if (!this.knobMesh) return;
        this.knobMesh.material.emissive = new THREE.Color(on ? 0x3b82f6 : 0x000000);
        this.knobMesh.material.emissiveIntensity = on ? 0.5 : 0;
    }

    update(deltaMs) {
        // 향후 확장
    }
}
