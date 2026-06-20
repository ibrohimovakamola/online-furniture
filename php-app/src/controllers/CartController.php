<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Cart;

class CartController extends Controller
{
    public function index(): void
    {
        $items = (new Cart())->getSessionItems();
        $this->view('cart/index', ['items' => $items, 'title' => 'Cart']);
    }

    public function add(): void
    {
        $productId = (int) $this->input('product_id', 0);
        $qty = max(1, (int) $this->input('quantity', 1));
        if ($productId <= 0) {
            $this->error('Invalid product', 422);
        }
        (new Cart())->addItem($productId, $qty);
        $this->redirect('/cart');
    }
}
