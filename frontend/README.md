1. Users
| Field                  | Type                                             | Notes                        |
| ---------------------- | ------------------------------------------------ | ---------------------------- |
| id                     | PK                                               | auto increment               |
| name                   | string                                           | HR / Manager / Employee name |
| email                  | string                                           | login credential             |
| password               | string                                           | hashed                       |
| role                   | enum(`HR`, `Manager`, `SkipManager`, `Employee`) | access control               |
| is_active              | boolean                                          | account status               |
| created_at, updated_at | timestamps                                       |                              |




2. Departments
| Field                  | Type           | Notes           |
| ---------------------  | -------------- | --------------- |
| id                     | PK             |                 |
| name                   | string         | Department name |
| head_id                | FK → users(id) | department head |



3. projects
| Field                  | Type                                               | Notes           |
| ---------------------- | -------------------------------------------------- | --------------- |
| id                     | PK                                                 |                 |
| name                   | string                                             |                 |
| start_date             | date                                               |                 |
| end_date               | date                                               |                 |
| status                 | enum(`Planned`, `Ongoing`, `Completed`, `On Hold`) |                 |
| manager_id             | FK → users(id)                                     | project manager |



4. teams
| Field                 | Type                            | Notes                                         |
| --------------------- | ------------------------------- | --------------------------------------------- |
| team_id               | PK                              | Unique team identifier                        |
| team_name             | string                          | e.g., “Payroll”, “Recruitment”, “Engineering” |
| team_head_id**        | FK → `employee_details(emp_id)` | The leader of the team                        |
| project_id            | FK → `projects(id)` (optional)  | if the team belongs to a project              |




5. employee detail
| Field                    | Type                      | Notes               |
| ------------------------ | ------------------------- | ------------------- |
| emp_id                   | PK                        | unique employee ID  |
| user_id                  | FK → users(id)            | login mapping       |
| designation              | string                    |                     |
| department_id            | FK → departments(id)      |                     |
| reporting_manager_id     | FK → users(id)            |                     |
| dob                      | date                      |                     |
| aadhar_no                | string                    |                     |
| pan_no                   | string                    |                     |
| passport_no              | string                    | nullable            |
| contact1, contact2       | string                    |                     |
| email1, email2           | string                    |                     |
| father_name, mother_name | string                    |                     |
| present_address          | text                      |                     |
| permanent_address        | text                      |                     |
| marital_status           | enum(`Single`, `Married`) |                     |
| spouse_name              | string                    | nullable            |
| emergency_contact_name   | string                    |                     |
| emergency_relation       | string                    |                     |
| emergency_contact_number | string                    |                     |
| ready_for_relocation     | boolean                   |                     |
| criminal_cases           | boolean                   |                     |
| addictions               | string                    | nullable            |
| health_condition         | text                      |                     |
| pandemic_diseases        | text                      | nullable            |
| photo_url                | string                    | file path or S3 URL |


Educational Details
| Field            | Type                                                        | Notes     |
| ---------------- | ----------------------------------------------------------- | --------- |
| id               | PK                                                          |           |
| emp_id           | FK → employee_details(emp_id)                               |           |
| level            | enum(`10th`, `12th`, `Graduation`, `PostGraduation`, `PhD`) |           |
| board_university | string                                                      |           |
| year_of_passing  | int                                                         |           |
| cgpa             | float                                                       |           |
| document_url     | string                                                      | file path |


Certification
| Field           | Type                          | Notes |
| --------------- | ----------------------------- | ----- |
| id              | PK                            |       |
| emp_id          | FK → employee_details(emp_id) |       |
| exam_body       | string                        |       |
| registration_no | string                        |       |
| year_of_passing | int                           |       |
| has_expiry      | boolean                       |       |
| valid_till      | date (depens on has expiry)   |       |
| certificate     | string                        | file  |

Research papers
| Field           | Type                          | Notes |
| --------------- | ----------------------------- | ----- |
| id              | PK                            |       |
| emp_id          | FK → employee_details(emp_id) |       |
| title           | string                        |       |
| publicationname | string                        |       |
| publicationdate | date                          |       |
| doi_link        | string                        |       |
| Research paper  | string                        | file  |


6. joining details 
| Field           | Type | Notes |
| --------------- | ---- | ----- |
| id              | PK   |       |
| emp_id          | FK   |       |
| date_of_joining | date |       |


| id                   | PK                       | |
| joining_id           | FK → joining_details(id) | |
| company_name         | string                   | |
| start_date           | date                     | |
| end_date             | date                     | |
| designation          | string                   | |
| offer_letter_url     | string                   | |
| relieving_letter_url | string                   | |
| payslip_urls         | text[]                   | |


