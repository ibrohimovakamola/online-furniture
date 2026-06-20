import mongoose from 'mongoose'

const invoiceLineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    unitPrice: Number,
    lineTotal: Number,
  },
  { _id: false }
)

const b2bInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    b2bProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'B2BProfile' },
    companyName: { type: String, default: '' },
    poNumber: { type: String, default: '' },
    lines: { type: [invoiceLineSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentTerms: { type: String, default: 'prepay' },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'void'], default: 'draft' },
    emailedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('B2BInvoice', b2bInvoiceSchema)
