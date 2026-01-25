## How to Set MySQL Root Password

### Method 1: Using MySQL Workbench (GUI)
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Go to Server > Users and Privileges
4. Select 'root' user
5. Click "Change Password"
6. Enter new password and click OK

### Method 2: Using Command Line
1. Open Command Prompt as Administrator
2. Navigate to MySQL bin directory:
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   (or wherever your MySQL is installed)

3. Connect to MySQL:
   mysql -u root -p
   (Press Enter if no password, or enter current password)

4. Run this command to set password:
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
   FLUSH PRIVILEGES;
   EXIT;

### Method 3: Reset Password if Forgotten
1. Stop MySQL service:
   - Open Services (services.msc)
   - Find MySQL service and stop it

2. Start MySQL without password check:
   mysqld --skip-grant-tables

3. In another command prompt:
   mysql -u root
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
   EXIT;

4. Restart MySQL service normally

### After Setting Password
Update your .env file:
DB_PASSWORD=your_new_password

### Common Default Passwords
- No password (empty)
- root
- password
- admin
