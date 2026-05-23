// src/core/StepController.js
// 챕터별 "스텝(Step)" 시퀀스를 순서대로 재생하는 매니저.
//
// 스텝 정의 형태 (챕터별 steps 파일에서 제공):
//   {
//     id: 'pick-tube1',
//     label: 'Tube 1 집기',
//     play: (scene) => gsap.timeline()   // GSAP 타임라인 반환
//   }
//
// 사용:
//   const sc = new StepController(thawingScene);
//   sc.loadSteps(thawingSteps);
//   sc.next();   // 다음 스텝 재생

export default class StepController {
    constructor(scene) {

        // 현재 Three.js scene 저장
        // Step 진행 중 오브젝트 검색/제어에 사용
        this.scene = scene;

        // 실험 step 목록 저장 배열
        // 예: step1, step2, step3...
        this.steps = [];

        // 현재 진행 중인 step 번호
        //
        // -1;
        // 아직 아무 step도 시작하지 않은 상태
        //
        // 0:
        // 첫 번째 step 진행 중
        this.currentIndex = -1;   // 아직 아무 스텝도 재생 안 함

        // 현재 실행 중인 GSAP timeLine 저장
        // step 애니메이션 재생/정지/스킵 등에 사용
        this._currentTimeline = null;

        // 현재 실행 중인 GSAP timeline 저장
        // step 애니메이션 재생/정지/스킵 등에 사용
        this._isPlaying = false;

        
        // 상태 변화 감지용 콜백 함수 목록
        //
        // UI가 이 배열에 함수를 등록해 두면,
        // Step 상태가 변경될 때 자동으로 알림을 받을 수 있다.
        //
        // 예:
        // - 현재 -step UI 갱신
        // - 진행률 표시
        // - 버튼 활성화/비활성화
        this._listeners = [];
    }

    /**
     * 챕터의 스텝 배열 로드. 인덱스 초기화.
     */
    loadSteps(steps) {

        // 현재 실행 중인 step 애니메이션이 있으면 정리한다.
        // 이전 실험의 timeline이 남아 있으면
        // 새 실험 로딩 시 애니메이션 충돌이 발생할 수 있다.
        if (this._currentTimeline) {

            // GSAP timeline 완전 종료
            // pause가 아니라 kill이므로 완전히 제거된다.
            this._currentTimeline.kill();

            // 현재 timeline 참조 제거
            this._currentTimeline = null;
        }


        // 새로운 step 목록 저장
        //
        // steps가 null/undefined인 경우를 대비해
        // 기본값으로 빈 배열([]) 사용
        this.steps = steps || [];

        // 현재 진행 step 초기화
        //
        // -1;
        // 아직 아무 step도 시작하지 않은 상태
        this.currentIndex = -1;

        // 현재 재생 상태 초기화
        // 새 step 로딩 직후에는 재생 중이 아님
        this._isPlaying = false;

        // 상태 변경 알림
        //
        // 등록된 UI listener들에게
        // "step 상태가 변경되었다"는 이벤트를 전달한다.
        this._notify();
    }

    /**
     * 다음 스텝 재생.
     */
    next() {

        // 현재 step 애니메이션이 이미 재생 중이면 무시한다.
        // 사용자의 연속 클릭으로 step이 중첩 실행되는 것을 방지한다.
        if (this._isPlaying) return;

        // 현재 step이 마지막 step이면 종료한다.
        // 더 이상 다음 step이 존재하지 않는다.
        if (this.currentIndex >= this.steps.length - 1) return;

        // 다음 step으로 이동
        this.currentIndex++;

        // 현재 실행할 step 객체 가져오기
        const step = this.steps[this.currentIndex];

        // 현재 재생 중 상태로 변경
        // 다음 next() 호출을 잠시 막는다.
        this._isPlaying = true;

        // 상태 변화 알림
        // UI 갱신 등에 사용
        this._notify();

        //현재 step 실행
        //
        // step.play(scene)는 보통 GSAP timeline를 반환한다.
        // 예:
        // - 피펫 이동
        // - 버튼 점등
        // - 문 열기
        const tl = step.play(this.scene);

        // 현재 실행 중인 timeline 저장
        this._currentTimeline = tl;

        // timeline이 존재하고
        // eventCallback 기능을 지원하는 경우
        if (tl && typeof tl.eventCallback === 'function') {

            // GSAP 애니메이션 종료 시 실행될 콜백 등록
            tl.eventCallback('onComplete', () => {

                // 재생 종료 상태로 변경
                this._isPlaying = false;

                // 현재 timeline 제거
                this._currentTimeline = null;

                // 상태 변화 알림
                this._notify();
            });

        } else {

            // timeline을 반환하지 않는 step의 경우
            // 즉시 완료 처리
            this._isPlaying = false;

            // 상태 변화 알림
            this._notify();
        }
    }

