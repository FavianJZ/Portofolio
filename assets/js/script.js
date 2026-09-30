// Typing Effect
const typingText = document.getElementById('typing-effect');
const phrases = [
    "Mahasiswa Ilmu Komputer.",
    "Pengembang Web.",
    "Peminat AI & Machine Learning.",
    "Desainer UI/UX.",
    "Pecinta Teknologi Pendidikan."
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    if (!typingText) return;

    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
        typingText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => isDeleting = true, 2200);
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
    }

    const typingSpeed = isDeleting ? 80 : 150;
    setTimeout(type, typingSpeed);
}

// Interactive Project Card Sliders
function initProjectSliders() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        const container = card.querySelector('.project-image-container');
        if (!container) return;

        const images = container.querySelectorAll('.project-image');
        if (images.length <= 1) return;

        let currentIndex = 0;
        let slideInterval = null;

        // Create interactive dots container
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'slider-dots';

        images.forEach((_, idx) => {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute('type', 'button');
            dot.setAttribute('aria-label', `Lihat gambar ${idx + 1}`);
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                goToSlide(idx);
                resetAutoSlide();
            });
            dotsContainer.appendChild(dot);
        });

        // Prev & Next navigation buttons
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-nav-btn slider-nav-prev';
        prevBtn.setAttribute('type', 'button');
        prevBtn.setAttribute('aria-label', 'Gambar sebelumnya');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide((currentIndex - 1 + images.length) % images.length);
            resetAutoSlide();
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-nav-btn slider-nav-next';
        nextBtn.setAttribute('type', 'button');
        nextBtn.setAttribute('aria-label', 'Gambar selanjutnya');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide((currentIndex + 1) % images.length);
            resetAutoSlide();
        });

        container.appendChild(dotsContainer);
        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        function goToSlide(index) {
            images[currentIndex].classList.remove('active');
            if (dotsContainer.children[currentIndex]) {
                dotsContainer.children[currentIndex].classList.remove('active');
            }

            currentIndex = index;

            images[currentIndex].classList.add('active');
            if (dotsContainer.children[currentIndex]) {
                dotsContainer.children[currentIndex].classList.add('active');
            }
        }

        function startAutoSlide() {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(() => {
                goToSlide((currentIndex + 1) % images.length);
            }, 4500);
        }

        function resetAutoSlide() {
            if (slideInterval) clearInterval(slideInterval);
            startAutoSlide();
        }

        // Pause on hover so the user can inspect screenshots comfortably
        container.addEventListener('mouseenter', () => {
            if (slideInterval) clearInterval(slideInterval);
        });

        container.addEventListener('mouseleave', () => {
            startAutoSlide();
        });

        startAutoSlide();
    });
}

// Scroll Reveal
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealElements.forEach(el => {
        if (el.closest('#hero')) {
            el.classList.add('visible');
        } else {
            revealObserver.observe(el);
        }
    });
}

// Mobile Hamburger Menu
function initHamburgerMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if (!menuToggle || !navLinks) return;

    const navLinkItems = navLinks.querySelectorAll('a');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });

    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    document.addEventListener('click', (event) => {
        const isClickInsideMenu = navLinks.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (navLinks.classList.contains('active') && !isClickInsideMenu && !isClickOnToggle) {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
}

// Back To Top
function initBackToTopButton() {
    const backToTopButton = document.querySelector('.back-to-top');
    if (!backToTopButton) return;

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

// 3D Three.js Background Particle Wave
function init3DBackground() {
    const canvas = document.querySelector('#bg');
    if (!canvas || typeof THREE === 'undefined') return;

    let scene, camera, renderer, plane, mouse, mouseWorld;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    mouse = new THREE.Vector2(-999, -999);
    mouseWorld = new THREE.Vector3();

    const planeGeometry = new THREE.PlaneGeometry(420, 420, 65, 45);
    const material = new THREE.PointsMaterial({ 
        color: 0x40fb9d, 
        size: 1.2, 
        transparent: true, 
        opacity: 0.7 
    });
    plane = new THREE.Points(planeGeometry, material);
    plane.rotation.x = -Math.PI / 4;
    scene.add(plane);

    camera.position.z = 65;

    const originalVertices = plane.geometry.attributes.position.clone();

    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });

    let frame = 0;

    function animate() {
        requestAnimationFrame(animate);
        frame += 0.012;

        mouseWorld.set(mouse.x, mouse.y, 0.5);
        mouseWorld.unproject(camera);
        const dir = mouseWorld.sub(camera.position).normalize();
        const denom = Math.abs(dir.z) < 0.0001 ? 0.0001 : dir.z;
        const distance = -camera.position.z / denom;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        const positions = plane.geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = originalVertices.getX(i);
            const y = originalVertices.getY(i);

            const waveX = Math.sin(x * 0.08 + frame) * 4.5;
            const waveY = Math.cos(y * 0.08 + frame) * 4.5;
            let z = waveX + waveY;

            const dx = x - pos.x;
            const dy = y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ripple = Math.max(0, 45 - dist);
            z += ripple * 0.8;

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
