class RestaurantSpinner {
    constructor() {
        this.restaurants = [];
        this.filteredRestaurants = [];
        this.isSpinning = false;
        this.spinButton = document.getElementById('spin-btn');
        this.categorySelect = document.getElementById('restaurant-category');
        this.resultsContainer = document.getElementById('results');
        this.spinner = document.querySelector('.spinner');
        this.spinnerSegments = document.querySelector('.spinner-segments');
        this.celebrationModal = document.getElementById('celebration-modal');
        
        this.init();
    }

    async init() {
        await this.loadRestaurants();
        this.setupEventListeners();
        this.updateFilteredRestaurants();
    }

    setupEventListeners() {
        this.spinButton.addEventListener('click', () => this.spin());
        this.categorySelect.addEventListener('change', () => this.updateFilteredRestaurants());
        
        // Celebration modal close
        document.getElementById('celebration-close').addEventListener('click', () => {
            this.closeCelebration();
        });
        
        this.celebrationModal.addEventListener('click', (e) => {
            if (e.target === this.celebrationModal) {
                this.closeCelebration();
            }
        });
    }

    async loadRestaurants() {
        try {
            const response = await fetch('/api/restaurants');
            if (response.ok) {
                this.restaurants = await response.json();
                this.updateFilteredRestaurants();
            } else {
                console.error('Failed to load restaurants');
                this.showError('Failed to load restaurants. Please try again.');
            }
        } catch (error) {
            console.error('Error loading restaurants:', error);
            this.showError('Error loading restaurants. Please check your connection.');
        }
    }

    updateFilteredRestaurants() {
        const selectedCategory = this.categorySelect.value;
        
        if (selectedCategory === 'all') {
            this.filteredRestaurants = [...this.restaurants];
        } else {
            this.filteredRestaurants = this.restaurants.filter(restaurant => 
                restaurant.category === selectedCategory
            );
        }
        
        this.createSpinnerSegments();
        this.updateResultsMessage();
    }

    updateResultsMessage() {
        const category = this.categorySelect.value;
        const categoryText = category === 'all' ? 'any type' : category.replace('-', ' ');
        
        if (this.filteredRestaurants.length === 0) {
            this.resultsContainer.innerHTML = `
                <p class="no-results">No ${categoryText} restaurants available! Please add some in the admin panel.</p>
            `;
        } else {
            this.resultsContainer.innerHTML = `
                <p class="no-results">Ready to find a ${categoryText} restaurant! Click spin to discover your dining destination.</p>
            `;
        }
    }

    createSpinnerSegments() {
        if (this.filteredRestaurants.length === 0) {
            this.spinnerSegments.innerHTML = '';
            return;
        }

        const segmentCount = Math.min(this.filteredRestaurants.length, 12); // Maximum 12 segments
        const anglePerSegment = 360 / segmentCount;
        const radius = 120;
        
        let segmentsHTML = '';
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA'
        ];

        for (let i = 0; i < segmentCount; i++) {
            const startAngle = i * anglePerSegment;
            const endAngle = (i + 1) * anglePerSegment;
            const color = colors[i % colors.length];
            
            // Calculate path for segment
            const startAngleRad = (startAngle - 90) * Math.PI / 180;
            const endAngleRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = radius * Math.cos(startAngleRad);
            const y1 = radius * Math.sin(startAngleRad);
            const x2 = radius * Math.cos(endAngleRad);
            const y2 = radius * Math.sin(endAngleRad);
            
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            
            const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            
            // Text position (middle of segment)
            const textAngle = (startAngle + endAngle) / 2;
            const textAngleRad = (textAngle - 90) * Math.PI / 180;
            const textX = (radius * 0.7) * Math.cos(textAngleRad);
            const textY = (radius * 0.7) * Math.sin(textAngleRad);
            
            const restaurant = this.filteredRestaurants[i % this.filteredRestaurants.length];
            const restaurantName = restaurant.name;
            const truncatedName = restaurantName.length > 12 ? restaurantName.substring(0, 10) + '...' : restaurantName;
            
            segmentsHTML += `
                <g class="spinner-segment" data-restaurant-index="${i % this.filteredRestaurants.length}">
                    <path d="${pathData}" fill="${color}" stroke="#fff" stroke-width="1" opacity="0.9"/>
                    <text x="${textX}" y="${textY}" 
                          text-anchor="middle" 
                          dominant-baseline="middle" 
                          fill="white" 
                          font-size="10" 
                          font-weight="bold"
                          transform="rotate(${textAngle}, ${textX}, ${textY})">
                        ${truncatedName}
                    </text>
                </g>
            `;
        }
        
