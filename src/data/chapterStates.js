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
    }
    // Ch.2~9는 챕터 매니저 만들 때 추가
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
