// src/core/InteractionController.js
// Three.js Raycaster 래퍼. 객체별 hover/click 이벤트 디스패치.

import * as THREE from 'three';

export default class InteractionController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.pointerScreen = { x: 0, y: 0 };
        this.isPointerOver = false;

        // 등록: { id, root, meshes, payload, onHoverEnter, onHoverLeave, onClick }
        this._registrations = [];
        this._currentHover = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.domElement.addEventListener('pointermove', (e) => {
            this.isPointerOver = true;
            const rect = this.domElement.getBoundingClientRect();
            this.pointerScreen.x = e.clientX;
            this.pointerScreen.y = e.clientY;
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });

        this.domElement.addEventListener('pointerleave', () => {
            this.isPointerOver = false;
            this._clearHover();
        });

        this.domElement.addEventListener('click', (e) => {
            if (this._currentHover && this._currentHover.onClick) {
                this._currentHover.onClick(this._currentHover, e);
            }
        });
    }

    /**
     * 인터랙션 대상 등록.
     * @param {object} target - { root, meshes, ... } (씬의 getInteractiveTargets() 결과 한 항목)
     * @param {object} handlers - { onHoverEnter, onHoverLeave, onClick }
     */
    register(target, handlers = {}) {
        this._registrations.push({
            ...target,
            onHoverEnter: handlers.onHoverEnter || null,
            onHoverLeave: handlers.onHoverLeave || null,
            onClick: handlers.onClick || null
        });
    }

    registerAll(targets, handlers = {}) {
        for (const t of targets) {
            this.register(t, handlers);
        }
    }

    update() {
        if (!this.isPointerOver) return;

        // 모든 등록의 mesh를 평탄화 + mesh→registration 매핑
        const allMeshes = [];
        const meshToReg = new Map();
        for (const reg of this._registrations) {
            for (const m of reg.meshes) {
                if (m.userData.skipInteraction) continue;
                allMeshes.push(m);
                meshToReg.set(m, reg);
            }
        }

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(allMeshes, false);

        if (intersects.length === 0) {
            this._clearHover();
            return;
        }

        const hitReg = meshToReg.get(intersects[0].object);
        if (!hitReg) {
            this._clearHover();
            return;
        }

        if (this._currentHover !== hitReg) {
            this._clearHover();
            this._currentHover = hitReg;
            if (hitReg.onHoverEnter) {
                hitReg.onHoverEnter(hitReg);
            }
        }
    }

    _clearHover() {
        if (this._currentHover && this._currentHover.onHoverLeave) {
            this._currentHover.onHoverLeave(this._currentHover);
        }
        this._currentHover = null;
    }

    getPointerScreen() {
        return this.pointerScreen;
    }

    getCurrentHover() {
        return this._currentHover;
    }
}
