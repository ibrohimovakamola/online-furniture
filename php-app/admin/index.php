<?php
declare(strict_types=1);
define('APP_ROOT', dirname(__DIR__));
require APP_ROOT . '/vendor/autoload.php';
use App\Config\Bootstrap;
Bootstrap::init();
// TODO: admin auth guard
require APP_ROOT . '/src/views/admin/dashboard.php';
