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
        
        this._locked = false;
        this._lockReason = '';

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
        // 스텝이 없는 챕터면 컨트롤 숨김
        if (!state || state.total === 0) {
            this.mount.classList.remove('visible');
            return;
        }
        this.mount.classList.add('visible');

        const shown = state.currentIndex + 1;
        this.progressEl.textContent = `STEP ${Math.max(0, shown)} / ${state.total}`;

        if (state.currentLabel) {
            this.labelEl.textContent = state.currentLabel;
        } else {
            this.labelEl.textContent = '단계를 시작하세요';
        }

        // 버튼 상태 결정
        if (state.isPlaying) {
            this.nextBtn.textContent = '재생 중…';
            this.nextBtn.classList.add('playing');
            this.nextBtn.classList.remove('locked');
            this.nextBtn.disabled = true;
        } else if (state.isComplete) {
            this.nextBtn.textContent = '완료됨 ✓';
            this.nextBtn.classList.remove('playing', 'locked');
            this.nextBtn.disabled = true;
        } else if (this._locked) {
            // 게이팅에 걸린 상태
            this.nextBtn.textContent = '🔒 잠김';
            this.nextBtn.classList.add('locked');
            this.nextBtn.classList.remove('playing');
            this.nextBtn.disabled = true;
            if (this._lockReason) {
                this.labelEl.textContent = this._lockReason;
            }
        } else {
            this.nextBtn.textContent = '다음 ›';
            this.nextBtn.classList.remove('playing', 'locked');
            this.nextBtn.disabled = false;
        }
    }
    /**
     * 외부에서 게이팅 상태를 설정.
     * @param {boolean} locked - 잠금 여부
     * @param {string} reason - 잠금 안내 문구
     */
    setLocked(locked, reason = '') {
        // 상태가 바뀔 때만 갱신
        if (this._locked === locked && this._lockReason === reason) return;
        this._locked = locked;
        this._lockReason = reason;
        this._update(this.stepController.getState());
    }
}