# 🎯 Family Decision Spinner

A full-stack web application designed to solve the eternal question: "What should we eat?" Built for families who struggle with meal and restaurant decisions, this spinner app makes dining choices fun and easy.

## ✨ Features

### 🏠 Landing Page
- Clean, modern interface with two main decision categories
- Responsive design that works on all devices
- Easy navigation between meal and restaurant options

### 🍽️ Dinner Spinner
- **Interactive spinning wheel** with visual meal segments
- **Select 1-5 meals** for variety in your choices
- **Smart wheel physics** - the wheel actually lands on your selected meal
- **Ingredient display** for each selected meal
- **Primary vs additional results** - wheel choice highlighted in gold

### 🍕 Restaurant Wheel of Fortune
- **Category filtering** by restaurant type:
  - **Formal Dining** - Upscale restaurants for special occasions
  - **Sit Down** - Casual family dining experiences  
  - **Quick Service** - Fast food and quick meals
- **Single restaurant selection** with celebration animation
- **Confetti celebration** when a restaurant is chosen
- **Restaurant details** including category and information

### 🔧 Admin Management
- **Secure login system** (default: admin/admin123)
- **Separate admin panels** for meals and restaurants
- **Easy meal management** - add name and ingredients
- **Restaurant management** - add name and category
- **Edit and delete** existing entries
- **Real-time updates** to the spinner wheels

## 🏗️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite database** for local data storage
- **Session-based authentication** with bcrypt password hashing
- **RESTful API** design for all operations

### Frontend
- **Vanilla HTML/CSS/JavaScript** - no heavy frameworks
- **Responsive CSS Grid and Flexbox** layouts
- **SVG-based spinning wheels** with smooth animations
- **Modern ES6+ JavaScript** with async/await

### Database Schema
- **Users table** - Admin authentication
- **Meals table** - Home cooking options with ingredients
- **Restaurants table** - Dining out options with categories

## 🚀 Installation & Setup

### Prerequisites
- Raspberry Pi (or any Linux system)
- Node.js 14+ and npm
- Basic command line knowledge

### Quick Start
```bash
# Clone or create project directory
mkdir dinner-spinner && cd dinner-spinner

# Initialize npm project
npm init -y

# Install dependencies
npm install express sqlite3 express-session bcryptjs body-parser cors

# Create directory structure
mkdir -p public/{css,js}

# Add all project files (server.js, HTML, CSS, JS files)
# Start the application
npm start
```

### File Structure
```
dinner-spinner/
├── server.js                 # Main server application
├── package.json              # Node.js dependencies
├── dinner_spinner.db         # SQLite database (auto-created)
└── public/                   # Static web files
    ├── landing.html          # Main landing page
    ├── index.html            # Dinner spinner page
    ├── restaurants.html      # Restaurant wheel page
    ├── admin.html            # Meals admin panel
    ├── admin-restaurants.html # Restaurant admin panel
    ├── css/
    │   └── styles.css        # Application styling
    └── js/
        ├── spinner.js        # Dinner spinner logic
        ├── restaurant-spinner.js # Restaurant wheel logic
        ├── admin.js          # Meals admin functionality
        └── restaurant-admin.js   # Restaurant admin functionality
```

## 🎮 Usage Guide

### Getting Started
1. **Start the application**: `npm start`
2. **Open your browser**: Navigate to `http://localhost:3000`
3. **Choose your decision type**: Dinner Spinner or Restaurant Wheel

### Adding Content
1. **Access admin panels**: Click admin links on landing page
2. **Login**: Use default credentials (admin/admin123)
3. **Add meals**: Include name and ingredients for home cooking
4. **Add restaurants**: Include name and select appropriate category
5. **Manage existing entries**: Edit or delete as needed

### Making Decisions
1. **For home meals**: Select number of meals (1-5) and spin
2. **For restaurants**: Choose category filter and spin for one result
3. **Enjoy your selection**: The wheel decides for you!

## ⚙️ Configuration

### Default Settings
- **Port**: 3000 (configurable via PORT environment variable)
- **Database**: SQLite file in project root
- **Admin credentials**: admin/admin123
- **Session duration**: 24 hours

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=production          # Environment mode
```

### Security Notes
- Change default admin password after setup
- Consider using reverse proxy (nginx) for production
- Keep system and dependencies updated

## 🔄 Auto-Start Setup (Systemd)

### Create Service File
```bash
# Create systemd service
sudo nano /etc/systemd/system/dinner-spinner.service
```

### Service Configuration
```ini
[Unit]
Description=Family Decision Spinner Web Application
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=5
User=your-username
ExecStart=/usr/bin/node /home/your-username/dinner-spinner/server.js
WorkingDirectory=/home/your-username/dinner-spinner
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Enable Auto-Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable dinner-spinner
sudo systemctl start dinner-spinner
```

## 🔄 Automatic Updates

### Weekly Update Script
```bash
#!/bin/bash
# weekly-update.sh - Updates system and app weekly

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies  
cd /home/your-username/dinner-spinner
npm update --production

# Restart service
sudo systemctl restart dinner-spinner
```

### Cron Setup
```bash
# Add to crontab for Sunday 2 AM updates
crontab -e

# Add this line:
0 2 * * 0 /home/your-username/dinner-spinner/weekly-update.sh
15 2 * * 0 sudo reboot  # Reboot after updates
```

## 🛠️ Maintenance

### Service Management
```bash
sudo systemctl status dinner-spinner    # Check status
sudo systemctl restart dinner-spinner   # Restart service
sudo systemctl stop dinner-spinner      # Stop service
sudo journalctl -u dinner-spinner -f    # View logs
```

### Database Operations
```bash
# View database contents
sqlite3 dinner_spinner.db "SELECT * FROM meals;"
sqlite3 dinner_spinner.db "SELECT * FROM restaurants;"

# Backup database
cp dinner_spinner.db dinner_spinner_backup.db
```

### Troubleshooting
- **Port conflicts**: Change PORT environment variable
- **Permission issues**: Ensure correct file ownership
- **Service failures**: Check logs with `journalctl`
- **Database errors**: Verify SQLite file permissions

## 🎨 Customization

### Styling
- Modify `public/css/styles.css` for appearance changes
- Colors, fonts, and layouts are easily customizable
- Responsive design adapts to different screen sizes

### Functionality
- Add new restaurant categories by updating validation arrays
- Modify spinning animations in JavaScript files
- Extend database schema for additional fields

### Branding
- Update page titles and headers in HTML files
- Change application name and descriptions
- Add custom logos or icons

## 📊 Features Overview

| Feature | Meals | Restaurants |
|---------|-------|-------------|
| **Categories** | Single type | 3 categories |
| **Selection** | 1-5 items | Single item |
| **Data Fields** | Name + Ingredients | Name + Category |
| **Animation** | Wheel landing | Celebration + Confetti |
| **Admin Panel** | Separate | Separate |

## 🤝 Contributing

This is a personal/family project, but improvements are welcome:
- **Bug reports**: Document issues with reproduction steps
- **Feature requests**: Suggest new functionality
- **Code improvements**: Optimize performance or add features

## 📝 License

This project is intended for personal and family use. Feel free to adapt and modify for your own needs.

## 🙏 Acknowledgments

- Built for families who struggle with daily dining decisions
- Inspired by the universal question: "What do you want to eat?"
- Designed to make meal planning fun instead of stressful

---

**Enjoy never having to make dining decisions again!** 🎉
