import ErrorLog from '../models/ErrorLog.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parsePagination } from '../utils/pagination.js'
import { buildSearchRegex } from '../utils/safeRegex.js'

/** GET /api/admin/errors */
export const listErrorLogs = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 })
  const sort = req.query.sort === 'count' ? { count: -1, lastSeenAt: -1 } : { lastSeenAt: -1 }

  const filter = {}
  if (req.query.statusCode) {
    filter.statusCode = Number(req.query.statusCode)
  }
  if (req.query.search?.trim()) {
    const regex = buildSearchRegex(req.query.search)
    if (regex) {
      filter.$or = [{ message: regex }, { path: regex }]
    }
  }

  const [items, total, frequencySummary] = await Promise.all([
    ErrorLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ErrorLog.countDocuments(filter),
    ErrorLog.aggregate([
      ...(Object.keys(filter).length ? [{ $match: filter }] : []),
      {
        $group: {
          _id: null,
          totalErrors: { $sum: '$count' },
          uniqueErrors: { $sum: 1 },
        },
      },
    ]),
  ])

  const summary = frequencySummary[0] || { totalErrors: 0, uniqueErrors: 0 }

  res.json({
    success: true,
    data: {
      items: items.map((row) => ({
        id: String(row._id),
        message: row.message,
        statusCode: row.statusCode,
        path: row.path,
        method: row.method,
        count: row.count,
        lastSeenAt: row.lastSeenAt,
        createdAt: row.createdAt,
        stack: req.query.includeStack === 'true' ? row.stack : undefined,
      })),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      frequency: {
        totalOccurrences: summary.totalErrors,
        uniqueErrors: summary.uniqueErrors,
      },
    },
  })
})

/** DELETE /api/admin/errors/:errorId */
export const deleteErrorLog = asyncHandler(async (req, res) => {
  const deleted = await ErrorLog.findByIdAndDelete(req.params.errorId)
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Error log not found' })
  }
  res.json({ success: true, message: 'Error log removed' })
})
