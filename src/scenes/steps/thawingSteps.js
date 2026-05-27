// src/scenes/steps/thawingSteps.js

// ============================================================
// [Import]
// ------------------------------------------------------------
// gsap 라이브러리를 import합니다.
//
// GSAP(GreenSock Animation Platform)는
// JavaScript 기반 Tweening / Timeline Animation Library입니다.
//
// 주요 역할:
//
// - 객체 위치 보간(interpolation)
// - 회전 애니메이션
// - 스케일 애니메이션
// - 타임라인 기반 시퀀싱(sequencing)
//
// Three.js에서는 Mesh.position / rotation 등을
// 매우 자주 GSAP로 제어합니다.
// ============================================================
import gsap from 'gsap';


// thawingSteps 배열(Array)을 Named Export 한다.
// 이 배열은:
// "해동 챕터에서 실행 가능한 Step Object 목록"이다.
// 외부 시스템(예: StepController)이 이 배열을 import하여
// 순차적으로 실행한다.
export const thawingSteps = [
    // 실험 절차 1단계를 표현하는 객체(Object Literal)
    //
    // 하나의 Step Object는 보통:
    // - id
    // - label
    // - play()
    // 를 가진다.
    {
        // step의 고유 식별자(Unique Identifier)
        //
        // StepController 내부에서:
        // - 현재 step 추적
        // - step 비교
        // - 이벤트 처리
        // 등에 사용될 수 있다.
        // naming:
        // soc-out
        // = SOC를 밖으로 꺼냄
        id: 'soc-out',

        // 사용자 인터페이스(UI)에 표시될 Step 이름
        // 예:
        // STEP 1
        // SOC 배지를 꺼내 실온 해동
        // 같은 형태로 표시될 수 있다.
        label: 'SOC 배지를 꺼내 실온 해동',

        // Step 실행 함수(Execution Function)
        // 사용자가:
        // "다음 단계" 버튼을 눌렀을 때 호출된다.
        // 매개변수(Parameter):
        // scene → 현재 Three.js Scene Context
        // 이 함수 내부에서:
        // - Scene Graph 탐색
        // - Object Reference 획득
        // - Animation 실행
        // 등을 수행한다.
        play: (scene) => {

            // 현재 Scene 내부의 iceBox 객체 참조(reference)를 가져온다.
            // scene.objects:
            // → 주요 게임/실험 객체를 저장한 Registry
            //
            // iceBox:
            // → IceBox Class Instance
            const iceBox = scene.objects.iceBox;

            // 직접 접근이 아닌, 메서드를 통해 접근한다.
            // 캡슐화(Encapsulation), 추상화(Abstraction)
            // 튜브가 내부적으로 어떻게 저장되는지는 숨기고 외부에서는
            // getTube()만 사용하게 만드는 것이다.
            const tube5 = iceBox.getTube('tube5');

            // tube5의 현재 로컬 위치(아이스박스 기준)를 월드 좌표로 환산하기엔 복잡하므로,
            // 간단히: 아이스박스 그룹에서 분리해서 씬에 직접 붙이고 작업대 옆으로 이동.
            // 여기선 더 단순하게 — 아이스박스 로컬 좌표 내에서 박스 밖(오른쪽)으로 빼내고 내려놓음.
            // Timeline, Sequencing, Animation Orchestration
            // GSAP의 Timeline은: 여러 Tween을 시간축 위에 배치하는 시스템이다.
            // 0s | Lift, 0.6s | Move, 1.4 | Drop 처럼 애니메이션 실행하는
            // 애니메이션의 스케줄러

            const tl = gsap.timeline();

            // 1) 위로 들어올림
            // Tweening, Interpolation, Property Animation
            // 현재 값과 목표 값 사이를 보간(interpolation)하는 기술.
            tl.to(tube5.position, {

                // GSAP의 Relative Value Syntax
                // 의미는: 현재 값 + 1.2 이다.
                // 반대로 y: 1.2는 Absolute Value이다.
                // +=1.2(상대 이동), 1.2(절대 좌표)
                y: '+=1.2',
                duration: 0.6,

                // 애니메이션의 속도 곡선(Speed Curve)
                // easing curve, interpolation curve
                // 현실 세계의 물체처럼 처음 빠르게, 끝에서 감속한다.
                ease: 'power2.out'
            });

            // 2) 박스 오른쪽 밖으로 이동 (로컬 x 증가)

            // Three.js의 position은 Vector3 객체이다.
            // 즉, x,y,z 를 갖는 3차원 백터이다.
            // x: 좌우, y: 높이, z: 앞뒤
            tl.to(tube5.position, {
                x: '+=2.5',
                duration: 0.8,
                ease: 'power1.inOut'
            });

            // 3) 작업대 바닥 높이로 내려놓음
            //    (아이스박스가 y=0에 있고 박스 높이만큼 떠있었으므로 바닥까지 내림)

            // tl.to(...)
            // tl.to(...)
            // tl.to(...)
            // 이건 method Chining과 Sequential Scheduling이다.
            // GSAP Timeline은:
            // 앞 애니메이션이 끝난 뒤 다음 애니메이션을 자동 실행한다.
            // 즉, Lift, Move, Drop 순서가 자동 보장된다.
            tl.to(tube5.position, {
                y: 0.3,
                duration: 0.6,
                ease: 'power2.in'
            });
            
            // 상위 시스템(StepController)이 await step.play(scene) 같은 식으로
            // 사용할 가능성이 있기 때문에
            // 단순한 반환 값이 아니라, 이 Step의 실행 흐름 전체이다.
            // 상위 시스템은 이 return tl을 통해 완료 감지, 다음 Step 실행, 재생 상태 관리
            // 등을 수행한다.
            return tl;

            // 실험 프로토콜
            // → Step System
            // → Scene Graph 접근
            // → Object Query
            // → Timeline Sequencing
            // → Tween Interpolation
            // → State-driven Animation
        }
    }
];