/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart with items
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Cart updated
 *       422:
 *         description: Insufficient stock
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 *
 * /api/cart/item/{productId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: Item updated
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item removed
 *
 * /api/orders:
 *   get:
 *     summary: List authenticated user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order list
 *   post:
 *     summary: Create order from server-side cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress, paymentMethod]
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   fullName: { type: string }
 *                   phone: { type: string }
 *                   street: { type: string }
 *                   city: { type: string }
 *               paymentMethod: { type: string, enum: [payme, click, cash, installment] }
 *     responses:
 *       201:
 *         description: Order created
 *       422:
 *         description: Cart empty or insufficient stock
 *
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order detail
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/orders/guest:
 *   post:
 *     summary: Create guest order (no account)
 *     tags: [Orders]
 *     responses:
 *       201:
 *         description: Guest order created
 *
 * /api/orders/checkout:
 *   post:
 *     summary: Legacy checkout with client cart payload
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order placed
 *
 * /api/orders/{orderId}/status:
 *   put:
 *     summary: Update order status (admin)
 *     tags: [Orders, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, confirmed, processing, shipped, delivered, cancelled] }
 *     responses:
 *       200:
 *         description: Status updated
 *
 * /api/orders/installment-plans:
 *   get:
 *     summary: Calculate installment plans for order total
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: total
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Available plans
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

export {}
