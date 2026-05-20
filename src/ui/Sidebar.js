// src/ui/Sidebar.js
// 좌측 사이드바를 동적으로 생성하고, 챕터 변경에 따라 자동 갱신.
//
// 의존: index.html에 <div id="sidebar-mount"></div> 가 존재해야 함.
// (또는 생성자에 다른 mount 셀렉터를 전달)

import AppState from '../core/AppState.js';
import { getTubeDisplayForChapter, CHAPTERS } from '../data/chapterStates.js';
import { hexToCss } from '../data/tubeConfig.js';

export default class Sidebar {
    constructor(mountSelector = '#sidebar-mount') {
        this.mount = document.querySelector(mountSelector);
        if (!this.mount) {
            console.error(`Sidebar: mount target "${mountSelector}" not found`);
            return;
        }

        this._render();

        // 챕터 변경 시 자동 갱신
        AppState.subscribe('chapter', () => this._render());
    }

    _render() {
        const chapterId = AppState.get('chapter');
        const chapterMeta = CHAPTERS.find(c => c.id === chapterId) || CHAPTERS[0];
        const items = getTubeDisplayForChapter(chapterId);

        // 색상 매핑 (status → 우측 라벨 색)
        const statusColor = {
            stored: '#ef4444',     // 빨강 (냉동/냉장 보관)
            thawing: '#60a5fa',    // 파랑 (해동 중)
            ready: '#10b981',      // 초록 (사용 준비됨)
            in_use: '#a78bfa',     // 보라 (사용 중)
            used: '#6b7280'        // 회색 (사용 완료)
        };

        // sidebar HTML 통째로 재생성
        this.mount.innerHTML = `
            <h2>실험 기구 목록</h2>
            <p class="chapter-sub">${chapterMeta.title}</p>
            <p>${chapterMeta.description}</p>

            <div class="section-label">시료 (Tubes)</div>
            <ul class="object-list">
                ${items.map(item => `
                    <li class="object-item" data-tube-id="${item.id}">
                        <div style="display: flex; align-items: center; min-width: 0;">
                            <span class="dot" style="background-color: ${hexToCss(item.dotColor)};"></span>
                            <span class="item-name">${item.shortName}</span>
                        </div>
                        <span class="item-status" style="color: ${statusColor[item.status] || '#9ca3af'};">
                            ${item.label}
                        </span>
                    </li>
                `).join('')}
            </ul>

            <div class="section-label">도구 (Tools)</div>
            <ul class="object-list">
                <li class="object-item">
                    <div style="display: flex; align-items: center;">
                        <span class="dot" style="background-color: rgb(255,204,0);"></span>
                        <span class="item-name">P200 피펫</span>
                    </div>
                    <span class="item-status" style="color: #a78bfa;">대기 중</span>
                </li>
                <li class="object-item">
                    <div style="display: flex; align-items: center;">
                        <span class="dot" style="background-color: rgb(51,153,255);"></span>
                        <span class="item-name">P1000 피펫</span>
                    </div>
                    <span class="item-status" style="color: #a78bfa;">대기 중</span>
                </li>
                <li class="object-item">
                    <div style="display: flex; align-items: center;">
                        <span class="dot" style="background-color: rgb(46,125,240);"></span>
                        <span class="item-name">Tip Box (Blue, P1000)</span>
                    </div>
                    <span class="item-status" style="color: #a78bfa;">사용 가능</span>
                </li>
                <li class="object-item">
                    <div style="display: flex; align-items: center;">
                        <span class="dot" style="background-color: rgb(245,197,24);"></span>
                        <span class="item-name">Tip Box (Yellow, P200)</span>
                    </div>
                    <span class="item-status" style="color: #a78bfa;">사용 가능</span>
                </li>
            </ul>
        `;
    }
}
