const db = require('../db');
const { validationResult } = require('express-validator');
const { format } = require('date-fns');

// ============= TECHNICIAN FUNCTIONS (Simple to use) =============

// Record a safety check (for technicians)
exports.recordSafetyCheck = (req, res) => {
  const { task_id, technician_id, check_type, safety_status, notes, location } = req.body;

  const query = `
    INSERT INTO safety_checks (task_id, technician_id, check_type, safety_status, notes, location)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [task_id, technician_id, check_type, safety_status, notes, location], (err, result) => {
    if (err) {
      console.error('Error recording safety check:', err);
      return res.status(500).json({ message: 'Error recording safety check' });
    }

    // Update task safety status and last check time
    const updateTaskQuery = `
      UPDATE tasks 
      SET safety_status = ?, last_safety_check = NOW() 
      WHERE id = ?
    `;
    
    db.query(updateTaskQuery, [safety_status, task_id], (updateErr) => {
      if (updateErr) {
        console.error('Error updating task safety status:', updateErr);
      }
    });

    res.status(201).json({ 
      message: 'Safety check recorded successfully', 
      checkId: result.insertId 
    });
  });
};

// Report a safety incident (for technicians)
exports.reportIncident = (req, res) => {
  const { task_id, reported_by, incident_type, severity, description, immediate_action, location } = req.body;

  if (!description) {
    return res.status(400).json({ message: 'Description is required for incident report' });
  }

  const query = `
    INSERT INTO safety_incidents (task_id, reported_by, incident_type, severity, description, immediate_action, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [task_id, reported_by, incident_type, severity, description, immediate_action, location], (err, result) => {
    if (err) {
      console.error('Error reporting incident:', err);
      return res.status(500).json({ message: 'Error reporting incident' });
    }

    // Auto-update task safety status based on severity
    let taskSafetyStatus = 'warning';
    if (severity === 'high' || severity === 'critical') {
      taskSafetyStatus = 'blocked';
    }

    const updateTaskQuery = `UPDATE tasks SET safety_status = ? WHERE id = ?`;
    db.query(updateTaskQuery, [taskSafetyStatus, task_id], (updateErr) => {
      if (updateErr) {
        console.error('Error updating task safety status after incident:', updateErr);
      }
    });

    res.status(201).json({ 
      message: 'Safety incident reported successfully', 
      incidentId: result.insertId 
    });
  });
};

// Get safety status for a task (for technicians)
exports.getTaskSafetyStatus = (req, res) => {
  const { taskId } = req.params;

  const query = `
    SELECT 
      t.id,
      t.title,
      t.safety_status,
      t.last_safety_check,
      t.safety_notes,
      COUNT(sc.id) as total_checks,
      COUNT(si.id) as total_incidents
    FROM tasks t
    LEFT JOIN safety_checks sc ON t.id = sc.task_id
    LEFT JOIN safety_incidents si ON t.id = si.task_id AND si.resolved = FALSE
    WHERE t.id = ?
    GROUP BY t.id
  `;

  db.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error fetching task safety status:', err);
      return res.status(500).json({ message: 'Error fetching safety status' });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(result[0]);
  });
};

// Get technician's own safety checks
exports.getTechnicianChecks = (req, res) => {
  const { technicianId } = req.params;

  const query = `
    SELECT 
      sc.*,
      t.title as task_title
    FROM safety_checks sc
    JOIN tasks t ON sc.task_id = t.id
    WHERE sc.technician_id = ?
    ORDER BY sc.created_at DESC
    LIMIT 50
  `;

  db.query(query, [technicianId], (err, results) => {
    if (err) {
      console.error('Error fetching technician checks:', err);
      return res.status(500).json({ message: 'Error fetching safety checks' });
    }

    const formattedResults = results.map(check => ({
      ...check,
      created_at: format(new Date(check.created_at), 'yyyy-MM-dd HH:mm:ss')
    }));

    res.status(200).json(formattedResults);
  });
};

// Get technician's own reported incidents
exports.getTechnicianIncidents = (req, res) => {
  const { technicianId } = req.params;

  const query = `
    SELECT 
      si.*,
      t.title as task_title,
      u.username as resolved_by_name
    FROM safety_incidents si
    JOIN tasks t ON si.task_id = t.id
    LEFT JOIN users u ON si.resolved_by = u.id
    WHERE si.reported_by = ?
    ORDER BY si.created_at DESC
    LIMIT 50
  `;

  db.query(query, [technicianId], (err, results) => {
    if (err) {
      console.error('Error fetching technician incidents:', err);
      return res.status(500).json({ message: 'Error fetching incidents' });
    }

    const formattedResults = results.map(incident => ({
      ...incident,
      created_at: format(new Date(incident.created_at), 'yyyy-MM-dd HH:mm:ss'),
      resolved_at: incident.resolved_at ? format(new Date(incident.resolved_at), 'yyyy-MM-dd HH:mm:ss') : null
    }));

    res.status(200).json(formattedResults);
  });
};

// ============= ADMIN FUNCTIONS (View and manage) =============

