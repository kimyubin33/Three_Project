// src/scenes/steps/injectionSteps.js
// Ch.3 Plasmid DNA 주입 챕터의 스텝 시퀀스.
//
// 정확성 포인트:
//   - Competent Cell(Tube1,2)는 주입 직전까지 아이스박스 안에 둠 (노출 최소화)
//   - Plasmid DNA(Tube3,4)는 손에 쥐고 30초 해동 후 사용
//   - 교차오염 방지를 위해 매 흡입 전 새 팁 장착, 사용 후 폐기
//   - 실험군(Tube3→Tube1)과 대조군(Tube4→Tube2)을 순차로 처리

// GSAP는 애니메이션 라이브러리.
import * as THREE from 'three';
import gsap from 'gsap';

// export는 이 배열을 다른 파일에서 가져다 쓸 수 있게 공개한다는 뜻이다.
export const injectionSteps = [
    {
        // Step의 고유 이름
        id: 'plasmid-thaw',
        label: 'Plasmid DNA 해동',
        subtitle: '실제로는 약 30초간 손에 쥐고 해동합니다',

        // 이 Step이 실제로 실행될 때 호출되는 함수
        // scene은 현재 Three.js 씬 객체이다.
        // 이 코드에서는 iceBox만을 사용한다.
        play: (scene) => {
            /*
            scene
            └─ objects
                └─ iceBox
            */
           // 에서 iceBox를 꺼내는 코드.
            const iceBox = scene.objects.iceBox;
            const tube3 = iceBox.getTube('tube3');
            const tube4 = iceBox.getTube('tube4');

            // GSAP Timeline을 만든다.
            // Timeline은 여러 애니메이션을 순서대로 실행하는 묶음이다.
            const tl = gsap.timeline();

            // 1) 두 튜브를 동시에 위로 들어 올림 (공중에 띄움)
            // 배열로 넣었기 때문에 두 튜브가 동시에 움직인다.
            tl.to([tube3.position, tube4.position], {
                y: '+=1.5',
                // 애니메이션 실행 시간
                duration: 0.7,
                // 움직임의 속도 곡선
                // power2.out은 보통 처음에는 빠르게 움직이고, 끝으로 갈수록 천천히 멈춘다.
                ease: 'power2.out'
            });

            // 2) 4초간 해동 표현 (그냥 공중에 가만히 떠있음 - 흔들기 X)
            //    GSAP에서 "그냥 기다리기"는 빈 to 또는 set with delay 사용
            // {} 움직일 대상을 빈 객체로 뒀다.
            tl.to({}, { duration: 4 });   // 4초 대기

            // 완성된 Timeline을 반환
            // play() 함수가 Timeline을 반환해야 StepController가 이 Step이 언제 시작하고 언제
            // 끝나는지 알 수 있다.
            return tl;
        }
    },
    {
     id: 'attach-tip-experimental',
        label: 'P200에 새 팁 장착 (실험군용)',
        subtitle: '교차오염 방지를 위해 매번 새 팁 사용',
        play: (scene) => {
            const p200 = scene.objects.p200;
            const tipBoxYellow = scene.objects.tipBoxYellow;

            // 피펫의 원래 위치/회전 기억 (복귀용)
            const origPos = p200.position.clone();
            const origRot = p200.rotation.clone();

            // 팁박스 위쪽으로 이동할 위치 (팁박스 약간 위)
            const tbWorld = new THREE.Vector3();
            tipBoxYellow.getWorldPosition(tbWorld);
            const aboveTipBox = { x: tbWorld.x, y: tbWorld.y + 1.5, z: tbWorld.z };
            const intoTipBox = { x: tbWorld.x, y: tbWorld.y + 0.7, z: tbWorld.z };

            const tl = gsap.timeline();

            // 1) 피펫이 팁박스 위로 이동 (수직 자세로 회전 정리)
            tl.to(p200.position, {
                x: aboveTipBox.x, y: aboveTipBox.y, z: aboveTipBox.z,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p200.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);

            // 2) 팁박스 안으로 내려가서 팁 장착
            tl.to(p200.position, {
                y: intoTipBox.y,
                duration: 0.4, ease: 'power2.in'
            });

            // 3) attachTip 실행 (팁이 시각적으로 붙음)
            tl.call(() => {
                p200.attachTip(tipBoxYellow);
            });

            // 4) 피펫이 다시 위로 빠짐 (팁이 같이 따라옴)
            tl.to(p200.position, {
                y: aboveTipBox.y,
                duration: 0.5, ease: 'power2.out'
            });

            // 5) 원래 위치/회전으로 복귀
            tl.to(p200.position, {
                x: origPos.x, y: origPos.y, z: origPos.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            tl.to(p200.rotation, {
                x: origRot.x, y: origRot.y, z: origRot.z,
                duration: 0.7, ease: 'power2.inOut'
            }, '<');  // '<' = 직전 트윈과 동시 시작

            return tl;
        }
    },
    {
        id: 'aspirate-plasmid-experimental',
        label: 'Plasmid #1 흡입 (5 µL)',
        subtitle: 'Tube 3에서 실험군용 Plasmid 5 µL 흡입',
        play: (scene) => {
            const p200 = scene.objects.p200;
            const iceBox = scene.objects.iceBox;
            const tube3 = iceBox.getTube('tube3');

            const origPos = p200.position.clone();
            const origRot = p200.rotation.clone();

            // tube3의 월드 좌표 (이미 공중에 떠있는 상태)
            const tube3World = new THREE.Vector3();
            tube3.getWorldPosition(tube3World);

            // 피펫이 tube3 위로 이동할 위치, 그리고 팁이 액체에 닿을 위치
            const aboveTube = { x: tube3World.x, y: tube3World.y + 2.0, z: tube3World.z };
            const intoTube = { x: tube3World.x, y: tube3World.y + 1.0, z: tube3World.z };

            const tl = gsap.timeline();

            // 1) 피펫이 tube3 위로 이동 + 수직 자세
            tl.to(p200.position, {
                x: aboveTube.x, y: aboveTube.y, z: aboveTube.z,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);
            tl.to(p200.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);

            // 2) 팁이 액체에 잠기도록 내려감
            tl.to(p200.position, {
                y: intoTube.y,
                duration: 0.5, ease: 'power2.in'
            });

            // 3) 흡입: Tube3 액체 감소 + 피펫 팁 안에 액체 생성
            tl.call(() => {
                tube3.changeLiquidVolume(-5);
                p200.aspirate(0x88ddff, 5);
            });

            // 4) 흡입 시간 (시각적 여유)
            tl.to({}, { duration: 0.5 });

            // 5) 피펫 빠짐
            tl.to(p200.position, {
                y: aboveTube.y,
                duration: 0.5, ease: 'power2.out'
            });

            // 6) 원래 위치/회전 복귀
            tl.to(p200.position, {
                x: origPos.x, y: origPos.y, z: origPos.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            tl.to(p200.rotation, {
                x: origRot.x, y: origRot.y, z: origRot.z,
                duration: 0.7, ease: 'power2.inOut'
            }, '<');

            return tl;
        }
    },
    {
        id: 'discard-plasmid-tube3',
        label: '빈 Plasmid #1 튜브 폐기',
        subtitle: '사용 완료된 시료 튜브는 폐기',
        play: (scene) => {
            // 현재 씬에 존재하는 IceBox에서 tube3를 꺼낸다.
            const iceBox = scene.objects.iceBox;
            const tube3 = iceBox.getTube('tube3');

            // GSAP Timeline 생성
            const tl = gsap.timeline();

            // 1) 화면 왼쪽 위(작업대 한쪽 끝)로 이동
            tl.to(tube3.position, {
                x: '-=4',
                y: '+=0.3',
                duration: 0.8,
                ease: 'power2.inOut'
            });

            // 2) 페이드아웃 + 작아지기
            //    튜브 내부의 모든 mesh에 opacity 적용해야 하므로 traverse 사용
            tl.to(tube3.scale, {
                x: 0.1, y: 0.1, z: 0.1,
                duration: 0.5,
                ease: 'power2.in'
            });

            // 3) 완전히 화면에서 제거 (visible = false)
            tl.call(() => {
                tube3.visible = false;
            });

            return tl;
        }
    },
    {
        id: 'lift-tube1-experimental',
        label: '실험군 Competent Cell 꺼내기',
        subtitle: '주입 직전 잠깐 꺼냄 — 노출 시간 최소화',
        play: (scene) => {
            const iceBox = scene.objects.iceBox;
            const tube1 = iceBox.getTube('tube1');

            const tl = gsap.timeline();

            // Tube3가 떠있던 위치 근처로 Tube1을 올림
            // Tube3는 Step 1에서 y +1.5 올라갔다가 Step 4에서 옆으로 폐기됨
            // 즉 "Plasmid가 있던 영역"의 y 높이 = 원래 y + 1.5
            // Tube1을 그 옆자리에 두면 자연스러움
            tl.to(tube1.position, {
                y: '+=1.5',
                duration: 0.7,
                ease: 'power2.out'
            });

            // Tube1이 비스듬히 박혀있던 회전을 똑바로 정리
            tl.to(tube1.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7,
                ease: 'power2.inOut'
                // GSAP의 Position Parameter이다. '<'는 직전 트윈과 동시 시작하라는 뜻이다.
            }, '<');  // 위 트윈과 동시 시작

            return tl;
        }
    },
    {
        id: 'inject-and-tap-experimental',
        label: '실험군에 Plasmid 주입 + Tapping',
        subtitle: '주입 후 부드러운 Tapping으로 혼합',
        play: (scene) => {

            // 처음에 필요한 객체를 명확하게 선언해서 코드 가독성을 높인다.
            const p200 = scene.objects.p200;
            const iceBox = scene.objects.iceBox;
            const tube1 = iceBox.getTube('tube1');

            // 피펫의 원래 위치와 회전을 저장 (애니메이션 후 복귀용)
            // const origPos = p200.position; 이렇게 하면 나중에 피펫이 움직이면
            // origPos도 같이 움직이는 참조가 된다. 따라서 clone()으로 복사해서 저장해야 한다.
            const origPos = p200.position.clone();
            const origRot = p200.rotation.clone();

            // tube1의 월드 좌표 (Step 5a에서 공중에 떠올라 있음)
            // Tube1이 iceBox같은 부모 객체 안에 들어있으면 tube1.position은 부모 기준 좌표이고,
            // 실제 화면상의 절대 위치와 다를 수 있기 때문에 World Position을 쓰는 것이 좋다.
            const tube1World = new THREE.Vector3();
            tube1.getWorldPosition(tube1World);

            // 목표 좌표를 만든다.
            // aboveTube = 튜브 위 대기 위치
            // intoTube = 튜브 안쪽 주입 위치
            const aboveTube = { x: tube1World.x, y: tube1World.y + 2.0, z: tube1World.z };
            const intoTube  = { x: tube1World.x, y: tube1World.y + 1.0, z: tube1World.z };

            // 애니메이션 순서표
            const tl = gsap.timeline();

            // 1) 피펫이 tube1 위로 이동 + 수직 자세
            // p200.position을 aboveTube 좌표로 0.7초 동안 이동
            // 마지막 0은 시작 시간을 의미한다.
            tl.to(p200.position, {
                x: aboveTube.x, y: aboveTube.y, z: aboveTube.z,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);

            // 피펫 회전을 수직 자세로 정리 (x=0, y=0, z=0)
            // 위치 이동과 회전 정렬이 동시에 시작
            tl.to(p200.rotation, {
                x: 0, y: 0, z: 0,
                duration: 0.7, ease: 'power2.inOut'
            }, 0);

            // 2) 팁이 tube1 안으로 내려감
            // 이미 피펫이 Tube1 위에 있기 때문에 y 좌표만 내리면 된다.
            tl.to(p200.position, {
                y: intoTube.y,
                duration: 0.5, ease: 'power2.in'
            });

            // 3) 주입: 팁 안 액체 사라짐 + Tube1 액체 5µL 증가
            // 움직임은 tl.to(), 상태 변화는 tl.call()로 구분해서 작성.
            // tl.call()는 특정 시점에 함수를 호출하는 GSAP 메서드이다.
            // 그래서 실제 객체 상태를 변경하는 코드는 tl.call() 안에 넣는다.
            tl.call(() => {
                const ok = p200.dispense();
                tube1.changeLiquidVolume(5);
            });

            // 4) 잠시 머무름 (주입 표현)
            tl.to({}, { duration: 0.3 });

            // 5) 피펫 위로 빠짐
            tl.to(p200.position, {
                y: aboveTube.y,
                duration: 0.5, ease: 'power2.out'
            });

            // 6) 피펫 원래 위치 복귀
            // 처음에 저장해 둔 origPos를 사용
            tl.to(p200.position, {
                x: origPos.x, y: origPos.y, z: origPos.z,
                duration: 0.7, ease: 'power2.inOut'
            });
            // 회전도 원래대로 복귀
            // '<'의 의미는 바로 이전 애니메이션과 동시에 시작이라는 뜻이다.
            // 즉, 피펫 위치 복귀와 피펫 회전 복귀가 동시에 일어난다.
            tl.to(p200.rotation, {
                x: origRot.x, y: origRot.y, z: origRot.z,
                duration: 0.7, ease: 'power2.inOut'
            }, '<');

            // 7) Tapping: Tube1을 좌우로 살짝 흔들기 (±5도, 2회)
            //    Math.PI/36 ≈ 5도
            // Three.js 회전값은 도(degree)가 아니라 라디안(radian)을 쓴다.
            const tapAngle = Math.PI / 36;
            const tapDur = 0.15;
            tl.to(tube1.rotation, { z: tapAngle, duration: tapDur, ease: 'sine.inOut' });
            tl.to(tube1.rotation, { z: -tapAngle, duration: tapDur, ease: 'sine.inOut' });
            tl.to(tube1.rotation, { z: tapAngle, duration: tapDur, ease: 'sine.inOut' });
            tl.to(tube1.rotation, { z: 0, duration: tapDur, ease: 'sine.inOut' });

            return tl;
        }
    },
    {
        id: 'eject-tip-experimental',
        label: '사용한 팁 폐기',
        subtitle: '이젝터 버튼으로 팁 제거 → 재사용 금지',
        play: (scene) => {
            const p200 = scene.objects.p200;

            const tl = gsap.timeline();

            // 1) 잠깐 정지 (이젝터 버튼 누르는 순간 표현용)
            tl.to({}, { duration: 0.3 });

            // 2) 팁 제거 (즉시 사라짐)
            tl.call(() => {
                p200.detachTip();
            });

            // 3) 짧은 대기 (다음 스텝과의 호흡)
            tl.to({}, { duration: 0.3 });

            return tl;
        }
    }
];