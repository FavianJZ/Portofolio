/* ============================================
   SPACE ODYSSEY PORTFOLIO — Three.js + GLB Models
   ============================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// ─── Scene Setup ───
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
camera.position.set(0, 0, 8);

// ─── Lighting ───
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
mainLight.position.set(5, 5, 5);
scene.add(mainLight);

const cyanLight = new THREE.PointLight(0x00f0ff, 0.8, 20);
cyanLight.position.set(-3, 2, 4);
scene.add(cyanLight);

const blueLight = new THREE.PointLight(0x38bdf8, 0.8, 30);
blueLight.position.set(4, -1, 5);
scene.add(blueLight);

// ─── Starfield Particles ───
const starGeo = new THREE.BufferGeometry();
const starCount = 2000;
const starPositions = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 100;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
    starSizes[i] = Math.random() * 2 + 0.5;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

const starMat = new THREE.PointsMaterial({
    color: 0xe6f1ff,
    size: 0.08,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// ─── Draco & GLTF Loader Setup ───
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
dracoLoader.preload();

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const clock = new THREE.Clock();
const mixers = [];
let spacemanRig = null;
let robotRig = null;

const models = {};
const loadingScreen = document.getElementById('loading-screen');
const loaderFill = document.getElementById('loader-fill');
const loaderPercent = document.getElementById('loader-percent');

// Exact orientation for space shuttle:
// - Pointy nose ("moncong") points diagonally UP-RIGHT into the stars (+X, +Y)
// - Dorsal side (cockpit windows & vertical tail fin) faces camera / viewer (+Z)
// - Belly (black heat shield tiles) faces backwards (-Z)
const ROCKET_BASE_ROT = {
    x: 2.06,
    y: 2.41,
    z: -0.34
};

// Helper: Calculate exact Three.js world Y for any section based on its DOM position
function getSectionWorldY(sectionId) {
    const el = document.getElementById(sectionId);
    if (!el) return 0;
    const max = totalHeight();
    if (max <= 0) return 0;
    // Calculate scroll offset when section is centered on screen
    const elCenterScroll = el.offsetTop - (window.innerHeight - el.offsetHeight) / 2;
    const progress = Math.max(0, Math.min(1, elCenterScroll / max));
    return -progress * 70;
}

const modelList = [
    // Hero Zone: Space Shuttle floating beside profile, nose pointing diagonally up-right
    { name: 'rocket', path: 'assets/models/rocket.glb', scale: 0.0030, pos: [4.4, 0.6, 1.4], rotX: ROCKET_BASE_ROT.x, rotY: ROCKET_BASE_ROT.y, rotZ: ROCKET_BASE_ROT.z },
    { name: 'planet1', path: 'assets/models/planet_1.glb', scale: 0.75, pos: [-8.0, 2.0, -14], rotY: 0, center: true },

    // About Zone: 3D Astronaut character floating in the dedicated right-hand stage
    { name: 'spaceman', path: 'assets/models/spaceman.glb', scale: 0.80, pos: [3.8, -10.0, 1.4], rotY: 0.4, center: true },
    { name: 'planet2', path: 'assets/models/planet_2.glb', scale: 0.65, pos: [-8.5, -10.0, -14], rotY: 0, center: true },

    // Experience Zone: 3D Flying Saucer hovering in the dedicated left-hand stage
    { name: 'ufo', path: 'assets/models/ufo.glb', scale: 0.45, pos: [-3.8, -20.0, 1.4], rotX: 0.35, rotY: 0, center: true },
    { name: 'planet3', path: 'assets/models/planet_3.glb', scale: 0.65, pos: [8.5, -20.0, -14], rotY: 0, center: true },

    // Skills Zone: 3D Cyber Robot assistant floating in the dedicated right-hand stage
    { name: 'robot', path: 'assets/models/robot.glb', scale: 3.2, pos: [3.8, -35.0, 1.4], rotY: -0.3, center: true },
    { name: 'planet4', path: 'assets/models/planet_4.glb', scale: 0.07, pos: [-8.5, -35.0, -14], rotY: 0, center: true },

    // Projects Zone: Space Academy Celestial World
    { name: 'planet5', path: 'assets/models/planet_5.glb', scale: 0.65, pos: [8.5, -50.0, -14], rotY: 0, center: true },

    // Contact Zone: Frontier planet at the edge of the universe
    { name: 'planet6', path: 'assets/models/planet_6.glb', scale: 0.70, pos: [-8.0, -65.0, -14], rotY: 0, center: true },
];

let loadedCount = 0;
const totalModels = modelList.length;

// Space Academy Rig Helper
function createRigPart(root, ...boneNames) {
    for (const name of boneNames) {
        const obj = root.getObjectByName(name);
        if (obj) {
            return {
                bone: obj,
                baseRotation: obj.rotation.clone()
            };
        }
    }
    return null;
}

function applyBoneRotation(part, x, y, z, response) {
    if (!part || !part.bone) return;
    part.bone.rotation.x = THREE.MathUtils.lerp(part.bone.rotation.x, part.baseRotation.x + x, response);
    part.bone.rotation.y = THREE.MathUtils.lerp(part.bone.rotation.y, part.baseRotation.y + y, response);
    part.bone.rotation.z = THREE.MathUtils.lerp(part.bone.rotation.z, part.baseRotation.z + z, response);
}

function smoothRange(value, start, end) {
    return THREE.MathUtils.smootherstep(value, start, end);
}

function loadModels() {
    return Promise.all(modelList.map(item => {
        return new Promise((resolve) => {
            loader.load(item.path, (gltf) => {
                const model = gltf.scene;
                let rootObj = model;

                // 1. Embedded glTF Animations (UFO tractor beam, Robot articulation, Planet 4 core)
                if (gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    gltf.animations.forEach((clip) => {
                        const action = mixer.clipAction(clip);
                        action.setLoop(THREE.LoopRepeat, Infinity);
                        action.play();
                    });
                    mixers.push(mixer);
                }

                // 2. Space Academy Procedural Skeleton Rigging for Spaceman
                if (item.name === 'spaceman') {
                    spacemanRig = {
                        hips: createRigPart(model, 'Hips'),
                        spine: createRigPart(model, 'Spine'),
                        head: createRigPart(model, 'Head'),
                        armLeft: createRigPart(model, 'Arm.L', 'ArmL'),
                        armRight: createRigPart(model, 'Arm.R', 'ArmR'),
                        legLeft: createRigPart(model, 'Leg.L', 'LegL'),
                        legRight: createRigPart(model, 'Leg.R', 'LegR'),
                    };
                }

                // 3. Space Academy Procedural Articulation for Robot
                if (item.name === 'robot') {
                    robotRig = {
                        mouth: model.getObjectByName('Mouth'),
                        leftHand: model.getObjectByName('Hand origin'),
                        rightHand: model.getObjectByName('Hand origin.002'),
                    };
                }

                if (item.center) {
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);
                    const group = new THREE.Group();
                    group.add(model);
                    rootObj = group;
                }

                rootObj.scale.setScalar(item.scale);
                rootObj.position.set(...item.pos);
                if (item.rotX !== undefined) rootObj.rotation.x = item.rotX;
                if (item.rotY) rootObj.rotation.y = item.rotY;
                if (item.rotZ !== undefined) rootObj.rotation.z = item.rotZ;

                // Enable shadows/better rendering & UFO custom color
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // UFO custom recoloring (make body sleek silver/cyan so it pops out and doesn't blend into dark galaxy)
                        if (item.name === 'ufo') {
                            const origMat = Array.isArray(child.material) ? child.material[0] : child.material;
                            const mat = origMat ? origMat.clone() : new THREE.MeshStandardMaterial();
                            mat.map = null; // Detach dark texture

                            if (child.name === 'Object_7' || child.name === 'Object_8' || origMat?.name === 'PaletteMaterial001') {
                                // Saucer Hull: Sleek metallic silver/platinum with subtle cyan reflection
                                mat.color.set(0xccdcf0);
                                mat.metalness = 0.85;
                                mat.roughness = 0.25;
                                mat.emissive.set(0x102b48);
                                mat.emissiveIntensity = 0.35;
                            } else if (child.name === 'Object_9' || origMat?.name === 'PaletteMaterial002') {
                                // Cockpit Dome: Luminous cyber-cyan energy shield
                                mat.color.set(0x00f5ff);
                                mat.metalness = 0.1;
                                mat.roughness = 0.15;
                                mat.emissive.set(0x00d8ff);
                                mat.emissiveIntensity = 0.85;
                            } else if (child.name === 'Object_10' || origMat?.name === 'PaletteMaterial003') {
                                // Tractor Beam Rings: Luminous electric cyan pulse
                                mat.color.set(0x70d8ff);
                                mat.metalness = 0.2;
                                mat.roughness = 0.3;
                                mat.emissive.set(0x0099cc);
                                mat.emissiveIntensity = 0.9;
                            } else if (child.name === 'Object_11' || origMat?.name === 'PaletteMaterial004') {
                                // Perimeter Beacon Lights: Vibrant neon cyan dots
                                mat.color.set(0x00ffff);
                                mat.emissive.set(0x00ffff);
                                mat.emissiveIntensity = 2.0;
                            }

                            mat.envMapIntensity = 1.5;
                            mat.needsUpdate = true;
                            child.material = mat;
                        } else if (child.material) {
                            child.material.envMapIntensity = 1;
                        }
                    }
                });

                scene.add(rootObj);
                models[item.name] = rootObj;
                window.models = models;
                window.scene = scene;
                window.camera = camera;

                loadedCount++;
                const pct = Math.round((loadedCount / totalModels) * 100);
                if (loaderFill) loaderFill.style.width = pct + '%';
                if (loaderPercent) loaderPercent.textContent = pct + '%';

                resolve();
            }, undefined, () => {
                // On error, still count it
                loadedCount++;
                const pct = Math.round((loadedCount / totalModels) * 100);
                if (loaderFill) loaderFill.style.width = pct + '%';
                if (loaderPercent) loaderPercent.textContent = pct + '%';
                resolve();
            });
        });
    }));
}

// ─── Space Academy Procedural Animations ───
function updateSpacemanProceduralAnimation(time, delta) {
    if (!spacemanRig || !spacemanRig.head) return;
    const response = 1 - Math.exp(-delta * 9);

    const breath = Math.sin(time * 1.25);
    const headTurn = Math.sin(time * 0.62);
    const weightShift = Math.sin(time * 0.72);
    const idleCycle = time % 12;

    const puzzledShrug = smoothRange(idleCycle, 3.7, 4.35) * (1 - smoothRange(idleCycle, 5.8, 6.5));
    const thoughtfulHand = smoothRange(idleCycle, 6.1, 6.65) * (1 - smoothRange(idleCycle, 8, 8.65));
    const toeTap = smoothRange(idleCycle, 8.3, 8.8) * (1 - smoothRange(idleCycle, 10.4, 10.9));
    const toeTapBeat = toeTap * (0.5 + Math.sin(time * 5.4) * 0.5);

    applyBoneRotation(spacemanRig.hips,
        breath * 0.01 + toeTapBeat * 0.012,
        weightShift * 0.012,
        weightShift * 0.022 + puzzledShrug * 0.018,
        response
    );
    applyBoneRotation(spacemanRig.spine,
        breath * 0.018 - puzzledShrug * 0.025,
        headTurn * 0.016 + thoughtfulHand * 0.035,
        -weightShift * 0.018 - puzzledShrug * 0.05 + thoughtfulHand * 0.025,
        response
    );
    applyBoneRotation(spacemanRig.head,
        breath * 0.02 + puzzledShrug * 0.02,
        headTurn * 0.085 - thoughtfulHand * 0.08,
        headTurn * 0.018 - puzzledShrug * 0.1 + thoughtfulHand * 0.08,
        response
    );
    applyBoneRotation(spacemanRig.armLeft,
        breath * 0.01 - puzzledShrug * 0.1,
        -puzzledShrug * 0.06,
        0.025 + puzzledShrug * 0.56 + weightShift * 0.025,
        response
    );
    applyBoneRotation(spacemanRig.armRight,
        -breath * 0.01 - puzzledShrug * 0.1 - thoughtfulHand * 0.12,
        thoughtfulHand * 0.1,
        -0.025 - puzzledShrug * 0.56 - thoughtfulHand * 0.74 - weightShift * 0.025,
        response
    );
    applyBoneRotation(spacemanRig.legLeft,
        weightShift * 0.042 - toeTapBeat * 0.012,
        headTurn * 0.01,
        -0.012 - weightShift * 0.028,
        response
    );
    applyBoneRotation(spacemanRig.legRight,
        -weightShift * 0.042 + toeTapBeat * 0.11,
        -headTurn * 0.01,
        0.012 + weightShift * 0.028 + toeTap * 0.018,
        response
    );
}

function updateRobotProceduralAnimation(time, delta) {
    if (!robotRig) return;
    const t = time;
    if (robotRig.mouth) {
        const mouthOpen = 0.98 + Math.sin(t * 2) * 0.015;
        robotRig.mouth.scale.y = THREE.MathUtils.lerp(robotRig.mouth.scale.y, mouthOpen, 0.12);
    }
}

// ─── Scroll-Driven Camera & Parallax ───
let scrollProgress = 0;
const totalHeight = () => document.body.scrollHeight - window.innerHeight;

window.addEventListener('scroll', () => {
    const max = totalHeight();
    scrollProgress = max > 0 ? window.scrollY / max : 0;
});

function updateSceneOnScroll(time, delta) {
    // Camera descends through space as user scrolls
    camera.position.y = -scrollProgress * 70;
    camera.position.z = 8 + scrollProgress * 2;

    // Gentle camera sway
    camera.position.x = Math.sin(time * 0.2) * 0.3;
    camera.rotation.z = Math.sin(time * 0.15) * 0.01;

    // Stars parallax — slower
    if (stars) {
        stars.position.y = -scrollProgress * 35;
    }

    // Dynamic section centers in Three.js world space
    const heroY = getSectionWorldY('hero');
    const aboutY = getSectionWorldY('about');
    const expY = getSectionWorldY('experience');
    const skillsY = getSectionWorldY('skills');
    const projY = getSectionWorldY('projects');
    const contactY = getSectionWorldY('contact');

    // Rotate/animate individual models per section (always in sync with their section)
    if (models.rocket) {
        models.rocket.position.y = heroY + 0.6 + Math.sin(time * 0.8) * 0.15;
        models.rocket.position.x = 4.4 + Math.sin(time * 0.5) * 0.08;
        models.rocket.position.z = 1.4;
        models.rocket.rotation.x = ROCKET_BASE_ROT.x + Math.cos(time * 0.5) * 0.02;
        models.rocket.rotation.y = ROCKET_BASE_ROT.y + Math.sin(time * 0.4) * 0.02;
        models.rocket.rotation.z = ROCKET_BASE_ROT.z + Math.sin(time * 0.6) * 0.03;
    }
    if (models.planet1) {
        models.planet1.position.y = heroY + 2.0;
        models.planet1.position.x = -8.0;
        models.planet1.position.z = -14;
    }

    if (models.spaceman) {
        models.spaceman.rotation.y = 0.4 + Math.sin(time * 0.5) * 0.15;
        models.spaceman.rotation.z = Math.sin(time * 0.35) * 0.04;
        models.spaceman.position.y = aboutY + Math.sin(time * 0.7) * 0.2;
        models.spaceman.position.x = 3.8 + Math.sin(time * 0.4) * 0.08;
        models.spaceman.position.z = 1.4;
    }
    if (models.planet2) {
        models.planet2.position.y = aboutY;
        models.planet2.position.x = -8.5;
        models.planet2.position.z = -14;
    }

    if (models.ufo) {
        models.ufo.rotation.y += delta * 0.4;
        models.ufo.position.y = expY + Math.sin(time * 0.8) * 0.25;
        models.ufo.position.x = -3.8 + Math.sin(time * 0.4) * 0.12;
        models.ufo.position.z = 1.4;
    }
    if (models.planet3) {
        models.planet3.position.y = expY;
        models.planet3.position.x = 8.5;
        models.planet3.position.z = -14;
    }

    if (models.robot) {
        models.robot.rotation.y = -0.3 + Math.sin(time * 0.6) * 0.15;
        models.robot.position.y = skillsY + Math.sin(time * 0.7) * 0.2;
        models.robot.position.x = 3.8 + Math.sin(time * 0.5) * 0.08;
        models.robot.position.z = 1.4;
    }
    if (models.planet4) {
        models.planet4.position.y = skillsY;
        models.planet4.position.x = -8.5;
        models.planet4.position.z = -14;
    }

    if (models.planet5) {
        models.planet5.position.y = projY;
        models.planet5.position.x = 8.5;
        models.planet5.position.z = -14;
    }
    if (models.planet6) {
        models.planet6.position.y = contactY;
        models.planet6.position.x = -8.0;
        models.planet6.position.z = -14;
    }

    // Rotate planets slowly in background
    ['planet1', 'planet2', 'planet3', 'planet4', 'planet5', 'planet6'].forEach((name, i) => {
        if (models[name]) {
            models[name].rotation.y += 0.003 + i * 0.001;
        }
    });

    // Dynamic lighting based on scroll
    const hue = scrollProgress * 0.2;
    cyanLight.color.setHSL(0.52 + hue, 1, 0.5);
    cyanLight.position.y = -scrollProgress * 70 + 2;
    blueLight.position.y = -scrollProgress * 70 - 2;
}

// ─── Animation Loop ───
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    const time = clock.getElapsedTime();

    // 1. Update GLTF AnimationMixers (UFO tractor beam/rings, Robot articulation, Planet 4 core)
    for (let i = 0; i < mixers.length; i++) {
        mixers[i].update(delta);
    }

    // 2. Update Space Academy procedural bone / mesh animations
    updateSpacemanProceduralAnimation(time, delta);
    updateRobotProceduralAnimation(time, delta);

    // 3. Update scroll-driven and hovering motions
    updateSceneOnScroll(time, delta);

    // 4. Twinkle stars
    starMat.opacity = 0.6 + 0.2 * Math.sin(time);

    renderer.render(scene, camera);
}

// ─── Window Resize ───
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Initialize ───
loadModels().then(() => {
    setTimeout(() => {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        setTimeout(() => { if (loadingScreen) loadingScreen.style.display = 'none'; }, 800);
    }, 500);
    animate();
});


// ============================================
// NON-THREE.JS UI CODE
// ============================================

// ─── Typing Effect ───
(function initTyping() {
    const roles = ['Web Developer', 'Computer Science Student', 'AI/ML Enthusiast', 'UI/UX Designer', '3D Web Developer', 'Space Explorer 🚀'];
    const el = document.getElementById('typing-role');
    if (!el) return;
    let ri = 0, ci = 0, del = false, speed = 100;
    function type() {
        const r = roles[ri];
        if (del) { el.textContent = r.substring(0, --ci); speed = 40; }
        else { el.textContent = r.substring(0, ++ci); speed = 80; }
        if (!del && ci === r.length) { speed = 2000; del = true; }
        else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; speed = 400; }
        setTimeout(type, speed);
    }
    type();
})();

// ─── Scroll Observers & HUD Navigation ───
(function initObservers() {
    const zones = document.querySelectorAll('.zone');
    const navNodes = document.querySelectorAll('.nav-node');

    function updateNavActive(activeId) {
        navNodes.forEach((node) => {
            const href = node.getAttribute('href');
            if (href === `#${activeId}`) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });
    }

    // Reveal content
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const c = entry.target.querySelector('.zone-content');
                if (c) c.classList.add('visible');
                entry.target.querySelectorAll('.timeline-item, .skill-card, .project-mission, .contact-link').forEach((ch, i) => {
                    setTimeout(() => ch.classList.add('visible'), i * 80);
                });
            }
        });
    }, { threshold: 0.12 });
    zones.forEach(z => revealObs.observe(z));

    // Active section tracking
    const trackObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateNavActive(entry.target.id);
            }
        });
    }, { threshold: 0.35 });
    zones.forEach(z => trackObs.observe(z));

    // Initial active state
    setTimeout(() => updateNavActive('hero'), 300);
})();

// ─── Smooth Nav Scroll ───
document.querySelectorAll('.nav-node').forEach(link => {
    link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ─── Pinned Project Gallery ───
window.switchPinnedImg = function (thumbEl) {
    const mainImg = document.getElementById('pinned-main-img');
    const thumbs = document.querySelectorAll('.gallery-thumbs .thumb');
    if (mainImg && thumbEl) {
        mainImg.style.opacity = '0';
        setTimeout(() => { mainImg.src = thumbEl.src; mainImg.style.opacity = '1'; }, 200);
        thumbs.forEach(t => t.classList.remove('active'));
        thumbEl.classList.add('active');
    }
};

// Auto-rotate
(function () {
    const thumbs = document.querySelectorAll('.gallery-thumbs .thumb');
    if (!thumbs.length) return;
    let idx = 0, iv;
    const go = () => { idx = (idx + 1) % thumbs.length; switchPinnedImg(thumbs[idx]); };
    iv = setInterval(go, 4000);
    const g = document.querySelector('.pinned-mission .mission-gallery');
    if (g) {
        g.addEventListener('mouseenter', () => clearInterval(iv));
        g.addEventListener('mouseleave', () => { iv = setInterval(go, 4000); });
    }
})();

// ─── Mouse Glow on Glass Cards ───
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.glass-card').forEach(card => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) {
            card.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(0,240,255,0.06), transparent 60%), rgba(10,14,39,0.6)`;
        } else {
            card.style.background = '';
        }
    });
});

// ─── Console ───
console.log('%c🚀 SPACE ODYSSEY PORTFOLIO\n%cPowered by Three.js + Your Space Academy 3D Models',
    'color:#00f0ff;font-size:18px;font-weight:bold;', 'color:#b44dff;font-size:12px;');
