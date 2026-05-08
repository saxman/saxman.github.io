// Highlight active nav link based on scroll position
(function () {
    const links = document.querySelectorAll('nav a[href^="#"]');
    const sections = Array.from(links).map(l => document.querySelector(l.getAttribute('href')));

    function setActive() {
        const scrollY = window.scrollY + 80;
        let current = sections[0];
        for (const section of sections) {
            if (section && section.offsetTop <= scrollY) current = section;
        }
        links.forEach(l => {
            l.style.color = l.getAttribute('href') === '#' + current.id ? '#000' : '';
            l.style.fontWeight = l.getAttribute('href') === '#' + current.id ? '600' : '';
        });
    }

    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
})();
