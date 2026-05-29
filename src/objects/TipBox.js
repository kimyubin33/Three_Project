// src/objects/TipBox.js
// 피펫 팁 박스. blue(P1000용) / yellow(P200용) 두 종류 지원.
//
// 구조:
//   - 베이스 (흰색 박스)
//   - 컬러 플레이트 (위쪽, blue/yellow)
//   - 격자형 팁 배열 (8x12 = 96개가 표준이지만 시각적 단순화로 축소)

import * as THREE from 'three';

const TIPBOX_SPECS = {
    blue: {
        name: 'Tip Box (P1000)',
        plateColor: 0x2e7df0,
        tipColor: 0xeaf0fa,         // 큰 투명 팁
        tipRadius: 0.025,
        tipHeight: 0.22,
        grid: { rows: 6, cols: 8, spacing: 0.13 }
    },
    yellow: {
        name: 'Tip Box (P200)',
        plateColor: 0xf5c518,
        tipColor: 0xfff8d0,         // 중간 크기 투명 팁
        tipRadius: 0.018,
        tipHeight: 0.16,
        grid: { rows: 6, cols: 8, spacing: 0.11 }
    }
};

export default class TipBox extends THREE.Group {
    constructor(type) {
        super();

        if (!TIPBOX_SPECS[type]) {
            throw new Error(`TipBox: unknown type "${type}"`);
        }

        this.type = type;
        this.spec = TIPBOX_SPECS[type];
        this.name = `tipBox_${type}`;
        this.userData.tubeName = this.spec.name;
        this.userData.isInteractive = true;

        this._buildBase();
        this._buildPlate();
        this._buildTips();

        this.traverse((child) => {
            if (child.isMesh || child.isInstancedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    _buildBase() {
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xf2f2f2,
            roughness: 0.55
        });
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.0), baseMat);
        base.position.y = 0;
        this.add(base);
    }

