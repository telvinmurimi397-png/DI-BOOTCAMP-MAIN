CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('company', 'organization', 'volunteer', 'admin')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget NUMERIC(12, 2) CHECK (budget IS NULL OR budget >= 0),
    target_metric INTEGER CHECK (target_metric IS NULL OR target_metric >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Approved', 'Completed')),
    company_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_volunteers (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, volunteer_id)
);

CREATE INDEX IF NOT EXISTS projects_company_id_idx ON projects(company_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS project_volunteers_volunteer_id_idx ON project_volunteers(volunteer_id);