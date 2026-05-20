// src/ui/Tooltip.js
// 마우스 따라다니는 떠다니는 라벨.
// HTML 오버레이 방식 (3D 객체를 가리는 게 아니라 화면 좌표상에 그려짐).
//
// 사용:
//   const tooltip = new Tooltip();
//   tooltip.show({ title: 'Tube 1', subtitle: '실험군 대장균', x: 100, y: 200 });
//   tooltip.hide();

export default class Tooltip {
    constructor() {
        this._buildDom();
        this._visible = false;
    }

    _buildDom() {
        this.el = document.createElement('div');
        this.el.className = 'three-tooltip';
        this.el.style.cssText = `
            position: fixed;
            pointer-events: none;
            background: rgba(15, 18, 30, 0.92);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #f3f4f6;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 0.82rem;
            font-family: 'Outfit', 'Inter', sans-serif;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.12s ease;
            max-width: 280px;
            transform: translate(14px, 14px);
        `;
        this.el.innerHTML = `
            <div class="tt-title" style="font-weight: 600; font-size: 0.88rem; margin-bottom: 2px;"></div>
            <div class="tt-subtitle" style="color: #9ca3af; font-size: 0.75rem;"></div>
        `;
        document.body.appendChild(this.el);

        this.titleEl = this.el.querySelector('.tt-title');
        this.subtitleEl = this.el.querySelector('.tt-subtitle');
    }

    show({ title, subtitle, x, y }) {
        this.titleEl.textContent = title || '';
        this.subtitleEl.textContent = subtitle || '';
        this.subtitleEl.style.display = subtitle ? 'block' : 'none';
        this.move(x, y);
        if (!this._visible) {
            this.el.style.opacity = '1';
            this._visible = true;
        }
    }

    move(x, y) {
        this.el.style.left = `${x}px`;
        this.el.style.top = `${y}px`;
    }

    hide() {
        if (this._visible) {
            this.el.style.opacity = '0';
            this._visible = false;
        }
    }
}
