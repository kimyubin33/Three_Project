// src/ui/StepControl.js
// 하단 중앙 스텝 컨트롤 UI. StepController와 연결되어
// 현재 진행 상황 표시 + "다음" 버튼 제공.

export default class StepControl {
    constructor(stepController, mountSelector = '#step-control-mount') {

        // Step 상태 관리자 저장
        //
        // StepControl은 이 controller의 상태를 읽고,
        // next() 같은 함수도 호출할 수 있다.
        this.stepController = stepController;

        //  UI를 삽입할 HTML mount 요소 검색
        //
        // 기본값:
        // #step-control-mount
        this.mount = document.querySelector(mountSelector);

        // monut 요소를 찾지 못한 경우
        // UI 생성 중단
        if (!this.mount) {

            // 개발자 콘솔에 에러 출력
            console.error(`StepControl: mount "${mountSelector}" not found`);
            return;
        }

        // StepControl UI 생성
        //
        // 예:
        // - progress 텍스트
        // - 현재 step label
        // - next 버튼
        this._build();


        // StepController 상태 변화 구독 → UI 갱신
        //
        // 상태가 변경될 때마다
        // _update(state)를 호출하여 UI 갱신
        this.stepController.subscribe((state) => this._update(state));
    }

    _build() {

        // mount 영역 안에 StpeControl UI HTML 생성
        //
        // 포함 요소:
        // - progress 표시
        // - 현재 step label
        // - next 버튼
        this.mount.innerHTML = `
            <div class="sc-info">
                <div class="sc-progress" id="sc-progress">—</div>
                <div class="sc-label" id="sc-label">단계를 시작하세요</div>
            </div>
            <button class="sc-next-btn" id="sc-next">다음 ›</button>
        `;

        // progress 표시 DOM 저장
        // 나중에 textContent 업데이트에 사용
        this.progressEl = this.mount.querySelector('#sc-progress');

        // 현재 step label DOM 저장
        this.labelEl = this.mount.querySelector('#sc-label');

        // Next 버튼 DOM 저장
        this.nextBtn = this.mount.querySelector('#sc-next');

        // Next 버튼 클릭 이벤트 연결
        //
        // 클릭 시 StepController.next() 호출
        // -> 다음 step 실행
        this.nextBtn.addEventListener('click', () => {
            this.stepController.next();
        });
    }

    _update(state) {

        // state가 없거나
        // 현재 챕터에 step이 없는 경우
        // StepControl UI 숨김
        if (!state || state.total === 0) {

            // visibel class 제거
            // -> opacity:0
            // -> 클릭 비활성화
            this.mount.classList.remove('visible');
            return;
        }

        // step이 존재하면 UI 표시
        this.mount.classList.add('visible');

        // 현재 진행 step 번호 계산
        //
        // currentIndex:
        // -1 -> 아직 시작 안 함
        // 0 -> 첫 번째 step
        // UI 표시용으로 +1 처리
        // 진행 표시: 아직 시작 안 했으면 "0 / N", 진행 중이면 "k / N"
        const shown = state.currentIndex + 1;  // -1 → 0, 0 → 1 ...

        // 잰행 상태 텍스트 갱신
        //
        // 예:
        // STEP 2 / 5
        this.progressEl.textContent = `STEP ${Math.max(0, shown)} / ${state.total}`;

        // 현재 step label 표시
        if (state.currentLabel) {

            // 현재 step 이름 표시
            this.labelEl.textContent = state.currentLabel;
        } else {

            // 아직 시작 전 기본 메시지
            this.labelEl.textContent = '단계를 시작하세요';
        }

        // 버튼 상태 갱신
        if (state.isPlaying) {

            // 현재 애니메이션 재생 중 상태
            this.nextBtn.textContent = '재생 중…';

            // playing CSS class 추가
            this.nextBtn.classList.add('playing');

            // 중복 클릭 방지
            this.nextBtn.disabled = true;


        } else if (state.isComplete) {

            // 모든 step 완료 상태
            this.nextBtn.textContent = '완료됨 ✓';

            // playing class 제거
            this.nextBtn.classList.remove('playing');

            // 더 이상 진행 불가
            this.nextBtn.disabled = true;

            
        } else {

            // 일반 대기 상태
            this.nextBtn.textContent = '다음 ›';

            // playing class 제거
            this.nextBtn.classList.remove('playing');

            // 버튼 활성화
            this.nextBtn.disabled = false;
        }
    }
}