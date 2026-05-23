// src/scenes/steps/thawingSteps.js
// Ch.1 해동 챕터의 스텝 시퀀스.
// (Phase A: 뼈대 검증용 더미. 실제 동작은 Phase C에서 구현)

import gsap from 'gsap';

export const thawingSteps = [
    {
        id: 'test-lift',
        label: '[테스트] Tube 1 떠올랐다 내려오기',
        play: (scene) => {
            const tube = scene.objects.iceBox.getTube('tube1');
            const tl = gsap.timeline();
            tl.to(tube.position, { y: '+=1.2', duration: 0.8, ease: 'power2.out' });
            tl.to(tube.position, { y: '-=1.2', duration: 0.8, ease: 'power2.in' });
            return tl;
        }
    },
    {
        id: 'test-spin',
        label: '[테스트] Tube 2 회전',
        play: (scene) => {
            const tube = scene.objects.iceBox.getTube('tube2');
            const tl = gsap.timeline();
            tl.to(tube.rotation, { y: '+=6.28', duration: 1.2, ease: 'power1.inOut' });
            return tl;
        }
    }
];