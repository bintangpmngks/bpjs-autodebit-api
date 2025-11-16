const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// =========================
// Helper Mapping Functions
// =========================
function mapStatus(value) {
  const v = value === true ? 1 :
            value === false ? 0 :
            Number(value);

  if (v === 1) return "ACTIVE";
  if (v === 0) return "NON_ACTIVE";
  return "UNKNOWN";
}

function mapMerchantType(mt) {
  if (!mt) return "UNKNOWN";
  const x = mt.toUpperCase();
  if (x === "PSW" || x === "JKN" || x === "CS") return x;
  return "UNKNOWN";
}

// =========================
// POST /check (VERSI LAMA)
// =========================
router.post('/check', async (req, res) => {
  try {
    const { noreg, debit_account } = req.body;

    if (!noreg || !debit_account) {
      return res.status(400).json({
        ok: false,
        message: "Missing parameter (noreg, debit_account)"
      });
    }

    const pool = await getPool();
    const query = `
      SELECT 
        b.institution_name, 
        a.noreg, 
        a.debit_account, 
        a.debit_account_name, 
        a.card_number, 
        a.phone_number, 
        a.status, 
        a.date_inserted AS tanggal_registrasi, 
        a.merchant_type, 
        a.user_id 
      FROM [AUTODEBIT].[dbo].[REGISTRASI] a WITH(NOLOCK)
      LEFT JOIN [AUTODEBIT].[dbo].[INSTITUTION] b 
        ON a.INSTITUTION_CODE = b.INSTITUTION_CODE
      WHERE a.noreg = @noreg
        AND a.debit_account = @debit_account;
    `;

    const result = await pool.request()
      .input("noreg", sql.VarChar(100), noreg)
      .input("debit_account", sql.VarChar(100), debit_account)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        ok: true,
        found: false,
        message: "Data tidak ditemukan",
        data: null
      });
    }

    const mapped = result.recordset.map(r => ({
      institution_name: r.institution_name,
      noreg: r.noreg,
      debit_account: r.debit_account,
      debit_account_name: r.debit_account_name,
      card_number: r.card_number,
      phone_number: r.phone_number,
      status: mapStatus(r.status),
      tanggal_registrasi: r.tanggal_registrasi,
      merchant_type: mapMerchantType(r.merchant_type),
      registered_by_userid: r.user_id
    }));

    return res.json({
      ok: true,
      found: true,
      count: mapped.length,
      data: mapped
    });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
});


// =========================
// GET /check1 (VERSI OUTPUT KALIMAT)
// =========================
router.get('/check1', async (req, res) => {
  try {
    const { noreg, debit_account } = req.query;

    if (!noreg || !debit_account) {
      return res.status(400).json({
        ok: false,
        message: "Missing parameter (noreg, debit_account)"
      });
    }

    const pool = await getPool();
    const query = `
      SELECT 
        b.institution_name, 
        a.noreg, 
        a.debit_account, 
        a.debit_account_name, 
        a.card_number, 
        a.phone_number, 
        a.status, 
        a.date_inserted AS tanggal_registrasi, 
        a.merchant_type, 
        a.user_id 
      FROM [AUTODEBIT].[dbo].[REGISTRASI] a WITH(NOLOCK)
      LEFT JOIN [AUTODEBIT].[dbo].[INSTITUTION] b 
        ON a.INSTITUTION_CODE = b.INSTITUTION_CODE
      WHERE a.noreg = @noreg
        AND a.debit_account = @debit_account;
    `;

    const result = await pool.request()
      .input("noreg", sql.VarChar(100), noreg)
      .input("debit_account", sql.VarChar(100), debit_account)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Data tidak ditemukan"
      });
    }

    const r = result.recordset[0];

    const statusText = r.status ? "Aktif" : "Tidak Aktif";
    const merchantType = r.merchant_type ? r.merchant_type.toUpperCase() : "UNKNOWN";

    const message = `Nomor Registrasi ${r.noreg} dengan nomor rekening ${r.debit_account} dengan nama ${r.debit_account_name} terdaftar melalui ${merchantType} pada tanggal ${r.tanggal_registrasi}. Status BPJS tersebut saat ini ${statusText}.`;

    return res.json({
      ok: true,
      message,
      raw_data: r
    });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;
