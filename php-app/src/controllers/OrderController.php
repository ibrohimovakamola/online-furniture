<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Order;

class OrderController extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        $orders = (new Order())->forUser((int) $_SESSION['user_id']);
        $this->view('orders/index', ['orders' => $orders, 'title' => 'My orders']);
    }

    public function store(): void
    {
        $this->requireAuth();
        // Placeholder — integrate PaymentHelper + validation
        $this->json(['success' => true, 'message' => 'Order endpoint ready']);
    }
}
