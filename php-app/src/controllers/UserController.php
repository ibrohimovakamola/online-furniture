<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Helpers\ValidationHelper;
use App\Models\User;

class UserController extends Controller
{
    public function loginForm(): void
    {
        $this->view('users/login', ['title' => 'Login']);
    }

    public function login(): void
    {
        $email = trim((string) $this->input('email', ''));
        $password = (string) $this->input('password', '');

        if (!ValidationHelper::email($email)) {
            $this->error('Invalid email', 422);
        }

        $user = (new User())->findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'] ?? '')) {
            $this->error('Invalid credentials', 401);
        }

        $_SESSION['user_id'] = $user['id'];
        $this->redirect('/orders');
    }

    public function logout(): void
    {
        session_destroy();
        $this->redirect('/');
    }
}
