// src/core/AppState.js
// 챕터/단계 등 앱 전역 상태와 변경 알림 시스템.
// 매우 단순한 옵저버 패턴. 외부 라이브러리 없이 구현.
//
// 사용 예:
//   AppState.set('chapter', 2);
//   AppState.subscribe('chapter', (newVal) => { ... });

class AppStateClass {
    constructor() {
        this._state = {
            chapter: 0,                // 현재 챕터 번호 (0 = 초기/Ch.1 시작 전)
            chapterName: 'pre-thawing', // 챕터 식별자
            // 각 튜브별 동적 상태 (config의 불변 데이터와 별개)
            tubeStates: {
                tube1: { currentTemp: null, status: 'stored' },
                tube2: { currentTemp: null, status: 'stored' },
                tube3: { currentTemp: null, status: 'stored' },
                tube4: { currentTemp: null, status: 'stored' },
                tube5: { currentTemp: null, status: 'stored' }
            }
        };
        this._listeners = {};
    }

    get(key) {
        return this._state[key];
    }

    set(key, value) {
        const prev = this._state[key];
        if (prev === value) return;
        this._state[key] = value;
        this._notify(key, value, prev);
    }

    /**
     * 깊은 경로 업데이트 (예: tubeStates.tube1.status)
     */
    setPath(path, value) {
        const parts = path.split('.');
        let cursor = this._state;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in cursor)) cursor[parts[i]] = {};
            cursor = cursor[parts[i]];
        }
        cursor[parts[parts.length - 1]] = value;
        this._notify(parts[0], this._state[parts[0]]);
    }

    subscribe(key, callback) {
        if (!this._listeners[key]) this._listeners[key] = [];
        this._listeners[key].push(callback);
        // 즉시 현재값으로 한 번 호출 (편의)
        callback(this._state[key], undefined);
        // unsubscribe 함수 반환
        return () => {
            this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
        };
    }

    _notify(key, newVal, prevVal) {
        if (!this._listeners[key]) return;
        for (const cb of this._listeners[key]) {
            try {
                cb(newVal, prevVal);
            } catch (e) {
                console.error(`[AppState] listener error for "${key}":`, e);
            }
        }
    }
}

// 싱글톤 인스턴스
const AppState = new AppStateClass();
export default AppState;
