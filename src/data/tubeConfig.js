// src/data/tubeConfig.js
// 튜브 5개의 메타데이터 단일 진실 공급원(SSOT)
// 모든 색상/내용물/위치 정보가 여기서만 관리됨

export const TUBE_CONFIG = [
    {
        id: 'tube1',
        name: 'Tube 1 (Competent Cell - 실험군)',
        labelColor: 0xff3366,        // 캡 라벨 색
        liquidColor: 0xe8d8d8,       // 살짝 뿌연 액체 (Competent Cell)
        liquidOpacity: 0.85,
        volume: 25,                  // µL
        temperature: -80,
        isThawed: false,
        // 아이스박스 로컬 좌표 (박스 중심 기준)
        position: { x: -0.8, y: 0.0, z: -0.3 },
        rotation: { x: 0.05, y: 0.1, z: -0.08 }
    },
    {
        id: 'tube2',
        name: 'Tube 2 (Competent Cell - 대조군)',
        labelColor: 0x9933ff,
        liquidColor: 0xe8d8d8,
        liquidOpacity: 0.85,
        volume: 25,
        temperature: -80,
        isThawed: false,
        position: { x: -0.4, y: 0.0, z: 0.25 },
        rotation: { x: -0.06, y: -0.05, z: 0.12 }
    },
    {
        id: 'tube3',
        name: 'Tube 3 (Plasmid DNA #1)',
        labelColor: 0x10b981,
        liquidColor: 0xffffff,       // 완전 투명
        liquidOpacity: 0.25,
        volume: 50,
        temperature: -20,
        isThawed: false,
        position: { x: 0.1, y: 0.0, z: -0.25 },
        rotation: { x: 0.08, y: 0.2, z: 0.05 }
    },
    {
        id: 'tube4',
        name: 'Tube 4 (Plasmid DNA #2)',
        labelColor: 0x06b6d4,
        liquidColor: 0xffffff,
        liquidOpacity: 0.25,
        volume: 50,
        temperature: -20,
        isThawed: false,
        position: { x: 0.5, y: 0.0, z: 0.3 },
        rotation: { x: -0.04, y: 0.1, z: -0.1 }
    },
    {
        id: 'tube5',
        name: 'Tube 5 (SOC Medium - 회복 배지)',
        labelColor: 0xff9900,
        liquidColor: 0xfff4a3,       // 투명 노란색
        liquidOpacity: 0.7,
        volume: 1000,
        temperature: -20,
        isThawed: false,
        position: { x: 0.9, y: 0.0, z: -0.2 },
        rotation: { x: 0.1, y: -0.15, z: 0.07 }
    }
];
