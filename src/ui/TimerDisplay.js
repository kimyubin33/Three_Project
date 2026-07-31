// src/ui/TimerDisplay.js
// 시간 경과를 압축해서 보여주는 타이머 UI.
// 실제 실험 시간(30분 등)을 짧은 애니메이션(4초 등)으로 압축 표시.
//
// 사용:
//   const timer = new TimerDisplay();
//   timer.start({ totalSeconds: 1800, displayDuration: 4, label: 'Ice Incubation' });
//   timer.hide();

export default class TimerDisplay {
    constructor() {
        this._build();
        this._rafId = null;
    }

    _build() {
        this.el = document.createElement('div');
        this.el.className = 'timer-display';
        this.el.innerHTML = `
            <div class="td-label"></div>
            <div class="td-time">00:00</div>
            <div class="td-total"></div>
            <div class="td-bar"><div class="td-bar-fill"></div></div>
        `;
        document.body.appendChild(this.el);

        this.labelEl = this.el.querySelector('.td-label');
        this.timeEl = this.el.querySelector('.td-time');
        this.totalEl = this.el.querySelector('.td-total');
        this.barFillEl = this.el.querySelector('.td-bar-fill');
    }

    /**
     * 타이머 시작.
     * @param {number} totalSeconds - 실제 실험 시간 (초)
     * @param {number} displayDuration - 화면에서 재생될 시간 (초)
     * @param {string} label - 상단 라벨
     */
    start({ totalSeconds, displayDuration = 4, label = '' }) {
        this.stop();  // 기존 타이머 정리

        this.labelEl.textContent = label;
        this.totalEl.textContent = `/ ${this._format(totalSeconds)}`;
        this.el.classList.add('visible');

        const startTime = performance.now();
        const durationMs = displayDuration * 1000;

        const tick = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / durationMs);

            // 압축된 시간 표시 (0 → totalSeconds)
            const shownSeconds = Math.floor(totalSeconds * progress);
            this.timeEl.textContent = this._format(shownSeconds);
            this.barFillEl.style.width = `${progress * 100}%`;

            if (progress < 1) {
                this._rafId = requestAnimationFrame(tick);
            } else {
                this._rafId = null;
            }
        };
        this._rafId = requestAnimationFrame(tick);
    }

    stop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    hide() {
        this.stop();
        this.el.classList.remove('visible');
    }

    /**
     * 초 → "MM:SS" 또는 "HH:MM:SS" 포맷
     */
    _format(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}