7. bank details
| Field                | Type                          | Description                                                |
| -------------------- | ----------------------------- | ---------------------------------------------------------- |
| id                   | PK                            |                                                            |
| emp_id               | FK → employee_details(emp_id) | Employee this account belongs to                           |
| bank_name            | string                        |                                                            |
| branch_address       | string                        |                                                            |
| account_number       | string                        |                                                            |
| ifsc_code            | string                        |                                                            |
| pan_card             | string                        | File path / URL                                            |
| cancelled_cheque_url | string                        | File path / URL                                            |
| start_date           | date                          | When this account became active                            |
| end_date             | date or null                  | When this account stopped being used (null = still active) |
| is_primary           | boolean                       | true if salary is credited here                            |
| created_at           | timestamp                     | Auto                                                       |
| updated_at           | timestamp                     | Auto                                                       |



8. BGV
| Field   | Type                           | Notes                |
| ------- | ------------------------------ | -------------------- |
| emp_id  | FK                             |                      |
| status  | enum(`Green`, `Yellow`, `Red`) |                      |
| remarks | text                           | reason for rejection |


9. leave
Leave type
| Field      | Type           | Notes                           |
| ---------- | -------------- | ------------------------------- |
| id         | PK             |                                 |
| emp_id     | FK → employees | which employee                  |
| leave_type | ENUM or string | e.g. “Casual”, “Sick”, “Earned” |
| allocated  | int            |                                 |
| consumed   | int            |                                 |
| remaining  | int            | computed                        |
| year       | int            | for yearly reset                |

Leave application
| Field       | Type                                                 | Notes         |
| ----------- | ---------------------------------------------------- | ------------- |
| id          | PK                                                   |               |
| emp_id      | FK → employees                                       |               |
| leave_type  | same ENUM/string as above                            |               |
| from_date   | date                                                 |               |
| to_date     | date                                                 |               |
| reason      | text                                                 |               |
| status      | ENUM(`Pending`, `Approved`, `Rejected`, `Cancelled`) |               |



10. attendance
| Field       | Type                                           | Notes    |
| ----------- | ---------------------------------------------- | -------- |
| emp_id      | FK                                             |          |
| date        | date                                           |          |
| shift       | string                                         |          |
| login_time  | time                                           |          |
| logout_time | time                                           |          |
| total_hours | decimal                                        | computed |
| status      | enum(`Present`, `Absent`, `Half-day`)          |          |



13. Salary
| Field                | Type    | Notes     |
| -------------------- | ------- | --------- |
| emp_id               | FK      |           |
| salary_month         | string  | `YYYY-MM` |
| basic_salary         | decimal |           |
| hra                  | decimal |           |
| conveyance_allowance | decimal |           |
| medical_allowance    | decimal |           |
| special_allowance    | decimal |           |
| other_allowances     | decimal |           |
| bonus                | decimal |           |
| gross_salary         | decimal | computed  |
| provident_fund       | decimal |           |
| professional_tax     | decimal |           |
| income_tax           | decimal |           |
| total_deductions     | decimal | computed  |
| net_salary           | decimal | computed  |
| payment_mode         | string  |           |
| payment_date         | date    |           |
| remarks              | text    |           |


12. insurance
| Field           | Type                                   | Notes                              |
| --------------- | -------------------------------------- | ---------------------------------- |
| id              | PK                                     | unique policy ID                   |
| emp_id          | FK → employee_details(emp_id)          | the employee who owns the policy   |
| provider        | string                                 | e.g., LIC, HDFC, ICICI Lombard     |
| policy_number   | string                                 | policy ID assigned by the insurer  |
| policy_type     | string                                 | e.g., “Health”, “Life”, “Accident” |
| coverage_amount | decimal                                | sum insured                        |
| premium_amount  | decimal                                | yearly/monthly premium             |
| start_date      | date                                   | coverage start                     |
| end_date        | date                                   | coverage end                       |
| status          | enum(`Active`, `Expired`, `Cancelled`) | current state                      |
| remarks         | text (optional)                        | admin comments                     |

Dependent_Details
| Field         | Type               | Notes                                               |
| ------------- | ------------------ | --------------------------------------------------- |
| id            | PK                 | unique dependent record                             |
| insurance_id  | FK → insurance(id) | links this dependent to a specific insurance policy |
| name          | string             | dependent’s name                                    |
| relation      | string             | e.g., “Spouse”, “Child”, “Parent”                   |
| contact       | string             | phone number (optional)                             |
| date_of_birth | date (optional)    | if needed                                           |
| remarks       | text (optional)    |                                                     |


Claim_History
| Field        | Type                                    | Notes                                   |
| ------------ | --------------------------------------- | --------------------------------------- |
| id           | PK                                      | unique claim record                     |
| insurance_id | FK → insurance(id)                      | links the claim to its insurance policy |
| claim_date   | date                                    | date of claim                           |
| amount       | decimal                                 | claim amount                            |
| description  | text                                    | reason or note                          |
| status       | enum(`Pending`, `Approved`, `Rejected`) | optional field                          |
| document_url | string (nullable)(optional)             | file proof (invoice, receipt, etc.)     |


