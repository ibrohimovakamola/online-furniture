/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products (paginated, filterable)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [uz, ru, en], default: uz }
 *     responses:
 *       200:
 *         description: Product list
 *   post:
 *     summary: Create product (admin)
 *     tags: [Products, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name_uz: { type: string }
 *               basePrice: { type: number }
 *               category: { type: string }
 *               stock: { type: integer }
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/products/search:
 *   get:
 *     summary: Full-text product search
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 *
 * /api/products/suggestions:
 *   get:
 *     summary: Search autocomplete suggestions
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Suggestion list
 *
 * /api/products/trending:
 *   get:
 *     summary: Trending products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Trending list
 *
 * /api/products/bestsellers:
 *   get:
 *     summary: Best-selling products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Bestsellers list
 *
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update product (admin)
 *     tags: [Products, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     summary: Delete product (admin)
 *     tags: [Products, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 *
 * /api/products/{productId}/reviews:
 *   get:
 *     summary: List approved reviews for a product
 *     tags: [Reviews, Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review list
 *
 * /api/categories:
 *   get:
 *     summary: List categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category list
 *   post:
 *     summary: Create category (admin)
 *     tags: [Categories, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Category created
 *
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category detail
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

export {}
