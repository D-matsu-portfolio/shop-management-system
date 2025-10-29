const db = require('../config/db');

// @desc    Create a new payment
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res) => {
    const { invoice_id, amount, payment_date, payment_method, notes } = req.body;

    if (!invoice_id || !amount || !payment_date) {
        return res.status(400).json({ error: 'Invoice ID, amount, and payment date are required.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch the invoice to get grand_total and current paid_amount
        const invoiceRes = await client.query('SELECT grand_total, paid_amount FROM invoices WHERE id = $1', [invoice_id]);
        
        if (invoiceRes.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }
        const invoice = invoiceRes.rows[0];

        // 2. Insert the new payment
        const paymentRes = await client.query(
            'INSERT INTO payments (invoice_id, amount, payment_date, payment_method, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [invoice_id, amount, payment_date, payment_method, notes]
        );
        const newPayment = paymentRes.rows[0];

        // 3. Calculate new paid amount and status
        const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(amount);
        let newStatus = 'partially_paid';
        if (newPaidAmount >= parseFloat(invoice.grand_total)) { // Corrected column name here
            newStatus = 'paid';
        }

        // 4. Update the invoice
        await client.query(
            'UPDATE invoices SET paid_amount = $1, status = $2 WHERE id = $3',
            [newPaidAmount, newStatus, invoice_id]
        );

        await client.query('COMMIT');
        res.status(201).json(newPayment);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in createPayment transaction:', error);
        res.status(500).json({ error: 'Server error while creating payment.' });
    } finally {
        client.release();
    }
};

// @desc    Get payments for an invoice
// @route   GET /api/payments/invoice/:invoice_id
// @access  Private
exports.getPaymentsForInvoice = async (req, res) => {
    const { invoice_id } = req.params;

    try {
        const { rows: payments } = await db.query(
            'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
            [invoice_id]
        );
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Server error while fetching payments.' });
    }
};