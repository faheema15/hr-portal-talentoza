-- HR Portal Database Initialization Script
-- Run this script to set up all required tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS insurance CASCADE;
DROP TABLE IF EXISTS salary CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS leave CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS bgv CASCADE;
DROP TABLE IF EXISTS bank_details CASCADE;
DROP TABLE IF EXISTS joining_details CASCADE;
DROP TABLE IF EXISTS employee_details CASCADE;
DROP TABLE IF EXISTS users CASCADE; 
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'hr', 'manager', 'skip_level_manager')),
  emp_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employee_details table
CREATE TABLE employee_details (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) UNIQUE NOT NULL,
  photo TEXT,
  dob DATE,
  aadhar VARCHAR(20),
  pan VARCHAR(20),
  passport_number VARCHAR(20),
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  contact1 VARCHAR(20),
  contact2 VARCHAR(20),
  mail_id1 VARCHAR(100),
  mail_id2 VARCHAR(100),
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  present_address TEXT,
  permanent_address TEXT,
  education TEXT,
  marital_status VARCHAR(20),
  spouse_name VARCHAR(100),
  emergency_contact VARCHAR(100),
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

-- Create joining_details table
CREATE TABLE joining_details (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) UNIQUE NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  dob DATE,
  aadhar_pan VARCHAR(50),
  passport_number VARCHAR(20),
  emp_name VARCHAR(200),
  contact1 VARCHAR(20),
  contact2 VARCHAR(20),
  mail_id1 VARCHAR(100),
  mail_id2 VARCHAR(100),
  date_of_joining DATE,
  designation VARCHAR(100),
  department VARCHAR(100),
  project_name VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bank_details table
CREATE TABLE bank_details (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) UNIQUE NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  dob DATE,
  aadhar_pan VARCHAR(50),
  passport_number VARCHAR(20),
  emp_name VARCHAR(200),
  contact1 VARCHAR(20),
  contact2 VARCHAR(20),
  mail_id1 VARCHAR(100),
  mail_id2 VARCHAR(100),
  date_of_joining DATE,
  bank_name VARCHAR(200),
  branch_address TEXT,
  bank_account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bgv table
CREATE TABLE bgv (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) UNIQUE NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  dob DATE,
  aadhar_number VARCHAR(20),
  passport_number VARCHAR(20),
  emp_name VARCHAR(200),
  contact1 VARCHAR(20),
  contact2 VARCHAR(20),
  mail_id1 VARCHAR(100),
  mail_id2 VARCHAR(100),
  date_of_joining DATE,
  designation VARCHAR(100),
  department VARCHAR(100),
  project_name VARCHAR(200),
  bgv_status VARCHAR(20),
  reason_for_reject TEXT,
  education TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create department table
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  head VARCHAR(200),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) UNIQUE NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  dob DATE,
  aadhar_pan VARCHAR(50),
  passport_number VARCHAR(20),
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  contact1 VARCHAR(20),
  contact2 VARCHAR(20),
  mail_id1 VARCHAR(100),
  mail_id2 VARCHAR(100),
  designation VARCHAR(100),
  department_id VARCHAR(50),
  department_name VARCHAR(100),
  reporting_manager VARCHAR(100),
  project_name VARCHAR(200),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leave table
