// src/ui/DialPanel.js
// 피펫 클릭 시 화면 가운데에 뜨는 부피 입력 패널.
//
// 사용:
//   const panel = new DialPanel();
//   panel.open(pipetteInstance);
//   panel.close();

export default class DialPanel {
    constructor() {
        this._buildDom();
        this._bindEvents();
        this._pipette = null;
    }

    _buildDom() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'dial-panel-overlay';
        this.overlay.innerHTML = `
            <div class="dial-panel">
                <div class="dp-header">
                    <div class="dp-title">— 부피 설정 —</div>
                    <button class="dp-close" title="닫기 (ESC)">×</button>
                </div>
                <div class="dp-subtitle"></div>

                <div class="dp-input-row">
                    <input type="text" class="dp-input" inputmode="numeric" maxlength="4" />
                    <div class="dp-unit">µL</div>
                </div>

                <div class="dp-display-row">
                    <div class="dp-display-label">다이얼 표시값:</div>
                    <div class="dp-display-value">000</div>
                </div>

                <div class="dp-range"></div>
                <div class="dp-target"></div>
                <div class="dp-warning"></div>

                <div class="dp-hint">Enter / ESC / 바깥 클릭 → 닫기</div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.panel = this.overlay.querySelector('.dial-panel');
        this.subtitleEl = this.overlay.querySelector('.dp-subtitle');
        this.inputEl = this.overlay.querySelector('.dp-input');
        this.displayValueEl = this.overlay.querySelector('.dp-display-value');
        this.rangeEl = this.overlay.querySelector('.dp-range');
        this.targetEl = this.overlay.querySelector('.dp-target');
        this.warningEl = this.overlay.querySelector('.dp-warning');
        this.closeBtn = this.overlay.querySelector('.dp-close');
    }

    _bindEvents() {
        this.inputEl.addEventListener('input', () => this._onInput());

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                this.close();
            }
        });

        this.closeBtn.addEventListener('click', () => this.close());

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    open(pipette) {
        this._pipette = pipette;

        this.subtitleEl.textContent = pipette.spec.name;
        this.rangeEl.textContent = `허용 범위: 0 ~ ${pipette.spec.maxVolume} µL`;
        this.warningEl.textContent = '';
        this.warningEl.classList.remove('show');
        this._updateTargetUI();

        const cur = Math.round(pipette.state.currentVolume);
        this.inputEl.value = cur.toString();
        this._updateDisplay(cur);

        this.overlay.classList.add('open');
        setTimeout(() => {
            this.inputEl.focus();
            this.inputEl.select();
        }, 50);
    }

    close() {
        this.overlay.classList.remove('open');
        this._pipette = null;
    }

    isOpen() {
        return this.overlay.classList.contains('open');
    }

    _onInput() {
        if (!this._pipette) return;

        const raw = this.inputEl.value.trim();

        if (raw === '') {
            this.warningEl.textContent = '';
            this.warningEl.classList.remove('show');
            return;
        }

        const parsed = parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
            this._showWarning('숫자만 입력 가능합니다');
            return;
        }

        const max = this._pipette.spec.maxVolume;
        let clamped = parsed;
        let warned = false;

        if (parsed < 0) {
            clamped = 0;
            this._showWarning('음수는 입력할 수 없습니다 → 0으로 조정');
            warned = true;
        } else if (parsed > max) {
            clamped = max;
            this._showWarning(`최대값 초과 → ${max}로 조정`);
            warned = true;
        }

        if (!warned) {
            this.warningEl.textContent = '';
            this.warningEl.classList.remove('show');
        }

        if (clamped !== parsed) {
            this.inputEl.value = clamped.toString();
        }

        this._pipette.setVolume(clamped);
        this._updateDisplay(clamped);
    }

    _updateDisplay(volume) {
        const type = this._pipette ? this._pipette.type : 'p200';
        const dialValue = type === 'p200'
            ? Math.round(volume)
            : Math.round(volume / 10);
        this.displayValueEl.textContent = dialValue.toString().padStart(3, '0');
    }

    _showWarning(msg) {
        this.warningEl.textContent = msg;
        this.warningEl.classList.add('show');
    }

    _updateTargetUI() {
        if (!this._pipette || !this.targetEl) return;
        const target = this._pipette._currentTarget;

        if (!target || target.pipetteType !== this._pipette.type) {
            this.targetEl.textContent = '';
            this.targetEl.classList.remove('show', 'matched');
            return;
        }

        const matched = this._pipette._targetMatched();
        if (matched) {
            this.targetEl.textContent = `✓ 목표값 도달 (${target.volume} µL)`;
            this.targetEl.classList.add('show', 'matched');
        } else {
            this.targetEl.textContent = `목표: ${target.volume} µL`;
            this.targetEl.classList.add('show');
            this.targetEl.classList.remove('matched');
        }
    }
}