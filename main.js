import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
gsap.registerPlugin(ScrollTrigger);

function createSection(trigger, extra = {}) {
    return gsap.timeline({
        scrollTrigger: {
            trigger: trigger,
            start: "top top",
            end: "+=100%",
            markers: false,
            scrub: 1,
            totalDuration: 20,
            ...extra
        }
    })
}
const tl1 = createSection("#box-1");
const tl2 = createSection("#cake-2", {
    onUpdate: self => {
        accelTarget = Math.min(1 + self.progress * 10, 6);
    }
});
const tl3 = createSection("#out-3");
const tl4 = createSection("#mems-4");
const tl5 = createSection("#out-5");
const tl6 = createSection("#letter-6");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6f6ed);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.6, 0.3);

const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('#bg')});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

let accel = 1;
let accelTarget = 1;
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLights = new THREE.Group();
const dir1 = new THREE.DirectionalLight(0xffffff, 4);
const dir2 = dir1;
const dir3 = dir2;
dir1.position.set(-10, -5, 0);
dir2.position.set(0, 11, 0);
dir3.position.set(9, -6, 0);
dirLights.add(dir1, dir2, dir3);
scene.add(dirLights);

function garbo(obj) {
    scene.remove(obj);
    if(obj.geometry) obj.geometry.dispose();
    obj.material.dispose();
}

const ribbonGroup = new THREE.Group();
scene.add(ribbonGroup);
const L = 10;
const P = 700; // Quantity of Pieces (=> Detail)
const step = L / P;
const WIDTH = 0.008;
const HEIGHT = 0.055;
const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa097f,
    metalness: 0.5,
    side: THREE.DoubleSide
});
const ribbonPieces = [];
for (let i = 0; i < P; i++) {
    const geo = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    geo.translate(0, HEIGHT/3, 0);

    const mesh = new THREE.Mesh(geo, ribbonMaterial);
    
    const R = 0.4;
    mesh.position.setY(R - i * step);
    ribbonGroup.add(mesh);
    ribbonPieces.push(mesh);
}
ribbonPieces.forEach(p => {
    p.scale.set(1, 0.001, 1);
});

const modLoader = new GLTFLoader();

let balloonModel;
modLoader.load('assets/balloon/balloon_numbers.gltf', (gltf) => {
    balloonModel = gltf.scene;
    balloonModel.position.set(0.04, -0.5, -0.7);
    scene.add(balloonModel);
    tl3.to(balloonModel.position, {
        y:1.5,
        duration:20
    }, "<");
}, undefined, (error) => {
    console.error(error);
});

let cakeModel;
modLoader.load('assets/cake/cake.glb', (gltf) => {
    cakeModel = gltf.scene;
    cakeModel.position.set(0, -0.1, -0.1);
    cakeModel.rotation.set(Math.PI/8, 0, 0);
    cakeModel.scale.set(0.095, 0.095, 0.095);
    scene.add(cakeModel);

    const candleLight = new THREE.PointLight(0xffb45e, 1.5, 3, 2);
    candleLight.position.set(0, 3.31909, 0);
    candleLight.intensity = 0.05;
    cakeModel.add(candleLight);
    
    // BOX OPENING
    tl1.to("#ribbon", { scale:0, opacity:0, duration: 9.5, delay:0.5 })
        .to("#mflap", { y:500, opacity:0, width:10, duration:10 })
        .to("#lflap", { x:-100, opacity:0, duration:10 }, "<")
        .to("#rflap", { x:100, opacity:0, duration:10 }, "<");
    // VERTICAL LINE
    ribbonGroup.position.setY(1);
    ribbonPieces.forEach((p, i) => {
        tl1.to(p.scale, {
            y: 1,
        }, i * 0.03); // tween (staggering)
    });

    // CAKE ROTATION
    const CAKE_FREQUENCY = 0.4;
    const HORIZONTAL = 0.12;
    ribbonPieces.forEach((p, i) => {
        tl2.to(p.position, {
            x: Math.sin(i * CAKE_FREQUENCY) * HORIZONTAL, // HORIZONTAL = WIDTH
            z: Math.cos(i * CAKE_FREQUENCY) * HORIZONTAL, // HORIZONTAL = DEPTH
            duration: 20,
            ease: "power2.inOut"
        }, "<");
    });
    // Camera Panning
    tl2.to(camera.position, { x:0, y:0, z:0.4, duration:20 }, "<");

    // CAKE -> MEMORIES
    const MEM_FREQUENCY = 0.09;
    ribbonPieces.forEach((p, i) => {
        tl3.to(p.position, {
            x: -Math.sin(i * MEM_FREQUENCY) * 0.55,
            z: 0,
            duration: 20,
            ease: "power2.inOut"
        }, "<");
    });
    tl3.to(cakeModel.position, {
        y:1,
        duration:20
    }, "<").to(ribbonGroup.position, {
        y:1,
        duration:20
    }, "<").to(camera.position, {
        x:0,
        z:0.8,
        duration:20
    }, "<");

    tl4.to(ribbonGroup.position, {
        y:2.2,
        duration:20
    });
}, undefined, (error) => {
    console.error(error);
});

addEventListener("beforeunload", (event) => {
    window.scrollTo(0, 0);
    // reset letter click
});

const envelope = document.querySelector('.envelope-wrapper');
envelope.classList.toggle('flap');
envelope.addEventListener('click', () => {
    envelope.classList.toggle('flap');
});
document.addEventListener('keyup', event => {
    if(event.code === 'Space') {
        envelope.classList.toggle('flap');
    }
});

const tempVec = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

function animate() {
    for (let i = 0; i < ribbonPieces.length - 1; i++) {
        const curr = ribbonPieces[i];
        const next = ribbonPieces[i + 1];

        // Direction along the ribbon
        tempVec.subVectors(next.position, curr.position).normalize();

        // Rotate so Y axis follows tangent
        curr.quaternion.setFromUnitVectors(up, tempVec);
    }

    camera.lookAt(0, 0, 0);

    accel += (accelTarget - accel) * 0.08;
    dirLights.rotation.x += 0.01 * accel;
    dir1.lookAt(0, 0, 0);
    dir2.lookAt(0, 0, 0);
    dir3.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);