// src/ui/Subtitle.js
// 화면 상단 중앙에 떠다니는 자막. 스텝 재생 시 표시되어
// "실제론 어떤 의미인지" 같은 보조 설명을 보여줌.
//
// 사용:
//   const sub = new Subtitle();
//   sub.show('실제로는 30초간 손에 쥐고 해동');
//   sub.hide();

// Subtitle 이라는 클래스를 정의한다.
// 이 클래스는: 자막 생성, 자막 표시, 자막 숨김 기능만 담당하는 전용 UI 객체이다.
export default class Subtitle {

    // new Subtitle()을 실행하면 자동으로 호출된다.
    // 예를 들어: const subtitle = new Subtitle();를 실행하면 constructor()가 실행되고,
    // this._build가 호출된다.
    constructor() {
        this._build();
    }

    // 이 함수는 자막 UI를 실제로 생성한다.
    _build() {
        // div 생성
        // HTML 에서 <div></div>를 만드는 것과 같다.
        // 생성 직후 상태는 <div></div>이다.
        this.el = document.createElement('div');

        // 클래스 지정
        // 결과: <div class="subtitle-bar"></div>
        // 왜 클래스 이름을 붙일까?
        // CSS로 꾸미기 위해서다.
        // 예를 들어 CSS에:
        /*
        .subtitle-bar {
        position: absolute;
        top: 20px;
        left: 50%;
        }

        같은 스타일을 적용할 수 있다.
        */
        this.el.className = 'subtitle-bar';

        // 화면에 추가
        // 이 줄이 매우 중요하다. 지금까지는 메모리 안에만 존재했다.
        // <body>
        // </body> 상태였는데,
        // 이 코드를 실행하면
        /*
        <body>
            <div class="subtitle-bar"></div>
        </body>
        가 된다. 즉, 실제 브라우저 화면에 등장하는 것이다.
        */
        document.body.appendChild(this.el);
    }

    // 이 함수는 자막 표시를 담당한다.
    // 예를 들어,
    /*
    subtitle.show(
        '얼음 위에서 30분간 반응시킨다.'
    )
    를 호출했다고 해보자.
    */
    show(text) {
        // text가 비어있는가?
        // subtitle.show('');
        // subtitle.show(null);
        // subtitle.show(undefined);
        // 이면 조건이 참이 된다.
        // 조건이 참이 되면
        if (!text) {
            // 실행된다.
            // 즉, 보여줄 내용이 없으면 자막을 숨긴다.
            this.hide();
            return;
        }

        // 실제 자막 내용 입력
        // 예를 들어 show('DNA를 첨가한다');
        // 라면 HTML은
        // <div class="subtitle-bar">
        //      DNA를 첨가한다
        // </div>
        // 가 된다.
        // 즉, 텍스트 삽입 단계이다.
        this.el.textContent = text;

        // visible 클래스 추가
        // 이 부분이 핵심이다.
        // 현재: <div class = "subtitle-bar"> DNA를 첨가한다 </div> 였다면
        // 실행 후: <div class = "subtitle-bar visible"> DNA를 첨가한다 </div>
        // 가 된다.
        // 왜 굳이 visible을 붙일까?
        // CSS에서: .subtitle-bar {opacity: 0;}로 숨겨두고
        // .subtitle-bar.visible {opacity: 1;}로 보여줄 수 있기 때문이다.
        // 즉: show() = 텍스트 입력 + visible 클래스 추가 이다.
        this.el.classList.add('visible');
    }

    // 이 함수는 자막을 숨긴다.
    // 실행 내용은 단 하나이다.
    // this.el.classList.remove('visible');
    // 현재 <div class = "subtitle-bar visible"> 였다면,
    // <div class= "subtitle-bar"가 된다.
    // CSS가 .subtitle-bar{opacity: 0;}라면 다시 투명해져서 사라진다.
    hide() {
        this.el.classList.remove('visible');
    }
}