CREATE TABLE leave (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  emp_name VARCHAR(200),
  designation VARCHAR(100),
  department_id VARCHAR(50),
  department_name VARCHAR(100),
  reporting_manager VARCHAR(100),
  project_name VARCHAR(200),
  sick_leaves_allocated INT,
  sick_leaves_consumed INT,
  sick_leaves_remaining INT,
  rh_allocated INT,
  rh_consumed INT,
  rh_remaining INT,
  pl_allocated INT,
  pl_consumed INT,
  pl_remaining INT,
  leave_apply_type VARCHAR(100),
  leave_from_date DATE,
  leave_to_date DATE,
  reason_for_leave TEXT,
  approval_manager VARCHAR(100),
  skip_level_manager VARCHAR(100),
  leave_approval_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  emp_name VARCHAR(200),
  designation VARCHAR(100),
  department_id VARCHAR(50),
  department_name VARCHAR(100),
  reporting_manager VARCHAR(100),
  project_name VARCHAR(200),
  shift_timings VARCHAR(50),
  regularisation_days INT,
  attendance_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create salary table
CREATE TABLE salary (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  emp_name VARCHAR(200),
  designation VARCHAR(100),
  department_id VARCHAR(50),
  department_name VARCHAR(100),
  reporting_manager VARCHAR(100),
  project_name VARCHAR(200),
  basic_salary DECIMAL(10, 2),
  hra DECIMAL(10, 2),
  conveyance_allowance DECIMAL(10, 2),
  medical_allowance DECIMAL(10, 2),
  special_allowance DECIMAL(10, 2),
  other_allowances DECIMAL(10, 2),
  gross_salary DECIMAL(10, 2),
  provident_fund DECIMAL(10, 2),
  professional_tax DECIMAL(10, 2),
  income_tax DECIMAL(10, 2),
  other_deductions DECIMAL(10, 2),
  total_deductions DECIMAL(10, 2),
  net_salary DECIMAL(10, 2),
  payment_mode VARCHAR(50),
  payment_date DATE,
  salary_month VARCHAR(10),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create insurance table
CREATE TABLE insurance (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) NOT NULL REFERENCES employee_details(emp_id) ON DELETE CASCADE,
  photo TEXT,
  emp_name VARCHAR(200),
  designation VARCHAR(100),
  department_id VARCHAR(50),
  department_name VARCHAR(100),
  reporting_manager VARCHAR(100),
  project_name VARCHAR(200),
  insurance_provider VARCHAR(200),
  policy_number VARCHAR(100),
  policy_type VARCHAR(100),
  coverage_amount DECIMAL(10, 2),
  premium_amount DECIMAL(10, 2),
  policy_start_date DATE,
  policy_end_date DATE,
  policy_status VARCHAR(50),
  nominee_details VARCHAR(200),
  nominee_relation VARCHAR(50),
  nominee_contact_number VARCHAR(20),
  dependents_count INT,
  dependent_details TEXT,
  claim_history TEXT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_emp_id_joining ON joining_details(emp_id);
CREATE INDEX idx_emp_id_bank ON bank_details(emp_id);
CREATE INDEX idx_emp_id_bgv ON bgv(emp_id);
CREATE INDEX idx_emp_id_department ON department(emp_id);
CREATE INDEX idx_emp_id_leave ON leave(emp_id);
CREATE INDEX idx_emp_id_attendance ON attendance(emp_id);
CREATE INDEX idx_emp_id_salary ON salary(emp_id);
CREATE INDEX idx_emp_id_insurance ON insurance(emp_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_emp_id ON users(emp_id) WHERE emp_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_emp_id_joining ON joining_details(emp_id);

-- Insert sample data (optional)
INSERT INTO employee_details (emp_id, first_name, middle_name, last_name, contact1, mail_id1, dob)
VALUES 
  ('EMP001', 'Rajesh', 'Kumar', 'Sharma', '+91 9876543210', 'rajesh@company.com', '1990-05-15'),
  ('EMP002', 'Priya', '', 'Singh', '+91 9876543211', 'priya@company.com', '1992-08-20'),
  ('EMP003', 'Amit', 'Kumar', 'Patel', '+91 9876543212', 'amit@company.com', '1988-12-10');

COMMENT ON TABLE employee_details IS 'Main employee information table';
COMMENT ON TABLE joining_details IS 'Employee joining information';
COMMENT ON TABLE bank_details IS 'Employee banking information';
COMMENT ON TABLE bgv IS 'Background verification details';
COMMENT ON TABLE department IS 'Department and project assignments';
COMMENT ON TABLE leave IS 'Leave management records';
COMMENT ON TABLE attendance IS 'Attendance tracking';
COMMENT ON TABLE salary IS 'Salary and payment details';
COMMENT ON TABLE insurance IS 'Insurance policy information';

SELECT 'Database setup completed successfully!' AS status;