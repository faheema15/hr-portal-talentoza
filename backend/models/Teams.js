// backend/models/teams.js
const pool = require('../config/database');

const teamsModel = {
  // Get all teams
  getAllTeams: async () => {
    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.team_head_id,
        u.name as team_head_name,
        ed.designation as team_head_designation,
        d.name as department_name,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT tm.emp_id) as member_count,
        COUNT(DISTINCT tp.project_id) as project_count,
        JSON_AGG(JSON_BUILD_OBJECT(
          'project_id', tp.project_id,
          'project_name', p.name,
          'status', p.status
        ) ORDER BY p.name) FILTER (WHERE tp.project_id IS NOT NULL) as projects
      FROM teams t
      LEFT JOIN employee_details ed ON t.team_head_id = ed.emp_id
      LEFT JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id
      LEFT JOIN team_members tm ON t.team_id = tm.team_id AND tm.is_active = true
      LEFT JOIN team_projects tp ON t.team_id = tp.team_id
      LEFT JOIN projects p ON tp.project_id = p.id
      GROUP BY t.team_id, t.team_name, t.team_head_id, u.name, 
               ed.designation, d.name, t.created_at, t.updated_at
      ORDER BY t.team_id DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Get team by ID with full details
  getTeamById: async (team_id) => {
    const teamQuery = `
      SELECT 
        t.team_id,
        t.team_name,
        t.team_head_id,
        u.name as team_head_name,
        u.email as team_head_email,
        ed.designation as team_head_designation,
        ed.contact1 as team_head_contact,
        d.id as department_id,
        d.name as department_name,
        t.created_at,
        t.updated_at
      FROM teams t
      LEFT JOIN employee_details ed ON t.team_head_id = ed.emp_id
      LEFT JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE t.team_id = $1
    `;
    
    const projectsQuery = `
      SELECT 
        tp.id as team_project_id,
        p.id as project_id,
        p.name as project_name,
        p.project_code,
        p.description as project_description,
        p.status as project_status,
        p.start_date as project_start_date,
        p.end_date as project_end_date,
        p.client_name,
        p.technologies,
        p.budget,
        p.actual_cost,
        tp.start_date as assignment_start_date,
        tp.end_date as assignment_end_date,
        tp.role_in_project
      FROM team_projects tp
      JOIN projects p ON tp.project_id = p.id
      WHERE tp.team_id = $1
      ORDER BY p.name
    `;
    
    const membersQuery = `
      SELECT 
        ed.emp_id,
        u.name as member_name,
        u.email as member_email,
        ed.designation,
        ed.contact1,
        tm.role_in_team,
        tm.start_date,
        tm.end_date,
        tm.is_active,
        d.name as department_name
      FROM team_members tm
      JOIN employee_details ed ON tm.emp_id = ed.emp_id
      JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE tm.team_id = $1
      ORDER BY tm.is_active DESC, u.name
    `;

    const teamResult = await pool.query(teamQuery, [team_id]);
    const projectsResult = await pool.query(projectsQuery, [team_id]);
    const membersResult = await pool.query(membersQuery, [team_id]);

    if (teamResult.rows.length === 0) {
      return null;
    }

    return {
      ...teamResult.rows[0],
      projects: projectsResult.rows,
      members: membersResult.rows
    };
  },

  // Create new team (unchanged)
  createTeam: async (team_data) => {
    const { team_name, team_head_id } = team_data;
    
    const query = `
      INSERT INTO teams (team_name, team_head_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const values = [team_name, team_head_id || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update team (unchanged)
  updateTeam: async (team_id, team_data) => {
    const { team_name, team_head_id } = team_data;
    
    const query = `
      UPDATE teams 
      SET team_name = $1, 
          team_head_id = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE team_id = $3
      RETURNING *
    `;
    
    const values = [team_name, team_head_id || null, team_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete team (unchanged)
  deleteTeam: async (team_id) => {
    const query = 'DELETE FROM teams WHERE team_id = $1 RETURNING *';
    const result = await pool.query(query, [team_id]);
    return result.rows[0];
  },

  // Add project to team
  addProjectToTeam: async (team_project_data) => {
    const { team_id, project_id, start_date, end_date, role_in_project } = team_project_data;
    
    const query = `
      INSERT INTO team_projects (team_id, project_id, start_date, end_date, role_in_project)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (team_id, project_id)
      DO UPDATE SET
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        role_in_project = EXCLUDED.role_in_project,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [team_id, project_id, start_date || null, end_date || null, role_in_project || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Remove project from team
  removeProjectFromTeam: async (team_id, project_id) => {
    const query = `
      DELETE FROM team_projects 
      WHERE team_id = $1 AND project_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [team_id, project_id]);
    return result.rows[0];
  },

  // Get all employees for dropdown
  getAllEmployees: async () => {
    const query = `
      SELECT 
        ed.emp_id,
        u.name,
        u.email,
        ed.designation,
        d.name as department_name
      FROM employee_details ed
      JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id
      WHERE u.is_active = true
      ORDER BY u.name
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Get all projects for dropdown
  getAllProjects: async () => {
    const query = `
      SELECT 
        id as project_id,
        name as project_name,
        project_code,
        status
      FROM projects
      WHERE status IN ('Ongoing', 'Planned')
      ORDER BY name
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Add team member (unchanged)
  addTeamMember: async (member_data) => {
    const { team_id, emp_id, role_in_team, start_date, end_date } = member_data;
    
    const query = `
      INSERT INTO team_members (team_id, emp_id, role_in_team, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (team_id, emp_id) 
      DO UPDATE SET 
        role_in_team = EXCLUDED.role_in_team,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [team_id, emp_id, role_in_team || null, start_date || null, end_date || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Remove team member (unchanged)
  removeTeamMember: async (team_id, emp_id) => {
    const query = `
      DELETE FROM team_members 
      WHERE team_id = $1 AND emp_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [team_id, emp_id]);
    return result.rows[0];
  }
};

module.exports = teamsModel;