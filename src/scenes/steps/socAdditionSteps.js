// src/scenes/steps/socAdditionSteps.js
// Ch.6 SOC Medium 첨가 챕터의 스텝.
//
// 보고서 기준:
//   - 실온으로 데워둔 SOC medium 500 µL를 각 튜브에 첨가
//   - P1000 사용 (다이얼 500 µL = 표시값 050)
//   - 교차오염 방지를 위해 실험군/대조군 각각 새 팁 사용
//
// 전제: Ch.1에서 SOC(Tube5)는 이미 아이스박스 밖으로 꺼내진 상태

import * as THREE from 'three';
import gsap from 'gsap';

// 튜브 원위치 (아이스박스 안)
const TUBE1_HOME = { pos: { x: -0.8, y: 0.75, z: -0.3 }, rot: { x: 0.05, y: 0.1, z: -0.08 } };
const TUBE2_HOME = { pos: { x: -0.4, y: 0.75, z: 0.25 }, rot: { x: -0.06, y: -0.05, z: 0.12 } };

const SOC_COLOR = 0xfff4a3;   // 투명한 노란색 (SOC medium)

export const socAdditionSteps = [
    {
        id: 'soc-attach-tip-1',
        label: 'P1000에 새 팁 장착 (실험군용)',
        subtitle: '대용량 분주를 위해 P1000과 파란 팁을 사용합니다',
        play: (scene) => {
            const p1000 = scene.objects.p1000;
            const tipBoxBlue = scene.objects.tipBoxBlue;

            const origPos = p1000.position.clone();
            const origRot = p1000.rotation.clone();

            const tbWorld = new THREE.Vector3();
            tipBoxBlue.getWorldPosition(tbWorld);
            const aboveTipBox = { x: tbWorld.x, y: tbWorld.y + 1.5, z: tbWorld.z };

            const tl = gsap.timeline();

            tl.to(p1000.position, {
                x: aboveTipBox.x, y: aboveTipBox.y, z: aboveTipBox.z,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p1000.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p1000.position, {
                y: tbWorld.y + 0.8,
                duration: 0.4, ease: 'power2.in'
            });
            tl.call(() => p1000.attachTip(tipBoxBlue));
            tl.to(p1000.position, {
                y: aboveTipBox.y,
                duration: 0.5, ease: 'power2.out'
            });
            tl.to(p1000.position, {
                x: origPos.x, y: origPos.y, z: origPos.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            tl.to(p1000.rotation, {
                x: origRot.x, y: origRot.y, z: origRot.z,
                duration: 0.7, ease: 'power2.inOut'
            }, '<');

            return tl;
        }
    },
    {
        id: 'soc-aspirate-1',
        label: 'SOC 배지 500 µL 흡입',
        subtitle: '실온 해동된 SOC medium을 흡입합니다',
        play: (scene) => {
            const p1000 = scene.objects.p1000;
            const iceBox = scene.objects.iceBox;
            const tube5 = iceBox.getTube('tube5');

            const origPos = p1000.position.clone();
            const origRot = p1000.rotation.clone();

            const tube5World = new THREE.Vector3();
            tube5.getWorldPosition(tube5World);
            const aboveTube = { x: tube5World.x, y: tube5World.y + 2.0, z: tube5World.z };

            const tl = gsap.timeline();

            tl.to(p1000.position, {
                x: aboveTube.x, y: aboveTube.y, z: aboveTube.z,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p1000.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p1000.position, {
                y: tube5World.y + 1.0,
                duration: 0.5, ease: 'power2.in'
            });
            tl.call(() => {
                tube5.changeLiquidVolume(-500);
                p1000.aspirate(SOC_COLOR, 500);
            });
            tl.to({}, { duration: 0.6 });
            tl.to(p1000.position, {
                y: aboveTube.y,
                duration: 0.5, ease: 'power2.out'
            });
            tl.to(p1000.position, {
                x: origPos.x, y: origPos.y, z: origPos.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            tl.to(p1000.rotation, {
                x: origRot.x, y: origRot.y, z: origRot.z,
                duration: 0.7, ease: 'power2.inOut'
            }, '<');

            return tl;
        }
    },
    {
        id: 'soc-inject-tube1',
        label: '실험군에 SOC 주입 + 팁 폐기',
        subtitle: '세포 회복을 위한 영양 배지를 첨가합니다',
        play: (scene) => {
            const p1000 = scene.objects.p1000;
            const iceBox = scene.objects.iceBox;
            const tube1 = iceBox.getTube('tube1');

            const origPos = p1000.position.clone();
            const origRot = p1000.rotation.clone();

            const tl = gsap.timeline();

            // 1) Tube1 꺼내기
            tl.to(tube1.position, {
                y: '+=1.5',
                duration: 0.6, ease: 'power2.out'
            });
            tl.to(tube1.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.6, ease: 'power2.inOut'
            }, '<');

            // 2) 위치 갱신 후 피펫 이동
            const tube1World = new THREE.Vector3();
            tl.call(() => { tube1.getWorldPosition(tube1World); });

            tl.to(p1000.position, {
                x: () => tube1World.x,
                y: () => tube1World.y + 2.0,
                z: () => tube1World.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            tl.to(p1000.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7, ease: 'power2.inOut'
            }, '<');
            tl.to(p1000.position, {
                y: () => tube1World.y + 1.0,
                duration: 0.5, ease: 'power2.in'
            });

            // 3) 주입
            tl.call(() => {
                p1000.dispense();
                tube1.changeLiquidVolume(500);
            });
            tl.to({}, { duration: 0.4 });

            // 4) 피펫 빠짐
            tl.to(p1000.position, {
                y: () => tube1World.y + 2.0,
                duration: 0.5, ease: 'power2.out'
            });

            // 5) 팁 폐기 + Tube1 복귀 + 피펫 복귀 (동시)
            const t5 = tl.duration();
            tl.call(() => { p1000.detachTip(); }, null, t5);
            tl.to(tube1.position, {
                x: TUBE1_HOME.pos.x, y: TUBE1_HOME.pos.y, z: TUBE1_HOME.pos.z,
                duration: 1.0, ease: 'power2.inOut'
            }, t5);
            tl.to(tube1.rotation, {
                x: TUBE1_HOME.rot.x, y: TUBE1_HOME.rot.y, z: TUBE1_HOME.rot.z,
                duration: 1.0, ease: 'power2.inOut'
            }, t5);
            tl.to(p1000.position, {
                x: origPos.x, y: origPos.y, z: origPos.z,
                duration: 1.0, ease: 'power2.inOut'
            }, t5);
            tl.to(p1000.rotation, {
                x: origRot.x, y: origRot.y, z: origRot.z,
                duration: 1.0, ease: 'power2.inOut'
            }, t5);

            tl.to({}, { duration: 0.4 });

            return tl;
        }
    },
    {
        id: 'soc-control-group-full',
        label: '대조군 SOC 첨가 (자동 진행)',
        subtitle: '대조군에도 동일한 과정을 자동으로 수행합니다 (약 12초)',
        play: (scene) => {
            const p1000 = scene.objects.p1000;
            const tipBoxBlue = scene.objects.tipBoxBlue;
            const iceBox = scene.objects.iceBox;
            const tube5 = iceBox.getTube('tube5');
            const tube2 = iceBox.getTube('tube2');

            const origPos = p1000.position.clone();
            const origRot = p1000.rotation.clone();

            const tl = gsap.timeline();

            // [1/3] 새 파란 팁 장착
            const tbWorld = new THREE.Vector3();
            tipBoxBlue.getWorldPosition(tbWorld);

            tl.to(p1000.position, {
                x: tbWorld.x, y: tbWorld.y + 1.5, z: tbWorld.z,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p1000.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p1000.position, {
                y: tbWorld.y + 0.8,
                duration: 0.4, ease: 'power2.in'
            });
            tl.call(() => p1000.attachTip(tipBoxBlue));
            tl.to(p1000.position, {
                y: tbWorld.y + 1.5,
                duration: 0.5, ease: 'power2.out'
            });

            // [2/3] SOC 흡입
            const tube5World = new THREE.Vector3();
            tube5.getWorldPosition(tube5World);

            tl.to(p1000.position, {
                x: tube5World.x, y: tube5World.y + 2.0, z: tube5World.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            tl.to(p1000.position, {
                y: tube5World.y + 1.0,
                duration: 0.5, ease: 'power2.in'
            });
            tl.call(() => {
                tube5.changeLiquidVolume(-500);
                p1000.aspirate(SOC_COLOR, 500);
            });
            tl.to({}, { duration: 0.5 });
            tl.to(p1000.position, {
                y: tube5World.y + 2.0,
                duration: 0.5, ease: 'power2.out'
            });

            // [3/3] Tube2 꺼내서 주입 + 복귀
            tl.to(tube2.position, {
                y: '+=1.5',
                duration: 0.6, ease: 'power2.out'
            });
            tl.to(tube2.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.6, ease: 'power2.inOut'
            }, '<');

            const tube2World = new THREE.Vector3();
            tl.call(() => { tube2.getWorldPosition(tube2World); });

            tl.to(p1000.position, {
                x: () => tube2World.x,
                y: () => tube2World.y + 2.0,
                z: () => tube2World.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            tl.to(p1000.position, {
                y: () => tube2World.y + 1.0,
                duration: 0.5, ease: 'power2.in'
            });
            tl.call(() => {
                p1000.dispense();
                tube2.changeLiquidVolume(500);
            });
            tl.to({}, { duration: 0.4 });
            tl.to(p1000.position, {
                y: () => tube2World.y + 2.0,
                duration: 0.5, ease: 'power2.out'
            });

            // 마무리: 팁 폐기 + Tube2 복귀 + 피펫 복귀 (동시)
            const tEnd = tl.duration();
            tl.call(() => { p1000.detachTip(); }, null, tEnd);
            tl.to(tube2.position, {
                x: TUBE2_HOME.pos.x, y: TUBE2_HOME.pos.y, z: TUBE2_HOME.pos.z,
                duration: 1.0, ease: 'power2.inOut'
            }, tEnd);
            tl.to(tube2.rotation, {
                x: TUBE2_HOME.rot.x, y: TUBE2_HOME.rot.y, z: TUBE2_HOME.rot.z,
                duration: 1.0, ease: 'power2.inOut'
            }, tEnd);
            tl.to(p1000.position, {
                x: origPos.x, y: origPos.y, z: origPos.z,
                duration: 1.0, ease: 'power2.inOut'
            }, tEnd);
            tl.to(p1000.rotation, {
                x: origRot.x, y: origRot.y, z: origRot.z,
                duration: 1.0, ease: 'power2.inOut'
            }, tEnd);

            tl.to({}, { duration: 0.4 });

            return tl;
        }
    }
];