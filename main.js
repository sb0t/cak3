import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#scroll",
        start: "top top",
        end: "bottom bottom",
        markers: true,
        scrub: 1
    }
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.6, 0.3);

const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('#bg')});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 4);
dirLight.position.set(10, 5, 0);
scene.add(dirLight);

const ribbonGroup = new THREE.Group();
scene.add(ribbonGroup);
const PIECES = 200;
const WIDTH = 0.008;
const HEIGHT = 0.06;
const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    side: THREE.DoubleSide
});
const RIBBON_UP = new THREE.Vector3(0, 0, 1);
const ribbonPieces = [];
for (let i = 0; i < PIECES; i++) {
    const geo = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    geo.translate(0, HEIGHT / 2, 0);

    const mesh = new THREE.Mesh(geo, ribbonMaterial);

    const OVERLAP = 0.6; // < 1 = overlap, > 1 = gaps

    mesh.position.set(0, 0.5 - i * HEIGHT * OVERLAP, 0);
    ribbonGroup.add(mesh);
    ribbonPieces.push(mesh);
}
ribbonPieces.forEach(p => {
    p.scale.set(1, 0.001, 1);
});

let model;
const mats = [];
const loader = new GLTFLoader();
loader.load('assets/scene.gltf', (gltf) => {
    model = gltf.scene;
    model.position.set(0, 0.04, 0);
    model.rotation.set(Math.PI/8, 0, 0);
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                map: child.material.map,
                roughness: 0.6,
                metalness: 0.0,
            });
            child.material.needsUpdate = true;
            child.material.transparent = true;
            child.material.opacity = 0;
            mats.push(child.material);
        }
    });
    scene.add(model);
    // BOX OPENING
    // HERE ADD THE 3D ROPE GOING FROM SCALE 0 to BIG FROM THE CENTER (RIGHT AFTER RIBBON KNOT IS UNDONE)
    tl.to("#ribbon", { scale:0, opacity:0, duration: 1, delay:0.5 })
        .to("#lflap", { x:-100, opacity:0, duration:1 })
        .to("#rflap", { x:100, opacity:0, duration:1 }, "<");
    // VERTICAL LINE
    ribbonPieces.forEach((p, i) => {
        tl.to(p.scale, {
            y: 1,
        }, i * 0.03);
    });
    // CAKE ROTATION
    ribbonPieces.forEach((p, i) => {
        tl.to(p.position, {
            x: Math.sin(i * 0.4) * 0.12,
            z: Math.cos(i * 0.4) * 0.08,
            duration: 1,
            ease: "power2.inOut"
        }, "<");
    });

    // CAKE
    // ADD ROPE LOOPING AROUND CAKE
    tl.to(mats, { opacity:1, duration:0.3, stagger:0.02 });
    tl.to(camera.position, { x:0, y:0, z:0.4, duration:1 }, "<");

    // MEMORY BOXES FLOW DOWN
    // ROPE GOES DOWN (SIN GRAPH FROM ONE MEMORY TO THE OTHER)

    // LETTER UPWARDS CONCAVITY FROM RIGHT TO LEFT AND INTERSECTS ONTO RIBBON -> BOTH SWINGS TO LEFT AND BACK TO CENTER

    // LETTER (4 PANELS: top flap, front piece, back piece and inside letter) OPENS TOP PANEL UP AND INNER LETTER SHOW TEXT WITH "THANKS FOR EVERYTHING" (SCRIPT FONT)
}, undefined, (error) => {
    console.error(error);
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
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);