// src/scenes/steps/index.js
// 챕터 번호 → 스텝 시퀀스 매핑.
// 새 챕터 애니메이션을 만들면 여기에 등록.

// 1번 챕터 실행 시 → thawingStep 사용
// 3번 챕터 실행 시 → injectionSteps 사용
// 이런 테이블 역할을 한다.


// ES Module Named Import를 사용한다.
// thawingStpes.js 파일에서:
// export const thawingSteps = [...]
// 로  export한 배열을 가져오는 것이다.
// 즉, 메모리 상에는 형태의 배열 참조(reference)가 들어온다.
import { thawingSteps } from './thawingSteps.js';

// Registry Object 생성
// 이 객체는:
// Chapter ID → Step Sequence를 연결하는 Lookup Table이다.
// 구조적으로는: {key:value} 형태의 JavaScript Object이다.
// 왜 배열이 아니라 Object를 쓰는가?
// 예를 들어 배열을 쓰면 const arr = [thawingSteps]; 처럼 된다.
// 하지만 이 경우 0번째 == chapter 1인가?, 1번째 == chapter 2인가?
// 반면 Object Mapping을 사용하면 {1: thawingSteps, 3: injectionSteps} 처럼
// 명시적으로 연결된다. 즉, 유지보수성, 가독성, 확장성이 좋아진다.
//
// STEPS_MY_CHAPTER[chapterId] 이 부분은 Dynamic Property Access이다.
// 예를 들어: chapterId = 1 이면, STEPS_BY_CHAPTER[1]이 실행된다.
// 결과: thawingSteps 배열 반환.
//
// 즉 내부적으로 chapter 번호를 key로 사용하여 step sequence를 조회하는 시스템이다.
export const STEPS_BY_CHAPTER = {
    1: thawingSteps
    // 3: injectionSteps   ← Ch.3 만들면 추가 예정
};

/**
 * 챕터 번호에 해당하는 스텝 배열 반환. 없으면 빈 배열.
 */

// 이 함수는 Registry Access Layer이다.
// 외부 시스템이 Registry에 직접 접근하지 않고, 함수를 통해 접근하도록 만드는 구조.
// 이게 중요한 이유는 캡슐화 때문이다.
// 직접 접근하면 Registry 구조가 외부에 노출되고, 구조 변경 어렵고, Validation 추가가 어렵다.
// 반면 함수로 감싸면 getStepsForChapter() 안에서 fallback처리, logging, validation, lazy loading
// 등을 추가할 수 있다.
// 즉 함수는 일종의 API Layer이다.
export function getStepsForChapter(chapterId) {

    // Fallback 처리
    // 여기에 사용되는 개념은, Short-circuit evaluation, Fallback value, Defensive Programming
    // 이다.
    // 정상적으로는 chapterId = 1 이면, STEPS_BY_CHAPTER[1] → thawingSteps
    // 즉 truthy value. 따라서 반환: thawingSteps
    // 없는 챕터 chaterId = 99이면 STEPS_BY_CHAPTER[99] → undefined
    // undefined는 falsy이다. 따라서: || [] 가 실행되어 빈 배열 반환.
    // 즉, step이 없는 챕터를 안전하게 처리한다.
    // 왜 빈 배열을 반환하냐?
    // 만약 return undefined;를 하면 상위 코드에서
    // steps.length 같은 코드를 실행할 때 오류 발생 가능.
    // 하지만 빈 배열이면 [].length → 0 이므로 안전하다.
    // Null Safety, Defensive API Design 개념이다.
    return STEPS_BY_CHAPTER[chapterId] || [];

    // 전체 구조 흐름
    // ChapterManager → 현재 chapterId 확인 → getStepsForChapter(chapterId) → 해당 step 배열 반환
    // → StepController가 순차 실행
    // 즉 이 파일은 챕터 시스템과 실제 애니메이션 step 사이를 연결하는 Router 같은 역할을 한다.
    // Registry Pattern
    // + Lookup Tabel
    // + Encapsulation
    // + Defensive Programming
    // + Data-driven Workflow를 합친 형태이다.
}