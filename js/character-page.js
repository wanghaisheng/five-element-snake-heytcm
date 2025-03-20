document.addEventListener('DOMContentLoaded', () => {
    const characterCards = document.querySelectorAll('.character-card');
    const characterDetails = document.querySelectorAll('.character-details');
    
    // Initially hide all character details except the first one
    characterDetails.forEach((detail, index) => {
        if (index !== 0) {
            detail.style.display = 'none';
        }
    });
    
    // Add click event to character cards
    characterCards.forEach(card => {
        card.addEventListener('click', () => {
            const element = card.getAttribute('data-character');
            
            // Hide all character details
            characterDetails.forEach(detail => {
                detail.style.display = 'none';
            });
            
            // Show the selected character's details
            const targetDetail = document.getElementById(`${element}-details`);
            if (targetDetail) {
                targetDetail.style.display = 'block';
                
                // Scroll to the details section
                targetDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Add active class to the clicked card and remove from others
            characterCards.forEach(c => {
                c.classList.remove('active');
            });
            card.classList.add('active');
        });
    });
    
    // Add animation to character cards
    characterCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
});