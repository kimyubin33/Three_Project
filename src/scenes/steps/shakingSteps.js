// src/scenes/steps/shakingSteps.js
// Ch.7 Shaking Incubation 챕터의 스텝.
//
// 보고서 기준: 37℃, 250 rpm, 1시간 진탕 배양으로 세포 회복

import * as THREE from 'three';
import gsap from 'gsap';

const TUBE1_HOME = { pos: { x: -0.8, y: 0.75, z: -0.3 }, rot: { x: 0.05, y: 0.1, z: -0.08 } };
const TUBE2_HOME = { pos: { x: -0.4, y: 0.75, z: 0.25 }, rot: { x: -0.06, y: -0.05, z: 0.12 } };

export const shakingSteps = [
    {
        id: 'move-to-incubator',
        label: '배양기로 이동 + 문 열기',
        subtitle: '진탕 배양기에 튜브를 넣습니다',
        play: (scene) => {
            const iceBox = scene.objects.iceBox;
            const incubator = scene.objects.shakingIncubator;
            const tube1 = iceBox.getTube('tube1');
            const tube2 = iceBox.getTube('tube2');

            // 인큐베이터 슬롯 위치를 아이스박스 로컬 좌표로 변환
            const slot1 = incubator.getSlotPosition(1);
            const slot2 = incubator.getSlotPosition(2);
            const slot1World = new THREE.Vector3(slot1.x, slot1.y, slot1.z);
            const slot2World = new THREE.Vector3(slot2.x, slot2.y, slot2.z);
            incubator.localToWorld(slot1World);
            incubator.localToWorld(slot2World);
            const slot1Local = slot1World.clone(); iceBox.worldToLocal(slot1Local);
            const slot2Local = slot2World.clone(); iceBox.worldToLocal(slot2Local);

            const tl = gsap.timeline();

            // 1) 문 열기 (위로 들어올림)
            tl.to(incubator.getDoorGroup().rotation, {
                x: -Math.PI * 0.5,
                duration: 0.8, ease: 'power2.inOut'
            });

            // 2) 튜브 들어올림
            tl.to([tube1.position, tube2.position], {
                y: '+=1.5',
                duration: 0.6, ease: 'power2.out'
            });
            tl.to([tube1.rotation, tube2.rotation], {
                x: 0, y: 0, z: 0,
                duration: 0.6, ease: 'power2.inOut'
            }, '<');

            // 3) 인큐베이터로 이동
            tl.to(tube1.position, {
                x: slot1Local.x, y: slot1Local.y + 1.0, z: slot1Local.z,
                duration: 1.0, ease: 'power2.inOut'
            });
            tl.to(tube2.position, {
                x: slot2Local.x, y: slot2Local.y + 1.0, z: slot2Local.z,
                duration: 1.0, ease: 'power2.inOut'
            }, '<');

            // 4) 슬롯에 내려놓기
            tl.to(tube1.position, {
                y: slot1Local.y,
                duration: 0.4, ease: 'power2.in'
            });
            tl.to(tube2.position, {
                y: slot2Local.y,
                duration: 0.4, ease: 'power2.in'
            }, '<');

            // 5) 문 닫기
            tl.to(incubator.getDoorGroup().rotation, {
                x: 0,
                duration: 0.8, ease: 'power2.inOut'
            });

            return tl;
        }
    },
    {
        id: 'set-incubator',
        label: '배양 조건 설정',
        subtitle: '37°C · 250 rpm · 1시간으로 설정합니다',
        play: (scene) => {
            const incubator = scene.objects.shakingIncubator;

            const tl = gsap.timeline();

            // 디스플레이에 값이 하나씩 뜨는 연출
            tl.call(() => incubator.setSettings({ temp: 37 }));
            tl.to({}, { duration: 0.6 });
            tl.call(() => incubator.setSettings({ rpm: 250 }));
            tl.to({}, { duration: 0.6 });
            tl.call(() => incubator.setSettings({ timeText: '1:00:00' }));
            tl.to({}, { duration: 0.8 });

            return tl;
        }
    },
    {
        id: 'shaking-1hour',
        label: '진탕 배양 (1시간)',
        subtitle: '세포가 회복되며 항생제 내성 단백질을 발현합니다',
        timer: {
            totalSeconds: 3600,
            displayDuration: 6,
            label: 'Shaking 37°C'
        },
        play: (scene) => {
            const incubator = scene.objects.shakingIncubator;
            const iceBox = scene.objects.iceBox;
            const tube1 = iceBox.getTube('tube1');
            const tube2 = iceBox.getTube('tube2');

            // 진탕 시작 시점의 튜브 위치 기억 (진동 기준점)
            const base1 = tube1.position.clone();
            const base2 = tube2.position.clone();

            const tl = gsap.timeline();

            tl.call(() => incubator.startShaking());

            // 튜브를 플랫폼과 같은 궤도로 흔들기
            // GSAP로 원운동을 만들려면 각도를 트윈하고 onUpdate에서 좌표 계산
            const orbit = { angle: 0 };
            tl.to(orbit, {
                angle: Math.PI * 2 * 10,   // 10바퀴
                duration: 6.5,
                ease: 'none',
                onUpdate: () => {
                    const r = 0.12;
                    const dx = Math.cos(orbit.angle) * r;
                    const dz = Math.sin(orbit.angle) * r;
                    tube1.position.x = base1.x + dx;
                    tube1.position.z = base1.z + dz;
                    tube2.position.x = base2.x + dx;
                    tube2.position.z = base2.z + dz;
                }
            });

            // 원위치 정리 + 진탕 정지
            tl.call(() => {
                incubator.stopShaking();
                tube1.position.copy(base1);
                tube2.position.copy(base2);
            });
            tl.to({}, { duration: 0.4 });

            return tl;
        }
    },
    {
        id: 'retrieve-from-incubator',
        label: '배양 완료 — 튜브 회수',
        subtitle: '회복된 배양액을 꺼냅니다',
        play: (scene) => {
            const iceBox = scene.objects.iceBox;
            const incubator = scene.objects.shakingIncubator;
            const tube1 = iceBox.getTube('tube1');
            const tube2 = iceBox.getTube('tube2');

            const tl = gsap.timeline();

            // 1) 문 열기
            tl.to(incubator.getDoorGroup().rotation, {
                x: -Math.PI * 0.5,
                duration: 0.8, ease: 'power2.inOut'
            });

            // 2) 튜브 들어올림
            tl.to([tube1.position, tube2.position], {
                y: '+=1.2',
                duration: 0.5, ease: 'power2.out'
            });

            // 3) 아이스박스 원위치로 (이후 도말 챕터에서 사용)
            tl.to(tube1.position, {
                x: TUBE1_HOME.pos.x, z: TUBE1_HOME.pos.z,
                duration: 1.0, ease: 'power2.inOut'
            });
            tl.to(tube2.position, {
                x: TUBE2_HOME.pos.x, z: TUBE2_HOME.pos.z,
                duration: 1.0, ease: 'power2.inOut'
            }, '<');

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

            // 4) 문 닫기
            tl.to(incubator.getDoorGroup().rotation, {
                x: 0,
                duration: 0.8, ease: 'power2.inOut'
            });

            return tl;
        }
    }
];