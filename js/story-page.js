document.addEventListener('DOMContentLoaded', () => {
    // Add animation to story sections
    const storySection = document.querySelector('.story-section');
    
    if (storySection) {
        storySection.style.opacity = '0';
        storySection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            storySection.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            storySection.style.opacity = '1';
            storySection.style.transform = 'translateY(0)';
        }, 200);
    }
    
    // Add animation to related story cards
    const storyCards = document.querySelectorAll('.story-card');
    
    storyCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 500 + index * 150);
    });
    
    // Add hover effect to read more links
    const readMoreLinks = document.querySelectorAll('.read-more');
    
    readMoreLinks.forEach(link => {
        link.addEventListener('mouseover', () => {
            link.style.color = '#7b50e0';
        });
        
        link.addEventListener('mouseout', () => {
            link.style.color = '';
        });
    });
    
    // Navigation buttons hover effect
    const navButtons = document.querySelectorAll('.nav-button:not(.disabled)');
    
    navButtons.forEach(button => {
        button.addEventListener('mouseover', () => {
            button.style.boxShadow = '0 5px 15px rgba(123, 80, 224, 0.3)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.boxShadow = '';
        });
    });
});
