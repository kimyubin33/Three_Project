// src/ui/ChapterNav.js
// 우상단 챕터 네비게이션. 좌/우 화살표로 챕터 이동.
// 미구현 챕터는 회색으로 표시하되 이동은 가능 (씬은 그대로지만 사이드바 상태만 변경).

import AppState from '../core/AppState.js';
import { CHAPTERS } from '../data/chapterStates.js';

export default class ChapterNav {
    constructor(mountSelector = '#chapter-nav-mount') {
        this.mount = document.querySelector(mountSelector);
        if (!this.mount) {
            console.error(`ChapterNav: mount target "${mountSelector}" not found`);
            return;
        }

        this._build();
        AppState.subscribe('chapter', (id) => this._update(id));
    }

    _build() {
        this.mount.className = 'chapter-nav';
        this.mount.innerHTML = `
            <button class="chapter-nav-btn" data-action="prev" title="이전 챕터">‹</button>
            <div class="chapter-nav-label" id="chapter-nav-label">—</div>
            <button class="chapter-nav-btn" data-action="next" title="다음 챕터">›</button>
        `;

        this.prevBtn = this.mount.querySelector('[data-action="prev"]');
        this.nextBtn = this.mount.querySelector('[data-action="next"]');
        this.labelEl = this.mount.querySelector('#chapter-nav-label');

        this.prevBtn.addEventListener('click', () => this._go(-1));
        this.nextBtn.addEventListener('click', () => this._go(+1));
    }

    _go(delta) {
        const current = AppState.get('chapter');
        const next = current + delta;
        if (next < 0 || next >= CHAPTERS.length) return;
        AppState.set('chapter', next);
    }

    _update(chapterId) {
        const ch = CHAPTERS.find(c => c.id === chapterId) || CHAPTERS[0];
        this.labelEl.textContent = ch.title;
        this.labelEl.classList.toggle('unimplemented', !ch.implemented);

        // 경계 비활성화
        this.prevBtn.disabled = chapterId <= 0;
        this.nextBtn.disabled = chapterId >= CHAPTERS.length - 1;
    }
}