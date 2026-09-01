const frameCount = 80;
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d');

const images = [];
let loadedImagesCount = 0;

let currentFrame = 0;
let targetFrame = 0;

// Format frame index as 3-digit padded number matching filename sequence
function getFramePath(index) {
    const paddedIndex = String(index).padStart(3, '0');
    return `assets/images/frames/Person_rotating_and_moving_left_202608101640_gwr_video_mvp_${paddedIndex}.jpg`;
}

// Preload all 80 frame images
function preloadImages() {
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        img.onload = () => {
            loadedImagesCount++;
            if (i === 0) {
                drawFrame(0);
            }
        };
        images.push(img);
    }
}

// Handle window resizing with device pixel ratio scaling
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    drawFrame(currentFrame);
}

// Render canvas frame centered with cover aspect ratio
let lastDrawnIndex = -1;

function drawFrame(frameIndex) {
    const index = Math.min(frameCount - 1, Math.max(0, Math.round(frameIndex)));
    const img = images[index];

    if (!img || !img.complete || img.naturalWidth === 0) return;
    if (index === lastDrawnIndex && currentFrame === targetFrame) return;

    lastDrawnIndex = index;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const canvasAspect = canvas.width / canvas.height;
    const imgAspect = img.naturalWidth / img.naturalHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasAspect > imgAspect) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
    } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
    }

    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = (canvas.height - drawHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Map page scroll position to frame index and update active nav link
function updateTargetFrame() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const maxScroll = scrollHeight - clientHeight;
    const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
    targetFrame = Math.min(frameCount - 1, Math.max(0, scrollFraction * (frameCount - 1)));

    // Highlight active section in navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = [];
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.startsWith('#')) {
            const targetEl = document.querySelector(href);
            if (targetEl) {
                const targetTop = targetEl.getBoundingClientRect().top + scrollTop - 150;
                sections.push({ id: href.substring(1), top: targetTop });
            }
        }
    });

    // Sort sections by actual document position from top to bottom
    sections.sort((a, b) => a.top - b.top);

    let currentSectionId = sections.length > 0 ? sections[0].id : 'home';

    // If scrolled to the end position of the page, activate the final section (About)
    if (maxScroll > 0 && scrollTop >= maxScroll - 40) {
        currentSectionId = sections[sections.length - 1].id;
    } else {
        for (let i = 0; i < sections.length; i++) {
            if (scrollTop >= sections[i].top) {
                currentSectionId = sections[i].id;
            }
        }
    }

    navItems.forEach(item => {
        if (item.getAttribute('href') === `#${currentSectionId}`) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Continuous animation loop using linear interpolation (lerp) for smooth fast motion
function animate() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.001) {
        currentFrame += diff * 0.35;
        drawFrame(currentFrame);
    } else if (currentFrame !== targetFrame) {
        currentFrame = targetFrame;
        drawFrame(currentFrame);
    }
    requestAnimationFrame(animate);
}

// Fast smooth scroll function for navigation links
function smoothScrollTo(targetPosition, duration = 450) {
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const finalTarget = Math.min(Math.max(0, targetPosition), maxScroll);
    const distance = finalTarget - startPosition;
    if (Math.abs(distance) < 2) return;

    let startTime = null;

    function step(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // Ease out quad for fast responsive movement
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);

        window.scrollTo(0, startPosition + distance * easeOutQuad);

        if (timeElapsed < duration) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

// Add smooth click handler for all internal anchor links (nav items, buttons)
function setupNavSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            e.preventDefault();

            let targetPosition = 0;
            if (targetId !== '#home') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const navHeight = 70;
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    targetPosition = Math.min(
                        maxScroll,
                        Math.max(0, targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight)
                    );
                }
            }

            smoothScrollTo(targetPosition, 450);

            if (history.pushState) {
                history.pushState(null, null, targetId);
            }
        });
    });
}

// Setup Skills Section Radial Orbit Animations & Connector Highlights
function setupSkillsAnimation() {
    const orbitWrapper = document.querySelector('.skills-orbit-wrapper');
    const orbitCards = document.querySelectorAll('.orbit-card');
    const rayLines = document.querySelectorAll('.orbit-ray-line');

    if (!orbitWrapper) return;

    // Highlight SVG ray line when hovering corresponding orbital card
    orbitCards.forEach(card => {
        const nodeId = card.getAttribute('data-node');
        const targetRay = document.querySelector(`.orbit-ray-line[data-node="${nodeId}"]`);

        card.addEventListener('mouseenter', () => {
            if (targetRay) {
                targetRay.classList.add('highlight');
            }
        });

        card.addEventListener('mouseleave', () => {
            if (targetRay) {
                targetRay.classList.remove('highlight');
            }
        });
    });
}

// Mobile Hamburger Navigation Toggle Logic
function toggleMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const links = document.querySelector('.nav-links');
    if (btn && links) {
        btn.classList.toggle('active');
        links.classList.toggle('active');
    }
}

function setupMobileNav() {
    const btn = document.querySelector('.mobile-menu-btn');
    const links = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-item');

    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (btn && links) {
                btn.classList.remove('active');
                links.classList.remove('active');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (links && links.classList.contains('active') && !links.contains(e.target) && !btn.contains(e.target)) {
            btn.classList.remove('active');
            links.classList.remove('active');
        }
    });
}

function initApp() {
    setupNavSmoothScroll();
    setupSkillsAnimation();
    setupMobileNav();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', updateTargetFrame, { passive: true });

// Initialize sequence
preloadImages();
resizeCanvas();
updateTargetFrame();
animate();

