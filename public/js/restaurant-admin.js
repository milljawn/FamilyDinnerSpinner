class RestaurantAdminPanel {
    constructor() {
        this.loginSection = document.getElementById('login-section');
        this.adminContent = document.getElementById('admin-content');
        this.loginForm = document.getElementById('login-form');
        this.logoutBtn = document.getElementById('logout-btn');
        this.restaurantForm = document.getElementById('restaurant-form');
        this.restaurantsList = document.getElementById('restaurants-list');
        this.filterCategory = document.getElementById('filter-category');
        this.editModal = document.getElementById('edit-modal');
        this.editForm = document.getElementById('edit-restaurant-form');
        
        this.restaurants = [];
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
        if (this.isAuthenticated) {
            await this.loadRestaurants();
        }
    }

    setupEventListeners() {
        // Login form
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Logout button
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Restaurant form
        this.restaurantForm.addEventListener('submit', (e) => this.handleAddRestaurant(e));
        
        // Filter
        this.filterCategory.addEventListener('change', () => this.filterRestaurants());
        
        // Edit modal
        this.editForm.addEventListener('submit', (e) => this.handleEditRestaurant(e));
        
        // Modal close events
        const closeBtn = this.editModal.querySelector('.close');
        const cancelBtn = this.editModal.querySelector('.cancel-btn');
        
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        
        // Close modal when clicking outside
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeModal();
            }
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            this.isAuthenticated = data.authenticated;
            
            if (this.isAuthenticated) {
                this.showAdminContent();
            } else {
                this.showLoginForm();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.showLoginForm();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.loginForm);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.isAuthenticated = true;
                this.showAdminContent();
                await this.loadRestaurants();
                this.clearLoginError();
            } else {
                this.showLoginError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError('Network error. Please try again.');
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.isAuthenticated = false;
            this.showLoginForm();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async handleAddRestaurant(e) {
        e.preventDefault();
        
        const formData = new FormData(this.restaurantForm);
        const restaurantData = {
            name: formData.get('name').trim(),
            category: formData.get('category'),
            details: formData.get('details').trim()
        };
        
        if (!restaurantData.name || !restaurantData.category || !restaurantData.details) {
            this.showRestaurantFormMessage('Please fill in all fields', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/restaurants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(restaurantData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showRestaurantFormMessage('Restaurant added successfully!', 'success');
                this.restaurantForm.reset();
                await this.loadRestaurants();
            } else {
                this.showRestaurantFormMessage(data.error || 'Failed to add restaurant', 'error');
            }
        } catch (error) {
            console.error('Error adding restaurant:', error);
            this.showRestaurantFormMessage('Network error. Please try again.', 'error');
        }
    }

    async handleEditRestaurant(e) {
        e.preventDefault();
        
        const restaurantId = document.getElementById('edit-restaurant-id').value;
        const name = document.getElementById('edit-restaurant-name').value.trim();
        const category = document.getElementById('edit-restaurant-category').value;
        const details = document.getElementById('edit-restaurant-details').value.trim();
        
        if (!name || !category || !details) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch(`/api/restaurants/${restaurantId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, category, details })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.closeModal();
                await this.loadRestaurants();
                this.showRestaurantFormMessage('Restaurant updated successfully!', 'success');
            } else {
                alert(data.error || 'Failed to update restaurant');
            }
        } catch (error) {
            console.error('Error updating restaurant:', error);
            alert('Network error. Please try again.');
        }
    }

    async deleteRestaurant(restaurantId, restaurantName) {
        if (!confirm(`Are you sure you want to delete "${restaurantName}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/restaurants/${restaurantId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                await this.loadRestaurants();
                this.showRestaurantFormMessage('Restaurant deleted successfully!', 'success');
            } else {
                alert(data.error || 'Failed to delete restaurant');
            }
        } catch (error) {
            console.error('Error deleting restaurant:', error);
            alert('Network error. Please try again.');
        }
    }

    async loadRestaurants() {
        try {
            const response = await fetch('/api/restaurants');
            
            if (response.ok) {
                this.restaurants = await response.json();
                this.filterRestaurants();
            } else {
                console.error('Failed to load restaurants');
            }
        } catch (error) {
            console.error('Error loading restaurants:', error);
        }
    }

    filterRestaurants() {
        const selectedCategory = this.filterCategory.value;
        let filteredRestaurants = this.restaurants;
        
        if (selectedCategory !== 'all') {
            filteredRestaurants = this.restaurants.filter(restaurant => 
                restaurant.category === selectedCategory
            );
        }
        
        this.displayRestaurants(filteredRestaurants);
    }

    displayRestaurants(restaurants) {
        if (restaurants.length === 0) {
            this.restaurantsList.innerHTML = `
                <div class="no-restaurants">
                    <p>No restaurants found. Add your first restaurant using the form above!</p>
                </div>
            `;
            return;
        }

        const restaurantsHTML = restaurants.map(restaurant => `
            <div class="restaurant-item ${restaurant.category}" data-restaurant-id="${restaurant.id}">
                <div class="restaurant-info">
                    <h4>${this.escapeHtml(restaurant.name)}</h4>
                    <div class="restaurant-category ${restaurant.category}">${this.getCategoryDisplayName(restaurant.category)}</div>
                    <p><strong>Details:</strong> ${this.escapeHtml(restaurant.details)}</p>
                </div>
                <div class="restaurant-actions">
                    <button class="edit-btn" onclick="restaurantAdminPanel.openEditModal(${restaurant.id}, '${this.escapeForAttribute(restaurant.name)}', '${restaurant.category}', '${this.escapeForAttribute(restaurant.details)}')">
                        Edit
                    </button>
                    <button class="delete-btn" onclick="restaurantAdminPanel.deleteRestaurant(${restaurant.id}, '${this.escapeForAttribute(restaurant.name)}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        this.restaurantsList.innerHTML = restaurantsHTML;
    }

    openEditModal(restaurantId, restaurantName, restaurantCategory, restaurantDetails) {
        document.getElementById('edit-restaurant-id').value = restaurantId;
        document.getElementById('edit-restaurant-name').value = restaurantName;
        document.getElementById('edit-restaurant-category').value = restaurantCategory;
        document.getElementById('edit-restaurant-details').value = restaurantDetails;
        this.editModal.style.display = 'block';
    }

    closeModal() {
        this.editModal.style.display = 'none';
        this.editForm.reset();
    }

    getCategoryDisplayName(category) {
        const categoryMap = {
            'formal': 'Formal Dining',
            'sit-down': 'Sit Down',
            'quick-service': 'Quick Service'
        };
        return categoryMap[category] || category;
    }

    showLoginForm() {
        this.loginSection.style.display = 'flex';
        this.adminContent.style.display = 'none';
        this.logoutBtn.style.display = 'none';
    }

    showAdminContent() {
        this.loginSection.style.display = 'none';
        this.adminContent.style.display = 'block';
        this.logoutBtn.style.display = 'block';
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearLoginError() {
        const errorDiv = document.getElementById('login-error');
        errorDiv.style.display = 'none';
    }

    showRestaurantFormMessage(message, type) {
        const messageDiv = document.getElementById('restaurant-form-message');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeForAttribute(text) {
        return text.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }
}

// Global variable for access from inline event handlers
let restaurantAdminPanel;

// Initialize the restaurant admin panel when the page loads
document.addEventListener('DOMContentLoaded', () => {
    restaurantAdminPanel = new RestaurantAdminPanel();
});
