CREATE DATABASE smart_placement;

USE smart_placement;

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    branch VARCHAR(50),
    cgpa DOUBLE,
    backlogs INT DEFAULT 0,
    skills VARCHAR(500)
);

CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    job_role VARCHAR(100),
    min_cgpa DOUBLE,
    max_backlogs INT DEFAULT 0,
    required_branch VARCHAR(100),
    required_skills VARCHAR(500)
);

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    company_id INT,
    status VARCHAR(30) DEFAULT 'Applied',
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

INSERT INTO companies
(company_name, job_role, min_cgpa, max_backlogs, required_branch, required_skills)
VALUES
('Infosys', 'Software Developer', 6.0, 0, 'CSE', 'Java,SQL'),
('TCS', 'Java Developer', 6.5, 0, 'CSE', 'Java,MySQL'),
('Wipro', 'Graduate Engineer Trainee', 6.0, 1, 'ANY', 'Java,Python'),
('Accenture', 'Associate Software Engineer', 6.5, 0, 'ANY', 'Java,SQL');