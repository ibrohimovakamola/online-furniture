import mongoose from 'mongoose'

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    color: {
      type: String,
      default: '#0F6E56',
      trim: true,
    },
    icon: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('BlogCategory', blogCategorySchema)
