// main.js
// 애플리케이션 엔트리 포인트.

import SceneManager from './src/core/SceneManager.js';
import AppState from './src/core/AppState.js';
import ThawingScene from './src/scenes/ThawingScene.js';
import Sidebar from './src/ui/Sidebar.js';

function bootstrap() {
    const container = document.getElementById('webgl-container');
    if (!container) {
        console.error('webgl-container element not found');
        return;
    }

    // 1) Three.js 인프라
    const sceneManager = new SceneManager(container);

    // 2) 현재 챕터 씬
    const thawing = new ThawingScene();
    sceneManager.setScene(thawing);

    // 3) UI 컴포넌트 (AppState 변화에 자동 반응)
    const sidebar = new Sidebar('#sidebar-mount');

    // 4) 초기 챕터 설정 (사이드바도 이 시점에 한 번 갱신됨)
    //    AppState.set('chapter', 0) → 보관 상태 (-80/-20)
    //    AppState.set('chapter', 1) → 해동 중
    //
    //    Ch.1 초기 진입 = 해동 시작이지만, 사이드바는 "방금 꺼낸 보관 상태"를
    //    보여주는 게 자연스러우므로 0(보관 상태)로 시작.
    AppState.set('chapter', 0);

    // 5) 로더 페이드아웃
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }, 400);

    // 6) 렌더 루프 시작
    sceneManager.start();

    // 개발용: 콘솔에서 챕터 전환 테스트
    //   window.__app.setChapter(1) 로 사이드바 변화 확인 가능
    window.__app = {
        sceneManager,
        thawing,
        sidebar,
        AppState,
        setChapter: (n) => AppState.set('chapter', n)
    };
}

document.addEventListener('DOMContentLoaded', bootstrap);