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
import StepController from './src/core/StepController.js';
import { thawingSteps } from './src/scenes/steps/thawingSteps.js';
import StepControl from './src/ui/StepControl.js';

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

    // 현재 Thaving Scene을 제어할
    // StepController 생성
    //
    // StepController는:
    // - 현재 step 관리
    // - 애니메이션 재생 상태 관리
    // - timeline 관리
    // - UI 상태 notify
    // 등을 담당한다.
    const stepController = new StepController(thawing);

    // Thawing 실험 step 시퀀스 등록
    //
    // thawingSteps 배열 안에는:
    // - step ID
    // - label
    // - play(scene) 함수
    // 등이 정의되어 있다.
    //
    // loadSteps()는
    // - 기존 timeline 정리
    // - step 목록 저장
    // - currentIndex 초기화
    // - UI 상태 갱신
    // 등을 수행한다.
    stepController.loadSteps(thawingSteps);

    // StepControl UI 생성
    //
    // StepControl은:
    // - 현재 step 진행 상태 표시
    // - progress UI 표시
    // - 현재 step label 표시
    // - Next 버튼 처리
    // 등을 담당한다.
    //
    // 전달된 StepController의 상태를 subscribe()로 감시하며,
    // 상태가 변경될 때마다 자동으로 UI를 갱신한다.
    const stepControl = new StepControl(stepController);

    // === 4) 인터랙션 ===
    const interaction = new InteractionController(
        sceneManager.camera,
        sceneManager.renderer.domElement
    );

    // 씬의 모든 인터랙션 대상을 등록
    const targets = thawing.getInteractiveTargets();
    interaction.registerAll(targets, {
        onHoverEnter: (target) => {

            // 펄스 중인 피펫이면 hover 시 멈춤
            // 현재 hover된 대상이 피펫인지 확인한다.
            // 또한 stopPulse 함수가 실제로 존재하는지도 검사한다.
            //
            // typeof === 'function' 검사를 사용하는 이유:
            // stopPulse가 없는 객체에서 함수를 호출하면 에러가 발생할 수 있기 때문이다.
            if (target.type === 'pipette' && typeof target.root.stopPulse === 'function') {

                // 사용자가 이미 올바른 피펫 위에 마우스를 올렸으므로
                // "여기 클릭하세요" 시각 힌트(펄스 효과)를 종료한다.
                target.root.stopPulse();
            }
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

        // 4. Spot light 생성/제거
        if (ch && ch.focus && ch.focus.spotLight) {
            thawing.addSpotLight(ch.focus.spotLight);
        } else {
            thawing.removeSpotLight();
        }

        // 5. 피펫 펄스 (대상 피펫에 챕터 진입 펄스 힌트)
        // 현재 챕터 진입 시,
        // 어떤 피펫을 사용해야 하는지 사용자에게 시각적으로 알려준다.

        // 이전 챕터에서 반짝이고 있는 피펫들을 먼저 모두 끈다.
        // 안 끄면 여러 피펫이 동시에 반짝여 사용자 혼란이 생길 수 있다.
        thawing.objects.p200.stopPulse();
        thawing.objects.p1000.stopPulse();

        // 현재 챕터(ch)와 목표 대상(target)이 존재하는지 확인한다.
        // target 안에는 현재 사용해야 할 피펫 종류 정보가 들어 있다.
        if (ch && ch.target){

            // 현재 챕터가 요구하는 피펫 종류를 가져온다.
            // 예:
            // ch.target.pipetteType === 'p200'
            //
            // 그러면:
            // thawing.objects["p200"]
            // -> thawing.objects.p200
            //
            // 객체 이름을 문자열로 접근하는 동적 접근 방식이다.
            const pip=thawing.objects[ch.target.pipetteType];

            // 해당 피펫 객체가 실제로 존재하면
            // 펄스(반짝이는 시각 힌트)를 시작한다.
            if(pip) pip.startPulse();
        }
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
        stepController,
        stepControl,
        AppState,
        setChapter: (n) => AppState.set('chapter', n)
    };
}

document.addEventListener('DOMContentLoaded', bootstrap);