// Get all safety checks (admin view)
exports.getAllSafetyChecks = (req, res) => {
  const query = `
    SELECT 
      sc.*,
      t.title as task_title,
      u.username as technician_name
    FROM safety_checks sc
    JOIN tasks t ON sc.task_id = t.id
    JOIN users u ON sc.technician_id = u.id
    ORDER BY sc.created_at DESC
    LIMIT 100
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching safety checks:', err);
      return res.status(500).json({ message: 'Error fetching safety checks' });
    }

    const formattedResults = results.map(check => ({
      ...check,
      created_at: format(new Date(check.created_at), 'yyyy-MM-dd HH:mm:ss')
    }));

    res.status(200).json(formattedResults);
  });
};

// Get all safety incidents (admin view)
exports.getAllIncidents = (req, res) => {
  const query = `
    SELECT 
      si.*,
      t.title as task_title,
      u1.username as reported_by_name,
      u2.username as resolved_by_name
    FROM safety_incidents si
    JOIN tasks t ON si.task_id = t.id
    JOIN users u1 ON si.reported_by = u1.id
    LEFT JOIN users u2 ON si.resolved_by = u2.id
    ORDER BY si.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching incidents:', err);
      return res.status(500).json({ message: 'Error fetching incidents' });
    }

    const formattedResults = results.map(incident => ({
      ...incident,
      created_at: format(new Date(incident.created_at), 'yyyy-MM-dd HH:mm:ss'),
      resolved_at: incident.resolved_at ? format(new Date(incident.resolved_at), 'yyyy-MM-dd HH:mm:ss') : null
    }));

    res.status(200).json(formattedResults);
  });
};

// Resolve safety incident (admin only)
exports.resolveIncident = (req, res) => {
  const { incidentId } = req.params;
  const { resolved_by } = req.body;

  const query = `
    UPDATE safety_incidents 
    SET resolved = TRUE, resolved_at = NOW(), resolved_by = ? 
    WHERE id = ?
  `;

  db.query(query, [resolved_by, incidentId], (err, result) => {
    if (err) {
      console.error('Error resolving incident:', err);
      return res.status(500).json({ message: 'Error resolving incident' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.status(200).json({ message: 'Incident resolved successfully' });
  });
};

// Get safety dashboard data (admin overview)
exports.getSafetyDashboard = (req, res) => {
  const dashboardQuery = `
    SELECT 
      (SELECT COUNT(*) FROM safety_checks WHERE DATE(created_at) = CURDATE()) as todays_checks,
      (SELECT COUNT(*) FROM safety_incidents WHERE resolved = FALSE) as open_incidents,
      (SELECT COUNT(*) FROM safety_incidents WHERE severity IN ('high', 'critical') AND resolved = FALSE) as critical_incidents,
      (SELECT COUNT(*) FROM tasks WHERE safety_status = 'blocked') as blocked_tasks,
      (SELECT COUNT(*) FROM tasks WHERE safety_status = 'warning') as warning_tasks
  `;

  db.query(dashboardQuery, (err, result) => {
    if (err) {
      console.error('Error fetching safety dashboard:', err);
      return res.status(500).json({ message: 'Error fetching dashboard data' });
    }

    res.status(200).json(result[0]);
  });
};

// Create safety audit (admin only)
exports.createSafetyAudit = (req, res) => {
  const { task_id, auditor_id, audit_score, findings, recommendations, compliance_status, follow_up_required, follow_up_date } = req.body;

  const query = `
    INSERT INTO safety_audits (task_id, auditor_id, audit_score, findings, recommendations, compliance_status, follow_up_required, follow_up_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [task_id, auditor_id, audit_score, findings, recommendations, compliance_status, follow_up_required, follow_up_date], (err, result) => {
    if (err) {
      console.error('Error creating safety audit:', err);
      return res.status(500).json({ message: 'Error creating safety audit' });
    }

    res.status(201).json({ 
      message: 'Safety audit created successfully', 
      auditId: result.insertId 
    });
  });
};

// Get all safety audits (admin view)
exports.getAllAudits = (req, res) => {
  const query = `
    SELECT 
      sa.*,
      t.title as task_title,
      u.username as auditor_name
    FROM safety_audits sa
    JOIN tasks t ON sa.task_id = t.id
    JOIN users u ON sa.auditor_id = u.id
    ORDER BY sa.audit_date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching safety audits:', err);
      return res.status(500).json({ message: 'Error fetching safety audits' });
    }

    const formattedResults = results.map(audit => ({
      ...audit,
      audit_date: format(new Date(audit.audit_date), 'yyyy-MM-dd HH:mm:ss'),
      follow_up_date: audit.follow_up_date ? format(new Date(audit.follow_up_date), 'yyyy-MM-dd') : null
    }));

    res.status(200).json(formattedResults);
  });
};

// Get safety audits for a specific task
exports.getTaskAudits = (req, res) => {
  const { taskId } = req.params;

  const query = `
    SELECT 
      sa.*,
      u.username as auditor_name
    FROM safety_audits sa
    JOIN users u ON sa.auditor_id = u.id
    WHERE sa.task_id = ?
    ORDER BY sa.audit_date DESC
  `;

  db.query(query, [taskId], (err, results) => {
    if (err) {
      console.error('Error fetching task audits:', err);
      return res.status(500).json({ message: 'Error fetching task audits' });
    }

    const formattedResults = results.map(audit => ({
      ...audit,
      audit_date: format(new Date(audit.audit_date), 'yyyy-MM-dd HH:mm:ss'),
      follow_up_date: audit.follow_up_date ? format(new Date(audit.follow_up_date), 'yyyy-MM-dd') : null
    }));

    res.status(200).json(formattedResults);
  });
};