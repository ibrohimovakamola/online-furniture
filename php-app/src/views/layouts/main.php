<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title ?? 'MebelSotish', ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="/css/app.css">
</head>
<body>
    <header><a href="/">MebelSotish</a></header>
    <main>
        <?php require $path; ?>
    </main>
    <script src="/js/app.js" defer></script>
</body>
</html>
