// src/objects/MicroTube.js
// 1.5ml 에펜튜브 모델. THREE.Group을 상속하여 scene.add()로 바로 사용 가능.
//
// 구조 (위→아래):
//   - 뚜껑 (lid)
//   - 캡 라벨 띠 (colored band)
//   - 본체 원통 (body)
//   - 원뿔 끝 (cone tip)
// 내부:
//   - 액체 (liquid) — 본체+원뿔 부분에 차있는 형태
//
// 사용 예:
//   const tube = new MicroTube(TUBE_CONFIG[0]);
//   tube.position.set(x, y, z);
//   scene.add(tube);

import * as THREE from 'three';

export default class MicroTube extends THREE.Group {
    constructor(config) {
        super();

        this.config = config;
        this.name = config.id;
        this.userData.tubeName = config.name;
        this.userData.isInteractive = true;  // Raycaster 대상으로 표시

        this._buildPlastic();
        this._buildLiquid();
        this._buildLabelBand();
        this._buildLid();

        // 그림자 일괄 활성화
        this.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    _buildPlastic() {
        // 반투명 플라스틱 재질 (튜브 본체와 원뿔 공통)
        const plasticMat = new THREE.MeshPhysicalMaterial({
            color: 0xf5f5f5,
            transparent: true,
            opacity: 0.45,
            roughness: 0.15,
            metalness: 0.0,
            transmission: 0.5,        // 빛이 통과하는 느낌
            thickness: 0.05,
            ior: 1.45                 // 플라스틱 굴절률 근사
        });

        // 본체 원통 (위→아래 0.25 길이)
        const bodyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 24, 1, true);
        const body = new THREE.Mesh(bodyGeo, plasticMat);
        body.position.y = 0.0;  // 그룹 중심
        this.add(body);

        // 원뿔 끝 (아래로 뾰족)
        const coneGeo = new THREE.ConeGeometry(0.06, 0.12, 24, 1, true);
        coneGeo.rotateX(Math.PI);  // 뾰족한 부분이 아래로
        const cone = new THREE.Mesh(coneGeo, plasticMat);
        cone.position.y = -0.185;
        this.add(cone);

        // 본체 안쪽이 보이도록 양면 렌더
        plasticMat.side = THREE.DoubleSide;
    }

    _buildLiquid() {
        // 액체는 원뿔 부분 + 본체 아래쪽 일부에 차있음
        const liquidMat = new THREE.MeshStandardMaterial({
            color: this.config.liquidColor,
            transparent: true,
            opacity: this.config.liquidOpacity,
            roughness: 0.1,
            metalness: 0.0
        });

        // 원뿔 부분 액체 (살짝 안쪽으로)
        const liqConeGeo = new THREE.ConeGeometry(0.055, 0.115, 20);
        liqConeGeo.rotateX(Math.PI);
        const liqCone = new THREE.Mesh(liqConeGeo, liquidMat);
        liqCone.position.y = -0.183;
        this.add(liqCone);

        // 본체 아래쪽 액체 (높이는 volume에 비례, 단순화)
        const liquidHeight = Math.min(0.08, 0.02 + this.config.volume / 1500);
        const liqBodyGeo = new THREE.CylinderGeometry(0.055, 0.055, liquidHeight, 20);
        const liqBody = new THREE.Mesh(liqBodyGeo, liquidMat);
        liqBody.position.y = -0.06 - liquidHeight / 2 + 0.04;
        this.add(liqBody);

        this.liquidMesh = liqBody;  // 나중에 액체량 변경할 때 참조용
    }

    _buildLabelBand() {
        // 본체 상단에 둘러진 색 띠 (튜브 식별용)
        const bandGeo = new THREE.CylinderGeometry(0.0625, 0.0625, 0.04, 24);
        const bandMat = new THREE.MeshStandardMaterial({
            color: this.config.labelColor,
            roughness: 0.6,
            metalness: 0.1
        });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = 0.105;
        this.add(band);
    }

    _buildLid() {
        // 뚜껑 (아이스박스에 묻혔을 때 이 부분만 노출됨)
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0xf8f8f8,
            roughness: 0.35,
            metalness: 0.05
        });

        const lidGeo = new THREE.CylinderGeometry(0.072, 0.07, 0.045, 24);
        const lid = new THREE.Mesh(lidGeo, lidMat);
        lid.position.y = 0.148;
        this.add(lid);

        // 뚜껑 위 마커 글씨 자국 (작은 평면, 보라색)
        // 실제 텍스트는 나중에 CSS2DRenderer로 처리 예정
        const markerGeo = new THREE.CircleGeometry(0.04, 16);
        const markerMat = new THREE.MeshBasicMaterial({
            color: 0x4a2c8f,
            transparent: true,
            opacity: 0.65
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.y = 0.171;
        this.add(marker);

        this.lidMesh = lid;
    }

    /**
     * 외부에서 hover/선택 시 시각 피드백
     */
    setHighlight(on) {
        if (!this.lidMesh) return;
        this.lidMesh.material.emissive = new THREE.Color(on ? 0x3b82f6 : 0x000000);
        this.lidMesh.material.emissiveIntensity = on ? 0.4 : 0;
    }

    /**
     * 매 프레임 업데이트 훅 (현재는 비어있지만 해동 애니메이션 등 확장 지점)
     */
    update(deltaMs) {
        // 향후 확장: 해동 진행도에 따라 액체 색/투명도 변경
    }
}
