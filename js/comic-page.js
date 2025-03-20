document.addEventListener('DOMContentLoaded', () => {
    // Add animation to comic episodes
    const comicEpisodes = document.querySelectorAll('.comic-episode');
    
    comicEpisodes.forEach((episode, index) => {
        episode.style.opacity = '0';
        episode.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            episode.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            episode.style.opacity = '1';
            episode.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
    
    // Add animation to comic reader panels
    const comicPanels = document.querySelectorAll('.comic-panel');
    
    comicPanels.forEach((panel, index) => {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            panel.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
        }, 300 + index * 200);
    });
    
    // Add click event to pagination
    const pageNumbers = document.querySelectorAll('.page-number');
    
    pageNumbers.forEach(page => {
        page.addEventListener('click', () => {
            if (page.textContent === '...') return;
            
            pageNumbers.forEach(p => {
                p.classList.remove('active');
            });
            
            page.classList.add('active');
            
            // Here you would normally load the appropriate page content
            // For this demo, we'll just show a message
            console.log(`Loading page ${page.textContent}`);
        });
    });
    
    // Add hover effect to share buttons
    const shareButtons = document.querySelectorAll('.share-button');
    
    shareButtons.forEach(button => {
        button.addEventListener('mouseover', () => {
            button.style.transform = 'translateY(-3px)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.transform = '';
        });
    });
    
    // Add click event to comic episodes for navigation
    comicEpisodes.forEach(episode => {
        episode.addEventListener('click', (e) => {
            const readButton = episode.querySelector('.read-button');
            
            // If the click is on the read button, let the default action happen
            if (e.target === readButton || readButton.contains(e.target)) {
                return;
            }
            
            // Otherwise, trigger the read button click
            readButton.click();
        });
    });
});