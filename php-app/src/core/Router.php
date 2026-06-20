<?php
declare(strict_types=1);

namespace App\Core;

class Router
{
    /** @var array<int, callable|object> */
    private array $globalMiddleware = [];

    /** @var array<string, array<int, array{pattern:string, handler:string, middleware:array}>> */
    private array $routes = [];

    public function use(callable|object $middleware): void
    {
        $this->globalMiddleware[] = $middleware;
    }

    public function get(string $path, string $handler, array $middleware = []): void
    {
        $this->add('GET', $path, $handler, $middleware);
    }

    public function post(string $path, string $handler, array $middleware = []): void
    {
        $this->add('POST', $path, $handler, $middleware);
    }

    private function add(string $method, string $path, string $handler, array $middleware): void
    {
        $pattern = preg_replace('#\{([a-zA-Z_]+)\}#', '(?P<$1>[^/]+)', $path);
        $this->routes[$method][] = [
            'pattern' => '#^' . $pattern . '$#',
            'handler' => $handler,
            'middleware' => $middleware,
        ];
    }

    public function dispatch(string $method, string $uri): void
    {
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $path = rtrim($path, '/') ?: '/';

        foreach ($this->routes[$method] ?? [] as $route) {
            if (!preg_match($route['pattern'], $path, $matches)) {
                continue;
            }

            foreach ($this->globalMiddleware as $mw) {
                $this->runMiddleware($mw);
            }
            foreach ($route['middleware'] as $mw) {
                $this->runMiddleware(new $mw());
            }

            [$class, $action] = explode('@', $route['handler']);
            $controllerClass = 'App\\Controllers\\' . $class;
            $controller = new $controllerClass();
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            $controller->$action(...array_values($params));
            return;
        }

        http_response_code(404);
        echo '404 Not Found';
    }

    private function runMiddleware(callable|object $middleware): void
    {
        if (is_object($middleware) && method_exists($middleware, 'handle')) {
            $middleware->handle();
        } elseif (is_callable($middleware)) {
            $middleware();
        }
    }
}
