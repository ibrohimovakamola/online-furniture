<?php
/**
 * Front controller — all requests route through here (Apache + mod_rewrite).
 */
declare(strict_types=1);

define('APP_ROOT', dirname(__DIR__));
define('PUBLIC_ROOT', __DIR__);

require APP_ROOT . '/vendor/autoload.php';

use App\Config\Bootstrap;
use App\Core\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;

Bootstrap::init();

// Force HTTPS in production
if (Bootstrap::env('APP_ENV') === 'production' && !Bootstrap::isHttps()) {
    $target = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ($_SERVER['REQUEST_URI'] ?? '/');
    header('Location: ' . $target, true, 301);
    exit;
}

$router = new Router();

$router->use(new RateLimitMiddleware());
$router->get('/', 'ProductController@index');
$router->get('/products', 'ProductController@index');
$router->get('/products/{id}', 'ProductController@show');
$router->get('/cart', 'CartController@index');
$router->post('/cart/add', 'CartController@add');
$router->get('/orders', 'OrderController@index', [AuthMiddleware::class]);
$router->post('/orders', 'OrderController@store', [AuthMiddleware::class]);
$router->get('/login', 'UserController@loginForm');
$router->post('/login', 'UserController@login');
$router->post('/logout', 'UserController@logout');

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/');
