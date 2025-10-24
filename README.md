# 💰 Shared Expenses App

A comprehensive expense tracking application built with Node.js, Express, and PostgreSQL. Track shared expenses, deposits, and generate detailed reports with an intuitive web interface.

## 🚀 Features

### Core Functionality

- **Expense & Deposit Tracking**: Add, edit, and delete financial transactions
- **Category Management**: Organize expenses by custom categories
- **Monthly & Annual Reports**: Detailed breakdowns by month and category
- **Search & Filter**: Find specific transactions with advanced filtering
- **Data Export**: Export data to CSV format for external analysis
- **Print Functionality**: Print reports and transaction lists

### Security Features

- **PIN-Protected Editing**: Secure edit access with customizable PIN
- **User Authentication**: Login system with JWT tokens
- **Input Validation**: Comprehensive data validation and error handling

### User Interface

- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Real-time Updates**: Instant feedback and data refresh
- **Visual Indicators**: Color-coded deposits and expenses

## 📋 Prerequisites

- Node.js (v18.20.5 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sharedExpensesApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL=your_postgresql_connection_string
   MASTER_USERNAME=admin
   MASTER_PASSWORD=password
   SECRET_KEY=your_jwt_secret_key
   PORT=3000
   ```

4. **Initialize the database**

   ```bash
   # The app will automatically run schema.sql on startup
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 🔐 Authentication

### Default Login Credentials

- **Username**: `admin`
- **Password**: `password`

### Changing Login Credentials

Update the `.env` file:

```env
MASTER_USERNAME=your_username
MASTER_PASSWORD=your_password
```

## 🔒 PIN Protection for Editing

The app includes PIN protection for all edit operations to prevent unauthorized modifications.

### Current PIN

- **Default PIN**: `1234`

### How to Change the Edit PIN

#### Method 1: Main Application (script.js)

1. Open `frontEnd/script.js`
2. Find line 885: `const EDIT_PIN = "1234";`
3. Change to your desired PIN: `const EDIT_PIN = "your-new-pin";`
4. Save the file

#### Method 2: Monthly Totals (monthly-totals.js)

1. Open `frontEnd/monthly-totals.js`
2. Find line 4: `const EDIT_PIN = "1234";`
3. Change to your desired PIN: `const EDIT_PIN = "your-new-pin";`
4. Save the file

**Note**: You need to update the PIN in both files to maintain consistency across all edit functions.

### PIN Security Features

- Password field (hidden characters)
- Enter key support for quick entry
- Clear error messages for incorrect PIN
- Auto-focus on PIN input
- Click outside to cancel

## 📊 Usage Guide

### Adding Transactions

#### Adding Expenses

1. Click "Add Expense" button
2. Fill in the form:
   - **Name**: Person or business name
   - **Amount**: Expense amount (positive number)
   - **Category**: Select from existing categories
   - **Description**: Optional details
   - **Date**: Transaction date
3. Click "Add Expense"

#### Adding Deposits

1. Click "Add Deposit" button
2. Fill in the form (same fields as expenses)
3. Click "Add Deposit"

### Editing Transactions

#### From Main View

1. Toggle "Show All Entries" to display the table
2. Click the green "Edit" button next to any entry
3. Enter the PIN when prompted
4. Modify the fields in the popup modal
5. Click "Update Transaction"

#### From Search Results

1. Use the search functionality (🔍 icon)
2. Apply filters as needed
3. Click "Edit" on any result
4. Enter PIN and make changes

#### From Monthly Totals

1. Navigate to "View Totals" page
2. Click on a month to view details
3. Click "Edit" on any transaction
4. Enter PIN and make changes

### Managing Categories

#### Adding Categories

1. Click "Add Category" button
2. Enter category name
3. Click "Add Category"

#### Managing Categories

1. Click "Show/Delete Categories"
2. View all categories
3. Edit or delete as needed

### Viewing Reports

#### Grand Totals

1. Click "View Totals" in navigation
2. View annual summary by category
3. See overall balance (Deposits - Expenses)
4. Click on categories to view detailed entries

#### Monthly Totals

1. From "View Totals" page, click on a month
2. View monthly breakdown by category
3. See YTD (Year-to-Date) totals
4. Edit transactions directly from the list

### Search & Filter

#### Basic Search

1. Click the search icon (🔍)
2. Select filters:
   - **Name/Business**: Filter by person or business
   - **Month**: Filter by specific month
   - **Date Range**: Custom date range
   - **Category**: Filter by category
   - **Type**: Expense, Deposit, or All
3. Click "Search"

#### Search Features

- **Show Total**: Calculate total for search results
- **Print Results**: Print filtered results
- **Export CSV**: Export search results to CSV

## 🗄️ Database Schema

### Tables

#### `expenses`

- `id`: Primary key
- `name`: Person/business name
- `amount`: Transaction amount (positive values)
- `type`: 'expense' or 'deposit'
- `description`: Optional description
- `category_id`: Foreign key to categories
- `date`: Transaction date

#### `categories`

- `id`: Primary key
- `name`: Category name (unique)

## 🔧 API Endpoints

### Authentication

- `POST /login` - User login

### Transactions

- `GET /api/entries` - Get all entries (with optional filters)
- `GET /api/entries/:id` - Get single entry
- `POST /api/add` - Add new transaction
- `PUT /api/update-transaction/:id` - Update transaction
- `DELETE /api/delete-transaction/:id` - Delete transaction

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/add-category` - Add new category
- `PUT /api/category/:id` - Update category
- `DELETE /api/category/:id` - Delete category

### Reports

- `GET /api/grand-totals` - Get annual totals by category
- `GET /api/monthly-totals/:month` - Get monthly totals
- `GET /api/transactions/:month` - Get transactions for month
- `GET /api/ytd-totals/:month` - Get year-to-date totals
- `GET /api/total-deposits` - Get total deposits

## 🎨 Customization

### Styling

- Modify `frontEnd/style.css` for visual changes
- Color schemes and layouts can be customized
- Responsive design breakpoints can be adjusted

### Functionality

- Add new features by extending the existing API
- Modify calculation logic in the frontend JavaScript files
- Add new report types by creating additional API endpoints

## 🚀 Deployment

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Install dependencies
4. Run the application

### Production Considerations

- Use environment variables for sensitive data
- Set up proper database backups
- Configure HTTPS for secure connections
- Set up monitoring and logging

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start

- Check if port 3000 is available
- Verify database connection
- Check environment variables

#### Database Connection Issues

- Verify DATABASE_URL in .env file
- Ensure PostgreSQL is running
- Check database permissions

#### PIN Not Working

- Ensure PIN is updated in both `script.js` and `monthly-totals.js`
- Check for typos in PIN constant
- Restart server after PIN changes

#### Edit Modal Not Appearing

- Check browser console for JavaScript errors
- Verify API endpoints are working
- Ensure proper authentication

### Debug Mode

Enable debug logging by checking the browser console and server logs for detailed error information.

## 📝 File Structure

```
sharedExpensesApp/
├── frontEnd/
│   ├── index.html          # Main application page
│   ├── script.js           # Main JavaScript functionality
│   ├── monthly-totals.html # Monthly reports page
│   ├── monthly-totals.js   # Monthly reports JavaScript
│   ├── grand-totals.html   # Annual reports page
│   ├── grand-totals.js     # Annual reports JavaScript
│   ├── login.html          # Login page
│   ├── login.js            # Login functionality
│   ├── check-auth.js       # Authentication utilities
│   └── style.css           # Application styles
├── api.js                  # API routes and endpoints
├── server.js               # Express server setup
├── schema.sql              # Database schema
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables
└── README.md               # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check this README for common solutions
2. Review the troubleshooting section
3. Check browser console for error messages
4. Verify all environment variables are set correctly

## 🔄 Version History

### Current Version

- PIN protection for editing
- Comprehensive search and filtering
- Monthly and annual reporting
- Data export functionality
- Responsive design
- Timezone fixes for date handling

---

**Happy Expense Tracking! 💰📊**
