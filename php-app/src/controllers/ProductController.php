<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Product;

class ProductController extends Controller
{
    public function index(): void
    {
        $products = (new Product())->all();
        $this->view('products/index', ['products' => $products, 'title' => 'Products']);
    }

    public function show(string $id): void
    {
        $product = (new Product())->find($id);
        if (!$product) {
            $this->error('Product not found', 404);
        }
        $this->view('products/show', ['product' => $product, 'title' => $product['name'] ?? 'Product']);
    }
}
