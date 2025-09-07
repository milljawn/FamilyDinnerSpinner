class DinnerSpinner {
    constructor() {
        this.meals = [];
        this.isSpinning = false;
        this.spinButton = document.getElementById('spin-btn');
        this.mealCountSelect = document.getElementById('meal-count');
        this.resultsContainer = document.getElementById('results');
        this.spinner = document.querySelector('.spinner');
        this.spinnerSegments = document.querySelector('.spinner-segments');
        
        this.init();
    }

    async init() {
        await this.loadMeals();
        this.setupEventListeners();
        this.createSpinnerSegments();
    }

    setupEventListeners() {
        this.spinButton.addEventListener('click', () => this.spin());
        this.mealCountSelect.addEventListener('change', () => this.createSpinnerSegments());
    }

    async loadMeals() {
        try {
            const response = await fetch('/api/meals');
            if (response.ok) {
                this.meals = await response.json();
                this.createSpinnerSegments();
            } else {
                console.error('Failed to load meals');
                this.showError('Failed to load meals. Please try again.');
            }
        } catch (error) {
            console.error('Error loading meals:', error);
            this.showError('Error loading meals. Please check your connection.');
        }
    }

    createSpinnerSegments() {
        if (this.meals.length === 0) {
            this.spinnerSegments.innerHTML = '';
            return;
        }

        const segmentCount = Math.min(this.meals.length, 12); // Maximum 12 segments for visibility
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
            
            const mealName = this.meals[i % this.meals.length].name;
            const truncatedName = mealName.length > 12 ? mealName.substring(0, 10) + '...' : mealName;
            
            segmentsHTML += `
                <g class="spinner-segment" data-meal-index="${i % this.meals.length}">
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
        if (this.isSpinning || this.meals.length === 0) return;
        
        if (this.meals.length === 0) {
            this.showError('No meals available! Please add some meals in the admin panel.');
            return;
        }

        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.spinButton.innerHTML = '<span>🌪️ SPINNING...</span>';
        
        const mealCount = parseInt(this.mealCountSelect.value);
        
        try {
            // Visual spinning animation
            const spins = 3 + Math.random() * 3; // 3-6 full rotations
            const finalRotation = spins * 360 + Math.random() * 360;
            
            this.spinner.style.transform = `rotate(${finalRotation}deg)`;
            
            // Get random meals from backend
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ count: mealCount })
            });
            
            if (response.ok) {
                const selectedMeals = await response.json();
                
                // Wait for spin animation to complete
                setTimeout(() => {
                    this.displayResults(selectedMeals);
                    this.resetSpinButton();
                }, 2000);
            } else {
                throw new Error('Failed to get random meals');
            }
            
        } catch (error) {
            console.error('Error during spin:', error);
            this.showError('Error during spin. Please try again.');
            this.resetSpinButton();
        }
    }

    displayResults(meals, primaryMeal = null) {
        if (meals.length === 0) {
            this.resultsContainer.innerHTML = '<p class="no-results">No meals found! Please add some meals first.</p>';
            return;
        }

        let resultsHTML = '';
        
        // If we have a primary meal (the one the wheel landed on), show it first
        if (primaryMeal && meals.length > 1) {
            resultsHTML += `
                <div class="meal-result primary-result" style="animation-delay: 0s">
                    <h3>🎯 Wheel Choice: ${primaryMeal.name}</h3>
                    <p><span class="ingredients-label">Ingredients:</span> ${primaryMeal.ingredients}</p>
                </div>
            `;
            
            // Show other meals if multiple were selected
            const otherMeals = meals.filter(meal => meal.id !== primaryMeal.id);
            if (otherMeals.length > 0) {
                resultsHTML += `<h4 class="additional-meals-header">Additional Options:</h4>`;
                resultsHTML += otherMeals.map((meal, index) => `
                    <div class="meal-result additional-result" style="animation-delay: ${(index + 1) * 0.1}s">
                        <h3>${meal.name}</h3>
                        <p><span class="ingredients-label">Ingredients:</span> ${meal.ingredients}</p>
                    </div>
                `).join('');
            }
        } else {
            // Single meal or no primary meal specified
            resultsHTML = meals.map((meal, index) => `
                <div class="meal-result" style="animation-delay: ${index * 0.1}s">
                    <h3>${meal.name}</h3>
                    <p><span class="ingredients-label">Ingredients:</span> ${meal.ingredients}</p>
                </div>
            `).join('');
        }

        this.resultsContainer.innerHTML = resultsHTML;
        
        // Add entrance animation
        const resultElements = this.resultsContainer.querySelectorAll('.meal-result');
        resultElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animation = 'slideInUp 0.5s ease forwards';
            }, index * 100);
        });
    }

    resetSpinButton() {
        this.isSpinning = false;
        this.spinButton.disabled = false;
        this.spinButton.innerHTML = '<span>🎯 SPIN!</span>';
    }

    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }
}

// Add CSS animation for results
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .meal-result {
        opacity: 0;
        transform: translateY(30px);
    }
`;
document.head.appendChild(style);

// Initialize the spinner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DinnerSpinner();
});
