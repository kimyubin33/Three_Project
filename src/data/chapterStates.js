// src/data/chapterStates.js
// 각 챕터에서 튜브들이 어떤 상태/온도/표시 라벨을 가지는지 정의.
// 사이드바와 다른 UI들이 이 데이터를 보고 자동으로 갱신됨.
//
// 챕터별 시점 정의는 시퀀스/액티비티 다이어그램과 1:1 매핑.

import { TUBE_CONFIG } from './tubeConfig.js';

// 챕터 메타데이터
export const CHAPTERS = [
    {
        id: 0,
        name: 'pre-thawing',
        title: 'Ch.0 보관 상태',
        description: '디프프리저/냉동고에서 막 꺼낸 직후. 각 시료는 원래 보관 온도를 유지.',
        // 튜브별 상태 오버라이드 (없으면 기본값 = config의 storageLabel/storageTemp)
        implemented: true,
        tubeOverrides: null
    },
    {
        id: 1,
        name: 'thawing',
        title: 'Ch.1 해동 단계',
        description: '얼음 위에서 시료를 천천히 해동 중. Competent Cell은 손에 쥐고 해동.',
        tubeOverrides: {
            tube1: { label: '해동 중 (0°C)', status: 'thawing' },
            tube2: { label: '해동 중 (0°C)', status: 'thawing' },
            tube3: { label: '해동 중 (0°C)', status: 'thawing' },
            tube4: { label: '해동 중 (0°C)', status: 'thawing' },
            tube5: { label: '해동 중 (0°C)', status: 'thawing' }
        }
    },
    {
        id: 2,
        name: 'p200-dial',
        title: 'Ch.2 P200 다이얼 설정',
        description: 'P200 피펫의 다이얼을 050(=50 µL)으로 맞춥니다.',
        implemented: false,
        target: { pipetteType: 'p200', volume: 50 }
    },
    {
        id: 3,
        name: 'plasmid-injection',
        title: 'Ch.3 Plasmid DNA 주입',
        description: '5 µL 플라스미드를 각 Competent Cell에 첨가하고 Tapping으로 혼합.',
        implemented: false
    },
    {
        id: 4,
        name: 'ice-incubation',
        title: 'Ch.4 Ice Incubation (30분)',
        description: '얼음에 꽂아 30분간 반응시킵니다.',
        implemented: false
    },
    {
        id: 5,
        name: 'heat-shock',
        title: 'Ch.5 Heat Shock (42°C, 45초)',
        description: '히팅 블록에서 90초간 열충격 후 즉시 얼음으로 복귀.',
        implemented: false
    },
    {
        id: 6,
        name: 'p1000-soc',
        title: 'Ch.6 P1000 + SOC 첨가',
        description: 'P1000 다이얼을 050으로 맞추고 SOC 배지 500 µL 첨가.',
        implemented: false,
        target: { pipetteType: 'p1000', volume: 500 }
    },
    {
        id: 7,
        name: 'shaking',
        title: 'Ch.7 Shaking Incubation',
        description: '라벨링 → 분주 → 스프레더 도말 → 파라필름 밀봉.',
        implemented: false
    },
    {
        id: 9,
        name: 'result',
        title: 'Ch.9 Overnight & Result',
        description: '37°C overnight 배양 후 콜로니 비교.',
        implemented: false
    }
];

/**
 * 챕터 ID에 따른 튜브 표시 정보 계산.
 * 사이드바가 호출하는 헬퍼.
 *
 * @returns 각 튜브에 대해 { id, shortName, role, dotColor(hex), label, status }
 */
export function getTubeDisplayForChapter(chapterId) {
    const chapter = CHAPTERS.find(c => c.id === chapterId) || CHAPTERS[0];
    const overrides = chapter.tubeOverrides || {};

    return TUBE_CONFIG.map(cfg => {
        const ov = overrides[cfg.id] || {};
        return {
            id: cfg.id,
            shortName: cfg.shortName,
            role: cfg.role,
            dotColor: cfg.labelColor,
            label: ov.label || cfg.storageLabel,
            status: ov.status || 'stored'
        };
    });
}
