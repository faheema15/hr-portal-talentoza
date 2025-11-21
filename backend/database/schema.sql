-- backend/database/schema.sql

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('employee', 'hr', 'manager', 'skip_level_manager')),
  emp_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee details table
CREATE TABLE IF NOT EXISTS employee_details (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) UNIQUE NOT NULL,
  photo TEXT,
  dob DATE,
  aadhar VARCHAR(20),
  pan VARCHAR(20),
  passport_number VARCHAR(50),
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  contact1 VARCHAR(20),
  contact2 VARCHAR(20),
  mail_id1 VARCHAR(255),
  mail_id2 VARCHAR(255),
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  present_address TEXT,
  permanent_address TEXT,
  education TEXT,
  marital_status VARCHAR(50),
  spouse_name VARCHAR(255),
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  ready_for_relocation VARCHAR(10),
  criminal_cases TEXT,
  fir TEXT,
  addictions TEXT,
  health_condition TEXT,
  pandemic_diseases TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_emp_id ON users(emp_id);
CREATE INDEX idx_employee_details_emp_id ON employee_details(emp_id);