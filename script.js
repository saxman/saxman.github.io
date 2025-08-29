// Smooth scrolling and animations
document.addEventListener('DOMContentLoaded', function() {
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        // Add initial hidden state for animation
        if (section.id !== 'hero') {
            section.style.opacity = '0';
            section.style.transform = 'translateY(50px)';
            section.style.transition = 'all 0.8s ease-out';
        }
        observer.observe(section);
    });

    // Animate cards and items individually
    const animatedElements = document.querySelectorAll('.job-card, .education-card, .research-item, .publication-item, .cert-section, .patent-section, .skills-category, .languages-category');
    
    const cardObserver = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 200); // Stagger animation
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease-out';
        cardObserver.observe(element);
    });

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.getElementById('hero');
        const rate = scrolled * -0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    });

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function() {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.pageYOffset / totalHeight) * 100;
        progressBar.style.width = progress + '%';
    });

    // Add section navigation dots
    const navDots = document.createElement('nav');
    navDots.id = 'section-nav';
    navDots.style.cssText = `
        position: fixed;
        right: 30px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;

    const sectionIds = ['hero', 'current', 'education-grad', 'research', 'publications', 'achievements', 'education-undergrad', 'skills'];
    
    sectionIds.forEach((sectionId, index) => {
        const dot = document.createElement('div');
        dot.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid white;
        `;
        
        dot.addEventListener('click', () => {
            document.getElementById(sectionId).scrollIntoView({
                behavior: 'smooth'
            });
        });

        navDots.appendChild(dot);
    });

    document.body.appendChild(navDots);

    // Update active navigation dot on scroll
    const navDotsElements = navDots.querySelectorAll('div');
    
    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionIndex = sectionIds.indexOf(entry.target.id);
                navDotsElements.forEach((dot, index) => {
                    if (index === sectionIndex) {
                        dot.style.background = 'white';
                        dot.style.transform = 'scale(1.3)';
                    } else {
                        dot.style.background = 'rgba(255, 255, 255, 0.5)';
                        dot.style.transform = 'scale(1)';
                    }
                });
            }
        });
    }, {
        threshold: 0.6
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('.research-item, .publication-item, .cert-section, .patent-section, .skills-category, .languages-category');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
    });

    // Add typing animation to hero text
    const heroTitle = document.querySelector('#hero h1');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        setTimeout(typeWriter, 500);
    }

    // Table of Contents functionality
    const tocToggle = document.getElementById('toc-toggle');
    const tocClose = document.getElementById('toc-close');
    const toc = document.getElementById('toc');
    const tocContainer = document.getElementById('toc-container');
    const tocLinks = document.querySelectorAll('.toc-list a');

    // Toggle TOC
    tocToggle.addEventListener('click', function() {
        toc.classList.add('active');
        tocContainer.classList.add('toc-open');
    });

    // Close TOC
    tocClose.addEventListener('click', function() {
        toc.classList.remove('active');
        tocContainer.classList.remove('toc-open');
    });

    // Close TOC when clicking outside
    document.addEventListener('click', function(event) {
        if (!toc.contains(event.target) && !tocToggle.contains(event.target)) {
            toc.classList.remove('active');
            tocContainer.classList.remove('toc-open');
        }
    });

    // Handle TOC link clicks
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = document.querySelector(this.getAttribute('href'));
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
                toc.classList.remove('active');
                tocContainer.classList.remove('toc-open');
            }
        });
    });

    // Update active TOC link based on scroll position
    const tocSectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                
                // Update TOC active state
                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === sectionId) {
                        link.classList.add('active');
                    }
                });

                // Update navigation dots
                const sectionIndex = sectionIds.indexOf(sectionId);
                navDotsElements.forEach((dot, index) => {
                    if (index === sectionIndex) {
                        dot.style.background = 'white';
                        dot.style.transform = 'scale(1.3)';
                    } else {
                        dot.style.background = 'rgba(255, 255, 255, 0.5)';
                        dot.style.transform = 'scale(1)';
                    }
                });
            }
        });
    }, {
        threshold: 0.6,
        rootMargin: '0px 0px -20% 0px'
    });

    sections.forEach(section => {
        tocSectionObserver.observe(section);
    });

    // Keyboard accessibility for TOC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            toc.classList.remove('active');
            tocContainer.classList.remove('toc-open');
        }
    });

    // Mobile navigation adjustments
    function updateNavVisibility() {
        if (window.innerWidth <= 768) {
            navDots.style.display = 'none';
        } else {
            navDots.style.display = 'flex';
        }
    }

    updateNavVisibility();
    window.addEventListener('resize', updateNavVisibility);
});