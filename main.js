// main.js
// 애플리케이션 엔트리 포인트.

import { CHAPTERS } from './src/data/chapterStates.js';
import DialPanel from './src/ui/DialPanel.js';
import SceneManager from './src/core/SceneManager.js';
import InteractionController from './src/core/InteractionController.js';
import AppState from './src/core/AppState.js';
import ThawingScene from './src/scenes/ThawingScene.js';
import Sidebar from './src/ui/Sidebar.js';
import ChapterNav from './src/ui/ChapterNav.js';
import Tooltip from './src/ui/Tooltip.js';

function bootstrap() {
    const container = document.getElementById('webgl-container');
    if (!container) {
        console.error('webgl-container element not found');
        return;
    }

    // === 1) Three.js 인프라 ===
    const sceneManager = new SceneManager(container);

    // === 2) 챕터 씬 ===
    const thawing = new ThawingScene();
    sceneManager.setScene(thawing);

    // === 3) UI ===
    const sidebar = new Sidebar('#sidebar-mount');
    const chapterNav = new ChapterNav('#chapter-nav-mount');
    const tooltip = new Tooltip();
    const dialPanel = new DialPanel();

    // === 4) 인터랙션 ===
    const interaction = new InteractionController(
        sceneManager.camera,
        sceneManager.renderer.domElement
    );

    // 씬의 모든 인터랙션 대상을 등록
    const targets = thawing.getInteractiveTargets();
    interaction.registerAll(targets, {
        onHoverEnter: (target) => {
            // 하이라이트 (객체가 setHighlight를 가지고 있으면)
            if (typeof target.root.setHighlight === 'function') {
                target.root.setHighlight(true);
            }
            // 툴팁 표시
            const pos = interaction.getPointerScreen();
            tooltip.show({
                title: target.displayName,
                subtitle: target.displayRole,
                x: pos.x,
                y: pos.y
            });
            // 커서 모양 변경
            container.style.cursor = 'pointer';
        },
        onHoverLeave: (target) => {
            if (typeof target.root.setHighlight === 'function') {
                target.root.setHighlight(false);
            }
            tooltip.hide();
            container.style.cursor = '';
        },
        onClick: (target) => {
            if (target.type === 'pipette') {
                dialPanel.open(target.root);
            }
        }
    });

    // 인터랙션 컨트롤러를 매 프레임 업데이트하기 위해 sceneManager에 후크
    sceneManager.addUpdateCallback(() => {
        interaction.update();
        // 툴팁이 보이는 동안엔 마우스 따라다니게
        if (interaction.getCurrentHover()) {
            const pos = interaction.getPointerScreen();
            tooltip.move(pos.x, pos.y);
        }
    });

    // === 5) 초기 상태 ===
    // 챕터 변경 시 적용할 것들 (목표값, 카메라)
    AppState.subscribe('chapter', (chapterId) => {
        const ch = CHAPTERS.find(c => c.id === chapterId);

        // 1. 피펫 목표값 주입
        const target = ch ? ch.target || null : null;
        thawing.objects.p200.setTarget(target);
        thawing.objects.p1000.setTarget(target);

        // 2. 카메라 이동 (focus 정의된 챕터만)
        if (ch && ch.focus) {
            sceneManager.moveCameraTo(ch.focus.cameraPosition, ch.focus.cameraTarget);
        }

        // 3. Ambient light 변경
        const ambientIntensity = (ch && ch.focus && ch.focus.ambientIntensity !== undefined)
            ? ch.focus.ambientIntensity 
            : 0.55;
        thawing.ambientLight.intensity = ambientIntensity;
    });
    AppState.set('chapter', 0);

    // === 6) 로더 페이드아웃 ===
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }, 400);

    // === 7) 렌더 루프 시작 ===
    sceneManager.start();

    // 개발용
    window.__app = {
        sceneManager,
        thawing,
        sidebar,
        chapterNav,
        tooltip,
        dialPanel,
        interaction,
        AppState,
        setChapter: (n) => AppState.set('chapter', n)
    };
}

document.addEventListener('DOMContentLoaded', bootstrap);