    _buildPlate() {
        const plateMat = new THREE.MeshStandardMaterial({
            color: this.spec.plateColor,
            roughness: 0.25,
            metalness: 0.05
        });
        const plate = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.04, 0.98), plateMat);
        plate.position.y = 0.27;
        this.add(plate);

        // 격자 구멍 시각화는 생략 (성능 + 시각적 단순화)
    }

    _buildTips() {
        // InstancedMesh로 팁 배열
        const { rows, cols, spacing } = this.spec.grid;
        const total = rows * cols;

        const tipGeo = new THREE.CylinderGeometry(
            this.spec.tipRadius,
            this.spec.tipRadius * 0.25,
            this.spec.tipHeight,
            8
        );
        const tipMat = new THREE.MeshPhysicalMaterial({
            color: this.spec.tipColor,
            transparent: true,
            opacity: 0.55,
            roughness: 0.2,
            transmission: 0.3,
            thickness: 0.02
        });

        const tipsMesh = new THREE.InstancedMesh(tipGeo, tipMat, total);
        const dummy = new THREE.Object3D();

        const startX = -((cols - 1) * spacing) / 2;
        const startZ = -((rows - 1) * spacing) / 2;
        const tipY = 0.29 + this.spec.tipHeight / 2;

        let i = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                dummy.position.set(
                    startX + c * spacing,
                    tipY,
                    startZ + r * spacing
                );
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                tipsMesh.setMatrixAt(i++, dummy.matrix);
            }
        }

        // tipsMesh는 THREE.InstanceMesh이다.
        // InstancedMesh는 같은 모양의 물체를 여러 개 그릴 때 사용한다.
        // InstanceMatrix는 각 팁의 위치, 회전, 크기 정보를 담고 있다.
        // 이 말은: "각 인스턴스의 위치 정보가 바뀌었으니 GPU에 다시 반영해라."
        // 라는 뜻이다.
        tipsMesh.instanceMatrix.needsUpdate = true;

        // 그림자 설정이다.
        // 피펫 팁이 그림자를 만들 수 있게 한다.
        tipsMesh.castShadow = true;

        // 피펫 팁이 다른 물체의 그림자를 받을 수 있게 한다.
        // 즉, 팁이 바닥에 그림자를 드리우고, 동시에 다른 물체의 그림자도 팁 위에
        // 나타날 수 있다.
        tipsMesh.receiveShadow = true;

        // 현재 클래스가 THREE.Group을 상속하고 있다.
        // 이 피펫 팁 묶음을 현재 객체의 자식으로 추가하는 코드이다.
        // 현재 클래스가 TipBox이므로
        /*
        TipBox
        └─ tipsMesh
            ├─ tip instance 0
            ├─ tip instance 1
            ├─ tip instance 2
            └─ ...
        */
       // 이러한 구조가 된다.
        this.add(tipsMesh);

        // 나중에 다시 접근하기 위해 tipMesh를 클래스의 속성으로 저장하는 것이다.
        // 예를 들어 나중에 팁 하나를 숨기거나, 위치를 바꾸거나, 특정 팁을 꺼낼 때:
        // this.tipsMesh.setMartixAt(index, matrix) 처럼 사용할 수 있다.
        this.tipsMesh = tipsMesh;

        // 사용 가능한 팁 인덱스 큐 (앞에서부터 순서대로 꺼냄)

        // 사용 가능한 팁 번호를 저장할 배열을 만든다.
        // 예를 들어 팁이 8개라면:
        // this._availableIndices = [];
        // 에서 시작해서 아래 반복문으로:
        // [0,1,2,3,4,5,6,7]
        // 이 된다.
        this._availableIndices = [];

        // total은 전체 팁 개수이다.
        // 예를 들어 total=12라면
        // this._availableIndices는 [0,1,2,3,4,5,6,7,8,9,10,11]이 된다.
        for (let i = 0; i < total; i++) {

            // 이 배열은 아직 사용하지 않은 팁 번호 목록이다.
            // 주석에 있는 "큐"라는 말이 중요하다.
            // 큐는 먼저 들어온 것이 먼저 나가는 구조이다.
            // const index = this._availableIndices.shift();
            // 이런 식으로 쓰면 앞에서부터 하나씩 꺼낸다.
            // 처음에는 0, 그 다음은 1, 그 다음은 2가 나온다.
            // 즉, 피펫 팁을 왼쪽 위부터 순서대로 하나씩 사용하는 구조라고 보면 된다.
            this._availableIndices.push(i);
        }

        // 인스턴스 매트릭스 백업 (각 팁의 원래 위치 정보)
        // 각 팁의 원래 위치 정보를 저장할 배열이다.
        // InstanceMesh에서 각 팁은 자신의 Matrix4를 가진다.
        // 이 Matrix4 안에는 다음 정보가 들어 있다.
        // 위치 position
        // 회전 rotation
        // 크기 scale
        // 즉, 팁 하나의 3D 배치 정보이다.
        this._instanceMatrices = [];

        // 임시로 사용할 행렬 객체를 하나 만든다.
        // Matrix4는 3D 공간에서 물체의 변환 정보를 담는 4x4 행렬이다.
        // 쉽게 말하면: 이 팁은 어디에 있고, 어떻게 회전되어 있고, 얼마나 큰가를 담는 데이터이다.
        const tmpMatrix = new THREE.Matrix4();

        //이 부분은 모든 팁의 원래 위치 정보를 백업한다.
        for (let i = 0; i < total; i++) {

            // i번쨰 팁의 인스턴스 행렬을 가져와서 tmpMatrix에 넣는다.
            // 예를 들어: tipsMesh.getMatrixAt(0, tmpMatrix);
            // 는 0번 팁의 위치, 회전, 크기 정보를 가져온다.
            tipsMesh.getMatrixAt(i, tmpMatrix);

            // 현재 tmpMatrix를 복사해서 배열에 저장한다.
            // 여기서 clone()이 중요하다.
            // 그냥 tmpMatrix를 넣으면 같은 객체 참조가 계속 들어갈 수 있다.
            // 그러면 나중에 값이 덮어써져서 모든 백업이 같은 값처럼 망가질 수 있다.
            // 그래서 반드시: tmpMatrix.clone()으로 복사본을 저장한다.
            this._instanceMatrices.push(tmpMatrix.clone());
        }
    }

    /**
     * 다음 사용 가능한 팁을 꺼냄.
     * 반환값: { worldPosition: Vector3, color: number, radius: number, height: number }
     *         또는 null (남은 팁 없음)
     *
     * 팁박스에서는 해당 인스턴스를 화면 밖으로 보내서 사라진 것처럼 처리.
     */

    // 이 함수는 이름 그대로 팁 하나를 가져가는 함수이다.
    // 예를 들어 사용자가 피펫을 팁박스에 가져다 대고 클릭하면, 내부적으로 이런 식으로
    // 호출될 수 있다.
    takeTip() {

        // this._availableIndices는 아직 사용 가능한 팁 번호 목록이다.
        // 예를 들어 팁이 5개 남아 있다면:
        // this._availableIndices = [3, 4, 5, 6, 7]
        // 이런 상태일 수 있다.
        // 그런데 팁을 다 썼다면
        // this._availableIndices = []
        // 가 된다.
        // 이때는 더 이상 꺼낼 팁이 없으므로:
        // console.warn(...)
        // 으로 경고를 띄우고, retun null;을 반환한다.
        // 즉, 호출한 쪽에서는 이렇게 처리할 수 있다.
        /*
        const tip = tipBox.takeTip();

        if (!tip){
            console.log('더 이상 장착할 팁이 없습니다.');
        }
        */
        if (this._availableIndices.length === 0) {
            console.warn(`[TipBox ${this.type}] 남은 팁이 없습니다`);
            return null;
        }

        // 사용 가능한 팁 번호 하나 꺼내기
        // shift()는 배열의 맨 앞 요소를 꺼내는 함수이다.
        // 예를 들어: this._availableIndices = [0, 1, 2, 3] 일 때,
        // const index = this._availableIndices.shift();
        // index = 0이 되고, 배열은 이렇게 바뀐다.
        // this._availableIndices = [1, 2, 3]
        // 즉, 0번 팁을 사용 처리한 것이다.
        // 여기서 _availableIndices는 일종의 큐(queue)처럼 쓰인다.
        // 큐는 먼저 들어온 것이 먼저 나가는 구조, First In, First Out FIFO이다.
        // 그래서 팁이 0번, 1번, 2번 순서대로 사용된다.
        const index = this._availableIndices.shift();

        // 해당 팁의 원래 Matrix 가져오기
        // 앞에서 팁박스를 만들 때 각 팁의 원래 위치 정보를 저장해 두었다.
        // this._instanceMatrices는 이런 배열이다.
        // 0번 팁의 Matrix4
        // 1번 팁의 Matrix4
        // 2번 팁의 Matrix4
        // ...
        // 그래서
        // this._instanceMatrices[index]는 방금 꺼낸 팁의 원래 위치, 회전, 크기 정보이다.
        // 예를 들어 index = 0 이면, const matrix = this._instanceMatrices[0];
        // 이 된다.
        const matrix = this._instanceMatrices[index];

        // 해당 인스턴스의 월드 좌표 추출 (피펫 장착 시 시작 위치로 사용 가능)
        // Matrix를 position, rotation, scale로 분해하기.
        // matrix는 THREE.Matrix4이다.
        // Matrix4는 한 물체의 변환 정보를 한 번에 담고 있다.
        // 위치 position
        // 회전 rotation
        // 크기 scale
        // 그런데 지금 필요한 것은 주로 위치이다.
        // 그래서: matrix.decompose(localPos, localRot, localScl);
        // 를 사용해서 matrix 안에 들어 있는 정보를 세 부분으로 나눈다.
        // localPos -> 팁의 로컬 위치
        // localRot -> 팁의 로컬 회전
        // localScl -> 팁의 로컬 크기
        // 여기서 localRot과 localScl은 현재 코드에서는 직접 사용하지 않는다.
        const localPos = new THREE.Vector3();
        const localRot = new THREE.Quaternion();
        const localScl = new THREE.Vector3();
        matrix.decompose(localPos, localRot, localScl);

        // 로컬 좌표란?
        // localPose는 팁박스 기준 좌표이다.
        // 예를 들어 팁박스 안에서 0번 팁이 왼쪽 위에 있다면:
        // 팁박스 기준으로 x = -2, y = 0.5, z = 1
        // 같은 값일 수 있다.
        // 이 좌표는 전체 장면 기준이 아니다.
        // 즉: 팁박스 안에서 어디에 있는가? 를 나타낸다.

        // 그룹의 월드 좌표로 변환
        // 이 부분이 중요하다.
        // localPos는 팁박스 기준 좌표이다.
        // 하지만 피펫이 팁을 장착하려면 장면 전체 기준의 위치가 필요하다.
        // 왜냐하면 피펫 카메라, 실험대, 팁박스는 모두 같은 월드 공간 안에 있기 때문이다.
        // const worldPos = localPos.clone();
        // 먼저 localPos를 복사한다.
        // 원본 localPos를 직접 바꾸지 않기 위해서다.
        // 그 다음: this.localToWorld(worldPos); 현재 객체, 즉 TipBox의 로컬 좌표를
        // 월드 좌표로 변환한다.
        // 예를 들어: 팁박스 자체가 월드 좌표 x = 10 위치에 있음
        // 팁은 팁박스 기준 x = 2 위치에 있음
        // 이면 팁의 월드 좌표는 대략: x = 12가 된다.
        // 즉: localPos = 팁박스 안에서의 위치, worldPos = 전체 3D 장면 안에서의 실제 위치이다.
        const worldPos = localPos.clone();
        this.localToWorld(worldPos);

        // 인스턴스를 멀리 보내서 안 보이게 (scale 0보다 위치 이동이 안전)
        // 팁을 화면 밖으로 숨기기
        // 팁을 꺼냈으면 팁박스 안에서는 사라져야 한다.
        // 하지만 InstanceMesh에서는 특정 인스턴스 하나만 쉽게 visible = false로 끄는 방식이 일반
        // Mesh처럼 간단하지 않는다.
        // 그래서 이 코드는 해당 팁을 아주 멀리 아래쪽으로 이동시킨다.
        // const hideMatrix = new TREE.Matrix4().makeTranslation(0, -1000, 0);
        // 이 코드는 위치 이동 행렬을 만든다.
        // x = 0, y = -1000, z = 0
        // 즉, 팁을 아래로 엄청 멀리 보내는 것이다.
        // index 번째 팁의 행렬을 hideMatrix로 교체한다.
        // 즉, 방금 꺼낸 팁은 원래 위치에 있지 않고,
        // 0, -1000, 0으로 이동한다.
        // 그래서 화면에서는 사라진 것처럼 보인다.
        // 왜 scale = 0 으로 숨기지 않을까?
        // 팁을 숨기는 다른 방법으로는 크기를 0으로 만드는 방법도 있다.
        // scale = 0, 하지만 이것은 경우에 따라 문제가 생길 수 있다.
        // 예를 들어: 행렬 계산이 이상해짐, 법선 벡터 계산 문제, 그림자 계산 문제, Raycasting 문제, 나중에 복구할 때 scale 정보가 꼬일 가능성
        // 이 있다. 그래서 이 코드에서는 크기를 0으로 만들지 않고, 그냥 화면 밖으로 보내는 방식을 사용한다.
        const hideMatrix = new THREE.Matrix4().makeTranslation(0, -1000, 0);
        this.tipsMesh.setMatrixAt(index, hideMatrix);
        // GPU에 변경사항 반영하기
        // setMatrixAt()으로 인스턴스 위치를 바꿨지만, Three.js는 자동으로 GPU에 바로 반영하지 않을 수 있다.
        // 그래서 반드시:
        // needsUpdate = true
        // 를 설정한다.
        // 이 말은: 인스턴스 행렬이 바뀌었으니 다음 렌더링 때 GPU 버퍼를 업데이트해라
        // 라는 뜻이다.
        // 이 줄이 없으면 팁이 실제로 사라지지 않고 화면에 그대로 남아 있을 수 있다.
        this.tipsMesh.instanceMatrix.needsUpdate = true;

        // 반환값 만들기
        // 이 함수는 단순히 팁을 숨기고 끝나는 것이 아니라, 방금 꺼낸 팁의 정보를 반환한다.
        // 각각 의미는 다음과 같다.
        // worldPosition: worldPos
        // 방금 꺼낸 팁의 월드 좌표이다.
        // 피펫이 이 위치로 이동하거나, 이 위치에서 새 팁 모델을 피펫에 붙이는 데 사용할 수 있다.
        // color: this.spec.tipColor
        // 팁 색상이다.
        // 예를 들어 10µL 팁은 노란색, 1000µL 팁은 파란색처럼 표현할 수 있다.
        // radius: this.spec.tipRadius
        // 팁의 반지름이다.
        // 팁 모델을 새로 만들 때 사용할 수 있다.
        // height: this.spec.tipHeight
        // 팁의 높이이다.
        // 피펫 끝에 장착되는 팁의 길이를 정하는 데 필요하다.
        // sourceIndex: index
        // 원래 몇 번째 팁이었는지 저장한다.
        // 이 값은 나중에 팁을 다시 팁박스에 되돌리거나, 디버깅할 때 유용하다.
        return {
            worldPosition: worldPos,
            color: this.spec.tipColor,
            radius: this.spec.tipRadius,
            height: this.spec.tipHeight,
            sourceIndex: index   // 나중에 되돌리기용 (옵션)
        };
    }

    /**
     * 사용 가능한 팁 개수 (디버그/UI용)
     */
    // 이 함수는 남은 팁 개수를 반환한다.
    // 예를 들어: console.log(tipBox,getRemainingCount());를 실행하면 현재 남은 팁 개수가 나온다.
    // 처음 팁이 12개라면: 12
    // 한 개를 사용하면: 11
    // 두 개를 사용하면: 10 이 된다.
    getRemainingCount() {
        return this._availableIndices.length;
    }

    update(deltaMs) {
        // 향후 확장 (팁 사용/제거 등)
    }
}
