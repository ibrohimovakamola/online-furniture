import mongoose from 'mongoose'

const BLOG_STATUSES = ['draft', 'published', 'scheduled']

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    featuredImage: {
      type: String,
      default: '',
      trim: true,
    },
    metaDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    keywords: {
      type: [String],
      default: [],
    },
    readTime: {
      type: Number,
      required: true,
      min: 1,
      default: 5,
    },
    author: {
      type: String,
      trim: true,
      default: 'Kresla Team',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    viewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    commentCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      default: '',
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: BLOG_STATUSES,
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

blogSchema.index({ createdAt: -1 })
blogSchema.index({ title: 'text', content: 'text' })

blogSchema.pre('save', function syncPublishFlags() {
  const now = new Date()
  if (this.status === 'published') {
    this.isPublished = true
    if (!this.publishedAt) this.publishedAt = now
  } else if (this.status === 'scheduled' && this.publishedAt && this.publishedAt <= now) {
    this.status = 'published'
    this.isPublished = true
  } else if (this.status === 'scheduled') {
    this.isPublished = false
  } else {
    this.isPublished = false
  }
})

export { BLOG_STATUSES }
export default mongoose.model('Blog', blogSchema)
