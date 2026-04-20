const { Pool } = require('pg');
const CONFIGCENTRALIZADA = require('./../config/databaseCentral');



const pool = new Pool({
  ...CONFIGCENTRALIZADA,
  database: CONFIGCENTRALIZADA.database
});

const iniciarTransaccion = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        return client;
    } catch (error) {
        client.release();
        throw error;
    }
};

const commitTransaccion = async (client) => {
  if (!client) return; 
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
};

const rollbackTransaccion = async (client) => {
  if (!client) return; 
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};


module.exports = { iniciarTransaccion, commitTransaccion, rollbackTransaccion, pool };
