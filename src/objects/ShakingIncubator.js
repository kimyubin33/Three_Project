// src/objects/ShakingIncubator.js
// 진탕 배양기 (Shaking Incubator).
//
// 구조:
//   - 본체 박스 (하우징)
//   - 앞면 문 (경첩으로 열림/닫힘, 유리창 있음)
//   - 내부 진탕 플랫폼 (튜브가 올라가는 자리, orbital 진동)
//   - 제어 패널 디스플레이 (온도 / RPM / 시간)

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const INC = {
    bodyW: 2.6,
    bodyH: 2.2,
    bodyD: 2.0,
    wallT: 0.12,
    doorH: 1.5,
    platformW: 2.0,
    platformD: 1.5,
    platformY: 0.75
};

export default class ShakingIncubator extends THREE.Group {
    constructor() {
        super();
        this.name = 'shakingIncubator';
        this.userData.tubeName = 'Shaking Incubator (진탕 배양기)';
        this.userData.isInteractive = true;

        this.isShaking = false;
        this._shakeTime = 0;

        this._buildBody();
        this._buildPlatform();
        this._buildDoor();
        this._buildPanel();

        this.traverse((c) => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
            }
        });
    }

    _buildBody() {
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xe8e8ea,
            roughness: 0.5,
            metalness: 0.2
        });
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x9aa0a8,
            roughness: 0.7,
            metalness: 0.3,
            side: THREE.DoubleSide
        });

        const { bodyW, bodyH, bodyD, wallT } = INC;

        // 바닥
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(bodyW, wallT, bodyD), bodyMat
        );
        floor.position.y = wallT / 2;
        this.add(floor);

        // 좌우 벽
        for (const xSign of [1, -1]) {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(wallT, bodyH, bodyD), bodyMat
            );
            wall.position.set(xSign * (bodyW / 2 - wallT / 2), bodyH / 2, 0);
            this.add(wall);
        }

        // 뒷벽
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(bodyW, bodyH, wallT), bodyMat
        );
        back.position.set(0, bodyH / 2, -(bodyD / 2 - wallT / 2));
        this.add(back);

        // 천장
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(bodyW, wallT, bodyD), bodyMat
        );
        top.position.y = bodyH - wallT / 2;
        this.add(top);

        // 내부 라이닝 (안쪽이 금속처럼 보이게)
        const innerBack = new THREE.Mesh(
            new THREE.PlaneGeometry(bodyW - wallT * 2, bodyH - wallT * 2), innerMat
        );
        innerBack.position.set(0, bodyH / 2, -(bodyD / 2 - wallT - 0.005));
        this.add(innerBack);
    }

    _buildPlatform() {
        // 진탕 플랫폼 (튜브가 올라가는 자리)
        const platMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.4,
            metalness: 0.7
        });
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(INC.platformW, 0.08, INC.platformD), platMat
        );
        platform.position.y = INC.platformY;
        this.add(platform);
        this.platform = platform;   // 진동 애니메이션 대상

        // 플랫폼 위 튜브 홀더 (작은 클램프들)
        const clampMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.5,
            metalness: 0.6
        });
        const clampGeo = new THREE.TorusGeometry(0.09, 0.02, 8, 16);

        // 튜브 자리 4곳
        this.slotPositions = [];
        const slotXs = [-0.5, -0.15, 0.2, 0.55];
        for (const x of slotXs) {
            const clamp = new THREE.Mesh(clampGeo, clampMat);
            clamp.rotation.x = Math.PI / 2;
            clamp.position.set(x, INC.platformY + 0.08, 0);
            this.add(clamp);
            this.slotPositions.push({ x, y: INC.platformY + 0.1, z: 0 });
        }
    }

    _buildDoor() {
        // 문 그룹 — 경첩을 상단 앞 모서리에 두고 위로 들어올리는 방식
        this.doorGroup = new THREE.Group();
        // 경첩 위치: 문 상단 (앞면 위쪽)
        const hingeY = INC.doorH + 0.4;
        this.doorGroup.position.set(0, hingeY, INC.bodyD / 2);
        this.add(this.doorGroup);

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xdcdce0,
            roughness: 0.45,
            metalness: 0.25
        });
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xaaccdd,
            transparent: true,
            opacity: 0.25,
            roughness: 0.05,
            transmission: 0.85,
            thickness: 0.02,
            metalness: 0
        });

        // 문 프레임 — 경첩(원점)에서 아래로 매달린 형태
        const doorW = INC.bodyW;
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(doorW, INC.doorH, 0.06), frameMat
        );
        frame.position.set(0, -INC.doorH / 2, 0);
        this.doorGroup.add(frame);

        // 유리창
        const glass = new THREE.Mesh(
            new THREE.BoxGeometry(doorW * 0.75, INC.doorH * 0.7, 0.02), glassMat
        );
        glass.position.set(0, -INC.doorH / 2, 0.02);
        this.doorGroup.add(glass);

        // 손잡이 — 문 아래쪽 (위로 들어올리기 좋게)
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x555a63, roughness: 0.4, metalness: 0.8
        });
        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.06, 0.06), handleMat
        );
        handle.position.set(0, -INC.doorH + 0.18, 0.06);
        this.doorGroup.add(handle);
    }

    _buildPanel() {
        // 상단 제어 패널
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x2a2e37, roughness: 0.5, metalness: 0.2
        });
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(INC.bodyW * 0.85, 0.35, 0.05), panelMat
        );
        panel.position.set(0, INC.bodyH - 0.25, INC.bodyD / 2 + 0.03);
        this.add(panel);

        // 디스플레이 (CSS2D)
        const div = document.createElement('div');
        div.className = 'incubator-display';
        div.innerHTML = `
            <div class="ic-row"><span class="ic-key">TEMP</span><span class="ic-val" data-k="temp">--</span></div>
            <div class="ic-row"><span class="ic-key">RPM</span><span class="ic-val" data-k="rpm">--</span></div>
            <div class="ic-row"><span class="ic-key">TIME</span><span class="ic-val" data-k="time">--</span></div>
        `;
        const label = new CSS2DObject(div);
        label.position.set(0, INC.bodyH - 0.25, INC.bodyD / 2 + 0.08);
        this.add(label);
        this.displayLabel = div;
    }

    /**
     * 제어 패널 값 설정
     */
    setSettings({ temp, rpm, timeText }) {
        if (!this.displayLabel) return;
        const set = (k, v) => {
            const el = this.displayLabel.querySelector(`[data-k="${k}"]`);
            if (el && v !== undefined) el.textContent = v;
        };
        set('temp', temp !== undefined ? `${temp}°C` : undefined);
        set('rpm', rpm !== undefined ? `${rpm}` : undefined);
        set('time', timeText);
    }

    /**
     * 문 열기/닫기 — GSAP에서 doorGroup.rotation.y를 트윈하면 됨
     * 열림: -Math.PI * 0.6 (바깥쪽으로)
     */
    getDoorGroup() {
        return this.doorGroup;
    }

    /**
     * 진탕 시작/정지
     */
    startShaking() { this.isShaking = true; }
    stopShaking() {
        this.isShaking = false;
        if (this.platform) this.platform.position.x = 0;
        if (this.platform) this.platform.position.z = 0;
    }

    /**
     * 슬롯 위치 (로컬 좌표)
     */
    getSlotPosition(index) {
        return this.slotPositions[index] || this.slotPositions[0];
    }

    setHighlight(on) { /* 필요시 구현 */ }

    update(deltaMs) {
        if (this.isShaking && this.platform) {
            // orbital shaking: 작은 원을 그리며 진동
            this._shakeTime += deltaMs / 1000;
            const r = 0.12;    // 진폭 확대 (0.04 → 0.12)
            const speed = 10;
            this.platform.position.x = Math.cos(this._shakeTime * speed) * r;
            this.platform.position.z = Math.sin(this._shakeTime * speed) * r;
        }
    }
}