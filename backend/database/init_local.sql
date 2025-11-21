-- Local Development Initialization Script
-- This script creates the database and all tables

-- Create database (for local development only)
DROP DATABASE IF EXISTS hr_portal_db;
CREATE DATABASE hr_portal_db;

-- Connect to the database
\c hr_portal_db;

-- Enable UUID extension (optional, if you want to use UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('HR', 'Manager', 'SkipManager', 'Employee')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    head_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    client_contact VARCHAR(255),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Planned', 'Ongoing', 'Completed', 'On Hold')),
    priority VARCHAR(20) CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    technologies TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 5. Employee Details Table
CREATE TABLE employee_details (
    emp_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(255),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    reporting_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    dob DATE,
    aadhar_no VARCHAR(20),
    pan_no VARCHAR(20),
    passport_no VARCHAR(20),
    contact1 VARCHAR(20),
    contact2 VARCHAR(20),
    email1 VARCHAR(255),
    email2 VARCHAR(255),
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    present_address TEXT,
    permanent_address TEXT,
    marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married')),
    spouse_name VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_relation VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    ready_for_relocation BOOLEAN DEFAULT false,
    criminal_cases BOOLEAN DEFAULT false,
    addictions TEXT,
    health_condition TEXT,
    pandemic_diseases TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project assignment Table
CREATE TABLE project_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    role_in_project VARCHAR(100),
    start_date DATE,
    end_date DATE,
    allocation_percent DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, emp_id, start_date)
);


-- 4. Teams Table
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    team_head_id INTEGER REFERENCES employee_details(emp_id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Team Members Table (Explicit team membership)
-- This allows one employee to be in multiple teams
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    role_in_team VARCHAR(100), -- e.g., 'Developer', 'Designer', 'QA', 'Lead'
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, emp_id) -- One employee can be in a team only once (but can be in multiple teams)
);

-- Educational Details Table
CREATE TABLE educational_details (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    level VARCHAR(20) CHECK (level IN ('10th', '12th', 'Graduation', 'PostGraduation', 'PhD')),
    board_university VARCHAR(255),
    year_of_passing INTEGER,
    cgpa DECIMAL(4, 2),
    document_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certification Table
CREATE TABLE certifications (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    exam_body VARCHAR(255),
    registration_no VARCHAR(100),
    year_of_passing INTEGER,
    has_expiry BOOLEAN DEFAULT false,
    valid_till DATE,
    certificate VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research Papers Table
CREATE TABLE research_papers (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    title VARCHAR(500),
    publication_name VARCHAR(255),
    publication_date DATE,
    doi_link VARCHAR(500),
    research_paper VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Joining Details Table
CREATE TABLE joining_details (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    date_of_joining DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Previous Employment Table
CREATE TABLE previous_employment (
    id SERIAL PRIMARY KEY,
    joining_id INTEGER REFERENCES joining_details(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    designation VARCHAR(255),
    offer_letter_url VARCHAR(500),
    relieving_letter_url VARCHAR(500),
    payslip_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bank Details Table
CREATE TABLE bank_details (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    bank_name VARCHAR(255),
    branch_address TEXT,
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    pan_card VARCHAR(500),
    cancelled_cheque_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BGV (Background Verification) Table
CREATE TABLE bgv (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER UNIQUE REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('Green', 'Yellow', 'Red')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Leave Type Table
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    allocated INTEGER DEFAULT 0,
    consumed INTEGER DEFAULT 0,
    remaining INTEGER DEFAULT 0,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(emp_id, leave_type, year)
);

-- Leave Application Table
CREATE TABLE leave_applications (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Attendance Table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift VARCHAR(50),
    login_time TIME,
    logout_time TIME,
    total_hours DECIMAL(5, 2),
    status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'Half-day')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(emp_id, date)
);

-- 11. Salary Table
CREATE TABLE salary (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    salary_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    basic_salary DECIMAL(12, 2) DEFAULT 0,
    hra DECIMAL(12, 2) DEFAULT 0,
    conveyance_allowance DECIMAL(12, 2) DEFAULT 0,
    medical_allowance DECIMAL(12, 2) DEFAULT 0,
    special_allowance DECIMAL(12, 2) DEFAULT 0,
    other_allowances DECIMAL(12, 2) DEFAULT 0,
    bonus DECIMAL(12, 2) DEFAULT 0,
    gross_salary DECIMAL(12, 2) DEFAULT 0,
    provident_fund DECIMAL(12, 2) DEFAULT 0,
    professional_tax DECIMAL(12, 2) DEFAULT 0,
    income_tax DECIMAL(12, 2) DEFAULT 0,
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    net_salary DECIMAL(12, 2) DEFAULT 0,
    payment_mode VARCHAR(50),
    payment_date DATE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(emp_id, salary_month)
);

-- 12. Insurance Table
CREATE TABLE insurance (
    id SERIAL PRIMARY KEY,
    emp_id INTEGER REFERENCES employee_details(emp_id) ON DELETE CASCADE,
    provider VARCHAR(255),
    policy_number VARCHAR(100) UNIQUE,
    policy_type VARCHAR(50),
    coverage_amount DECIMAL(12, 2),
    premium_amount DECIMAL(12, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dependent Details Table
CREATE TABLE dependent_details (
    id SERIAL PRIMARY KEY,
    insurance_id INTEGER REFERENCES insurance(id) ON DELETE CASCADE,
    name VARCHAR(255),
    relation VARCHAR(50),
    contact VARCHAR(20),
    date_of_birth DATE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claim History Table
CREATE TABLE claim_history (
    id SERIAL PRIMARY KEY,
    insurance_id INTEGER REFERENCES insurance(id) ON DELETE CASCADE,
    claim_date DATE NOT NULL,
    amount DECIMAL(12, 2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    document_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_employee_details_user_id ON employee_details(user_id);
CREATE INDEX idx_employee_details_department_id ON employee_details(department_id);
CREATE INDEX idx_employee_details_reporting_manager_id ON employee_details(reporting_manager_id);
CREATE INDEX idx_attendance_emp_id_date ON attendance(emp_id, date);
CREATE INDEX idx_salary_emp_id_month ON salary(emp_id, salary_month);
CREATE INDEX idx_leave_applications_emp_id ON leave_applications(emp_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_emp_id ON project_assignments(emp_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_emp_id ON team_members(emp_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_assignments_updated_at BEFORE UPDATE ON project_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_details_updated_at BEFORE UPDATE ON employee_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_educational_details_updated_at BEFORE UPDATE ON educational_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_papers_updated_at BEFORE UPDATE ON research_papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_joining_details_updated_at BEFORE UPDATE ON joining_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_previous_employment_updated_at BEFORE UPDATE ON previous_employment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_details_updated_at BEFORE UPDATE ON bank_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bgv_updated_at BEFORE UPDATE ON bgv FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON leave_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_applications_updated_at BEFORE UPDATE ON leave_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salary_updated_at BEFORE UPDATE ON salary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_updated_at BEFORE UPDATE ON insurance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dependent_details_updated_at BEFORE UPDATE ON dependent_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claim_history_updated_at BEFORE UPDATE ON claim_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password should be hashed in your application)
-- Default password: 'admin123' (remember to hash this in your application)
INSERT INTO users (name, email, password, role, is_active) 
VALUES ('Admin User', 'admin@hrportal.com', '$2b$10$example.hash.here', 'HR', true);

COMMENT ON DATABASE hr_portal_db IS 'HR Portal Database - Local Development';
COMMENT ON TABLE team_members IS 'Explicit team membership - allows employees to be in multiple teams';


-- then manually did ALTER TABLE employee_details ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
