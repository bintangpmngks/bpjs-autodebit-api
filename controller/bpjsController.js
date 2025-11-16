import sql from "mssql";
import dbConfig from "../config/db.js";

export const checkBpjsV2 = async (req, res) => {
    const { noreg, debit_account } = req.query;

    if (!noreg || !debit_account) {
        return res.status(400).json({
            ok: false,
            message: "noreg dan debit_account wajib diisi"
        });
    }

    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("noreg", sql.VarChar, noreg)
            .input("debit", sql.VarChar, debit_account)
            .query(`
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
                WHERE 
                    a.noreg = @noreg
                AND 
                    a.debit_account = @debit
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Data tidak ditemukan"
            });
        }

        const row = result.recordset[0];

        // Convert status
        const statusText = row.status === true || row.status === 1
            ? "Aktif"
            : "Tidak Aktif";

        // Format kalimat output
        const message = `Nomor Registrasi ${row.noreg} dengan nomor rekening ${row.debit_account} dengan nama ${row.debit_account_name} terdaftar melalui ${row.merchant_type} pada tanggal ${row.tanggal_registrasi}. Status BPJS tersebut saat ini ${statusText}.`;

        return res.json({
            ok: true,
            message,
            raw_data: row
        });

    } catch (error) {
        console.error("SQL Error:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
