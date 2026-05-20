import * as THREE from 'three';

export default class ThawingScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a24);

        this.states = {
            p200: {
                name: 'P200 Pipette',
                selectedVolume: 200,
                hasTip: false,
                color: 0xffcc00
            },
            p1000: {
                name: 'P1000 Pipette',
                selectedVolume: 1000,
                hasTip: false,
                color: 0x3399ff
            },
            tube1: {
                name: 'Tube 1 (Competent Cell A)',
                isThawed: false,
                thawingProgress: 0,
                volume: 50,
                temperature: -80
            },
            tube2: {
                name: 'Tube 2 (Competent Cell B)',
                isThawed: false,
                thawingProgress: 0,
                volume: 50,
                temperature: -80
            },
            tube5: {
                name: 'Tube 5 (SOC Medium)',
                isThawed: true,
                volume: 1000,
                temperature: 25
            },
            iceBox: {
                name: 'Ice Box',
                temperature: 0
            },
            tipBox: {
                name: 'Tip Box',
                remainingTips: 96
            }
        };

        this.init();
    }

    init() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x222230,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const gridHelper = new THREE.GridHelper(20, 20, 0x3f3f5a, 0x2a2a3a);
        gridHelper.position.y = 0.002;
        this.scene.add(gridHelper);

        this.createIceBox();
        this.createPipettes();
        this.createTipBox();
        this.createTubes();
    }

    createIceBox() {
        const iceBoxGroup = new THREE.Group();
        iceBoxGroup.name = 'iceBoxGroup';
        iceBoxGroup.position.set(-1.5, 0.5, 0);

        const boxMat = new THREE.MeshStandardMaterial({
            color: 0x1e60ff,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        const outerBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.8), boxMat);
        outerBase.name = 'iceBox';
        outerBase.position.y = -0.05;
        outerBase.castShadow = true;
        outerBase.receiveShadow = true;
        iceBoxGroup.add(outerBase);

        const upperRim = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.15, 2.1), boxMat);
        upperRim.name = 'iceBox';
        upperRim.position.y = 0.425;
        upperRim.castShadow = true;
        upperRim.receiveShadow = true;
        iceBoxGroup.add(upperRim);

        const iceGeo = new THREE.BoxGeometry(2.7, 0.6, 1.7, 24, 2, 16);
        const posAttr = iceGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const y = posAttr.getY(i);
            if (y > 0.2) {
                const randomOffset = (Math.random() - 0.5) * 0.12;
                posAttr.setY(i, y + randomOffset);
            }

            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            posAttr.setX(i, x + (Math.random() - 0.5) * 0.04);
            posAttr.setZ(i, z + (Math.random() - 0.5) * 0.04);
        }
        posAttr.needsUpdate = true;
        iceGeo.computeVertexNormals();

        const iceMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.1
        });
        const iceMesh = new THREE.Mesh(iceGeo, iceMat);
        iceMesh.name = 'ice';
        iceMesh.position.y = 0.15;
        iceMesh.castShadow = true;
        iceMesh.receiveShadow = true;
        iceBoxGroup.add(iceMesh);

        const tube1 = this.createEppendorfTube(0xff3366, 0xff5588);
        tube1.name = 'tube1';
        tube1.position.set(-0.5, 0.32, 0.2);
        tube1.rotation.set(0.18, 0, -0.22);
        iceBoxGroup.add(tube1);

        const tube2 = this.createEppendorfTube(0x9933ff, 0xb870ff);
        tube2.name = 'tube2';
        tube2.position.set(0.4, 0.32, -0.2);
        tube2.rotation.set(-0.15, 0, 0.28);
        iceBoxGroup.add(tube2);

        this.scene.add(iceBoxGroup);
    }

    createEppendorfTube(labelColor, liquidColor) {
        const tube = new THREE.Group();

        const plasticMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            transparent: true,
            opacity: 0.5,
            roughness: 0.3,
            metalness: 0.1
        });

        const bodyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 16, 1, true);
        const bodyMesh = new THREE.Mesh(bodyGeo, plasticMat);
        tube.add(bodyMesh);

        const coneGeo = new THREE.ConeGeometry(0.06, 0.12, 16, 1, true);
        coneGeo.rotateX(Math.PI);
        const coneMesh = new THREE.Mesh(coneGeo, plasticMat);
        coneMesh.position.y = -0.185;
        tube.add(coneMesh);

        const lidGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16);
        const lidMesh = new THREE.Mesh(lidGeo, plasticMat);
        lidMesh.position.y = 0.135;
        tube.add(lidMesh);

        const liquidMat = new THREE.MeshStandardMaterial({
            color: liquidColor,
            transparent: true,
            opacity: 0.8,
            roughness: 0.2
        });

        const liqConeGeo = new THREE.ConeGeometry(0.055, 0.11, 16);
        liqConeGeo.rotateX(Math.PI);
        const liqConeMesh = new THREE.Mesh(liqConeGeo, liquidMat);
        liqConeMesh.position.y = -0.18;
        tube.add(liqConeMesh);

        const liqBodyGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16);
        const liqBodyMesh = new THREE.Mesh(liqBodyGeo, liquidMat);
        liqBodyMesh.position.y = -0.085;
        tube.add(liqBodyMesh);

        const labelGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.06, 16);
        const labelMat = new THREE.MeshStandardMaterial({
            color: labelColor,
            roughness: 0.6
        });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.y = 0.03;
        tube.add(labelMesh);

        tube.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return tube;
    }

    createPipettes() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 });
        const tipConeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const p200Group = new THREE.Group();
        p200Group.name = 'p200';
        p200Group.position.set(-4, 0.8, -1.5);

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16), bodyMat);
        p200Group.add(body);

        const knobGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3 });
        const knob = new THREE.Mesh(knobGeo, knobMat);
        knob.position.y = 0.65;
        p200Group.add(knob);

        const tipConeGeo = new THREE.CylinderGeometry(0.04, 0.01, 0.3, 16);
        const tipCone = new THREE.Mesh(tipConeGeo, tipConeMat);
        tipCone.position.y = -0.7;
        p200Group.add(tipCone);

        p200Group.rotation.x = Math.PI / 12;
        p200Group.traverse(this.enableShadows);
        this.scene.add(p200Group);

        const p1000Group = new THREE.Group();
        p1000Group.name = 'p1000';
        p1000Group.position.set(-3, 0.85, -1.5);

        const bodyLarge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.3, 16), bodyMat);
        p1000Group.add(bodyLarge);

        const knobGeoLarge = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 16);
        const knobMatLarge = new THREE.MeshStandardMaterial({ color: 0x3399ff, roughness: 0.3 });
        const knobLarge = new THREE.Mesh(knobGeoLarge, knobMatLarge);
        knobLarge.position.y = 0.7;
        p1000Group.add(knobLarge);

        const tipConeGeoLarge = new THREE.CylinderGeometry(0.05, 0.015, 0.35, 16);
        const tipConeLarge = new THREE.Mesh(tipConeGeoLarge, tipConeMat);
        tipConeLarge.position.y = -0.75;
        p1000Group.add(tipConeLarge);

        p1000Group.rotation.x = Math.PI / 12;
        p1000Group.traverse(this.enableShadows);
        this.scene.add(p1000Group);
    }

    createTipBox() {
        const tipBoxGroup = new THREE.Group();
        tipBoxGroup.name = 'tipBox';
        tipBoxGroup.position.set(2, 0.4, -1.5);

        const baseMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.2), baseMat);
        tipBoxGroup.add(base);

        const plateMat = new THREE.MeshStandardMaterial({ color: 0x00ccaa, roughness: 0.2 });
        const plate = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.05, 1.18), plateMat);
        plate.position.y = 0.3;
        tipBoxGroup.add(plate);

        const tipGeo = new THREE.CylinderGeometry(0.015, 0.005, 0.15, 8);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.3 });

        for (let x = -0.6; x <= 0.6; x += 0.2) {
            for (let z = -0.4; z <= 0.4; z += 0.2) {
                const tipMesh = new THREE.Mesh(tipGeo, tipMat);
                tipMesh.position.set(x, 0.38, z);
                tipBoxGroup.add(tipMesh);
            }
        }

        tipBoxGroup.traverse(this.enableShadows);
        this.scene.add(tipBoxGroup);
    }

    createTubes() {
        const tube5Group = new THREE.Group();
        tube5Group.name = 'tube5';
        tube5Group.position.set(2, 0.25, 1.2);

        const tube5Mat = new THREE.MeshStandardMaterial({
            color: 0xff9900,
            roughness: 0.3,
            metalness: 0.1
        });
        const tube5Body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.6, 16), tube5Mat);
        tube5Group.add(tube5Body);

        const tube5CapMat = new THREE.MeshStandardMaterial({ color: 0xe65c00, roughness: 0.3 });
        const tube5Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), tube5CapMat);
        tube5Cap.position.y = 0.32;
        tube5Group.add(tube5Cap);

        tube5Group.traverse(this.enableShadows);
        this.scene.add(tube5Group);
    }

    enableShadows(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    }

    getScene() {
        return this.scene;
    }

    update() {
        const tube1 = this.states.tube1;
        if (tube1.thawingProgress > 0 && tube1.thawingProgress < 100) {
            tube1.temperature = -80 + (tube1.thawingProgress / 100) * 80;
            tube1.isThawed = tube1.temperature >= 0;
        }
    }
}