    /**
     * 현재 상태 조회 (UI용)
     */
    getState() {

        // 현재 StepController 상태를 외부(UI 등)에 전달한다.
        // 상태 정보를 한 번에 객체 형태로 반환한다.
        return {


            // 현재 진행 중인 step 번호
            //
            // -1;
            // 아직 시작 안 함
            //
            // 0;
            // 첫 번째 step
            currentIndex: this.currentIndex,

            // 전체 step 개수
            total: this.steps.length,

            // 현재 애니메이션 재생 중 여부
            isPlaying: this._isPlaying,

            // 현재 step의 Label(이름)
            //
            // currentIndex가 유효하고
            // 현재 step 객체가 존재하면
            // 해당 Label 반환
            //
            // 예:
            // "DNA 시료 추가"
            //
            // 아직 시작 전이면 null 반환
            currentLabel: this.currentIndex >= 0 && this.steps[this.currentIndex]
                ? this.steps[this.currentIndex].label
                : null,

            // 다음 step이 남아 있는지 여부
            //
            // true:
            // 아직 다음 step 있음
            //
            // false:
            // 현재 마지막 step
            hasNext: this.currentIndex < this.steps.length - 1,

            // 전체 step 완료 여부
            //
            // 조건:
            // 1. step이 최소 1개 이상 존재
            // 2. 현재 마지막 step까지 도달
            // 3. 현재 애니메이션 재생 중이 아님
            isComplete: this.steps.length > 0 && this.currentIndex >= this.steps.length - 1 && !this._isPlaying
        };
    }

    // 외부(UI 등)가 감시(subscribe)할 수 있게 만드는 함수
    subscribe(callback) {

        // 상태 변화 알림을 받을 callback 함수를 등록한다.
        //
        // callback 예시:
        // (state) => {
        //      updateUI(state);
        //    }
        this._listeners.push(callback);

        // subscribe 직후 현재 상태를 즉시 전달한다.
        //
        // 이렇게 하면 UI가 초기 상태를 바로 표시할 수 있다.
        // 상태 변경 이벤트를 기다릴 필요가 없다.
        callback(this.getState());

        // unsubscribe 함수 반환
        //
        // 나중에:
        // unsubscribe();
        //
        // 를 호출하면 현재 callback이 listeners 목록에서 제거된다.
        return () => {

            // 현재 callback을 제외한 listener들만 남긴다.
            // 즉, 현재 구독을 해제한다.
            this._listeners = this._listeners.filter(cb => cb !== callback);
        };
    }

    // StepController 내부 상태가 바뀌었을 때, 현재 상태를 모든 구독자(listener)에게 전달하는 함수.
 _notify() {

        // 현재 StepController 상태 snapshot 생성
        // listener 들에게 전달할 상태 객체 
        const state = this.getState();

        // 등록된 모든 listener(callback)들을 순회한다.
        //
        // 예:
        // - HUD 업데이트
        // - 진행률 UI 갱신
        // - 디버그 패널 갱신
        for (const cb of this._listeners) {

            // 현재 상태를 listener에게 전달한다.
            // 예:
            // updateHUD(state)

            // listener 실행 중 에러가 발생해도
            // 전체 notify 시스템이 중단되지 않도록 한다.
            //
            // 하나의 listener 실패가
            // 다른 listener 실행까지 막지 않게 하기 위한 안전장치
            try { cb(state); } catch (e) { console.error('[StepController] listener error:', e); }
        }
    }
}