        this.spinnerSegments.innerHTML = segmentsHTML;
    }

    async spin() {
        if (this.isSpinning || this.filteredRestaurants.length === 0) return;
        
        if (this.filteredRestaurants.length === 0) {
            this.showError('No restaurants available for the selected category! Please add some restaurants in the admin panel.');
            return;
        }

        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.spinButton.innerHTML = '<span>🌪️ SPINNING...</span>';
        
        const selectedCategory = this.categorySelect.value;
        
        try {
            // Get random restaurant from backend
            const response = await fetch('/api/restaurants/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category: selectedCategory })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get random restaurant');
            }
            
            const selectedRestaurant = await response.json();
            
            // Find which segment contains this restaurant
            const segments = this.spinnerSegments.querySelectorAll('.spinner-segment');
            let targetSegmentIndex = 0;
            
            // Look for the restaurant in our visible segments
            for (let i = 0; i < segments.length; i++) {
                const segmentRestaurantIndex = parseInt(segments[i].getAttribute('data-restaurant-index'));
                if (this.filteredRestaurants[segmentRestaurantIndex] && 
                    this.filteredRestaurants[segmentRestaurantIndex].id === selectedRestaurant.id) {
                    targetSegmentIndex = i;
                    break;
                }
            }
            
            // Calculate the angle needed to land on the target segment
            const segmentCount = segments.length;
            const anglePerSegment = 360 / segmentCount;
            const targetAngle = (targetSegmentIndex * anglePerSegment) + (anglePerSegment / 2);
            
            // Add multiple full rotations for visual effect (4-7 full spins)
            const extraSpins = 4 + Math.random() * 3;
            const finalRotation = (extraSpins * 360) + (360 - targetAngle);
            
            // Apply the spinning animation
            this.spinner.style.transform = `rotate(${finalRotation}deg)`;
            
            // Highlight the target segment during spin
            segments.forEach((segment, index) => {
                if (index === targetSegmentIndex) {
                    segment.style.filter = 'brightness(1.3) drop-shadow(0 0 15px #ffd700)';
                }
            });
            
            // Wait for spin animation to complete, then show celebration
            setTimeout(() => {
                // Remove highlighting
                segments.forEach(segment => {
                    segment.style.filter = '';
                });
                
                this.displayResult(selectedRestaurant);
                this.showCelebration(selectedRestaurant);
                this.resetSpinButton();
            }, 3000); // Longer duration for restaurant spin
            
        } catch (error) {
            console.error('Error during spin:', error);
            this.showError('Error during spin. Please try again.');
            this.resetSpinButton();
        }
    }

    displayResult(restaurant) {
        const categoryDisplayName = this.getCategoryDisplayName(restaurant.category);
        
        const resultHTML = `
            <div class="restaurant-result">
                <div class="category-badge">${categoryDisplayName}</div>
                <h3>🎉 ${restaurant.name}</h3>
                <div class="restaurant-details">
                    <p>${restaurant.details}</p>
                </div>
            </div>
        `;

        this.resultsContainer.innerHTML = resultHTML;
    }

    showCelebration(restaurant) {
        const categoryDisplayName = this.getCategoryDisplayName(restaurant.category);
        
        document.getElementById('celebration-restaurant').textContent = restaurant.name;
        
        // Generate confetti
        this.generateConfetti();
        
        // Show modal
        this.celebrationModal.style.display = 'block';
        
        // Play celebration sound (if you want to add audio)
        // this.playCelebrationSound();
    }

    generateConfetti() {
        const confettiContainer = document.querySelector('.confetti-container');
        confettiContainer.innerHTML = ''; // Clear existing confetti
        
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confettiContainer.appendChild(confetti);
        }
    }

    closeCelebration() {
        this.celebrationModal.style.display = 'none';
    }

    getCategoryDisplayName(category) {
        const categoryMap = {
            'formal': 'Formal Dining',
            'sit-down': 'Sit Down',
            'quick-service': 'Quick Service'
        };
        return categoryMap[category] || category;
    }

    resetSpinButton() {
        this.isSpinning = false;
        this.spinButton.disabled = false;
        this.spinButton.innerHTML = '<span>🎯 SPIN THE WHEEL!</span>';
    }

    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }
}

// Initialize the restaurant spinner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RestaurantSpinner();
});
