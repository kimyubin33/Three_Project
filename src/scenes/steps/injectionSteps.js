// src/scenes/steps/injectionSteps.js
// Ch.3 Plasmid DNA 주입 챕터의 스텝 시퀀스.
//
// 정확성 포인트:
//   - Competent Cell(Tube1,2)는 주입 직전까지 아이스박스 안에 둠 (노출 최소화)
//   - Plasmid DNA(Tube3,4)는 손에 쥐고 30초 해동 후 사용
//   - 교차오염 방지를 위해 매 흡입 전 새 팁 장착, 사용 후 폐기
//   - 실험군(Tube3→Tube1)과 대조군(Tube4→Tube2)을 순차로 처리

// GSAP는 애니메이션 라이브러리.
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
    }
    // Step 2~12는 다음 묶음(3b, 3c, 3d)에서 추가
];