const multer = require('multer');
const { format } = require('date-fns');
const db = require('../db');

// Multer setup for contract documents
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to execute queries
const executeQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Get all clients with basic info
exports.getAllClients = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        client_name, 
        email, 
        phone, 
        address, 
        company_name,
        client_type,
        status,
        created_at,
        updated_at
      FROM clients 
      ORDER BY created_at DESC
    `;
    
    const clients = await executeQuery(query);
    
    // Format dates
    const formattedClients = clients.map(client => ({
      ...client,
      created_at: format(new Date(client.created_at), 'MM/dd/yyyy'),
      updated_at: format(new Date(client.updated_at), 'MM/dd/yyyy')
    }));
    
    res.status(200).json(formattedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients' });
  }
};

// Get single client with full details including service history and contracts
exports.getClientById = async (req, res) => {
  const { clientId } = req.params;
  
  try {
    // Get client basic info
    const clientQuery = `
      SELECT * FROM clients WHERE id = ?
    `;
    const clients = await executeQuery(clientQuery, [clientId]);
    
    if (clients.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const client = clients[0];
    
    // Get service history
    const serviceQuery = `
      SELECT 
        id,
        service_type,
        service_description,
        service_date,
        technician_assigned,
        status,
        cost,
        notes,
        created_at
      FROM service_history 
      WHERE client_id = ? 
      ORDER BY service_date DESC
    `;
    const serviceHistory = await executeQuery(serviceQuery, [clientId]);
    
    // Get contracts
    const contractQuery = `
      SELECT 
        id,
        contract_title,
        contract_type,
        start_date,
        end_date,
        contract_value,
        status,
        terms,
        document_name,
        created_at
      FROM contracts 
      WHERE client_id = ? 
      ORDER BY created_at DESC
    `;
    const contracts = await executeQuery(contractQuery, [clientId]);
    
    // Format dates
    const formattedClient = {
      ...client,
      created_at: format(new Date(client.created_at), 'MM/dd/yyyy'),
      updated_at: format(new Date(client.updated_at), 'MM/dd/yyyy'),
      serviceHistory: serviceHistory.map(service => ({
        ...service,
        service_date: format(new Date(service.service_date), 'MM/dd/yyyy'),
        created_at: format(new Date(service.created_at), 'MM/dd/yyyy')
      })),
      contracts: contracts.map(contract => ({
        ...contract,
        start_date: format(new Date(contract.start_date), 'MM/dd/yyyy'),
        end_date: format(new Date(contract.end_date), 'MM/dd/yyyy'),
        created_at: format(new Date(contract.created_at), 'MM/dd/yyyy')
      }))
    };
    
    res.status(200).json(formattedClient);
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ message: 'Error fetching client details' });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  const {
    client_name,
    email,
    phone,
    address,
    company_name,
    client_type,
    notes
  } = req.body;
  
  if (!client_name || !email || !phone) {
    return res.status(400).json({ message: 'Client name, email, and phone are required' });
  }
  
  try {
    const query = `
      INSERT INTO clients (
        client_name, 
        email, 
        phone, 
        address, 
        company_name, 
        client_type, 
        notes,
        status,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const values = [
      client_name,
      email,
      phone,
      address || null,
      company_name || null,
      client_type || 'individual',
      notes || null
    ];
    
    const result = await executeQuery(query, values);
    
    res.status(201).json({ 
      message: 'Client created successfully',
      clientId: result.insertId
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Error creating client' });
  }
};

// Update client information
exports.updateClient = async (req, res) => {
  const { clientId } = req.params;
  const {
    client_name,
    email,
    phone,
    address,
    company_name,
    client_type,
    status,
    notes
  } = req.body;
  
  try {
    const query = `
      UPDATE clients SET 
        client_name = ?,
        email = ?,
        phone = ?,
        address = ?,
        company_name = ?,
        client_type = ?,
        status = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const values = [
      client_name,
      email,
      phone,
      address,
      company_name,
      client_type,
      status,
      notes,
      clientId
    ];
    
    await executeQuery(query, values);
    
    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Error updating client' });
  }
};

// Add service history entry
exports.addServiceHistory = async (req, res) => {
  const { clientId } = req.params;
  const {
    service_type,
    service_description,
    service_date,
    technician_assigned,
    cost,
    notes
  } = req.body;
  
  if (!service_type || !service_description || !service_date) {
    return res.status(400).json({ message: 'Service type, description, and date are required' });
  }
  
  try {
    const query = `
      INSERT INTO service_history (
        client_id,
        service_type,
        service_description,
        service_date,
        technician_assigned,
        status,
        cost,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const values = [
      clientId,
      service_type,
      service_description,
      service_date,
      technician_assigned || null,
      cost || 0,
      notes || null
    ];
    
    const result = await executeQuery(query, values);
    
    res.status(201).json({ 
      message: 'Service history added successfully',
      serviceId: result.insertId
    });
  } catch (error) {
    console.error('Error adding service history:', error);
    res.status(500).json({ message: 'Error adding service history' });
  }
};

// Add contract with document upload
exports.addContract = [upload.single('contract_document'), async (req, res) => {
  const { clientId } = req.params;
  const {
    contract_title,
    contract_type,
    start_date,
    end_date,
    contract_value,
    terms
  } = req.body;
  
  if (!contract_title || !contract_type || !start_date || !end_date) {
    return res.status(400).json({ message: 'Contract title, type, start date, and end date are required' });
  }
  
  try {
    const documentBlob = req.file ? req.file.buffer : null;
    const documentName = req.file ? req.file.originalname : null;
    
    const query = `
      INSERT INTO contracts (
        client_id,
        contract_title,
        contract_type,
        start_date,
        end_date,
        contract_value,
        status,
        terms,
        contract_document,
        document_name,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const values = [
      clientId,
      contract_title,
      contract_type,
      start_date,
      end_date,
      contract_value || 0,
      terms || null,
      documentBlob,
      documentName
    ];
    
    const result = await executeQuery(query, values);
    
    res.status(201).json({ 
      message: 'Contract added successfully',
      contractId: result.insertId
    });
  } catch (error) {
    console.error('Error adding contract:', error);
    res.status(500).json({ message: 'Error adding contract' });
  }
}];

// Download contract document
exports.downloadContract = async (req, res) => {
  const { contractId } = req.params;
  
  try {
    const query = `
      SELECT contract_document, document_name 
      FROM contracts 
      WHERE id = ?
    `;
    
    const contracts = await executeQuery(query, [contractId]);
    
    if (contracts.length === 0 || !contracts[0].contract_document) {
      return res.status(404).json({ message: 'Contract document not found' });
    }
    
    const contract = contracts[0];
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${contract.document_name}"`);
    res.send(contract.contract_document);
  } catch (error) {
    console.error('Error downloading contract:', error);
    res.status(500).json({ message: 'Error downloading contract' });
  }
};

// Delete client (soft delete)
exports.deleteClient = async (req, res) => {
  const { clientId } = req.params;
  
  try {
    const query = `
      UPDATE clients 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await executeQuery(query, [clientId]);
    
    res.status(200).json({ message: 'Client deactivated successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client' });
  }
};