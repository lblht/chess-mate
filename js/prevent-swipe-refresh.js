let touchStartY = 0;
let touchMoveY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', function(e) {
    touchMoveY = e.touches[0].clientY;

    if (touchStartY < touchMoveY && window.scrollY === 0) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', function(e) {
    touchStartY = 0;
    touchMoveY = 0;
});