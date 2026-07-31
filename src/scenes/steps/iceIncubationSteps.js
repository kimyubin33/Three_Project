// src/scenes/steps/iceIncubationSteps.js
// Ch.4 Ice Incubation (30분) 챕터의 스텝.
//
// 보고서 기준: 형질전환 반응을 위해 얼음 위에서 30분간 반응.
// Tube1, Tube2는 Ch.3 마지막에 이미 아이스박스로 복귀한 상태.

import gsap from 'gsap';

export const iceIncubationSteps = [
    {
        id: 'ice-incubation-30min',
        label: '얼음 위 30분 반응',
        subtitle: '형질전환 반응을 위해 얼음 위에서 30분간 정치합니다',
        // 타이머 설정 (StepController가 읽어서 TimerDisplay에 전달)
        timer: {
            totalSeconds: 1800,       // 실제 30분
            displayDuration: 5,       // 화면에선 5초로 압축
            label: 'Ice Incubation'
        },
        play: (scene) => {
            const tl = gsap.timeline();
            // 시각적 변화 없이 시간만 흐름 (타이머 UI가 진행 표시)
            tl.to({}, { duration: 5.5 });
            return tl;
        }
    }
];