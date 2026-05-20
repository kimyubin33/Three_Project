// src/data/tubeConfig.js
// 튜브 5개의 메타데이터 단일 진실 공급원(SSOT)
//
// 필드 설명:
//   - id: 내부 식별자 (씬 객체 이름)
//   - name: UI 표시명 (전체 이름)
//   - shortName: 사이드바용 짧은 이름
//   - role: 실험에서의 역할 설명
//   - labelColor: 캡 띠 색 (3D)
//   - liquidColor / liquidOpacity: 액체 시각화 (3D)
//   - volume: µL
//   - storageTemp: 표준 보관 온도 (°C)
//   - storageLabel: 사이드바 우측 표시용 라벨
//   - position / rotation: 아이스박스 내 배치
//
// 상태(state)는 별도 모듈(tubeState.js)에서 관리. config는 불변(immutable) 데이터.

export const TUBE_CONFIG = [
    {
        id: 'tube1',
        name: 'Tube 1 (Competent Cell - 실험군)',
        shortName: 'Tube 1 (Comp. Cell A)',
        role: '실험군 대장균',
        labelColor: 0xff3366,
        liquidColor: 0xe8d8d8,
        liquidOpacity: 0.85,
        volume: 25,
        storageTemp: -80,
        storageLabel: '-80°C 냉동',
        position: { x: -0.8, y: 0.0, z: -0.3 },
        rotation: { x: 0.05, y: 0.1, z: -0.08 }
    },
    {
        id: 'tube2',
        name: 'Tube 2 (Competent Cell - 대조군)',
        shortName: 'Tube 2 (Comp. Cell B)',
        role: '대조군 대장균',
        labelColor: 0x9933ff,
        liquidColor: 0xe8d8d8,
        liquidOpacity: 0.85,
        volume: 25,
        storageTemp: -80,
        storageLabel: '-80°C 냉동',
        position: { x: -0.4, y: 0.0, z: 0.25 },
        rotation: { x: -0.06, y: -0.05, z: 0.12 }
    },
    {
        id: 'tube3',
        name: 'Tube 3 (Plasmid DNA #1)',
        shortName: 'Tube 3 (Plasmid #1)',
        role: '실험군 주입용 플라스미드',
        labelColor: 0x10b981,
        liquidColor: 0xffffff,
        liquidOpacity: 0.25,
        volume: 50,
        storageTemp: -20,
        storageLabel: '-20°C 냉동',
        position: { x: 0.1, y: 0.0, z: -0.25 },
        rotation: { x: 0.08, y: 0.2, z: 0.05 }
    },
    {
        id: 'tube4',
        name: 'Tube 4 (Plasmid DNA #2)',
        shortName: 'Tube 4 (Plasmid #2)',
        role: '대조군 주입용 플라스미드',
        labelColor: 0x06b6d4,
        liquidColor: 0xffffff,
        liquidOpacity: 0.25,
        volume: 50,
        storageTemp: -20,
        storageLabel: '-20°C 냉동',
        position: { x: 0.5, y: 0.0, z: 0.3 },
        rotation: { x: -0.04, y: 0.1, z: -0.1 }
    },
    {
        id: 'tube5',
        name: 'Tube 5 (SOC Medium - 회복 배지)',
        shortName: 'Tube 5 (SOC Medium)',
        role: '열충격 후 회복용 영양액',
        labelColor: 0xff9900,
        liquidColor: 0xfff4a3,
        liquidOpacity: 0.7,
        volume: 1000,
        storageTemp: -20,
        storageLabel: '-20°C 냉동',
        position: { x: 0.9, y: 0.0, z: -0.2 },
        rotation: { x: 0.1, y: -0.15, z: 0.07 }
    }
];

// CSS rgb 문자열로 변환 (3D color hex → 사이드바 dot 색)
export function hexToCss(hexNum) {
    const r = (hexNum >> 16) & 0xff;
    const g = (hexNum >> 8) & 0xff;
    const b = hexNum & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
}