// src/scenes/steps/heatShockSteps.js
// Ch.5 Heat Shock (42℃ 90초) 챕터의 스텝.
//
// 보고서 기준:
//   - 30분 ice incubation 후 heat block으로 옮겨 42℃ 90초 가열
//   - 곧바로 얼음으로 옮겨 2분간 정치
//
// 정확성 포인트: 이동은 "잽싸게" — 온도 변화가 급격해야 형질전환 효율이 높음

import * as THREE from 'three';
import gsap from 'gsap';

// 튜브 원위치 (아이스박스 안)
const TUBE1_HOME = { pos: { x: -0.8, y: 0.75, z: -0.3 }, rot: { x: 0.05, y: 0.1, z: -0.08 } };
const TUBE2_HOME = { pos: { x: -0.4, y: 0.75, z: 0.25 }, rot: { x: -0.06, y: -0.05, z: 0.12 } };

export const heatShockSteps = [
    {
        id: 'move-to-heatblock',
        label: '히팅블록으로 신속히 이동',
        subtitle: '온도 변화가 급격할수록 형질전환 효율이 높습니다',
        play: (scene) => {
            const iceBox = scene.objects.iceBox;
            const heatingBlock = scene.objects.heatingBlock;
            const tube1 = iceBox.getTube('tube1');
            const tube2 = iceBox.getTube('tube2');

            // 히팅블록의 구멍 두 곳을 목표로 (월드 좌표로 변환)
            const hole1Local = heatingBlock.getHolePosition(8);   // 중앙 부근
            const hole2Local = heatingBlock.getHolePosition(9);
            const hole1World = new THREE.Vector3(hole1Local.x, hole1Local.y, hole1Local.z);
            const hole2World = new THREE.Vector3(hole2Local.x, hole2Local.y, hole2Local.z);
            heatingBlock.localToWorld(hole1World);
            heatingBlock.localToWorld(hole2World);

            // 튜브는 iceBox의 자식이므로, 목표 월드 좌표를 iceBox 로컬로 변환
            const hole1Local2 = hole1World.clone();
            const hole2Local2 = hole2World.clone();
            iceBox.worldToLocal(hole1Local2);
            iceBox.worldToLocal(hole2Local2);

            const tl = gsap.timeline();

            // 1) 얼음에서 위로 빠르게 들어올림
            tl.to([tube1.position, tube2.position], {
                y: '+=1.2',
                duration: 0.4, ease: 'power2.out'
            });

            // 2) 히팅블록 구멍 위로 이동 (빠르게)
            tl.to(tube1.position, {
                x: hole1Local2.x, z: hole1Local2.z,
                duration: 0.6, ease: 'power2.inOut'
            }, '<');
            tl.to(tube2.position, {
                x: hole2Local2.x, z: hole2Local2.z,
                duration: 0.6, ease: 'power2.inOut'
            }, '<');

            // 회전 정리 (똑바로)
            tl.to([tube1.rotation, tube2.rotation], {
                x: 0, y: 0, z: 0,
                duration: 0.6, ease: 'power2.inOut'
            }, '<');

            // 3) 구멍에 꽂아 넣음
            tl.to(tube1.position, {
                y: hole1Local2.y + 0.1,
                duration: 0.35, ease: 'power2.in'
            });
            tl.to(tube2.position, {
                y: hole2Local2.y + 0.1,
                duration: 0.35, ease: 'power2.in'
            }, '<');

            return tl;
        }
    },
    {
        id: 'heat-shock-90sec',
        label: '42°C 열충격 (90초)',
        subtitle: '42°C에서 정확히 90초간 가열합니다',
        timer: {
            totalSeconds: 90,
            displayDuration: 5,
            label: 'Heat Shock 42°C'
        },
        play: (scene) => {
            const iceBox = scene.objects.iceBox;
            const tube1 = iceBox.getTube('tube1');
            const tube2 = iceBox.getTube('tube2');

            const tl = gsap.timeline();

            // 가열 표현: 튜브가 살짝 붉게 빛남 (emissive)
            // 튜브 내부의 모든 mesh에 적용
            const heatMeshes = [];
            [tube1, tube2].forEach(t => {
                t.traverse(c => {
                    if (c.isMesh && c.material && 'emissive' in c.material) {
                        heatMeshes.push(c.material);
                    }
                });
            });

            // 서서히 붉어짐
            tl.call(() => {
                heatMeshes.forEach(m => {
                    m.emissive.setHex(0xff3300);
                });
            });
            tl.to(heatMeshes, {
                emissiveIntensity: 0.35,
                duration: 1.2, ease: 'power1.inOut'
            });

            // 유지 (타이머가 도는 동안)
            tl.to({}, { duration: 3.0 });

            // 서서히 식음
            tl.to(heatMeshes, {
                emissiveIntensity: 0,
                duration: 1.3, ease: 'power1.inOut'
            });
            tl.call(() => {
                heatMeshes.forEach(m => {
                    m.emissive.setHex(0x000000);
                });
            });

            return tl;
        }
    },
    {
        id: 'return-to-ice-2min',
        label: '즉시 얼음으로 복귀 + 2분 정치',
        subtitle: '열충격 직후 급속 냉각 — 2분간 얼음 위에서 정치',
        timer: {
            totalSeconds: 120,
            displayDuration: 4,
            label: 'Ice Recovery'
        },
        play: (scene) => {
            const iceBox = scene.objects.iceBox;
            const tube1 = iceBox.getTube('tube1');
            const tube2 = iceBox.getTube('tube2');

            const tl = gsap.timeline();

            // 1) 히팅블록에서 빠르게 뽑아 올림
            tl.to([tube1.position, tube2.position], {
                y: '+=1.0',
                duration: 0.35, ease: 'power2.out'
            });

            // 2) 아이스박스 원위치로 신속 이동
            tl.to(tube1.position, {
                x: TUBE1_HOME.pos.x, z: TUBE1_HOME.pos.z,
                duration: 0.6, ease: 'power2.inOut'
            });
            tl.to(tube2.position, {
                x: TUBE2_HOME.pos.x, z: TUBE2_HOME.pos.z,
                duration: 0.6, ease: 'power2.inOut'
            }, '<');

            // 3) 얼음에 꽂기 + 원래 회전 복원
            tl.to(tube1.position, {
                y: TUBE1_HOME.pos.y,
                duration: 0.4, ease: 'power2.in'
            });
            tl.to(tube1.rotation, {
                x: TUBE1_HOME.rot.x, y: TUBE1_HOME.rot.y, z: TUBE1_HOME.rot.z,
                duration: 0.4, ease: 'power2.inOut'
            }, '<');
            tl.to(tube2.position, {
                y: TUBE2_HOME.pos.y,
                duration: 0.4, ease: 'power2.in'
            }, '<');
            tl.to(tube2.rotation, {
                x: TUBE2_HOME.rot.x, y: TUBE2_HOME.rot.y, z: TUBE2_HOME.rot.z,
                duration: 0.4, ease: 'power2.inOut'
            }, '<');

            // 4) 2분 정치 (타이머가 도는 동안 대기)
            tl.to({}, { duration: 3.0 });

            return tl;
        }
    }
];