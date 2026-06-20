/**
 * @swagger
 * /api/store/settings:
 *   get:
 *     summary: Public store settings
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: Store configuration
 *
 * /api/store/flash-sale:
 *   get:
 *     summary: Active flash sale products
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: Flash sale data
 *
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Message received
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate Payme or Click payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId: { type: string }
 *               paymentMethod: { type: string, enum: [payme, click] }
 *     responses:
 *       200:
 *         description: Payment URL or checkout data
 *
 * /api/reviews:
 *   post:
 *     summary: Submit product review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Review submitted (pending approval)
 *
 * /api/blogs:
 *   get:
 *     summary: List published blog posts
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: Blog list
 *
 * /api/faq:
 *   get:
 *     summary: List FAQ entries
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: FAQ list
 *
 * /api/gallery:
 *   get:
 *     summary: Public gallery entries
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: Gallery list
 *
 * /api/csrf-token:
 *   get:
 *     summary: Issue CSRF token for file uploads
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: CSRF token in JSON + cookie
 */

export {}
