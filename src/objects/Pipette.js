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

    /**
     * 팁박스에서 팁을 꺼내 피펫 끝에 장착.
     * @param {TipBox} tipBox - 팁을 꺼낼 박스
     * @returns {boolean} 성공 여부
     */
    // 핵심 구조는 두 개이다.
    // attachTip(tipBox) - 팁 장착
    // detachTip - 팁 제거

    // tipBox는 팁을 꺼낼 대상이다. 즉, 이전에 설명한 takeTip() 메서드를 가진 객체이다.
    attachTip(tipBox) {
        // 이미 팁이 장착되어 있는지 확인
        // 피펫에는 한 번에 팁 하나만 장착할 수 있다.
        // 그래서 이미 팁이 있다면 새 팁을 장착하지 않는다.
        if (this.state.hasTip) {
            console.warn(`[${this.type}] 이미 팁이 장착되어 있습니다. detachTip 먼저 호출하세요.`);
            // "장착 실패"를 의미
            return false;
        }

        // 실제로 팁박스 안의 팁 하나를 꺼낸다.
        // takeTip()은 성공하면 이런 정보를 반환한다.
        /*
        {
            worldPosition: worldPos,
            color: tipColor,
            radius: tipRadius,
            height: tipHeight,
            sourceIndex: index
        }
        */
       // 남은 팁이 없으면 null을 반환한다.
       // 그래서 if (!tipInfo) return false;
       // 는 "팁박스에 남은 팁이 없으면 장착 실패"라는 뜻이다.
        const tipInfo = tipBox.takeTip();
        if (!tipInfo) return false;

        // 새 팁 mesh 생성 (피펫 끝 콘에 씌워지는 형태)
        // 여기서 피펫 끝에 붙일 새 팁 모양을 만든다.
        // CylinderGeometry는 원기둥 또는 원뿔대 모양을 만드는 지오메트리이다.
        // 인자는 대략 이렇게 이해하면 된다.
        /* new THREE.CylinderGeometry(
            윗면 반지름,
            아랫면 반지름,
            높이,
            둘레 분할 수
        )
        */
        const tipGeo = new THREE.CylinderGeometry(
            // 윗부분 반지름이다. 피펫에 가까운 쪽이 더 넓다.
            tipInfo.radius,
            // 아랫부분 반지름이다. 끝부분이 훨씬 좁다.
            // 그래서 모양은 완전한 원기둥이 아니라 아래로 갈수록 뾰족해지는 팁이다.
            tipInfo.radius * 0.2,  // 끝은 더 뾰족
            // 팁의 길이이다.
            tipInfo.height,
            // 원형을 몇 조각으로 나눌지 정한다. 값이 클수록 더 둥글지만 렌더링 비용도 조금 증가한다.
            12
        );
        
        // 팁 material 생성
        const tipMat = new THREE.MeshPhysicalMaterial({
            // 팁박스에서 꺼낸 팁 색상을 그대로 사용한다.
            // 예를 들어 노란 팁이면 노란색, 파란 팁이면 파란색이 된다.
            color: tipInfo.color,
            // 투명 재질을 사용하겠다는 뜻이다.
            transparent: true,
            // 불투명도이다. 1.0이면 완전 불투명, 0.0이면 완전 투명이다.
            // 0.55는 반투명에 가깝다.
            opacity: 0.55,
            // 표면 거칠기이다.
            // 값이 낮을수록 매끈하고 반사가 조금 더 선명하다.
            // 팁 플라스틱 느낌을 내기 위해 낮은 값을 준 것이다.
            roughness: 0.2,
            // 빛이 물체를 통과하는 정도.
            // MeshPhysicalMaterial에서 유리나 투명 플라스틱 같은 느낌을 줄 때 사용한다.
            transmission: 0.3,
            // 투명 재질의 두께감을 설정한다.
            // 즉, 이 재질은 "반투명한 플라스틱 피펫 팁"느낌을 내기 위한 설정이다.
            thickness: 0.02
        });

        // Mesh 생성
        // Geomeyry와 Material을 합쳐서 실제 화면에 보이는 Mesh를 만든다.
        // Geometry = 모양
        // Material = 표면 재질
        // Mesh = 모양 + 재질이 합쳐진 실제 3D 물체
        const tipMesh = new THREE.Mesh(tipGeo, tipMat);
        // 그림자 설정
        // 팁이 그림자를 만들 수 있게 한다.
        tipMesh.castShadow = true;
        // 팁이 다른 물체의 그림자를 받을 수 있게 한다.
        tipMesh.receiveShadow = true;

        // 피펫 끝 콘(tipConeMesh) 아래에 배치
        // tipConeMesh의 로컬 y 위치는 -bodyHeight/2 - 0.18 - tipConeLength/2
        // 팁은 그 아래에 더 길게 내려옴
        // 이 부분이 가장 중요하다.
        // 피펫 객체의 로컬 좌표계에서 y축 아래 방향에 팁을 배치한다.
        // 보통 피펫 몸체가 중앙에 있고, 아래쪽에 tip cone이 있으며, 그 아래에 팁이 붙는다.
        /*
        구조를 그리면 대략 이렇다.
        피펫 몸체
            |
            |
        tip cone
            |
            |
        pipette tip
        */
       // coneY는 피펫의 팁 콘 중심 위치이다.
       // 각 항복을 나누면 -this.spec.bodyHeight / 2
       // 피펫 몸체의 아래쪽 끝 위치이다.
       // 피펫 몸체가 중심을 기준으로 만들어졌다면, 몸체 아래쪽은 -bodyHeight / 2이다.
       // -0.18 몸체와 tip cone 사이의 추가 간격 또는 연결부 길이이다.
       // -this.spec.tipConeLength / 2
       // tip cone의 중심까지 내려가기 위한 거리이다.
       /*
        몸체 중심
        ↓ bodyHeight / 2
        몸체 아래쪽
        ↓ 0.18
        콘 시작 지점
        ↓ tipConeLength / 2
        콘 중심
       */
        const coneY = -this.spec.bodyHeight / 2 - 0.18 - this.spec.tipConeLength / 2;
        // const tipY = coneY - this.spec.tipConeLength / 2 - tipInfo.height / 2 + 0.05;
        // tipY는 새로 장착할 팁의 중심 위치이다.
        // CylinderGeometry는 기본적으로 자기 중심이 원점이다.
        // 즉, 높이가 tipInfo.height인 팁을 만들면:
        // 팁의 위쪽 끝: +height / 2
        // 팁의 중심: 0
        // 팁의 아래쪽 끝: -height / 2
        // 그래서 팁을 콘 아래에 붙이려면 팁의 중심을 적절히 아래로 내려야 한다.
        // coneY
        // tip cone의 중심 위치이다.
        // -this.spec.tipConeLength / 2
        // tip cone의 아래쪽 끝까지 내려간다.
        // tipInfo.height / 2
        // 팁의 중심이 오도록 팁 높이의 절반만큼 더 내려간다.
        // +0.05
        // 팁이 콘과 살짝 겹치게 하는 보정값이다.
        // 이 값이 없으면 팁과 콘 사이에 미세한 틈이 생길 수 있다.
        // 즉, +0.05는 시각적으로 "끼워진 느낌"을 만들기 위한 보정이다.
        const tipY = coneY - this.spec.tipConeLength / 2 - tipInfo.height / 2 + 0.05;
        tipMesh.position.set(0, tipY, 0);

        // 피펫의 자식으로 추가 → 피펫 움직이면 팁도 자동으로 따라감
        // 이 부분이 매우 중요하다.
        // 팁을 씬에 직접 추가하는 것이 아니라, *피펫 객체의 자식*으로 추가한다.
        // 즉 구조가 이렇게 된다.
        /*
        Pipette
        ├─ bodyMesh
        ├─ tipConeMesh
        └─ attachedTip
        */
        // 이렇게 하면 피펫이 움직일 때 팁도 자동으로 따라 움직인다.
        // 예를 들어 피펫을 오른쪽으로 이동하면:
        // pipette.position.x +=1;
        // 자식인 팁도 같이 오른쪽으로 이동한다.
        // 피펫을 회전시켜도 팁도 같이 회전한다.
        this.add(tipMesh);

        // 상태 저장
        // 이 부분은 "피펫에 팁이 장착되었다"는 상태를 저장한다.
        // 현재 장착된 팁 Mesh를 저장한다.
        // 나중에 제거할 때 필요하다.
        this.attachedTip = tipMesh;
        // 팁 정보도 저장한다.
        // 어떤 색상, 어떤 크기, 어느 팁박스 index에서 온 팁인지 추적할 수 있다.
        this.attachedTipInfo = tipInfo;
        // 피펫이 현재 팁을 가지고 있다는 상태값이다.
        // 이 값이 true가 되면 다음 attachTip() 호출은 실패한다.
        this.state.hasTip = true;

        // 모든 과정이 성공하면 true를 반환한다.
        // 호출하는 쪽에서는 이렇게 쓸 수 있다.
        /*
        if (pipette.attachTip(tipBox)){
            console.log('팁 장착 성공');
        }
        */
        return true;
    }

    /**
     * 장착된 팁을 제거. 씬에서 완전히 사라짐 (폐기 처리).
     * @returns {boolean} 성공 여부
     */
    // 이 함수는 피펫에 장착된 팁을 제거한다.
    // 즉, 팁을 다시 탑박스로 되돌리는 게 아니라 버리는 처리이다.
    detachTip() {
        // 팁이 없는데 제거하려고 하면 경고를 띄운다.
        // 조건은 두 가지를 확인한다.
        // !this.state.hasTip(상태상 팁이 없다고 되어 있는 경우)
        // !this.attachedTip(실제 Mesh 참조가 없는 경우)
        // 둘 중 하나라도 문제가 있으면 제거할 팁이 없다고 판단한다.
        // 그리고: return false;로 실패를 반환한다.
        if (!this.state.hasTip || !this.attachedTip) {
            console.warn(`[${this.type}] 장착된 팁이 없습니다.`);
            return false;
        }

        if (this.attachedTipLiquid) this.dispense(); // 팁 안에 액체가 있으면 먼저 제거한다.

        // 부모(this)에서 제거 + geometry/material 정리
        // 피펫에서 팁 제거
        // this는 피펫 객체이다.
        // 앞에서 팁을 추가할 때: this.add(tipMesh); 로 피펫의 자식으로 추가했다.
        // 따라서 제거할 때는: this.remove(this.attachedTip); 을 사용한다.
        // 이렇게 하면 장착된 팁이 피펫의 자식 목록에 빠지고, 화면에서도 사라진다.
        this.remove(this.attachedTip);
        // Three.js에서는 Mesh를 씬에서 제거했다고 해서 GPU 메모리가 자동으로 완전히 정리되지 않는다.
        // 특히 geometry와 material은 GPU 리소스를 가지고 있을 수 있다.
        // 그래서 더 이상 사용하지 않는다면 직접 정리하는 것이 좋다.
        // 팁의 모양 데이터 제거.
        this.attachedTip.geometry.dispose();
        //팁의 재질 데이터 제거.
        // 이 과정은 메모리 누수를 막는 데 중요하다.
        this.attachedTip.material.dispose();

        // 내부 상태 초기화
        // 팁을 제거했으므로 관련 정보를 비운다.
        // 현재 장착된 팁 Mesh가 없다는 뜻이다.
        this.attachedTip = null;
        // 현재 장착된 팁 정보도 없다는 뜻이다.
        this.attachedTipInfo = null;
        // 피펫 상태를 "팁 없음"으로 바꾼다.
        // 이제 다시 attachTip()을 호출할 수 있다.
        this.state.hasTip = false;

        // 제거 성공 반환
        // 정상적으로 제거되면 true를 반환한다.
        // 예를 들어: if (pipette.detachTip()) {console.log('팁 제거 성공');}
        // 처럼 사용할 수 있다.
        return true;
    }

    /**
     * 팁 안에 액체를 표시. 흡입 동작의 결과물.
     * 팁이 장착되어 있어야 호출 가능.
     * @param {number} color - 액체 색상 (hex)
     * @param {number} microliters - 부피
     */
    // AND 연산자. 팁이 없거나 팁이 장착되어 있지 않으면
    // "팁이 없어 흡입 불가" 출력.
    aspirate(color, microliters) {
        if (!this.state.hasTip || !this.attachedTip) {
            console.warn(`[${this.type}] 팁이 없어 흡입 불가`);
            return false;
        }

        // 팁에 액체가 있다면 경고 출력(중첩 흡입 방지)
        if (this.attachedTipLiquid) {
            console.warn(`[${this.type}] 팁에 이미 액체 있음. dispense 먼저.`);
            return false;
        }

        // 음수가 되어 오류가 될 수 있으므로 방지한다(clamp).
        const targetVolume = Math.max(0, microliters);

        if(targetVolume <= 0) {
            console.warn(`[${this.type}] 흡입량이 0 이하입니다.`);
            return false;
        }

        // 팁 형태에 맞춰 안쪽에 작은 실린더 형태로 액체 mesh 생성
        // 현재 장착된 팁의 정보를 가져오고,
        // 액체 반지름을 팁 반지름보다 조금 작게 만든다.
        // 즉, 팁 반지름 > 액체 반지름
        const tipInfo = this.attachedTipInfo;
        const liqRadiusTop = tipInfo.radius * 0.8;
        // 부피가 적으니 팁 길이의 일부만 채움 (시각적 비율)
        // microliters가 100이어도 비율이 2가 되지 않게 막는다.
        // 즉 최대값을 1로 제한한다.
        const liqRadiusBottom = tipInfo.radius * 0.25; // 팁 끝부분은 더 좁으므로 액체도 더 좁게 표현한다.
        const fillRatio = Math.min(1, microliters / 50);  // 50µL면 가득
        // 액체 원기둥의 높이를 계산한다.
        // 중요한 점은 액체가 팁 전체 높이를 채우는 것이 아니라
        // 팁 길이의 최대 40%까지만 차도록 만든 것이다.
        const liqHeight = Math.max(0.08, tipInfo.height * 0.6 * fillRatio);

        // 액체 모양을 만든다.
        // 여기서 위쪽 반지름은 liqRadius, 아래쪽 반지름은 liqRadius * 0.5로
        // 완전한 원기둥이 아니라, 아래쪽이 조금 좁은 형태이다.
        const liqGeo = new THREE.CylinderGeometry(liqRadiusTop, liqRadiusBottom, liqHeight, 12);
        
        // 액체 재질을 만든다.
        // transparent: ture와 opacity: 0.85 때문에 약간 투명하게 보인다.
        const liqMat = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.85,
            roughness: 0.2
        });

        // Geometry와 Material을 합쳐서 실제 화면에 보이는 Mesh를 만든다.
        const liqMesh = new THREE.Mesh(liqGeo, liqMat);
        liqMesh.castShadow = true;

        // 팁 안쪽 아래에 위치 (팁이 아래로 뾰족하므로 아래쪽에 액체가 모임)
        liqMesh.position.copy(this.attachedTip.position);

        // 액체 바닥이 팁 끝에 거의 닿도록 배치 (액체는 중력으로 아래에 모임)
        // 팁 바닥 = tip.position.y - tipInfo.height / 2
        // 액체 바닥 = liqMesh.position.y - liqHeight / 2
        // 이 둘이 같아야 액체가 팁 끝에 닿는다.
        const tipBottomLocal = -tipInfo.height / 2;

        // 팁의 중심에서 액체의 중심까지 내려가는 거리 계산
        liqMesh.position.y = this.attachedTip.position.y + tipBottomLocal + liqHeight / 2 + 0.01;

        // 피펫 객체 안에 액체 Mesh를 추가한다.
        this.add(liqMesh);

        // 현재 액체 상태를 저장한다.
        this.attachedTipLiquid = liqMesh;
        this.state.aspiratedVolume = microliters;
        this.state.aspiratedColor = color;
        return true;
    }

    /**
     * 팁 안 액체 제거 (주입 완료 등).
     */
    // 액체가 없으면 제거할 것이 없으므로 실패 처리한다.
    dispense() {
        if (!this.attachedTipLiquid) return false;

        // 화면/객체 계층에서 액체 Mesh를 제거한다.
        this.remove(this.attachedTipLiquid);

        // 메모리에서 Geometry와 Material을 정리한다.
        // Three.js에서는 Mesh를 씬에서 제거해도 GPU 메모리가 자동으로 완전히 정리되지 않는다.
        // 특히 geometry와 material은 GPU 리소스를 가지고 있을 수 있다.
        // 그래서 더 이상 사용하지 않는다면 직접 정리하는 것이 좋다.
        this.attachedTipLiquid.geometry.dispose();
        this.attachedTipLiquid.material.dispose();

        // 액체 상태 초기화
        this.attachedTipLiquid = null;
        this.state.aspiratedVolume = 0;
        this.state.aspiratedColor = null;
        return true;
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
