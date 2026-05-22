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

const PULSE_COLOR = new THREE.Color(0x3b82f6); // 파란색 (Tailwind의 blue-500)

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

    /**
     * 현재 챕터의 목표값과 비교하여 디스플레이 색을 갱신.
     * 목표값이 없거나 다른 피펫의 목표면 빨강(기본), 일치하면 녹색.
     */
    _updateTargetState() {
        if (!this.displayLabel) return;
        const isMatched = this._targetMatched();
        this.displayLabel.classList.toggle('target-matched', isMatched);
        this.state.atTarget = isMatched;
    }

    _updateKnobRotation() {
        if (!this.knobMesh) return;
        const ratio = this.state.currentVolume / this.spec.maxVolume;
        const totalRotations = 3;
        this.knobMesh.rotation.y = ratio * Math.PI * 2 * totalRotations;
    }

    _targetMatched() {
        if (!this._currentTarget) return false;
        if (this._currentTarget.pipetteType !== this.type) return false;
        return Math.round(this.state.currentVolume) === this._currentTarget.volume;
    }

    /**
     * 외부에서 현재 챕터의 목표값을 주입.
     * null을 넘기면 목표 해제.
     */
    setTarget(target) {
        this._currentTarget = target;  // { pipetteType, volume } | null
        this._updateTargetState();
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
        this._updateKnobRotation();
        this._updateTargetState();
    }

    setHighlight(on) {
        if (!this.knobMesh) return;
        this.knobMesh.material.emissive = new THREE.Color(on ? 0x3b82f6 : 0x000000);
        this.knobMesh.material.emissiveIntensity = on ? 0.5 : 0;
    }

    /**
     * 펄스 시작, 사용자가 "여기 클릭하세요" 시각 힌트.
     * update()에서 매 프레임 emissive를 사인파로 진동.
     */

    // 펄스 깜빡임을 시작하는 코드
    startPulse() {
        this._pulsing = true; // 이 오브젝트가 현재 펄스 중인지 저장, "지금 버튼이 반짝이고 있는 상태인가?"를 기록하는 변수
        this._pulseStartTime = performance.now(); // 현재 시간을 밀리초(ms) 단위로 저장, 사인파(sin)를 이용해서 부드럽게 밝기를 흔들기 위해 사용

        // 펄스 효과를 적용할 Mesh들을 저장할 배열을 초기화한다.
        // startPulse() 가 여러 번 호출될 수 있으므로, 이전 목록을 비우고 새로 수집한다.
        this._pulseMeshes = [];

        // this 객체와 그 안에 포함된 모든 자식 오브젝트를 순회한다.
        // 예: 기계 본체, 뚜껑, 버튼, 손잡이 등
        this.traverse((c) => {

        // c.isMesh:
        // 현재 오브젝트가 실제 화면에 보이는 Mesh인지 확인한다.
        //
        // c.material:
        // Mesh에 재질이 있는지 확인한다.
        //
        // 'emissive' in c.material:
        // 이 재질이 자체 발광 색상(emissive)을 지원하는지 확인한다.
        // emissive가 없는 재질에는 발광 효과를 줄 수 없다.
            if (c.isMesh && c.material && 'emissive' in c.material) {

                // 조건을 통과한 Mesh를 펄스 대상 목록에 추가한다.
                // 이후 startPulse()애서 색상을 지정하고,
                // update()에서 emissiveIntensity를 바꾸어 깜빡이게 만든다.
                this._pulseMeshes.push(c);
            }
        })

        // 펄스 효과를 줄 Mesh들을 하나씩 확인한다.
        // 예: 버튼, 손잡이, 뚜껑 등 사용자가 클릭해야 하는 오브젝트들
        for (const m of this._pulseMeshes) {

            // 안전장치:
            // material이 없거나 emissive 속성이 없는 재질이면
            // 발광 효과를 줄 수 없으므로 이번 Mesh는 건너뛴다.
            if (!m.material?.emissive) continue;

            // 펄스 색상 설정:
            // update()에서 매 프레임 색상을 새로 만들면 낭비가 생기므로,
            // startPulse() 시점에 발광 색상만 한 번 지정한다.
            m.material.emissive.set(PULSE_COLOR);
        }
    }

    // 펄스를 종료하는 코드
    stopPulse() {

        // 펄스 상태를 종료한다.
        // update()에서 더 이상 emissiveIntensity를 계산하거나 적용하지 않게 된다.
        this._pulsing = false;

        // 펄스 대상 Mesh 목록이 존재할 때만 실행한다.
        // null 상태에서 순회하면 에러가 발생할 수 있으므로 안전하게 검사한다.
        if (this._pulseMeshes) { // 안전장치. knobMesh가 존재할 때만 실행

            // 펄스 효과가 적용되던 모든 Mesh를 순회한다.
            for (const m of this._pulseMeshes) {

                // emissiveIntensity:
                // 자체 발광(emissive)의 밝기 강도
                //
                // 펄스가 멈춘 순간 마지막 밝기 값이 남아 있을 수 있으므로
                // 강제로 0으로 초기화한다.
                m.material.emissiveIntensity = 0;

                // emissive:
                // 자체 발광 색상
                //
                // 발광 색상도 검정(0x000000)으로 초기화하여
                // 완전히 빛이 없는 상태로 되돌린다.
                m.material.emissive.set(0x000000); // 발광 색상도 초기화 (검정)
            }
        }

        // 펄스 대상 Mesh 목록 참조 제거
        // 이후 startPulse()에서 새로 수집하도록 한다.
        // 메모리 정리 및 이전 상태 제거 목적
        this._pulseMeshes = null; // 펄스 대상 목록 초기화, 메모리 해제
    }

    // 현재 펄스 중인지 확인
    isPulsing() {
        return !!this._pulsing; // !! -> 강제로 true/false 변환, 객체지향(OOP)에서는 상태를 직접 접근하지 말고, 메서드를 통해 접근하게 만드는 것이 굉장히 중요하다.(펄스 상태의 내부 구현은 숨기고, 외부에서는 함수만 통해 안전하게 접근하게 만드는 구조.)
    }

    
    // knobMesh라는 버튼/손잡이 오브젝트를 파란색으로 부드럽게 깜빡이게 만드는 코드.
    update(deltaMs) {                        // update()는 보통 매 프레임마다 실행되는 함수, 만약 60fps라면 1초에 약 60번 실행됨
        if (this._pulsing && this._pulseMeshes) {   //펄스 상태가 켜져 있고, knobMesh가 존재할 때만 실행(지금 반짝여도 되는 상태이고, 반짝일 물체도 있으면 실행)
            const elapsed = (performance.now() - this._pulseStartTime) / 1000;  // (startPulse()가 실행됐던 시간 - 펄스가 시작된 뒤 지난 시간 ) /1000 => 초 단위 즉, (펄스 시작 후 몇 초가 지났는가)
            const intensity = 0.2 + 0.25 * Math.sin(elapsed * Math.PI);  // Math.sim -> 부드럽게 위아래로 흔들어주는 함수 (0.3+0.3 * -1 = 0, 0.3+0.3 * 0 = 0.3, 0.3+0.3 * 1 = 0.6)

            for (const m of this._pulseMeshes) {
                if (!m.material) continue; // 안전장치: material이 없는 경우 건너뛰기

                m.material.emissiveIntensity = intensity; // 계산된 밝기 적용
            }
        }
    }
}
