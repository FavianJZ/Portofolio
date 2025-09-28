const typingText = document.getElementById('typing-effect');
const phrases = [
    "Mahasiswa Ilmu Komputer.",
    "Pengembang Web.",
    "Desainer UI/UX.",
    "Pecinta Teknologi Pendidikan."
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
        typingText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => isDeleting = true, 2000);
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
    }

    const typingSpeed = isDeleting ? 100 : 200;
    setTimeout(type, typingSpeed);
}

function initProjectSliders() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        const images = card.querySelectorAll('.project-image');
        if (images.length <= 1) return;

        let currentIndex = 0;

        setInterval(() => {
            images[currentIndex].classList.remove('active');
            
            currentIndex++;
            if (currentIndex >= images.length) {
                currentIndex = 0;
            }

            images[currentIndex].classList.add('active');
        }, 4000);
    });
}

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        if (el.closest('#hero')) {
            el.classList.add('visible');
        } else {
            revealObserver.observe(el);
        }
    });
}

function initHamburgerMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const navLinkItems = navLinks.querySelectorAll('a');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    document.addEventListener('click', (event) => {
        const isClickInsideMenu = navLinks.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (navLinks.classList.contains('active') && !isClickInsideMenu && !isClickOnToggle) {
            navLinks.classList.remove('active');
        }
    });
}

function initBackToTopButton() {
    const backToTopButton = document.querySelector('.back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function init3DBackground() {
    let scene, camera, renderer, plane, mouse, mouseWorld;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    mouse = new THREE.Vector2();
    mouseWorld = new THREE.Vector3();

    const planeGeometry = new THREE.PlaneGeometry(400, 400, 70, 50);
    const material = new THREE.PointsMaterial({ color: 0x00FF77, size: 2 });
    plane = new THREE.Points(planeGeometry, material);
    plane.rotation.x = -Math.PI / 4;
    scene.add(plane);

    camera.position.z = 150;

    const originalVertices = plane.geometry.attributes.position.clone();

    document.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    });

    let frame = 0;

    function animate() {
        requestAnimationFrame(animate);
        frame += 0.01;

        mouseWorld.set(mouse.x, mouse.y, 0.5);
        mouseWorld.unproject(camera);
        const dir = mouseWorld.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        const positions = plane.geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = originalVertices.getX(i);
            const y = originalVertices.getY(i);

            const waveX = Math.sin(x * 0.1 + frame) * 5;
            const waveY = Math.cos(y * 0.1 + frame) * 5;
            let z = waveX + waveY;

            const dx = x - pos.x;
            const dy = y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ripple = Math.max(0, 50 - dist);
            z += ripple;

            positions.setZ(i, z);
        }

        positions.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    type();
    initProjectSliders();
    initHamburgerMenu();
    initScrollReveal();
    initBackToTopButton();
    init3DBackground();
});
