// main.js
// 애플리케이션 엔트리 포인트. 짧고 명확하게 유지.

import SceneManager from './src/core/SceneManager.js';
import ThawingScene from './src/scenes/ThawingScene.js';

function bootstrap() {
    const container = document.getElementById('webgl-container');
    if (!container) {
        console.error('webgl-container element not found');
        return;
    }

    // 1) 씬 매니저 생성 (Three.js 인프라)
    const sceneManager = new SceneManager(container);

    // 2) 현재 챕터 씬 로드
    const thawing = new ThawingScene();
    sceneManager.setScene(thawing);

    // 3) 로더 페이드아웃
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }, 400);

    // 4) 렌더 루프 시작
    sceneManager.start();

    // 개발용: 콘솔에서 접근하기 쉽도록 전역 노출
    window.__app = { sceneManager, thawing };
}

document.addEventListener('DOMContentLoaded', bootstrap);